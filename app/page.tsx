"use client";
import { useState } from "react";
import { Compass, Check, Plus, Minus, Sparkles, FileText, Layers3, MessageCircle, CircleCheck, X } from "lucide-react";
import { Dialog as Modal } from "radix-ui";
import { siteContent as c } from "@/lib/site-content";
import { ReportForm, ReportWorkspace } from "@/components/report-workflow";
import type { ReportTask } from "@/lib/browser-bridge";

export default function Home() {
  const [dialog, setDialog] = useState<"booking" | "sample" | null>(null);
  const [tab, setTab] = useState(0);
  const [activeTask, setActiveTask] = useState<ReportTask | null>(null);
  const book = () => setDialog("booking");
  const created = (task: ReportTask) => {
    setActiveTask(task); setDialog(null);
    setTimeout(() => document.getElementById("my-report")?.scrollIntoView({behavior:"smooth"}), 50);
  };
  return <>
    <header className="header"><div className="container nav">
      <a className="brand" href="#"><span className="brand-icon"><Compass size={23}/></span>{c.brand}<span className="brand-en">TALENT STUDIO</span></a>
      <nav aria-label="主导航"><a href="#questions">报告内容</a><a href="#approach">分析方法</a><a href="#process">服务流程</a></nav>
      <button className="nav-cta" onClick={book}>生成我的报告</button>
    </div></header>
    <main>
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><span>个人事业探索计划</span><span className="beta">内测开放中</span></div>
          <h1>让你的天赋，<br/>成为事业的<span className="accent-word">方向。</span></h1>
          <p className="hero-subtitle">天赋事业报告</p>
          <p className="hero-description">看清自己的优势，找到合适的商业路径。<br/>从「我适合什么」，走到「下一步怎么做」。</p>
          <div className="hero-actions"><button className="button primary" onClick={book}>开启我的事业探索 <span className="button-price">¥{c.price}</span></button><button className="sample-button" onClick={() => setDialog("sample")}><FileText size={18}/> 看一份报告示例</button></div>
          <div className="hero-notes"><span><Check size={16}/> 附赠 {c.consultationMinutes} 分钟商业咨询</span><span><Check size={16}/> 提交资料后立即执行</span></div>
        </div>
        <div className="report-stage">
          <div className="report-card">
            <div className="report-top"><span><Compass size={18}/> {c.brand} · 个人策略研究</span><span>VOL. 01</span></div>
            <div className="report-cover"><span className="report-kicker">YOUR PERSONAL PLAYBOOK</span><h2>天赋事业<br/>探索报告<span>／</span></h2><p>读懂自己，然后选择自己的路。</p></div>
            <div className="report-body"><div className="report-label"><span>你的事业，值得一次认真梳理</span><span>01—08</span></div>
              <div className="report-item"><span className="mini-icon"><Sparkles size={18}/></span><div><b>个人天赋画像</b><p>优势 · 表达 · 角色偏好</p></div><span className="report-index">01</span></div>
              <div className="report-item"><span className="mini-icon"><Layers3 size={18}/></span><div><b>商业路径地图</b><p>定位 · 赛道 · 变现方式</p></div><span className="report-index">02</span></div>
              <div className="report-item"><span className="mini-icon"><Compass size={18}/></span><div><b>下一步行动建议</b><p>阶段节奏 · 实验 · 优先级</p></div><span className="report-index">03</span></div>
            </div><div className="report-bottom"><span>PERSONAL INSIGHT × BUSINESS STRATEGY</span><span>知己 · 知途</span></div>
          </div>
          <div className="floating-note"><CircleCheck size={22}/><div><b>不止认识自己</b><span>更要知道如何行动</span></div></div>
          <span className="stage-caption">一份属于你的事业探索指南</span>
        </div>
      </section>
      <section className="principle-strip"><div className="container"><p>把个人优势，放进真实的商业语境。</p><div><span>个人天赋画像</span><i>＋</i><span>商业方法论</span><i>＋</i><span>交叉验证</span></div></div></section>
      <ReportWorkspace initialTask={activeTask}/>
      <section id="questions" className="section container">
        <div className="section-heading"><div><span className="section-kicker">THE RIGHT QUESTIONS</span><h2>你正在纠结的，<br/>也许正是事业的关键。</h2></div><p>8 个核心问题，帮你梳理选择背后的逻辑。<br/>点击问题，看看报告会从哪里切入。</p></div>
        <div className="questions-grid">{c.questions.map((q, i) => <details className="question" key={q.title}><summary><span className="number">{String(i+1).padStart(2,"0")}</span><span>{q.title}</span><Plus className="plus" size={18}/><Minus className="minus" size={18}/></summary><p>{q.detail}</p></details>)}</div>
      </section>
      <section id="approach" className="approach section"><div className="container">
        <div className="section-heading"><div><span className="section-kicker">FROM INSIGHT TO ACTION</span><h2>认识自己，是起点。<br/>找到路径，才有下一步。</h2></div><p>用个人画像提出方向，<br/>再用商业方法与实际经历核对。</p></div>
        <div className="method-grid">{c.methods.map((m,i) => <article key={m.title}><span className="method-number">0{i+1} <span>／</span></span><h3>{m.title}</h3><p>{m.description}</p><div className="method-tags">{m.tags.map(t=><span key={t}>{t}</span>)}</div></article>)}</div>
        <div className="method-footnote"><Compass size={18}/><p>报告用于启发选择与行动；建议需要结合你的经历、资源和实践结果持续校准。</p></div>
      </div></section>
      <section id="process" className="section container">
        <div className="section-heading"><div><span className="section-kicker">HOW IT WORKS</span><h2>从一次梳理，<br/>开始更清晰的选择。</h2></div><p>你提供真实的自己，<br/>我们把线索整理成可以讨论的方向。</p></div>
        <div className="process-grid">{c.steps.map((s,i)=><article key={s.title}><span className="step-number">0{i+1}</span><h3>{s.title}</h3><p>{s.description}</p></article>)}</div>
      </section>
      <section id="pricing" className="container pricing-wrap"><div className="pricing">
        <div className="pricing-copy"><span className="section-kicker">BETA ACCESS · 内测方案</span><h2>把下一步，<br/>留给更了解自己的你。</h2><p>天赋事业报告 + 一次商业咨询</p><ul>{c.benefits.map(t=><li key={t}><Check size={18}/>{t}</li>)}</ul></div>
        <div className="price-panel"><span className="price-label">限时内测价</span><div className="price"><span>¥</span>{c.price}<del>¥{c.originalPrice}</del></div><div className="price-divider"/><p><MessageCircle size={18}/> 含 {c.consultationMinutes} 分钟商业咨询</p><p><FileText size={18}/> 生成完成后立即展示结果</p><button className="button lime" onClick={book}>立即生成报告</button><span className="price-note">当前报告生成体验不收取费用；商业咨询另行安排</span></div>
      </div></section>
      <section className="section container faq"><div><span className="section-kicker">GOOD TO KNOW</span><h2>在开始之前</h2></div><div>{c.faqs.map(f=><details key={f.title}><summary>{f.title}<Plus size={18}/></summary><p>{f.answer}</p></details>)}</div></section>
    </main>
    <footer className="container footer"><a className="brand" href="#"><Compass size={22}/>{c.brand}</a><p>以自我认识为起点，以行动验证为路径。</p><span>© {new Date().getFullYear()} {c.brand} TALENT STUDIO</span></footer>
    <div className="mobile-buy"><div><small>内测专享</small><b>¥{c.price}</b></div><button className="button primary" onClick={book}>生成我的报告</button></div>
    <Modal.Root open={dialog !== null} onOpenChange={open => { if (!open) setDialog(null); }}><Modal.Portal><Modal.Overlay className="modal-overlay"/><Modal.Content className="modal-content"><Modal.Close className="modal-close" aria-label="关闭"><X size={20}/></Modal.Close>
      {dialog === "sample" ? <><span className="section-kicker">REPORT PREVIEW</span><Modal.Title className="modal-title">报告会如何帮助你？</Modal.Title><Modal.Description className="modal-description">以下是内容结构示例，实际报告根据个人资料撰写。</Modal.Description><div className="sample-tabs" role="tablist" aria-label="报告示例章节">{c.samples.map((s,i)=><button key={s.title} id={`sample-tab-${i}`} aria-controls={`sample-panel-${i}`} role="tab" aria-selected={tab===i} onClick={()=>setTab(i)} onKeyDown={e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();const next=(tab+(e.key==="ArrowRight"?1:2))%3;setTab(next);document.getElementById(`sample-tab-${next}`)?.focus();}}} tabIndex={tab===i?0:-1} className={tab===i?"active":""}>{s.title}</button>)}</div><div className="sample-panel" role="tabpanel" id={`sample-panel-${tab}`} aria-labelledby={`sample-tab-${tab}`}><span>章节示例 / 0{tab+1}</span><h3>{c.samples[tab].heading}</h3><p>{c.samples[tab].description}</p><ul>{c.samples[tab].points.map(p=><li key={p}><Check size={16}/>{p}</li>)}</ul></div><button className="button primary full" onClick={book}>生成我的专属报告</button></>
      : <><span className="section-kicker">START YOUR JOURNEY</span><Modal.Title className="modal-title">从了解你开始，立即生成报告</Modal.Title><Modal.Description className="modal-description">填写真实经历与事业问题，浏览器插件会自动提交给你已登录的 ChatGPT，完成后在本页展示结果。</Modal.Description><ReportForm onCreated={created}/></>}
    </Modal.Content></Modal.Portal></Modal.Root>
  </>;
}
