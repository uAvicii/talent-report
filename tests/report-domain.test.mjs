import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildReportPrompt,parseReport} from '../lib/report-domain.mjs';
const profile={name:'测试',stage:'探索方向',experience:'写作与内容策划三年，擅长访谈和整理信息，现在想探索自己独立开展服务的可能。',strengths:'访谈与结构化表达',resources:'每周8小时',question:'怎样设计一个可验证的个人知识服务？'};
test('prompt treats personal information as data and keeps all eight required topics',()=>{
  const prompt=buildReportPrompt(profile);
  assert.ok(prompt.includes(JSON.stringify(profile)));assert.ok(prompt.includes('sections 必须恰好 8 项'));
  assert.ok(prompt.includes('不要生成图片'));assert.ok(prompt.includes('禁止编造'));
  assert.throws(()=>buildReportPrompt({...profile,experience:'太短'}));
});
test('parses complete reports and rejects partial or invalid structures',()=>{
  const report={title:'报告',summary:'概述',profile:{strengths:['写作'],workingStyle:'幕后',ipPositioning:'知识服务'},sections:Array.from({length:8},(_,i)=>({title:'章节'+i,analysis:'判断',suggestions:['行动']})),actionPlan:Array.from({length:4},(_,i)=>({period:'第'+i+'周',task:'验证',measure:'反馈'})),limitations:['自述需要核对']};
  assert.equal(parseReport('```json\n'+JSON.stringify(report)+'\n```').sections.length,8);
  assert.throws(()=>parseReport(JSON.stringify({...report,sections:report.sections.slice(0,2)})));
  assert.throws(()=>parseReport('{"title":"未完成'));
});
