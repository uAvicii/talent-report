import {test} from 'node:test';
import assert from 'node:assert/strict';

let sequence=0;
async function harness(reply){
  const values=new Map(),calls=[];
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)}});
  globalThis.fetch=async(url,options)=>{
    calls.push({url,options});
    if(url.endsWith('/session')){
      const {clientId}=JSON.parse(options.body);
      return {ok:true,json:async()=>({token:`report.${clientId}.${'a'.repeat(64)}`,protocolVersion:3})};
    }
    return reply(url,options);
  };
  const client=await import(`../lib/browser-bridge.ts?case=${++sequence}`);
  return {...client,calls,values};
}

test('a page without an extension submits by HTTP and queries the same task',async()=>{
  const task={id:'a'.repeat(24),status:'queued'};
  const h=await harness(async()=>({ok:true,json:async()=>task}));
  assert.deepEqual(await h.bridgeCall('create',{prompt:'test',clientRequestId:'request'}),task);
  await h.bridgeCall('get',{id:task.id});
  assert.equal(h.calls.length,3);
  assert.match(h.calls[0].url,/127\.0\.0\.1:8765\/api\/report-client\/session$/);
  assert.equal(h.calls[1].options.method,'POST');
  assert.equal(h.calls[2].options.method,'GET');
  assert.match(h.calls[2].url,new RegExp(`/tasks/${task.id}$`));
  assert.match(h.calls[1].options.headers.Authorization,/^Bearer report\./);
  assert.equal(JSON.parse(h.calls[1].options.body).clientRequestId,'request');
});

test('reconnecting only reads status and never creates another task',async()=>{
  const h=await harness(async()=>({ok:true,json:async()=>({connected:true,online:false,enabled:false})}));
  assert.equal((await h.bridgeCall('status')).online,false);
  await h.bridgeCall('status');
  assert.deepEqual(h.calls.map(call=>call.url.split('/').pop()),['session','status','status']);
});

test('a failed creation is not automatically replayed',async()=>{
  const h=await harness(async()=>{throw new TypeError('network failed');});
  await assert.rejects(h.bridgeCall('create',{prompt:'test',clientRequestId:'same-id'}),/无法连接本地工作台/);
  assert.equal(h.calls.filter(call=>call.url.endsWith('/tasks')).length,1);
});

test('cancellation targets only a valid task ID',async()=>{
  const h=await harness(async()=>({ok:true,json:async()=>({status:'cancelled'})}));
  await assert.rejects(h.bridgeCall('cancel',{id:'../other'}),/编号无效/);
  await h.bridgeCall('cancel',{id:'b'.repeat(24)});
  assert.equal(h.calls.length,2);
  assert.match(h.calls[1].url,/\/tasks\/b{24}\/cancel$/);
  assert.equal(h.calls[1].options.method,'POST');
});

test('expired capabilities reconnect on the next action without replaying writes',async()=>{
  let count=0;
  const h=await harness(async()=>({ok:++count>1,status:401,json:async()=>count===1?{error:'连接已失效'}:{connected:true}}));
  await assert.rejects(h.bridgeCall('status'),/连接已失效/);
  await h.bridgeCall('status');
  assert.equal(h.calls.filter(call=>call.url.endsWith('/session')).length,2);
});
