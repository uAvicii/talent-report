const ink = '#173D32';
const muted = '#677B72';
const heading = (text, id) => ({text, id, headlineLevel: 1, style: 'heading'});
const label = text => ({text, headlineLevel: 2, style: 'subheading'});
const paragraph = text => ({text, style: 'body'});

// A flowing document, rather than a screenshot: text remains searchable and
// arbitrarily long paragraphs can continue on the next A4 page.
export function buildReportPdfDefinition({report, text, id, updated}) {
  const title = report?.title || '天赋事业探索报告';
  const content = [
    {text: 'YOUR PERSONAL REPORT', style: 'kicker'},
    {text: title, style: 'title'},
    {text: `任务编号 ${id}`, style: 'meta'},
  ];
  if (Number.isFinite(updated) && updated > 0) {
    const date = new Date(updated * 1000);
    if (!Number.isNaN(date.getTime())) content.push({text: `报告更新时间 ${date.toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai', hour12: false})}（北京时间）`, style: 'meta'});
  }
  content.push({canvas: [{type: 'line', x1: 0, y1: 0, x2: 499.28, y2: 0, lineWidth: 1, lineColor: '#C7D6CC'}], margin: [0, 12, 0, 18]});
  if (report) {
    content.push(heading('综合判断', 'summary'), paragraph(report.summary));
    content.push(heading('个人优势与工作方式', 'profile'));
    content.push(label('优势线索'), {ul: report.profile.strengths.map(paragraph), margin: [0, 0, 0, 10]});
    content.push(label('角色与工作方式'), paragraph(report.profile.workingStyle));
    content.push(label('个人内容定位'), paragraph(report.profile.ipPositioning));
    report.sections.forEach((section, index) => {
      content.push(heading(`${String(index + 1).padStart(2, '0')}  ${section.title}`, `chapter-${index}`), paragraph(section.analysis));
      content.push(label('行动建议'), {ul: section.suggestions.map(paragraph), margin: [0, 0, 0, 8]});
    });
    content.push(heading('接下来 4 周，把方向放进行动', 'action-plan'));
    report.actionPlan.forEach((step, index) => {
      const week = [heading(step.period, `week-${index}`), paragraph(step.task), {text: `验证标准：${step.measure}`, style: 'measure'}];
      if (step.period.length + step.task.length + step.measure.length <= 300) content.push({stack: week, unbreakable: true});
      else content.push(...week);
    });
    const limitations = [heading('需要继续验证的判断', 'limitations'), {ul: report.limitations.map(paragraph)}];
    if (report.limitations.join('').length <= 300) content.push({stack: limitations, unbreakable: true});
    else content.push(...limitations);
  } else {
    content.push(heading('报告原文', 'original'), {text: '返回的报告结构与约定不同，以下保留完整原文。', style: 'measure'}, paragraph(text));
  }
  return {
    content,
    pageSize: 'A4', pageOrientation: 'portrait', pageMargins: [48, 58, 48, 56],
    info: {title, author: '知途', subject: '个人事业探索报告', keywords: '事业探索,天赋,行动计划'},
    defaultStyle: {font: 'NotoSansSC', fontSize: 10.5, lineHeight: 1.45, color: '#283C34'},
    styles: {
      kicker: {fontSize: 9, characterSpacing: 1.8, color: muted, margin: [0, 0, 0, 12]},
      title: {fontSize: 25, bold: true, color: ink, lineHeight: 1.2, margin: [0, 0, 0, 16]},
      meta: {fontSize: 8, color: muted, margin: [0, 0, 0, 4]},
      heading: {fontSize: 15, bold: true, color: ink, margin: [0, 16, 0, 10], lineHeight: 1.2},
      subheading: {fontSize: 11, bold: true, color: '#527545', margin: [0, 6, 0, 6]},
      body: {margin: [0, 0, 0, 9]},
      measure: {fontSize: 10, color: muted, margin: [0, 0, 0, 10]},
    },
    header: page => ({id: `page-decoration-header-${page}`, text: '知途  /  事业探索', fontSize: 8, color: muted, margin: [48, 26, 48, 0]}),
    footer: (page, pages) => ({id: `page-decoration-footer-${page}`, columns: [
      {id: `page-decoration-label-${page}`, text: '个人事业探索报告', alignment: 'left'},
      {id: `page-decoration-number-${page}`, text: `${page} / ${pages}`, alignment: 'right'},
    ], fontSize: 8, color: muted, margin: [48, 20, 48, 0]}),
    // pdfmake 0.3 API. Keep a heading with its opening lines, even when a
    // paragraph itself is long enough to span several pages.
    pageBreakBefore: (node, container) => Boolean(node.headlineLevel) &&
      !container.getFollowingNodesOnPage().some(item => !item.id?.startsWith('page-decoration-')) &&
      container.getPreviousNodesOnPage().some(item => !item.id?.startsWith('page-decoration-')),
  };
}

export function reportPdfFilename(id) {
  const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'report';
  return `天赋事业报告-${safeId}.pdf`;
}
