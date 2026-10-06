import type {TalentReport} from './report-domain.mjs';
import type {TDocumentDefinitions} from 'pdfmake/interfaces';
export interface ReportPdfInput {report:TalentReport|null;text:string;id:string;updated:number;}
export function buildReportPdfDefinition(input:ReportPdfInput):TDocumentDefinitions;
export function reportPdfFilename(id:string):string;
