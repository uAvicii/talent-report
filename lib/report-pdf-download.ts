import {buildReportPdfDefinition,reportPdfFilename,type ReportPdfInput} from './report-pdf.mjs';

let fontsReady:Promise<void>|undefined;
async function loadFont(filename:string):Promise<string> {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),30000);
  try {
    const response=await fetch(`/fonts/${filename}`,{signal:controller.signal});
    if(!response.ok)throw new Error('无法加载 PDF 中文字体');
    const bytes=new Uint8Array(await response.arrayBuffer());
    const parts:string[]=[];
    for(let offset=0;offset<bytes.length;offset+=8192)parts.push(String.fromCharCode(...bytes.subarray(offset,offset+8192)));
    return btoa(parts.join(''));
  } finally {clearTimeout(timer);}
}

export async function downloadReportPdf(input:ReportPdfInput):Promise<void> {
  // Load the PDF engine and same-origin Chinese fonts only on download.
  const {default:pdf}=await import('pdfmake/build/pdfmake');
  const regular='NotoSansSC-Regular.woff2',bold='NotoSansSC-Bold.woff2';
  if(!fontsReady){
    fontsReady=Promise.all([loadFont(regular),loadFont(bold)]).then(([normal,strong])=>{
      pdf.addVirtualFileSystem({[regular]:normal,[bold]:strong});
    }).catch(error=>{fontsReady=undefined;throw error;});
  }
  await fontsReady;
  pdf.addFonts({NotoSansSC:{normal:regular,bold,italics:regular,bolditalics:bold}});
  const blob=await pdf.createPdf(buildReportPdfDefinition(input)).getBlob();
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');
  anchor.href=url;anchor.download=reportPdfFilename(input.id);
  document.body.appendChild(anchor);
  try {anchor.click();} finally {
    anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
}
