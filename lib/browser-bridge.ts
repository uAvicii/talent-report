export interface ReportTask {id:string;status:string;text:string;detail:string;conversationUrl:string;updated:number;}
export interface BridgeStatus {connected:boolean;environment:string;version:string;online:boolean;}
export function bridgeCall<T>(action:'status'|'create'|'get'|'cancel',payload:Record<string,unknown> = {},timeoutMs=30000):Promise<T> {
  return new Promise((resolve,reject)=>{
    const id=crypto.randomUUID();
    const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',listener);};
    const listener=(event:MessageEvent)=>{
      if(event.source!==window||event.origin!==location.origin||event.data?.source!=='TALENT_REPORT_EXTENSION'||event.data.id!==id)return;
      cleanup();
      const response=event.data.result;
      if(!response?.ok)reject(new Error(response?.error||'浏览器插件连接失败。'));
      else { const {ok:_,...value}=response; resolve(value as T); }
    };
    const timer=setTimeout(()=>{cleanup();reject(new Error('未收到浏览器插件响应。请在 Chrome 中加载更新后的 Image Bridge 插件，选择本地工作台并刷新此页。'));},timeoutMs);
    window.addEventListener('message',listener);
    window.postMessage({source:'TALENT_REPORT_WEB',id,action,payload},location.origin);
  });
}
