"use client";
import {useState,useEffect,useRef,type FormEvent} from 'react';
import {Check,LoaderCircle,FileText,Download,RefreshCw,X,CircleCheck} from 'lucide-react';
import {bridgeCall,type ReportTask,type BridgeStatus} from '@/lib/browser-bridge';
import {buildReportPrompt,parseReport,terminalStatuses,reportStatuses,type TalentReport} from '@/lib/report-domain.mjs';
import {siteContent} from '@/lib/site-content';

export function ReportForm({onCreated}:{onCreated:(task:ReportTask)=>void}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[connection,setConnection]=useState('');
  const request=useRef({prompt:'',id:''});
  async function connect(){setConnection('正在检查…');try{const s=await bridgeCall<BridgeStatus>('status',{},10000);setConnection(s.online&&s.enabled?'本地工作台已连接 · 执行插件在线':s.online?'本地工作台已连接 · 请在插件中开启自动领取任务':'本地工作台已连接 · 执行插件暂未在线，任务将等待领取');}catch(e){setConnection(e instanceof Error?e.message:'无法连接本地工作台');}}
  useEffect(()=>{void connect();},[]);
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setError('');setBusy(true);
    const data=new FormData(e.currentTarget);
    try {
      if(data.get('consent')!=='on')throw new Error('请先确认资料将提交给执行插件所在浏览器中登录的 ChatGPT。');
      const prompt=buildReportPrompt({name:String(data.get('name')||''),stage:String(data.get('stage')||''),experience:String(data.get('experience')||''),strengths:String(data.get('strengths')||''),resources:String(data.get('resources')||''),question:String(data.get('question')||'')});
      if(request.current.prompt!==prompt)request.current={prompt,id:crypto.randomUUID()};
      const task=await bridgeCall<ReportTask>('create',{prompt,clientRequestId:request.current.id});
      onCreated(task);
    }catch(err){setError(err instanceof Error?err.message:'提交失败，请重试。');}finally{setBusy(false);}
  }
  return <form className="booking-form report-form" onSubmit={submit}>
    <div className="connection-box"><span>通过本地工作台生成 · 支持跨浏览器</span><button type="button" onClick={connect}>检查连接</button>{connection&&<p role="status">{connection}</p>}<small>报告页可在 Edge 等浏览器打开；插件在已登录 ChatGPT 的浏览器中执行。</small></div>
    <label>如何称呼你<input name="name" required maxLength={40} placeholder="姓名或昵称，不需要手机号" autoComplete="name"/></label>
    <label>目前的事业阶段<select name="stage" required defaultValue=""><option value="" disabled>请选择当前阶段</option>{siteContent.stages.map(s=><option key={s}>{s}</option>)}</select></label>
    <label>你的经历与当前工作<textarea name="experience" required minLength={30} maxLength={1500} rows={4} placeholder="至少 30 字：做过什么、擅长什么、目前的工作与遇到的困难"/></label>
    <label>你的优势、兴趣与技能<textarea name="strengths" required maxLength={400} rows={2} placeholder="例如：喜欢写作，擅长访谈与整理复杂信息"/></label>
    <label>可投入的时间与已有资源 <span className="optional">选填</span><textarea name="resources" maxLength={400} rows={2} placeholder="例如：每周 8 小时、有行业经验、已有少量内容读者"/></label>
    <label>你最想解决的事业问题<textarea name="question" required minLength={10} maxLength={600} rows={3} placeholder="至少 10 字：希望获得什么方向、目前在纠结哪些选择"/></label>
    <label className="consent"><input name="consent" type="checkbox" required/><span>同意将以上资料交给本地工作台，由执行插件所在浏览器中登录的 ChatGPT 生成报告，并在本地保存结果。</span></label>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <button className="button primary full" type="submit" disabled={busy}>{busy?<><LoaderCircle className="spin" size={18}/>正在提交…</>:'提交资料，立即生成报告'}</button>
    <p className="form-note">无需预约；提交后自动执行。其他任务正在生成时，会进入同一个队列。</p>
  </form>;
}

export function ReportWorkspace({initialTask}:{initialTask:ReportTask|null}){
  const [task,setTask]=useState<ReportTask|null>(initialTask),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const ref=useRef<ReportTask|null>(task),mounted=useRef(true),polling=useRef(false),resumeId=useRef('');
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{if(initialTask){ref.current=initialTask;setTask(initialTask);setError('');sessionStorage.setItem('talent-report-task',initialTask.id);}},[initialTask]);
  async function refresh(id?:string){
    if(polling.current)return;
    const key=id||ref.current?.id||resumeId.current;if(!key)return;
    polling.current=true;
    try{const next=await bridgeCall<ReportTask>('get',{id:key},10000);const previous=ref.current;if(mounted.current&&(!previous||previous.id===key)&&(!previous||next.updated>=previous.updated)&&(!previous||!terminalStatuses.has(previous.status)||terminalStatuses.has(next.status))){ref.current=next;setTask(next);setError('');}}
    catch(e){if(mounted.current)setError(e instanceof Error?e.message:'暂时无法读取结果。');}
    finally{polling.current=false;}
  }
  useEffect(()=>{const saved=sessionStorage.getItem('talent-report-task');if(saved&&!initialTask){resumeId.current=saved;void refresh(saved);}},[]);
  useEffect(()=>{if(!task?.id||terminalStatuses.has(task.status))return;const timer=setInterval(()=>void refresh(),2000);void refresh();return()=>clearInterval(timer);},[task?.id,task?.status]);
  async function cancel(){setBusy(true);try{const next=await bridgeCall<ReportTask>('cancel',{id:task!.id});ref.current=next;setTask(next);setError('');}catch(e){setError(e instanceof Error?e.message:'取消失败。');}finally{setBusy(false);}}
  if(!task&&!error)return null;
  let report:TalentReport|null=null;
  if(task?.status==='completed'){try{report=parseReport(task.text);}catch{}}
  function download(){if(!task)return;const blob=new Blob([task.text],{type:report?'application/json;charset=utf-8':'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`天赋事业报告-${task.id}.${report?'json':'txt'}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return <section id="my-report" className="container section report-workspace" aria-label="我的事业报告">
    <div className="section-heading"><div><span className="section-kicker">YOUR PERSONAL REPORT</span><h2>{task?.status==='completed'?'你的事业探索报告':'你的报告，正在路上。'}</h2></div>{task&&<span className="job-meta">任务编号 {task.id}</span>}</div>
    {error&&<div className="report-transport-error" role="alert"><p>{error}</p><button className="sample-button" onClick={()=>void refresh()}><RefreshCw size={16}/>重新连接并读取原任务</button></div>}
    {task&&task.status!=='completed'&&<div className="job-progress"><div className="job-progress-title" role="status">{terminalStatuses.has(task.status)?<X size={24}/>:<LoaderCircle className="spin" size={24}/>}<h3>{reportStatuses[task.status]||'正在读取任务状态'}</h3></div><p>{task.detail}</p><div className="job-steps">{['queued','preparing','generating','completed'].map((s,i)=><span key={s} className={task.status===s?'active':''}><b>0{i+1}</b>{['进入队列','准备会话','生成报告','结果展示'][i]}</span>)}</div>{!terminalStatuses.has(task.status)&&<button className="sample-button" onClick={cancel} disabled={busy}>取消此任务</button>}<small>取消停止任务回传；已发送给 ChatGPT 的生成可能仍会继续。断线后只读取原任务，不自动重复提交。</small>{task.conversationUrl&&<a className="conversation-link" href={task.conversationUrl} target="_blank" rel="noreferrer">查看本次 ChatGPT 会话</a>}</div>}
    {task?.status==='completed'&&<><div className="result-toolbar"><span><CircleCheck size={18}/>已从 ChatGPT 读取真实结果</span><button className="sample-button" onClick={download}><Download size={16}/>下载报告原文</button>{task.conversationUrl&&<a href={task.conversationUrl} target="_blank" rel="noreferrer">查看生成会话</a>}</div>
    {report?<><div className="result-summary"><FileText size={25}/><div><h3>{report.title}</h3><p>{report.summary}</p></div></div><div className="result-profile"><article><span>优势线索</span><ul>{report.profile.strengths.map((s,i)=><li key={i}>{s}</li>)}</ul></article><article><span>角色与工作方式</span><p>{report.profile.workingStyle}</p></article><article><span>个人内容定位</span><p>{report.profile.ipPositioning}</p></article></div><div className="result-sections">{report.sections.map((s,i)=><article key={i}><span className="section-kicker">CHAPTER {String(i+1).padStart(2,'0')}</span><h3>{s.title}</h3><p>{s.analysis}</p><ul>{s.suggestions.map((t,j)=><li key={j}><Check size={16}/>{t}</li>)}</ul></article>)}</div><div className="result-action"><h3>接下来 4 周，把方向放进行动。</h3><div>{report.actionPlan.map((s,i)=><article key={i}><span>{s.period}</span><h4>{s.task}</h4><p>验证标准：{s.measure}</p></article>)}</div></div><div className="result-limitations"><h3>需要继续验证的判断</h3><ul>{report.limitations.map((s,i)=><li key={i}>{s}</li>)}</ul></div></>:<div className="raw-report"><p>返回的报告结构与约定不同，已保留完整原文供你阅读。</p><pre>{task.text}</pre></div>}</>}
  </section>;
}
