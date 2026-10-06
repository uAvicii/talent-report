import {buildReportPrompt} from './report-domain.mjs';

export const DRAFT_KEY = 'talent-report-questionnaire-v1';
const options = texts => texts.map((text, index) => ({id: String(index + 1), text}));
const multiOptions = texts => options(texts).map(option => ({...option, exclusive: option.id === '12'}));
export const questionnaire = [
  {id:'stage', kind:'single', title:'你目前处于哪个阶段？', hint:'选择最接近当前情况的一项。', options:options([
    '在校学习，探索未来方向','刚开始工作，积累经验','有稳定主业，想探索副业','想转行，寻找新方向',
    '正在尝试内容或个人 IP','已有自由职业或接单业务','已有产品或团队业务','其他阶段 / 暂不确定',
  ])},
  {id:'experience', kind:'multi', title:'你实际做过哪些类型的工作？', hint:'以真实经历为准，学习项目、兼职和志愿经历也算。最多选 3 项。', options:multiOptions([
    '技术开发与工具制作','设计与视觉创作','写作与内容制作','营销与用户运营','销售与客户服务','教学与培训',
    '咨询与专业服务','项目管理与团队协作','研究与数据分析','实体经营与现场服务','行政与日常支持','其他 / 暂无相关经历',
  ])},
  {id:'skills', kind:'multi', title:'哪些事情是你做起来比较顺手的？', hint:'根据做过的事情选择；有实际反馈更好。最多选 3 项。', options:multiOptions([
    '把复杂信息讲清楚','倾听并理解他人需求','写作与整理知识','设计与审美表达','开发与解决技术问题','研究与分析问题',
    '沟通与促成合作','计划并推进执行','组织与协调团队','发现需求与改进流程','动手制作与现场服务','其他 / 还没发现优势',
  ])},
  {id:'interests', kind:'multi', title:'你愿意持续了解哪些领域？', hint:'这里问的是兴趣，不代表你已具备该领域的专业能力。最多选 3 项。', options:multiOptions([
    '科技与 AI 工具','商业与创业','教育与知识分享','设计与艺术','写作与文化','生活方式与消费',
    '运动与健康','人与沟通','职场与效率','社会与公共议题','手作与实体产品','其他 / 暂不确定',
  ])},
  {id:'role', kind:'single', title:'哪种工作方式让你更自在？', hint:'选择你更愿意长期采用的方式。', options:options([
    '公开表达，分享观点','一对一交流，帮助别人','小范围分享与讨论','幕后制作内容或作品',
    '独立研究，解决问题','组织协调，推动项目','根据任务切换台前幕后','还不确定，想尝试后判断',
  ])},
  {id:'collaboration', kind:'single', title:'开展一个新项目时，你更希望怎样合作？', hint:'考虑当前能力与现实条件。', options:options([
    '独立完成，自己安排','与一位互补伙伴合作','加入成熟团队承担专长','借助平台或社群资源',
    '自己统筹，部分工作外包','带领小团队共同推进','先参与别人的项目学习','还不确定，视项目而定',
  ])},
  {id:'time', kind:'single', title:'每周能稳定投入多少时间探索新方向？', hint:'以可持续投入为准，不需要填理想状态。', options:options([
    '少于 2 小时','2–4 小时','5–8 小时','9–15 小时','16–25 小时','超过 25 小时','时间不固定，难以承诺','暂时没有额外时间',
  ])},
  {id:'resources', kind:'multi', title:'你目前可以用到哪些资源？', hint:'只选已经具备或可直接使用的资源。最多选 3 项。', options:multiOptions([
    '某个领域的实际经验','可展示的作品或案例','相关资质或专业训练','已有客户或潜在客户','内容读者或社群成员','能合作的伙伴',
    '行业人脉或渠道','必要的工具与设备','可用的场地或供应链','可承担的小额试验预算','稳定主业提供生活保障','其他 / 暂无可用资源',
  ])},
  {id:'goal', kind:'single', title:'这次最希望报告帮你解决什么？', hint:'选出当前优先级最高的一个问题。', options:options([
    '找到值得探索的事业方向','判断转行方向与准备步骤','寻找适合的副业切入点','明确个人内容与 IP 定位',
    '把现有技能转成服务或产品','比较独立做与团队合作','梳理现有业务的下一步','还没想清楚，先了解自己',
  ])},
  {id:'pace', kind:'single', title:'面对新方向，你目前更能接受哪种推进节奏？', hint:'选择你现在愿意接受的投入与不确定性。', options:options([
    '先了解，不急于行动','保留现状，做小规模试验','先学技能，再尝试交付','先找真实需求，再决定投入',
    '先找到伙伴，一起验证','已有明确方向，持续推进','先完成手头事务，再开始','暂不确定，需要比较方案',
  ])},
];

export function normalizeAnswers(value) {
  const answers = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return answers;
  for (const question of questionnaire) {
    if (!Array.isArray(value[question.id])) continue;
    let selected = [...new Set(value[question.id])].filter(id => question.options.some(option => option.id === id));
    const exclusive = question.options.find(option => option.exclusive && selected.includes(option.id));
    selected = exclusive ? [exclusive.id] : selected.slice(0, question.kind === 'single' ? 1 : 3);
    if (selected.length) answers[question.id] = selected;
  }
  return answers;
}

export function toggleAnswer(answers, questionId, optionId) {
  const question = questionnaire.find(item => item.id === questionId);
  const option = question?.options.find(item => item.id === optionId);
  if (!question || !option) throw new Error('无效的题目选项。');
  const selected = answers[questionId] || [];
  let next;
  if (question.kind === 'single') next = [optionId];
  else if (selected.includes(optionId)) next = selected.filter(id => id !== optionId);
  else if (option.exclusive) next = [optionId];
  else {
    next = selected.filter(id => !question.options.find(item => item.id === id)?.exclusive);
    if (next.length >= 3) throw new Error('这题最多选 3 项，请先取消一项再选择。');
    next = [...next, optionId];
  }
  return {...answers, [questionId]:next};
}

export function validateAnswers(answers) {
  for (const question of questionnaire) {
    const selected = answers?.[question.id];
    if (!Array.isArray(selected) || !selected.length) throw new Error(`请回答「${question.title}」`);
    if (selected.length > (question.kind === 'single' ? 1 : 3) || new Set(selected).size !== selected.length || selected.some(id => !question.options.some(option => option.id === id))) throw new Error(`「${question.title}」的选择无效，请重新选择。`);
    if (selected.length > 1 && question.options.some(option => option.exclusive && selected.includes(option.id))) throw new Error('“其他 / 暂不确定”类选项请单独选择。');
  }
  return answers;
}

export function answerLabels(answers, questionId) {
  const question = questionnaire.find(item => item.id === questionId);
  return question ? question.options.filter(option => answers[questionId]?.includes(option.id)).map(option => option.text) : [];
}

export function buildQuestionnaireProfile(answers, name = '', note = '') {
  validateAnswers(answers);
  if (typeof name !== 'string' || name.length > 40 || typeof note !== 'string' || note.length > 500) throw new Error('昵称最多 40 字，补充经历最多 500 字。');
  const text = id => answerLabels(answers, id).join('、');
  return {
    name:name.trim() || '探索者', stage:text('stage'),
    experience:`以下为用户点选的实际经历范围，未提供具体项目、年限、成果或收入，不能据此推定能力水平：${text('experience')}。${note.trim() ? `用户自述补充：${note.trim()}` : '用户未补充具体经历。'}`,
    strengths:`自述做起来顺手的任务：${text('skills')}。感兴趣的领域（不等于已具备能力）：${text('interests')}。`,
    resources:`每周可投入时间：${text('time')}。自述已有资源（未核验）：${text('resources')}。`,
    question:`最希望解决：${text('goal')}。角色偏好：${text('role')}。合作偏好：${text('collaboration')}。可接受的推进节奏：${text('pace')}。`,
  };
}

export function buildQuestionnairePrompt(answers, name = '', note = '') {
  return buildReportPrompt(buildQuestionnaireProfile(answers, name, note)) + '\n资料来自选择题和可选补充，不是标准化心理测评。严格区分实际经历、自述优势、兴趣与偏好；不要把兴趣当作技能、把偏好当作固定人格、把经历类别当作已取得的成绩。“其他 / 暂不确定”表示该项信息不足，不是负面特征。建议须说明依据与待验证条件；具体经历不足时，在 limitations 中明确指出。';
}

export function restoreDraft(raw) {
  try {
    if (typeof raw !== 'string' || raw.length > 20000) return null;
    const value = JSON.parse(raw);
    if (value?.version !== 1) return null;
    const answers = normalizeAnswers(value.answers);
    const missing = questionnaire.findIndex(question => !answers[question.id]?.length);
    const step = Math.max(0, Math.min(Number.isInteger(value.step) ? value.step : 0, missing === -1 ? questionnaire.length : missing));
    return {answers, step, name:typeof value.name === 'string' ? value.name.slice(0,40) : '', note:typeof value.note === 'string' ? value.note.slice(0,500) : ''};
  } catch {return null;}
}
