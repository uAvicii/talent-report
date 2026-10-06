"use client";
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {ArrowLeft,ArrowRight,LoaderCircle} from 'lucide-react';
import {bridgeCall,bridgeStatusMessage,workbenchName,type BridgeStatus,type ReportTask} from '@/lib/browser-bridge';
import {answerLabels,buildQuestionnairePrompt,DRAFT_KEY,questionnaire,restoreDraft,toggleAnswer,type QuestionnaireAnswers} from '@/lib/report-questionnaire.mjs';

type QuizDraft={answers:QuestionnaireAnswers;step:number;name:string;note:string};
function initialDraft():QuizDraft & {storageFailed:boolean}{
  const empty={answers:{},step:0,name:'',note:''};
  if(typeof window==='undefined')return {...empty,storageFailed:false};
  try{return {...(restoreDraft(localStorage.getItem(DRAFT_KEY))||empty),storageFailed:false};}
  catch{return {...empty,storageFailed:true};}
}

export function ReportForm({onCreated}:{onCreated:(task:ReportTask)=>void}) {
  // The modal mounts this form after the user opens it, so its initial browser
  // draft is read once; edits synchronously save before another page is opened.
  const [draft,setDraft]=useState(initialDraft);
  const {answers,step,name,note}=draft;
  const [editing,setEditing]=useState(false),[consent,setConsent]=useState(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [connection,setConnection]=useState(''),[checking,setChecking]=useState(false);
  const request=useRef({prompt:'',id:''}),sending=useRef(false),heading=useRef<HTMLHeadingElement>(null);
  const review=step===questionnaire.length,question=questionnaire[step];
  const answered=questionnaire.filter(item=>answers[item.id]?.length).length;
  const saved=draft.storageFailed?'此浏览器无法暂存；关闭页面后回答可能丢失':answered||name||note?'回答已暂存于当前浏览器':'回答会自动暂存于当前浏览器';
  function updateDraft(patch:Partial<QuizDraft>){
    if(sending.current)return;
    const next={answers,step,name,note,...patch};
    try {
      localStorage.setItem(DRAFT_KEY,JSON.stringify({version:1,...next}));
      setDraft({...next,storageFailed:false});
    }catch{setDraft({...next,storageFailed:true});}
  }
  useEffect(()=>{
    heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:'nearest',behavior:'instant'});
  },[step]);

  async function connect(){
    if(checking)return;
    setChecking(true);setConnection('正在检查…');
    try{setConnection(bridgeStatusMessage(await bridgeCall<BridgeStatus>('status',{},10000)));}
    catch(err){setConnection(err instanceof Error?err.message:`无法连接${workbenchName}`);}
    finally{setChecking(false);}
  }
  function choose(optionId:string){
    try{updateDraft({answers:toggleAnswer(answers,question.id,optionId)});setError('');}
    catch(err){setError(err instanceof Error?err.message:'请选择有效选项。');}
  }
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(sending.current)return;
    setError('');
    if(!review){
      if(!answers[question.id]?.length){setError(question.kind==='multi'?'请至少选择一项。':'请选择最接近你情况的一项。');return;}
      updateDraft({step:editing?questionnaire.length:step+1});setEditing(false);return;
    }
    if(!consent){setError('请先确认同意将回答提交给 ChatGPT 生成报告。');return;}
    sending.current=true;setBusy(true);
    try {
      const prompt=buildQuestionnairePrompt(answers,name,note);
      if(request.current.prompt!==prompt)request.current={prompt,id:crypto.randomUUID()};
      const task=await bridgeCall<ReportTask>('create',{prompt,clientRequestId:request.current.id});
      try{localStorage.removeItem(DRAFT_KEY);}catch{/* Submission succeeds even when storage is unavailable. */}
      onCreated(task);
    }catch(err){setError(err instanceof Error?err.message:'提交失败，请重试。');}
    finally{sending.current=false;setBusy(false);}
  }
  function back(){setError('');setEditing(false);updateDraft({step:Math.max(0,step-1)});}
  function edit(index:number){setError('');setEditing(true);updateDraft({step:index});}

  return <form className="questionnaire-form report-form" onSubmit={submit}>
    <div className="questionnaire-progress">
      <div><span>{review?'核对答案':`第 ${step+1} / ${questionnaire.length} 题`}</span><span>已回答 {answered} / {questionnaire.length}</span></div>
      <progress value={answered} max={questionnaire.length} aria-label="问卷回答进度"/>
    </div>
    {review?<>
      <h3 className="questionnaire-heading" ref={heading} tabIndex={-1}>看看这些回答是否符合你</h3>
      <p className="questionnaire-hint">可以修改任意一题。昵称与具体经历都可跳过。</p>
      <ol className="questionnaire-review">
        {questionnaire.map((item,index)=><li key={item.id}><div><b>{index+1}. {item.title}</b><p>{answerLabels(answers,item.id).join('、')||'尚未回答'}</p></div><button type="button" disabled={busy} onClick={()=>edit(index)} aria-label={`修改第 ${index+1} 题`}>修改</button></li>)}
      </ol>
      <label className="questionnaire-extra">如何称呼你 <span>选填</span><input value={name} onChange={event=>updateDraft({name:event.target.value})} disabled={busy} maxLength={40} autoComplete="nickname" placeholder="昵称，不需要真实姓名"/></label>
      <label className="questionnaire-extra">有没有想补充的一件事？ <span>选填 · 最多 500 字</span><textarea value={note} onChange={event=>updateDraft({note:event.target.value})} disabled={busy} maxLength={500} rows={3} placeholder="例如：做过的一个项目、得到过的反馈，或正在纠结的选择。留空也能生成。"/></label>
      <div className="connection-box"><span>生成前确认连接</span><button type="button" disabled={checking||busy} onClick={()=>void connect()}>{checking?'检查中…':'检查连接'}</button>{connection&&<p role="status">{connection}</p>}<small>请保持执行插件连接，并在插件所在浏览器中登录 ChatGPT。</small></div>
      <label className="consent"><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)} disabled={busy}/><span>同意将这些回答交给{workbenchName}，由执行插件所在浏览器中登录的 ChatGPT 生成报告，并由工作台保存结果。</span></label>
    </>:<fieldset className="questionnaire-question">
      <legend><h3 className="questionnaire-heading" ref={heading} tabIndex={-1}>{question.title}</h3></legend>
      <p className="questionnaire-hint" id="question-hint">{question.hint}{question.kind==='multi'?' 最后一项需单独选择。':''}</p>
      <div className="questionnaire-kind">{question.kind==='single'?'单选':`多选 · 已选 ${answers[question.id]?.length||0} / 3`}</div>
      <div className="questionnaire-options">
        {question.options.map(option=><label className={`questionnaire-option${answers[question.id]?.includes(option.id)?' selected':''}`} key={`${question.id}-${option.id}`}><input type={question.kind==='single'?'radio':'checkbox'} name={question.id} value={option.id} checked={answers[question.id]?.includes(option.id)||false} onChange={()=>choose(option.id)} aria-describedby="question-hint"/><span>{option.text}</span></label>)}
      </div>
    </fieldset>}
    {error&&<p className="form-error" role="alert">{error}</p>}
    <div className="questionnaire-actions">
      {step>0&&<button type="button" className="questionnaire-back" onClick={back} disabled={busy}><ArrowLeft size={16}/>上一题</button>}
      <button className="button primary" type="submit" disabled={busy}>{busy?<><LoaderCircle className="spin" size={18}/>正在提交…</>:review?'确认并生成报告':<>{editing?'返回核对':step===questionnaire.length-1?'核对答案':'下一题'}<ArrowRight size={17}/></>}</button>
    </div>
    <p className="questionnaire-save" role="status">{saved}。提交成功后清除暂存。</p>
  </form>;
}
