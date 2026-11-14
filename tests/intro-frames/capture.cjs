/* global __dirname */
// Real shared renderer, deterministic test clock; never a replacement shader.
const { Buffer } = require('node:buffer');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const repo = path.resolve(__dirname, '../..');
const ts = require(path.join(repo,'node_modules/typescript'));
require.extensions['.ts'] = (module, name) => module._compile(ts.transpileModule(fs.readFileSync(name,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText, name);
const {makeSphereHtml} = require(path.join(repo,'src/intro/sphereHtml.ts'));
if (!process.argv[2]) throw new Error('Usage: node tests/intro-frames/capture.cjs /tmp/tih-intro-frames');
const out = path.resolve(process.argv[2]);
fs.mkdirSync(out,{recursive:true});
const htmlPath = path.join(out,'renderer.html');
fs.writeFileSync(htmlPath,makeSphereHtml(fs.readFileSync(path.join(repo,'assets/tune_into_her_sphere_source_clean.png')).toString('base64'),true));
const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
const profile=fs.mkdtempSync('/tmp/tih-brand-chrome-');
const log=fs.openSync(path.join(out,'chrome.log'),'w');
const chrome=cp.spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-default-apps','--use-angle=swiftshader','--enable-unsafe-swiftshader',`--user-data-dir=${profile}`,'--remote-debugging-port=0','about:blank'],{stdio:['ignore',log,log]});
(async()=>{
 let ws;
 try {
  const portFile=path.join(profile,'DevToolsActivePort');
  for(let i=0;!fs.existsSync(portFile)&&i<200;i++) await sleep(50);
  const port=fs.readFileSync(portFile,'utf8').split('\n')[0];
  const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws=new WebSocket(tabs.find(x=>x.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  let seq=0;const pending=new Map(); const events=[];
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(new Error(JSON.stringify(m.error)));else p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown'||m.method==='Log.entryAdded')events.push(m);};
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Log.enable');
  const rendererFiles=['src/intro/sphereHtml.ts','src/intro/timeline.ts','src/intro/sceneRuntime.generated.ts','src/intro/v4Shaders.generated.ts','src/intro/brand.generated.ts','src/intro/brandTexture.generated.ts','assets/tune_into_her_sphere_source_clean.png'];
  const sourceSha256=Object.fromEntries(rendererFiles.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,file))).digest('hex')]));
  const metadata={sourceSha256,sourceCommit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),capturedAt:new Date().toISOString(),engine:'Chromium headless WebGL / ANGLE SwiftShader; not iOS or Android native evidence',frames:[],events};
  const times=[0,500,1000,2000,2500,3500,4300,4500,9000,9500,10000];
  for(const [label,width,height] of [['iphone-se',375,667],['iphone-tall',393,852],['android-compact',360,800],['android-tall',412,915]]) {
   await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true});
   await cdp('Page.navigate',{url:`file://${htmlPath}`});
   let state;
   for(let i=0;i<300;i++){state=await evaluate('window.__TIH_TEST__?.state()');if(state?.failed)throw new Error(`Renderer failed: ${JSON.stringify(state)}`);if(state?.loaded)break;await sleep(50);}
   if(!state?.loaded)throw new Error('Renderer never ready');
   await evaluate(`document.body.style.background='linear-gradient(90deg,#DCE3E9 0%,#F9FBFC 50%,#DCE3E9 100%)';window.__TIH_CONTROL__({type:'configure',target:{x:${width/2},y:${height/2},radius:${Math.min(width*.38,height*.25)}},ink:[${41/255},${68/255},${88/255}]});true`);
   for(const ms of times){
    const info=await evaluate(`window.__TIH_TEST__.seek(${ms});(()=>{const canvas=document.querySelector('canvas');const gl=canvas.getContext('webgl');gl.finish();return {state:window.__TIH_TEST__.state(),canvas:[canvas.width,canvas.height],viewport:Array.from(gl.getParameter(gl.VIEWPORT)),glError:gl.getError(),devicePixelRatio,innerWidth,innerHeight};})()`);
    if(info.glError) throw new Error(`WebGL error ${info.glError} at ${label}/${ms}`);
    const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
    const file=`${label}-${String(ms).padStart(5,'0')}.png`;
    const data=Buffer.from(shot.data,'base64');fs.writeFileSync(path.join(out,file),data);
    metadata.frames.push({file,ms,width,height,sha256:crypto.createHash('sha256').update(data).digest('hex'),...info});
   }
  }
  metadata.offscreenScissors=[];
  for(const [x,y] of [[200,-200],[200,1500],[-500,400],[1500,400],[0,0],[200,400]]) {
    const sample=await evaluate(`window.__TIH_CONTROL__({type:'configure',target:{x:${x},y:${y},radius:140}});window.__TIH_TEST__.seek(9000);(()=>{const canvas=document.querySelector('canvas');const gl=canvas.getContext('webgl');gl.finish();return {target:[${x},${y}],canvas:[canvas.width,canvas.height],box:Array.from(gl.getParameter(gl.SCISSOR_BOX)),glError:gl.getError()};})()`);
    metadata.offscreenScissors.push(sample);
    if(sample.glError || sample.box.some(value=>value<0)) throw new Error('Invalid offscreen sphere scissor');
  }
  fs.writeFileSync(path.join(out,'frames.json'),JSON.stringify(metadata,null,2)+'\n');
  if(events.some(event=>event.method==='Runtime.exceptionThrown')) throw new Error('JavaScript runtime exception; inspect frames.json');
  console.log(JSON.stringify({out,frames:metadata.frames.length,exceptions:events.filter(x=>x.method==='Runtime.exceptionThrown').length,glErrors:metadata.frames.filter(x=>x.glError).length}));
 } finally {
  if(ws)ws.close();
  chrome.kill('SIGTERM');
  if(chrome.exitCode === null) await new Promise(resolve => {chrome.once('exit',resolve);setTimeout(resolve,5000);});
  fs.closeSync(log);
  fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
