import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import pdfmake from 'pdfmake';
import {buildReportPdfDefinition,reportPdfFilename} from '../lib/report-pdf.mjs';
import {pdfReport} from './fixtures/pdf-report.mjs';

const regular=fileURLToPath(new URL('../public/fonts/NotoSansSC-Regular.woff2',import.meta.url));
const bold=fileURLToPath(new URL('../public/fonts/NotoSansSC-Bold.woff2',import.meta.url));
pdfmake.addFonts({NotoSansSC:{normal:regular,bold,italics:regular,bolditalics:bold}});
pdfmake.setUrlAccessPolicy(()=>false);
pdfmake.setLocalAccessPolicy(filename=>filename===regular||filename===bold);
const input={report:pdfReport,text:JSON.stringify(pdfReport),id:'pdf-test-01',updated:1791289836};

test('exports a real A4 PDF with embedded Chinese fonts without changing the report',async()=>{
  const original=JSON.stringify(pdfReport);
  const definition=buildReportPdfDefinition(input);
  const buffer=await pdfmake.createPdf(definition).getBuffer();
  assert.equal(buffer.subarray(0,5).toString(),'%PDF-');
  assert.match(buffer.toString('latin1'),/\/FontFile3\b/);
  assert.match(buffer.toString('latin1'),/\/MediaBox \[0 0 595\.28 841\.89\]/);
  assert.ok((buffer.toString('latin1').match(/\/Type \/Page\b/g)||[]).length>1);
  // Inspect the final layout; pageBreakBefore receives the initial positions
  // before pdfmake lays out a requested page break again.
  const chapter=definition.content.find(node=>node.id==='chapter-0');
  const opening=definition.content.find(node=>node.text===pdfReport.sections[0].analysis);
  assert.equal(chapter.positions[0].pageNumber,opening.positions[0].pageNumber,'chapter title must share a page with its opening paragraph');
  assert.equal(JSON.stringify(pdfReport),original);
});

test('long reports and unstructured results both export as PDFs',async()=>{
  const long=structuredClone(pdfReport);
  long.sections[0].analysis=long.sections[0].analysis.repeat(18);
  for(const report of [long,null]){
    const buffer=await pdfmake.createPdf(buildReportPdfDefinition({...input,report,text:'保留完整原文\n'+('长段落与 ABC 123，不能被截断。'.repeat(300))})).getBuffer();
    assert.equal(buffer.subarray(0,5).toString(),'%PDF-');
    assert.ok((buffer.toString('latin1').match(/\/Type \/Page\b/g)||[]).length>2);
  }
});

test('download filenames always use PDF and cannot introduce path separators',()=>{
  assert.equal(reportPdfFilename('abc123'),'天赋事业报告-abc123.pdf');
  assert.equal(reportPdfFilename('../evil\\file'),'天赋事业报告-evilfile.pdf');
});
