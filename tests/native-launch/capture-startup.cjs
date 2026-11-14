/* global __dirname */
// Explicitly guarded native Release capture. Never boots/erases a device or resets app data.
const { spawn, execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const HELP = `Usage: node tests/native-launch/capture-startup.cjs
  --device <owned-SE3-UUID> --app </absolute/Release.app> --out </tmp/new-directory>
  --expected-binary-sha256 <64hex> --expected-js-sha256 <64hex>
  [--workers 0..6] [--worker-ms 1..6000] [--native-pressure]

Records 40 seconds, starting BEFORE cold launch. Updates only the already-owned
'Tune Into Her Launch QA' iPhone SE (3rd generation) Simulator. It never boots,
erases, uninstalls, changes preferences, enables access, starts Metro or buys.
All common local Metro ports must be closed. Expected binary and embedded JS
checksums are mandatory to identify the intended current standalone artifact.
--native-pressure additionally requires the explicit TIH_NATIVE_LAUNCH_QA binary;
normal Release never contains its deliberate main-thread work.
Host pressure is optional, bounded to at most six workers lasting six seconds.
Outputs private movie/logs, safe hashes/stage metadata and EVERY decoded frame's
central-80%-region luminance analysis. Pre-app Home/OS transition media is not
claimed to be app-owned content. Review any detected black frames in the video.
No recording or Simulator action occurs with --help or invalid arguments.\n`;
const BUNDLE = 'com.eliogenesis.tuneintoher';
const OWNED_NAME = 'Tune Into Her Launch QA';
const OWNED_TYPE = 'com.apple.CoreSimulator.SimDeviceType.iPhone-SE-3rd-generation';
const PORTS = [8081, 8082, 8083, 8084, 8085, 19000, 19001];
const RECORD_MS = 40000;
const repo = path.resolve(__dirname, '../..');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function requireThat(condition, reason) { if (!condition) throw new Error(reason); }
function command(file, args, options = {}) {
  return execFileSync(file, args, { encoding: 'utf8', timeout: 30000, maxBuffer: 16 * 1024 * 1024, ...options });
}
function options(argv) {
  if (argv.includes('--help')) return null;
  const result = { workers: 0, workerMs: 4000, nativePressure: false };
  const names = { '--device': 'device', '--app': 'app', '--out': 'out', '--workers': 'workers', '--worker-ms': 'workerMs', '--expected-binary-sha256': 'binaryHash', '--expected-js-sha256': 'jsHash' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--native-pressure') { result.nativePressure = true; continue; }
    requireThat(names[argv[i]] && argv[i + 1] && !argv[i + 1].startsWith('--'), 'Unknown or incomplete argument; use --help');
    result[names[argv[i]]] = argv[++i];
  }
  requireThat(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(result.device || ''), 'An explicit owned Simulator UUID is required');
  requireThat(path.isAbsolute(result.app || '') && result.app.endsWith('.app'), 'An absolute .app artifact is required');
  requireThat(path.isAbsolute(result.out || ''), 'An absolute new /tmp output directory is required');
  for (const hash of [result.binaryHash, result.jsHash]) requireThat(/^[a-f0-9]{64}$/i.test(hash || ''), 'Both expected artifact checksums are required');
  result.workers = Number(result.workers); result.workerMs = Number(result.workerMs);
  requireThat(Number.isInteger(result.workers) && result.workers >= 0 && result.workers <= 6, 'Host workers must be an integer from 0 through 6');
  requireThat(Number.isInteger(result.workerMs) && result.workerMs >= 1 && result.workerMs <= 6000, 'Worker duration must be 1..6000 ms');
  result.binaryHash = result.binaryHash.toLowerCase(); result.jsHash = result.jsHash.toLowerCase();
  return result;
}
async function portOpen(host, port) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host, port });
    let done = false;
    const finish = value => { if (!done) { done = true; socket.destroy(); resolve(value); } };
    socket.setTimeout(250, () => finish(false));
    socket.once('connect', () => finish(true)); socket.once('error', () => finish(false));
  });
}
async function requireNoMetro() {
  const probes = await Promise.all(PORTS.flatMap(port => ['127.0.0.1', '::1'].map(async host => ({ port, open: await portOpen(host, port) }))));
  requireThat(!probes.some(p => p.open), 'A common local Metro port is occupied; stop it independently before this standalone check');
}
async function stop(child) {
  if (!child || child.tihClosed) return;
  await new Promise(resolve => {
    const timeout = setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 5000);
    child.tihClose.then(() => { clearTimeout(timeout); resolve(); });
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGINT');
  });
}
function stagesFrom(text) {
  const rows = []; const seen = new Set();
  for (const match of text.matchAll(/TIH_NATIVE_LAUNCH\s+([A-Z_]+)\s+([0-9]+\.[0-9]+)/g)) {
    const key = match[1] + ':' + match[2];
    if (!seen.has(key)) { seen.add(key); rows.push({ stage: match[1], nativeMonotonicSeconds: Number(match[2]) }); }
  }
  return rows.sort((a, b) => a.nativeMonotonicSeconds - b.nativeMonotonicSeconds);
}
function analyze(out, launchEstimate) {
  const movie = path.join(out, 'startup.mov');
  const probe = JSON.parse(command('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_streams', '-show_format', '-of', 'json', movie]));
  const timestamps = JSON.parse(command('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_frames', '-show_entries', 'frame=best_effort_timestamp_time', '-of', 'json', movie], { timeout: 60000 }));
  const pixels = command('ffmpeg', ['-nostdin', '-v', 'error', '-i', movie, '-vf', 'crop=trunc(iw*0.8):trunc(ih*0.8):trunc(iw*0.1):trunc(ih*0.1),scale=64:64:flags=area,format=gray', '-an', '-fps_mode', 'passthrough', '-enc_time_base', '1:1000000', '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1'], { encoding: null, maxBuffer: 64 * 1024 * 1024, timeout: 60000 });
  const size = 64 * 64; requireThat(pixels.length % size === 0, 'Decoded frame buffer is incomplete');
  const count = pixels.length / size; requireThat(count > 0 && count === timestamps.frames.length, 'Decoded frames and source timestamps differ');
  const frames = [];
  for (let i = 0; i < count; i++) {
    let sum = 0, dark = 0;
    for (let j = i * size; j < (i + 1) * size; j++) { sum += pixels[j]; if (pixels[j] <= 18) dark++; }
    frames.push({ index: i, ptsSeconds: Number(timestamps.frames[i].best_effort_timestamp_time), meanLuma: Number((sum / size).toFixed(3)), darkFraction: dark / size, black: dark / size >= 0.98 });
  }
  const black = frames.filter(frame => frame.black);
  const result = { method: 'Every source video frame, central 80% ROI, area64x64 grayscale; black when >=98% samples have luma<=18', frameCount: count, durationSeconds: Number(probe.format.duration), stream: { width: probe.streams[0].width, height: probe.streams[0].height, averageFrameRate: probe.streams[0].avg_frame_rate }, launchCommandVideoEstimateSeconds: launchEstimate, blackFrameCount: black.length, blackFrameIndices: black.map(f => f.index), blackAfterLaunchCommandEstimate: black.filter(f => f.ptsSeconds >= launchEstimate).length, timingLimit: 'Recorder acknowledgement and command start are host observations, not exact UIKit foreground/frame timestamps; inspect OS/app transition in original movie', frames };
  fs.writeFileSync(path.join(out, 'all-frame-black-analysis.json'), JSON.stringify(result, null, 2) + '\n');
  return result;
}
async function main() {
  const args = options(process.argv.slice(2)); if (!args) { process.stdout.write(HELP); return; }
  command('ffmpeg', ['-version']); command('ffprobe', ['-version']);
  // All ownership/artifact checks precede any mutable Simulator command.
  const devices = JSON.parse(command('xcrun', ['simctl', 'list', 'devices', '--json']));
  const found = Object.values(devices.devices).flat().filter(device => device.udid === args.device);
  requireThat(found.length === 1 && found[0].name === OWNED_NAME && found[0].deviceTypeIdentifier === OWNED_TYPE && found[0].state === 'Booted' && found[0].isAvailable, 'Refusing any device except the booted, available, explicitly owned QA SE3');
  args.app = fs.realpathSync(args.app);
  const info = JSON.parse(command('plutil', ['-convert', 'json', '-o', '-', path.join(args.app, 'Info.plist')]));
  requireThat(info.CFBundleIdentifier === BUNDLE && info.CFBundleSupportedPlatforms?.includes('iPhoneSimulator'), 'Artifact is not this app for Simulator');
  const binaryName = info.CFBundleExecutable;
  const binary = path.join(args.app, binaryName), js = path.join(args.app, 'main.jsbundle');
  requireThat(fs.existsSync(js), 'Standalone embedded main.jsbundle is required; a Metro Debug artifact is not accepted');
  requireThat(sha(fs.readFileSync(binary)) === args.binaryHash && sha(fs.readFileSync(js)) === args.jsHash, 'Artifact does not match the expected current native/JS checksums');
  command('codesign', ['--verify', '--deep', '--strict', args.app]);
  const strings = command('strings', [binary]);
  requireThat(strings.includes('TIH_NATIVE_LAUNCH %@ %.6f') && strings.includes('EARLY_COVER_HANDOFF'), 'Artifact lacks the app-owned early native cover');
  if (args.nativePressure) requireThat(strings.includes('QA_FACTORY_PRESSURE_COMPLETE'), 'Native pressure needs an explicitly compiled TIH_NATIVE_LAUNCH_QA artifact');
  await requireNoMetro();
  requireThat(!fs.existsSync(args.out), 'Output directory must be new; existing evidence is never overwritten');
  const parent = fs.realpathSync(path.dirname(args.out));
  requireThat(parent === '/private/tmp' || parent.startsWith('/private/tmp/'), 'Output must resolve below /tmp');
  const disk = fs.statfsSync(parent); requireThat(Number(disk.bavail) * Number(disk.bsize) >= 512 * 1024 * 1024, 'At least 512MiB free is required before video capture');
  fs.mkdirSync(args.out); args.out = fs.realpathSync(args.out);
  const metadata = { startedAtUTC: new Date().toISOString(), ownedDevice: { name: OWNED_NAME, type: OWNED_TYPE, state: 'Booted', identifierSHA256: sha(args.device) }, artifact: { bundleID: BUNDLE, binarySHA256: args.binaryHash, embeddedJSSHA256: args.jsHash }, source: { head: command('git', ['rev-parse', 'HEAD'], { cwd: repo }).trim(), changedPaths: command('git', ['diff', '--name-only'], { cwd: repo }).trim().split('\n').filter(Boolean) }, pressure: { workers: args.workers, workerMs: args.workerMs, nativeQA: args.nativePressure }, standalone: { commonLocalMetroPortsClosed: PORTS }, dataPolicy: 'Update-install only; no uninstall/reset/preferences/history reads, navigation or billing', stageEvents: [], complete: false };
  const save = () => fs.writeFileSync(path.join(args.out, 'proof-metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
  const children = []; const descriptors = []; let recorder, recorderReadyAt, launchAt;
  const track = child => {
    child.tihClosed = false;
    child.tihClose = new Promise(resolve => child.once('close', () => { child.tihClosed = true; resolve(); }));
    child.on('error', () => { /* The owning operation records failure; cleanup stays safe. */ });
    children.push(child); return child;
  };
  const cleanup = async () => { await Promise.all(children.map(stop)); for (const fd of descriptors.splice(0)) { try { fs.closeSync(fd); } catch { /* already closed */ } } };
  const interrupt = () => { cleanup().finally(() => process.exit(130)); };
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt); save();
  try {
    try { command('xcrun', ['simctl', 'terminate', args.device, BUNDLE]); } catch { /* Already stopped is permitted; ownership was validated above. */ }
    command('xcrun', ['simctl', 'install', args.device, args.app]);
    const installed = command('xcrun', ['simctl', 'get_app_container', args.device, BUNDLE, 'app']).trim();
    requireThat(sha(fs.readFileSync(path.join(installed, binaryName))) === args.binaryHash && sha(fs.readFileSync(path.join(installed, 'main.jsbundle'))) === args.jsHash, 'Installed binary/JS differs from the supplied artifact');
    metadata.artifact.installedChecksumsMatch = true;
    const stageLog = path.join(args.out, 'native-stages.private.log'); const stageFd = fs.openSync(stageLog, 'w'); descriptors.push(stageFd);
    const logs = track(spawn('xcrun', ['simctl', 'spawn', args.device, 'log', 'stream', '--level', 'info', '--style', 'compact', '--predicate', 'process == "TuneIntoHer" AND eventMessage CONTAINS "TIH_NATIVE_LAUNCH"'], { stdio: ['ignore', stageFd, stageFd] }));
    const recorderLog = path.join(args.out, 'recorder.private.log'); const recordFd = fs.openSync(recorderLog, 'w'); descriptors.push(recordFd);
    recorder = track(spawn('xcrun', ['simctl', 'io', args.device, 'recordVideo', '--codec=hevc', '--mask=ignored', path.join(args.out, 'startup.mov')], { stdio: ['ignore', 'ignore', 'pipe'] }));
    await new Promise((resolve, reject) => {
      let output = '', settled = false;
      const timer = setTimeout(() => { if (!settled) { settled = true; reject(new Error('No recording-start acknowledgement within 8s')); } }, 8000);
      recorder.stderr.on('data', bytes => { if (descriptors.includes(recordFd)) fs.writeSync(recordFd, bytes); output += bytes.toString(); if (!settled && output.includes('Recording started')) { settled = true; clearTimeout(timer); recorderReadyAt = performance.now(); resolve(); } });
      recorder.once('error', error => { if (!settled) { settled = true; clearTimeout(timer); reject(error); } });
      recorder.once('exit', () => { if (!settled) { settled = true; clearTimeout(timer); reject(new Error('Recorder exited before its first frame')); } });
    });
    await pause(500); await requireNoMetro();
    const workerCode = 'const end=Date.now()+Math.min(6000,Number(process.argv[1])||0);let x=0;while(Date.now()<end){x=Math.sin(x+0.37)}';
    for (let i = 0; i < args.workers; i++) track(spawn(process.execPath, ['-e', workerCode, String(args.workerMs)], { stdio: 'ignore' }));
    launchAt = performance.now();
    const launchArgs = ['simctl', 'launch', '--terminate-running-process', '--stdout=' + path.join(args.out, 'app-stdout.private.log'), '--stderr=' + path.join(args.out, 'app-stderr.private.log'), args.device, BUNDLE];
    if (args.nativePressure) launchArgs.push('-TIHStartupStress');
    const launched = command('xcrun', launchArgs); fs.writeFileSync(path.join(args.out, 'launch.private.log'), launched);
    const pid = Number(launched.match(/:\s*(\d+)\s*$/)?.[1]); requireThat(Number.isInteger(pid) && pid > 0, 'Launch did not return a process ID'); metadata.processID = pid;
    metadata.launchCommandVideoEstimateSeconds = (launchAt - recorderReadyAt) / 1000; save();
    await pause(Math.max(0, RECORD_MS - (performance.now() - recorderReadyAt)));
    await stop(recorder); await stop(logs);
    for (const fd of descriptors.splice(0)) fs.closeSync(fd);
    metadata.recordedWallSeconds = (performance.now() - recorderReadyAt) / 1000;
    try { process.kill(pid, 0); metadata.sameProcessAliveAtEnd = true; } catch { metadata.sameProcessAliveAtEnd = false; }
    const logText = [stageLog, path.join(args.out, 'app-stderr.private.log')].filter(file => fs.existsSync(file)).map(file => fs.readFileSync(file, 'utf8')).join('\n');
    metadata.stageEvents = stagesFrom(logText);
    const time = name => metadata.stageEvents.find(event => event.stage === name)?.nativeMonotonicSeconds;
    const expected = ['COVER_INSTALLED', 'COVER_FRAME_COMMITTED', 'FACTORY_BEGIN', 'EXPO_SPLASH_INSTALLED', 'EARLY_COVER_HANDOFF'];
    metadata.stageOrderingPass = expected.every(name => time(name) !== undefined) && expected.every((name, i) => i === 0 || time(name) >= time(expected[i - 1]));
    const analysis = analyze(args.out, metadata.launchCommandVideoEstimateSeconds);
    metadata.analysis = { frameCount: analysis.frameCount, durationSeconds: analysis.durationSeconds, blackFrameCount: analysis.blackFrameCount, blackAfterLaunchCommandEstimate: analysis.blackAfterLaunchCommandEstimate };
    save();
    requireThat(metadata.sameProcessAliveAtEnd && metadata.stageOrderingPass, 'Native process/stage ordering failed; evidence retained');
    requireThat(metadata.recordedWallSeconds >= 39.5, 'Recorded wall time was shorter than the required 40s window; evidence retained');
    requireThat(analysis.blackAfterLaunchCommandEstimate === 0, 'Black frames found after launch-command estimate; inspect retained full media before attributing OS/app ownership');
    metadata.complete = true; save();
    process.stdout.write(JSON.stringify({ result: 'recorded-and-analyzed', out: args.out, ...metadata.analysis, stageOrderingPass: metadata.stageOrderingPass, sameProcessAliveAtEnd: true }) + '\n');
  } catch (error) {
    metadata.failure = String(error.message).split(args.device).join('<owned-simulator>'); save(); throw new Error(metadata.failure);
  } finally { await cleanup(); process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt); }
}
if (require.main === module) main().catch(error => { process.stderr.write('Startup capture stopped: ' + error.message + '\n'); process.exitCode = 1; });
module.exports = { parseOptions: options };
