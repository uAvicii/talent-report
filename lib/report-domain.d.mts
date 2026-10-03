export interface ProfileInput {name:string;stage:string;experience:string;strengths:string;resources:string;question:string;}
export interface TalentReport {title:string;summary:string;profile:{strengths:string[];workingStyle:string;ipPositioning:string};sections:{title:string;analysis:string;suggestions:string[]}[];actionPlan:{period:string;task:string;measure:string}[];limitations:string[];}
export const terminalStatuses:Set<string>;
export const reportStatuses:Record<string,string>;
export function buildReportPrompt(profile:ProfileInput):string;
export function parseReport(text:string):TalentReport;
