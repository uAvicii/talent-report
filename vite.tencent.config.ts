import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

const projectRoot=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig(({mode})=>{
  const env=loadEnv(mode,projectRoot,'VITE_');
  const service=env.VITE_REPORT_SERVICE || 'https://report.pepehub.top/api/report-client';
  const url=new URL(service);
  if(url.username || url.password || url.search || url.hash ||
    url.pathname!=='/api/report-client' ||
    !(url.protocol==='https:' || (url.protocol==='http:' && ['127.0.0.1','localhost'].includes(url.hostname)))) {
    throw new Error('VITE_REPORT_SERVICE 必须是 HTTPS 工作台或本机 HTTP 工作台的 /api/report-client 地址，不得包含配对码。');
  }
  return {
    root:fileURLToPath(new URL('./deploy/frontend',import.meta.url)),
    envDir:projectRoot,
    publicDir:fileURLToPath(new URL('./public',import.meta.url)),
    base:'/',
    plugins:[react()],
    resolve:{alias:{'@':projectRoot}},
    define:{__REPORT_SERVICE_URL__:JSON.stringify(service)},
    build:{outDir:fileURLToPath(new URL('./dist/tencent',import.meta.url)),emptyOutDir:true},
  };
});
