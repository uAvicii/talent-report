"use client";
import {useState,useEffect,useRef} from 'react';
import {Check,LoaderCircle,FileText,Download,RefreshCw,X,CircleCheck} from 'lucide-react';
import {bridgeCall,type ReportTask} from '@/lib/browser-bridge';
import {parseReport,terminalStatuses,reportStatuses,type TalentReport} from '@/lib/report-domain.mjs';

export {ReportForm} from '@/components/report-questionnaire-form';

export function ReportWorkspace({initialTask}:{initialTask:ReportTask|null}){
  const [task,setTask]=useState<ReportTask|null>(initialTask),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [pdfBusy,setPdfBusy]=useState(false),[pdfError,setPdfError]=useState('');
  const exporting=useRef(false);
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
  async function reread(){setBusy(true);try{const next=await bridgeCall<ReportTask>('read',{id:task!.id});ref.current=next;setTask(next);setError('');}catch(e){setError(e instanceof Error?e.message:'无法重新读取结果。');}finally{setBusy(false);}}
  if(!task&&!error)return null;
  let report:TalentReport|null=null;
  if(task?.status==='completed'){try{report=parseReport(task.text);}catch{}}
  async function download(){
    if(!task||exporting.current)return;
    exporting.current=true;setPdfBusy(true);setPdfError('');
    try{const {downloadReportPdf}=await import('@/lib/report-pdf-download');await downloadReportPdf({report,text:task.text,id:task.id,updated:task.updated});}
    catch{if(mounted.current)setPdfError('PDF 导出失败，请检查网络后重新下载。报告内容已保留。');}
    finally{exporting.current=false;if(mounted.current)setPdfBusy(false);}
  }
  return <section id="my-report" className="container section report-workspace" aria-label="我的事业报告">
    <div className="section-heading"><div><span className="section-kicker">YOUR PERSONAL REPORT</span><h2>{task?.status==='completed'?'你的事业探索报告':'你的报告，正在路上。'}</h2></div>{task&&<span className="job-meta">任务编号 {task.id}</span>}</div>
    {error&&<div className="report-transport-error" role="alert"><p>{error}</p><button className="sample-button" onClick={()=>void refresh()}><RefreshCw size={16}/>重新连接并读取原任务</button></div>}
    {task&&task.status!=='completed'&&<div className="job-progress"><div className="job-progress-title" role="status">{terminalStatuses.has(task.status)?<X size={24}/>:<LoaderCircle className="spin" size={24}/>}<h3>{reportStatuses[task.status]||'正在读取任务状态'}</h3></div><p>{task.detail}</p><div className="job-steps">{['queued','preparing','generating','completed'].map((s,i)=><span key={s} className={task.status===s?'active':''}><b>0{i+1}</b>{['进入队列','准备会话','生成报告','结果展示'][i]}</span>)}</div>{!terminalStatuses.has(task.status)&&<button className="sample-button" onClick={cancel} disabled={busy}>取消此任务</button>}{['failed','interrupted'].includes(task.status)&&task.conversationUrl&&<button className="sample-button" onClick={reread} disabled={busy}>重新读取原会话结果</button>}<small>重新读取只打开原会话，不重新发送资料。取消停止任务回传；已发送给 ChatGPT 的生成可能仍会继续。</small></div>}
    {task?.status==='completed'&&<><div className="result-toolbar"><span><CircleCheck size={18}/>已从 ChatGPT 读取真实结果</span><button className="sample-button" onClick={download} disabled={pdfBusy} aria-busy={pdfBusy}>{pdfBusy?<LoaderCircle className="spin" size={16}/>:<Download size={16}/>}<span>{pdfBusy?'正在导出 PDF…':'下载 PDF 报告'}</span></button></div>
    {pdfError&&<p className="form-error" role="alert">{pdfError}</p>}
    {report?<><div className="result-summary"><FileText size={25}/><div><h3>{report.title}</h3><p>{report.summary}</p></div></div><div className="result-profile"><article><span>优势线索</span><ul>{report.profile.strengths.map((s,i)=><li key={i}>{s}</li>)}</ul></article><article><span>角色与工作方式</span><p>{report.profile.workingStyle}</p></article><article><span>个人内容定位</span><p>{report.profile.ipPositioning}</p></article></div><div className="result-sections">{report.sections.map((s,i)=><article key={i}><span className="section-kicker">CHAPTER {String(i+1).padStart(2,'0')}</span><h3>{s.title}</h3><p>{s.analysis}</p><ul>{s.suggestions.map((t,j)=><li key={j}><Check size={16}/>{t}</li>)}</ul></article>)}</div><div className="result-action"><h3>接下来 4 周，把方向放进行动。</h3><div>{report.actionPlan.map((s,i)=><article key={i}><span>{s.period}</span><h4>{s.task}</h4><p>验证标准：{s.measure}</p></article>)}</div></div><div className="result-limitations"><h3>需要继续验证的判断</h3><ul>{report.limitations.map((s,i)=><li key={i}>{s}</li>)}</ul></div></>:<div className="raw-report"><p>返回的报告结构与约定不同，已保留完整原文供你阅读。</p><pre>{task.text}</pre></div>}</>}
  </section>;
}
