export interface ReportTask {id:string;status:string;text:string;detail:string;conversationUrl:string;updated:number;}
export interface BridgeStatus {connected:boolean;environment:string;version:string;online:boolean;enabled:boolean;}

// The Tencent build injects its public API address; local/Sites builds keep
// using the original local workbench. Pairing credentials never enter the bundle.
declare const __REPORT_SERVICE_URL__:string;
const service = typeof __REPORT_SERVICE_URL__==='string' ? __REPORT_SERVICE_URL__ : 'http://127.0.0.1:8765/api/report-client';
export const workbenchName=/^http:\/\/(127\.0\.0\.1|localhost):/.test(service)?'本地工作台':'线上工作台';
let session:Promise<string>|null = null;

async function request<T>(path:string,body:Record<string,unknown>|undefined,token:string|undefined,timeoutMs:number):Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const response = await fetch(service+path,{
      method:body===undefined?'GET':'POST',
      headers:{...(token?{Authorization:`Bearer ${token}`}:{ }),...(body===undefined?{}:{'Content-Type':'application/json'})},
      ...(body===undefined?{}:{body:JSON.stringify(body)}),
      signal:controller.signal,credentials:'omit',cache:'no-store',
    });
    const value = await response.json() as {error?:string};
    if(!response.ok) {
      if(response.status===401) session=null;
      throw new Error(value.error||`${workbenchName}请求失败（HTTP ${response.status}）。`);
    }
    return value as T;
  } catch(error) {
    if(controller.signal.aborted)throw new Error(`${workbenchName}响应超时，请检查服务是否运行；不会自动重复提交。`);
    if(error instanceof TypeError)throw new Error(workbenchName==='本地工作台'?'无法连接本地工作台。请启动 image-bridge/server.py；若浏览器提示访问本地网络，请允许当前页面访问。':'无法连接线上工作台，请检查工作台服务、HTTPS 和报告页面来源配置。');
    throw error;
  } finally { clearTimeout(timer); }
}

function connect(timeoutMs:number):Promise<string> {
  if(!session) {
    session=(async()=>{
      let clientId=sessionStorage.getItem('talent-report-client');
      if(!clientId||!/^[a-f0-9]{64}$/.test(clientId)){
        clientId=Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('');
        sessionStorage.setItem('talent-report-client',clientId);
      }
      const result=await request<{token:string;protocolVersion:number}>('/session',{clientId},undefined,timeoutMs);
      if(result.protocolVersion!==3||!/^report\.[a-f0-9]{64}\.[a-f0-9]{64}$/.test(result.token))throw new Error('工作台版本不兼容，请更新并重启 image-bridge/server.py。');
      return result.token;
    })().catch(error=>{session=null;throw error;});
  }
  return session;
}

// Any browser can use HTTP to submit and read its reports. The existing
// extension independently claims the shared queue and operates its own ChatGPT.
export async function bridgeCall<T>(action:'status'|'create'|'get'|'cancel'|'read',payload:Record<string,unknown> = {},timeoutMs=30000):Promise<T> {
  const token=await connect(timeoutMs);
  if(action==='status')return request<T>('/status',undefined,token,timeoutMs);
  if(action==='create')return request<T>('/tasks',payload,token,timeoutMs);
  if(typeof payload.id!=='string'||!/^[a-f0-9]{24}$/.test(payload.id))throw new Error('报告任务编号无效。');
  return request<T>(`/tasks/${payload.id}${action==='cancel'?'/cancel':action==='read'?'/read-result':''}`,action==='get'?undefined:{},token,timeoutMs);
}
