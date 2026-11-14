/* global __dirname */
// Real shared renderer, deterministic test clock; never a replacement shader.
const { Buffer } = require('node:buffer');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const repo = path.resolve(__dirname, '../..');
const ts = require(path.join(repo,'node_modules/typescript'));
require.extensions['.ts'] = (module, name) => module._compile(ts.transpileModule(fs.readFileSync(name,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText, name);
const {makeSphereHtml} = require(path.join(repo,'src/intro/sphereHtml.ts'));
const {INTRO_BACKGROUND_URI} = require(path.join(repo,'src/intro/brandBackground.generated.ts'));
const {introBackgroundOpacity} = require(path.join(repo,'src/intro/introPresentation.ts'));
// Load the historical production module graph, without rewriting either shader.
// A raw framebuffer comparison is independent of the new CSS background.
const baselineRef=process.argv[3] || '71504ac77a33f888fe65a49c60069a27153f1bea';
if(!/^[a-f0-9]{7,40}$/i.test(baselineRef))throw new Error('Baseline must be a local commit hash');
const baselineCommit=cp.execFileSync('git',['rev-parse',`${baselineRef}^{commit}`],{cwd:repo,encoding:'utf8'}).trim();
const historicalModules=new Map();
function loadHistorical(relative) {
 if(historicalModules.has(relative))return historicalModules.get(relative).exports;
 const source=cp.execFileSync('git',['show',`${baselineCommit}:${relative}`],{cwd:repo,encoding:'utf8',maxBuffer:20*1024*1024});
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const mod={exports:{}}; historicalModules.set(relative,mod);
 const localRequire=name=>{
  if(!name.startsWith('.'))throw new Error(`Unexpected historical external import: ${name}`);
  const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(relative),name));
  if(!resolved.startsWith('src/intro/'))throw new Error('Historical import escaped the intro module graph');
  return loadHistorical(resolved.endsWith('.ts')?resolved:`${resolved}.ts`);
 };
 vm.runInThisContext(`(function(exports,require,module){${compiled}\n})`,{filename:`${baselineCommit}/${relative}`})(mod.exports,localRequire,mod);
 return mod.exports;
}
const baselineMakeSphereHtml=loadHistorical('src/intro/sphereHtml.ts').makeSphereHtml;
if (!process.argv[2]) throw new Error('Usage: node tests/intro-frames/capture.cjs /tmp/tih-intro-frames [baseline-commit]');
const out = path.resolve(process.argv[2]);
fs.mkdirSync(out,{recursive:true});
const htmlPath = path.join(out,'renderer.html');
const texture=fs.readFileSync(path.join(repo,'assets/tune_into_her_sphere_source_clean.png'));
const historicalTexture=cp.execFileSync('git',['show',`${baselineCommit}:assets/tune_into_her_sphere_source_clean.png`],{cwd:repo,maxBuffer:20*1024*1024});
if(!texture.equals(historicalTexture))throw new Error('Protected V4 texture differs from the baseline');
fs.writeFileSync(htmlPath,makeSphereHtml(texture.toString('base64'),true));
const baselineHtmlPath=path.join(out,'baseline-renderer.html');
fs.writeFileSync(baselineHtmlPath,baselineMakeSphereHtml(historicalTexture.toString('base64'),true));
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
  const rendererFiles=['src/intro/sphereHtml.ts','src/intro/timeline.ts','src/intro/sceneRuntime.generated.ts','src/intro/v4Shaders.generated.ts','src/intro/brand.generated.ts','src/intro/brandTexture.generated.ts','src/intro/brandBackground.generated.ts','src/intro/introPresentation.ts','assets/tune_into_her_sphere_source_clean.png'];
  const sourceSha256=Object.fromEntries(rendererFiles.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,file))).digest('hex')]));
  const metadata={sourceSha256,sourceCommit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),workingTreeDirty:!!cp.execFileSync('git',['status','--porcelain'],{cwd:repo,encoding:'utf8'}).trim(),capturedAt:new Date().toISOString(),engine:'Chromium headless WebGL / ANGLE SwiftShader; not iOS or Android native evidence',frames:[],events};
  const times=[0,500,1000,1350,1800,2000,2350,2500,2850,3200,3500,3800,4000,4150,4300,4500,6500,9000,9360];
  const waitForReady=async()=>{
   let state;
   for(let i=0;i<300;i++){state=await evaluate('window.__TIH_TEST__?.state()');if(state?.failed)throw new Error(`Renderer failed: ${JSON.stringify(state)}`);if(state?.loaded)return state;await sleep(50);}
   throw new Error('Renderer never ready');
  };
  const framebuffer=async ms=>evaluate(`(async()=>{window.__TIH_TEST__.seek(${ms});const canvas=document.querySelector('canvas');const gl=canvas.getContext('webgl');gl.finish();const pixels=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);const glError=gl.getError();let nonzeroAlphaPixels=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])nonzeroAlphaPixels++;const hash=await crypto.subtle.digest('SHA-256',pixels);return {nonzeroAlphaPixels,renderer:gl.getParameter(gl.RENDERER),version:gl.getParameter(gl.VERSION),sha256:Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join(''),byteCount:pixels.length,canvas:[canvas.width,canvas.height],glError};})()`);
  metadata.v4Comparison={baselineCommit,method:'Exact SHA-256 equality of raw RGBA framebuffer readPixels at identical material-clock checkpoints; no background pixels',samples:[]};
  for(const [label,width,height] of [['iphone-se',375,667],['iphone-tall',393,852],['android-compact',360,800],['android-tall',412,915]]) {
   await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true});
   await cdp('Page.navigate',{url:`file://${htmlPath}`});
   await waitForReady();
   const configure=`window.__TIH_CONTROL__({type:'configure',target:{x:${width/2},y:${height/2},radius:${Math.min(width*.38,height*.25)}},ink:[${41/255},${68/255},${88/255}]});true`;
   await evaluate(`(async()=>{const image=new Image();image.src=${JSON.stringify(INTRO_BACKGROUND_URI)};await image.decode();document.body.style.background='linear-gradient(90deg,#DCE3E9 0%,#F9FBFC 50%,#DCE3E9 100%)';const backdrop=document.createElement('div');backdrop.id='intro-background';backdrop.style.cssText='position:fixed;inset:0;pointer-events:none;background-position:center;background-size:cover';backdrop.style.backgroundImage='url('+${JSON.stringify(INTRO_BACKGROUND_URI)}+')';document.body.prepend(backdrop);document.querySelector('canvas').style.position='relative';${configure}})()`);
   for(const ms of times){
    const backgroundOpacity=introBackgroundOpacity(ms);
    await evaluate(`document.getElementById('intro-background').style.opacity=${backgroundOpacity};true`);
    const info=await evaluate(`window.__TIH_TEST__.seek(${ms});(()=>{const canvas=document.querySelector('canvas');const gl=canvas.getContext('webgl');gl.finish();return {state:window.__TIH_TEST__.state(),canvas:[canvas.width,canvas.height],viewport:Array.from(gl.getParameter(gl.VIEWPORT)),glError:gl.getError(),devicePixelRatio,innerWidth,innerHeight};})()`);
    if(info.glError) throw new Error(`WebGL error ${info.glError} at ${label}/${ms}`);
    const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
    const file=`${label}-${String(ms).padStart(5,'0')}.png`;
    const data=Buffer.from(shot.data,'base64');fs.writeFileSync(path.join(out,file),data);
    const visibleDepthLayers=Array.from({length:6},(_,layer)=>({layer,z:info.state.scene.camera+.62-layer*.68})).filter(item=>info.state.scene.layers>0&&item.z>.08&&item.z<2.30).map(item=>item.layer);
    metadata.frames.push({file,ms,width,height,backgroundOpacity,visibleDepthLayers,sha256:crypto.createHash('sha256').update(data).digest('hex'),...info});
   }
   const currentPixels=new Map();
   for(const ms of [9000,9360])currentPixels.set(ms,await framebuffer(ms));
   await cdp('Page.navigate',{url:`file://${baselineHtmlPath}`}); await waitForReady(); await evaluate(configure);
   for(const ms of [9000,9360]){
    const baseline=await framebuffer(ms); const current=currentPixels.get(ms);
    const exact=baseline.sha256===current.sha256 && baseline.byteCount===current.byteCount && baseline.nonzeroAlphaPixels>0 && current.nonzeroAlphaPixels>0 && !baseline.glError && !current.glError;
    metadata.v4Comparison.samples.push({label,width,height,ms,baseline,current,exact});
    if(!exact){fs.writeFileSync(path.join(out,'frames.json'),JSON.stringify(metadata,null,2)+'\n');throw new Error(`Original V4 framebuffer mismatch: ${label}/${ms}`);}
   }
  }
  // Restore the current renderer for the actual-GPU offscreen-scissor probes.
  await cdp('Page.navigate',{url:`file://${htmlPath}`}); await waitForReady();
  metadata.offscreenScissors=[];
  for(const [x,y] of [[200,-200],[200,1500],[-500,400],[1500,400],[0,0],[200,400]]) {
    const sample=await evaluate(`window.__TIH_CONTROL__({type:'configure',target:{x:${x},y:${y},radius:140}});window.__TIH_TEST__.seek(9000);(()=>{const canvas=document.querySelector('canvas');const gl=canvas.getContext('webgl');gl.finish();return {target:[${x},${y}],canvas:[canvas.width,canvas.height],box:Array.from(gl.getParameter(gl.SCISSOR_BOX)),glError:gl.getError()};})()`);
    metadata.offscreenScissors.push(sample);
    if(sample.glError || sample.box.some(value=>value<0)) throw new Error('Invalid offscreen sphere scissor');
  }
  fs.writeFileSync(path.join(out,'frames.json'),JSON.stringify(metadata,null,2)+'\n');
  if(events.some(event=>event.method==='Runtime.exceptionThrown')) throw new Error('JavaScript runtime exception; inspect frames.json');
  console.log(JSON.stringify({out,frames:metadata.frames.length,exceptions:events.filter(x=>x.method==='Runtime.exceptionThrown').length,glErrors:metadata.frames.filter(x=>x.glError).length,exactV4Comparisons:metadata.v4Comparison.samples.filter(x=>x.exact).length}));
 } finally {
  if(ws)ws.close();
  chrome.kill('SIGTERM');
  if(chrome.exitCode === null) await new Promise(resolve => {chrome.once('exit',resolve);setTimeout(resolve,5000);});
  fs.closeSync(log);
  fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
