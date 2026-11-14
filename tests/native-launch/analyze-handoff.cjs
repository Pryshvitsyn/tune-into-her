// Offline, manually scoped intro analysis. Never controls a device or infers CPU timing.
// Actual336/337/338 calibration: presence1.000/0.0479/1.1544; gap background MAE0.755.
// Gap thresholds0.20/3 tolerate codec noise; halo is a separate diagnostic, not approval.
const { Buffer } = require('node:buffer');
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');

const PIXELS = 32 * 32;
const RGB_BYTES = PIXELS * 3;
const LIMITS = Object.freeze({ maskContrast: 4, missingRatio: 0.2, backgroundError: 3, excessBlue: 8, blueFraction: 0.3 });
function ensure(condition, message) { if (!condition) throw new Error(message); }
function rgb(value) { const data = Buffer.from(value); ensure(data.length === RGB_BYTES, 'Expected 32x32 RGB24 data'); return data; }
function pixelError(a, b, i) { return (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / 3; }
function buildModel(staticRGB, backgroundRGB) {
  const expected = rgb(staticRGB), background = rgb(backgroundRGB), mask = [];
  let contrast = 0;
  for (let i = 0; i < RGB_BYTES; i += 3) {
    const difference = pixelError(expected, background, i);
    if (difference > LIMITS.maskContrast) { mask.push(i); contrast += difference; }
  }
  ensure(mask.length >= PIXELS * 0.05 && contrast / mask.length >= 5, 'References lack sufficient foreground contrast; choose a real static-logo ROI and matching background');
  return { expected, background, mask, meanForegroundContrast: contrast / mask.length };
}
function measureForeground(model, candidateRGB) {
  const candidate = rgb(candidateRGB);
  let difference = 0, fullError = 0, extraBlue = 0, bluePixels = 0;
  for (let i = 0; i < RGB_BYTES; i += 3) fullError += pixelError(candidate, model.background, i);
  for (const i of model.mask) {
    difference += pixelError(candidate, model.background, i);
    const blue = (candidate[i + 2] - candidate[i]) - (model.expected[i + 2] - model.expected[i]);
    extraBlue += Math.max(0, blue);
    if (blue >= 4) bluePixels++;
  }
  const presenceRatio = difference / model.mask.length / model.meanForegroundContrast;
  const backgroundMAE = fullError / PIXELS;
  const backgroundOnlyGap = presenceRatio <= LIMITS.missingRatio && backgroundMAE <= LIMITS.backgroundError;
  const excessBlueMean = extraBlue / model.mask.length, excessBlueFraction = bluePixels / model.mask.length;
  return { presenceRatio, backgroundMAE, backgroundOnlyGap,
    haloDiagnostic: { signatureDetected: !backgroundOnlyGap && presenceRatio >= 0.5 && excessBlueMean >= LIMITS.excessBlue && excessBlueFraction >= LIMITS.blueFraction,
      excessBlueMean, excessBlueFraction, diagnosticOnly: true } };
}
function validateWindow(start, end) {
  ensure(Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end > start && end - start <= 5, 'Explicit manual window of at most 5 seconds required around a handoff where the logo is expected');
}
function options(argv) {
  if (argv.includes('--help')) return null;
  const allowed = new Set(['--video', '--references', '--start', '--end', '--out']), result = {};
  for (let i = 0; i < argv.length; i++) {
    ensure(allowed.has(argv[i]) && argv[i + 1] && !argv[i + 1].startsWith('--'), 'Unknown/incomplete argument; use --help');
    result[argv[i].slice(2)] = argv[++i];
  }
  ensure(result.video && result.references && result.out && result.start !== undefined && result.end !== undefined, 'Video, reference fixture, output and explicit start/end are required');
  result.start = Number(result.start); result.end = Number(result.end); validateWindow(result.start, result.end); return result;
}
function command(args, binary = 'ffmpeg', encoding = null) { return execFileSync(binary, args, { encoding, maxBuffer: 32 * 1024 * 1024, timeout: 60000 }); }
function analyze(options) {
  const fixtureBytes = fs.readFileSync(options.references), fixture = JSON.parse(fixtureBytes);
  ensure(fixture.width === 32 && fixture.height === 32 && fixture.channels === 3, 'Reference fixture must describe 32x32 RGB24');
  const model = buildModel(Buffer.from(fixture.candidates[fixture.staticReferenceCandidate].rgbBase64, 'base64'), Buffer.from(fixture.independentBackgroundRGBBase64, 'base64'));
  const probe = JSON.parse(command(['-v', 'error', '-threads', '2', '-select_streams', 'v:0', '-show_frames', '-show_entries', 'frame=best_effort_timestamp_time:stream=width,height', '-of', 'json', options.video], 'ffprobe', 'utf8'));
  const [width, height] = fixture.provenance.originalVideoPixels;
  ensure(probe.streams[0].width === width && probe.streams[0].height === height, 'Video geometry differs from reference; supply a matching explicit fixture, never silently stretch it');
  const selected = probe.frames.map((frame, index) => ({ originalFrame: index, moviePTS: Number(frame.best_effort_timestamp_time) })).filter(frame => frame.moviePTS >= options.start && frame.moviePTS < options.end);
  ensure(selected.length > 0, 'Manual handoff window contains no frames');
  const crop = fixture.provenance.cropPixels;
  const filter = `trim=start=${options.start}:end=${options.end},crop=${crop.width}:${crop.height}:${crop.x}:${crop.y},scale=32:32:flags=area,format=rgb24`;
  const pixels = command(['-nostdin', '-v', 'error', '-threads', '2', '-i', options.video, '-vf', filter, '-an', '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']);
  ensure(pixels.length === selected.length * RGB_BYTES, 'Decoded window and original frame timestamps disagree');
  const frames = selected.map((frame, i) => ({ ...frame, ...measureForeground(model, pixels.subarray(i * RGB_BYTES, (i + 1) * RGB_BYTES)) }));
  const report = { schemaVersion: 1, sourceVideoSHA256: crypto.createHash('sha256').update(fs.readFileSync(options.video)).digest('hex'), referenceFixtureSHA256: crypto.createHash('sha256').update(fixtureBytes).digest('hex'),
    manualWindowSeconds: { start: options.start, end: options.end }, cropPixels: crop, sampleRGBPixels: [32, 32], thresholds: LIMITS,
    foregroundMaskPixels: model.mask.length, referenceForegroundContrast: model.meanForegroundContrast,
    frameCount: frames.length, backgroundOnlyGapFrames: frames.filter(frame => frame.backgroundOnlyGap).map(frame => frame.originalFrame),
    haloDiagnosticFrames: frames.filter(frame => frame.haloDiagnostic.signatureDetected).map(frame => frame.originalFrame),
    foregroundContinuityPass: !frames.some(frame => frame.backgroundOnlyGap), frames,
    limits: ['Manual static-logo handoff window only: no automatic producer, OS/private-content, CPU-pressure or animation-time inference.', 'Thresholds calibrated on clean physical336/337/338 crops and an independent canonical background; other geometry/assets require matching references.', 'A background-only frame is a different defect from black frames; halo scoring is a separate signature diagnostic and never Founder visual approval.', 'RGB area averaging, codec/raster differences and deliberate animation can alter scores; review actual aligned frames before accepting a fix.'] };
  fs.writeFileSync(options.out, JSON.stringify(report, null, 2) + '\n'); return report;
}
if (require.main === module) {
  try {
    const args = options(process.argv.slice(2));
    if (!args) process.stdout.write('Usage: node tests/native-launch/analyze-handoff.cjs --video <private.mov> --references <matching32x32fixture.json> --start <seconds> --end <seconds> --out <metrics.json>\nManual window <=5s; logo must be expected throughout. No device control or CPU timing. Exit1 denotes a foreground gap, not a universal visual-fidelity judgment.\n');
    else { const report = analyze(args); process.stdout.write(JSON.stringify({ frameCount: report.frameCount, backgroundOnlyGapFrames: report.backgroundOnlyGapFrames, haloDiagnosticFrames: report.haloDiagnosticFrames, foregroundContinuityPass: report.foregroundContinuityPass }) + '\n'); if (!report.foregroundContinuityPass) process.exitCode = 1; }
  } catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 2; }
}
module.exports = { buildModel, measureForeground, validateWindow, parseOptions: options };
