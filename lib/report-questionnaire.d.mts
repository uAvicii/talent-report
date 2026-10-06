import type {ProfileInput} from './report-domain.mjs';
export type QuestionnaireAnswers = Record<string, string[]>;
export interface QuestionnaireOption {id:string;text:string;exclusive?:boolean;}
export interface QuestionnaireQuestion {id:string;kind:'single'|'multi';title:string;hint:string;options:QuestionnaireOption[];}
export const DRAFT_KEY:string;
export const questionnaire:QuestionnaireQuestion[];
export function normalizeAnswers(value:unknown):QuestionnaireAnswers;
export function toggleAnswer(answers:QuestionnaireAnswers,questionId:string,optionId:string):QuestionnaireAnswers;
export function validateAnswers(answers:QuestionnaireAnswers):QuestionnaireAnswers;
export function answerLabels(answers:QuestionnaireAnswers,questionId:string):string[];
export function buildQuestionnaireProfile(answers:QuestionnaireAnswers,name?:string,note?:string):ProfileInput;
export function buildQuestionnairePrompt(answers:QuestionnaireAnswers,name?:string,note?:string):string;
export function restoreDraft(raw:string|null):{answers:QuestionnaireAnswers;step:number;name:string;note:string}|null;
