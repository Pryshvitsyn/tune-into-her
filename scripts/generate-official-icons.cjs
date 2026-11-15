/* global __dirname */
// Immutable Founder photograph +bounded built-in imagegen wordmark-removal patch
// -> rings-only icon. Startup art stays exact; no SVG, typography or new logo.
const { Buffer } = require('node:buffer');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const reference = 'assets/brand/reference/founder-approved-premium-v5-20261114.png';
const sourceSHA256 = 'dfce7d014d6107bdad02a54886dba3bbb8e5f216065774dc7b7c34e7e3da1c58';
const crop = { left: 35, top: 450, width: 780, height: 780 };
const editSourceFile = 'assets/icons/source/rings-wordmark-removal.generated.png';
const editSourceSHA256 = 'd68c28ea81d9ea5a68d33269cfe4fdb65d6b429bfbad9e7e82c45b06dddafdcc';
const provenanceFile = 'assets/icons/source/rings-only.provenance.json';
const editBand = { top: 420, bottomExclusive: 680, featherPixels: 24 };
const protectedOutsideBandSHA256 = 'cd3d74547d11f1a50c8a743b6dde146b97b23d270ae59247c8ec7eccf99396b5';
// Conservative observed landmarks, in original photograph pixels. Insets are
// about system masks, not a replacement or reconstruction of the photographed art.
const landmarks = {
  ringEndpointsAndExtrema: [[120, 840], [365, 1075], [505, 1040], [505, 990], [650, 1020], [715, 840], [425, 605]],
};
const adaptive = { canvas: 1024, photoSide: 768, inset: 128, layerDP: 108, maskDP: 72, safeCircleDP: 66, outerSteelFeatherPixels: 24 };
// Ring/letter-free steel from the top of THE SAME square master, not another image.
const backgroundCrop = { left: 420, top: 24, width: 184, height: 184 };
const manifestFile = 'assets/icons/manifest.generated.json';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const source = fs.readFileSync(path.join(root, reference));
if (sha(source) !== sourceSHA256) throw new Error('Immutable approved photograph changed');
const { PNG } = require('pngjs');
const editedSource = fs.readFileSync(path.join(root, editSourceFile));
if (sha(editedSource) !== editSourceSHA256) throw new Error('Selected rings-only edit source changed');
const provenance = JSON.parse(fs.readFileSync(path.join(root, provenanceFile), 'utf8'));
if (provenance.editSourceSHA256 !== editSourceSHA256 || provenance.iconVariant !== 'silver-open-rings-no-wordmark') throw new Error('Rings-only edit provenance mismatch');
const original = PNG.sync.read(source);
if (original.width !== 851 || original.height !== 1847) throw new Error('Unexpected approved photograph bounds');
const landmarksInAdaptive = Object.values(landmarks).flat().map(([x, y]) => ({
  x: adaptive.inset + (x - crop.left) * adaptive.photoSide / crop.width,
  y: adaptive.inset + (y - crop.top) * adaptive.photoSide / crop.height,
}));
const safeRadius = adaptive.canvas * adaptive.safeCircleDP / adaptive.layerDP / 2;
const maxLandmarkRadius = Math.max(...landmarksInAdaptive.map(({ x, y }) => Math.hypot(x - 512, y - 512)));
if (maxLandmarkRadius >= safeRadius) throw new Error('Photographed ring endpoint exceeds Android safe circle');
const protectedFiles = [
  reference, 'assets/launch/approved-opening.png',
  'ios/TuneIntoHer/Images.xcassets/LaunchApprovedOpening.imageset/approved-opening.png',
  'src/intro/timeline.ts', 'src/intro/sceneRuntime.generated.ts', 'src/intro/v4Shaders.generated.ts',
  'src/intro/brandTexture.generated.ts', 'assets/sphere.png', 'assets/sphere.svg',
];
const protectedHashes = Object.fromEntries(protectedFiles.map(file => [file, sha(fs.readFileSync(path.join(root, file)))]));
const readJSON = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
function verify() {
  const manifest = readJSON(manifestFile);
  if (sha(fs.readFileSync(path.join(root, 'assets/icon.png'))) !== provenance.rasterAudit.masterSHA256) throw new Error('Selected rings-only master changed');
  if (manifest.iconVariant !== 'silver-open-rings-no-wordmark' || manifest.editSourceSHA256 !== editSourceSHA256 || manifest.provenanceSHA256 !== sha(fs.readFileSync(path.join(root, provenanceFile))) || JSON.stringify(manifest.cropSourcePixels) !== JSON.stringify(crop) || manifest.referenceSHA256 !== sourceSHA256) throw new Error('Official icon provenance changed');
  for (const item of manifest.outputs) {
    const bytes = fs.readFileSync(path.join(root, item.path));
    if (sha(bytes) !== item.sha256) throw new Error('Official icon stale: ' + item.path);
    // Hash validates the complete encoded file; IHDR is sufficient for cheap --check dimensions.
    if (bytes.readUInt32BE(16) !== item.width || bytes.readUInt32BE(20) !== item.height) throw new Error('Official icon dimensions changed: ' + item.path);
  }
  for (const [file, hash] of Object.entries(manifest.protectedSHA256)) {
    if (sha(fs.readFileSync(path.join(root, file))) !== hash) throw new Error('Unrelated protected source changed: ' + file);
  }
  const native = readJSON('ios/TuneIntoHer/Images.xcassets/AppIcon.appiconset/Contents.json');
  if (native.images.length !== 1 || native.images[0].size !== '1024x1024' || native.images[0].filename !== 'App-Icon-1024x1024@1x.png') throw new Error('Unexpected native app-icon catalog');
  if (!fs.readFileSync(path.join(root, 'assets/icon.png')).equals(fs.readFileSync(path.join(root, 'ios/TuneIntoHer/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png')))) throw new Error('Native AppIcon is stale');
  console.log('Official icon source, crop, mask clearance, output copies and protected assets match.');
}
async function generate(checkOnly = false) {
  const toolsModules = process.env.TIH_BRAND_TOOLS_NODE_MODULES || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
  const sharp = require(toolsModules ? path.join(toolsModules, 'sharp') : 'sharp');
  sharp.concurrency(1);
  const outputs = new Map();
  const png = pipeline => pipeline.png({ compressionLevel: 9, adaptiveFiltering: false }).toBuffer();
  const iosMask = side => {
    const points = Array.from({ length: 256 }, (_, i) => {
      const angle = i * Math.PI * 2 / 256, x = Math.cos(angle), y = Math.sin(angle);
      return (512 + 512 * Math.sign(x) * Math.abs(x) ** .4).toFixed(5) + ',' + (512 + 512 * Math.sign(y) * Math.abs(y) ** .4).toFixed(5);
    });
    return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="' + side + '" height="' + side + '" viewBox="0 0 1024 1024"><polygon points="' + points.join(' ') + '" fill="white"/></svg>');
  };
  const base = await png(sharp(source).extract(crop).resize(1024, 1024, { kernel: 'lanczos3' }).removeAlpha());
  if (sha(base) !== provenance.inputSquare1024SHA256) throw new Error('Original photographic crop is not reproducible');
  const patch = PNG.sync.read(await png(sharp(editedSource).resize(1024, 1024, { kernel: 'lanczos3' }).ensureAlpha()));
  for (let y = 0; y < 1024; y += 1) for (let x = 0; x < 1024; x += 1) {
    const t = Math.min(1, Math.max(0, Math.min((y - editBand.top) / editBand.featherPixels, (editBand.bottomExclusive - 1 - y) / editBand.featherPixels)));
    patch.data[(y * 1024 + x) * 4 + 3] = Math.round(255 * t * t * (3 - 2 * t));
  }
  const master = await png(sharp(base).composite([{ input: PNG.sync.write(patch) }]).removeAlpha());
  const pixels = PNG.sync.read(master).data;
  const untouched = Buffer.concat([pixels.subarray(0, editBand.top * 1024 * 4), pixels.subarray(editBand.bottomExclusive * 1024 * 4)]);
  if (sha(untouched) !== protectedOutsideBandSHA256) throw new Error('Original photographic pixels outside the icon edit band changed');
  outputs.set('assets/icon.png', master);
  outputs.set('ios/TuneIntoHer/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png', master);
  outputs.set('assets/icons/play-store-512.png', await png(sharp(master).resize(512, 512, { kernel: 'lanczos3' }).ensureAlpha()));
  for (const [name, size] of [['iphone-home-60pt@2x', 120], ['iphone-home-60pt@3x', 180], ['iphone-settings-29pt@2x', 58], ['iphone-settings-29pt@3x', 87]]) {
    outputs.set('assets/icons/previews/' + name + '.png', await png(sharp(master).resize(size, size, { kernel: 'lanczos3' }).composite([{ input: iosMask(size), blend: 'dest-in' }])));
  }
  const foregroundPixels = PNG.sync.read(await png(sharp(master).resize(adaptive.photoSide, adaptive.photoSide, { kernel: 'lanczos3' })));
  // Alpha-only easing in the outer24px steel margin. Both rings, endpoints and
  // their shadows are inside the fully opaque interior; no RGB/art is repainted.
  for (let y = 0; y < adaptive.photoSide; y += 1) for (let x = 0; x < adaptive.photoSide; x += 1) {
    const distance = Math.min(x, y, adaptive.photoSide - 1 - x, adaptive.photoSide - 1 - y);
    const t = Math.min(1, distance / adaptive.outerSteelFeatherPixels);
    foregroundPixels.data[(y * adaptive.photoSide + x) * 4 + 3] = Math.round(255 * t * t * (3 - 2 * t));
  }
  const foregroundPhoto = PNG.sync.write(foregroundPixels);
  const foreground = await png(sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#00000000' } }).composite([{ input: foregroundPhoto, left: adaptive.inset, top: adaptive.inset }]));
  const background = await png(sharp(master).extract(backgroundCrop).resize(1024, 1024, { kernel: 'lanczos3' }).removeAlpha());
  outputs.set('assets/adaptive-icon.png', foreground);
  outputs.set('assets/icons/adaptive-background.png', background);
  const composited = await png(sharp(background).composite([{ input: foreground }]));
  // Android AdaptiveIconDrawable: layer108dp, central masked viewport72dp.
  // Sample the exact centre viewport before a circular mask; no fake full108dp mask.
  const enlarged = await png(sharp(composited).affine([[1.5, 0], [0, 1.5]], { background: '#00000000', interpolator: 'bicubic' }));
  const visible = await png(sharp(enlarged).extract({ left: 256, top: 256, width: 1024, height: 1024 }));
  const circle = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><circle cx="512" cy="512" r="512" fill="white"/></svg>');
  const round = await png(sharp(visible).composite([{ input: circle, blend: 'dest-in' }]));
  outputs.set('assets/icons/previews/android-round-system-mask.png', round);
  const guide = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><circle cx="512" cy="512" r="' + safeRadius + '" fill="none" stroke="#ff3344" stroke-width="3"/><rect x="170.666667" y="170.666667" width="682.666667" height="682.666667" fill="none" stroke="#33ccff" stroke-width="3"/></svg>');
  outputs.set('assets/icons/previews/android-safe-area-DIAGNOSTIC.png', await png(sharp(composited).composite([{ input: guide }])));
  const label = (text, width = 512) => Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="32"><rect width="100%" height="100%" fill="white"/><text x="8" y="22" font-family="Arial" font-size="14">' + text + '</text></svg>');
  const sheet = [{ input: label('iOS / App Store square master (1024, shown 512)'), left: 0, top: 0 }, { input: await png(sharp(master).resize(512)), left: 0, top: 32 }, { input: label('Play listing (512 native pixels)'), left: 512, top: 0 }, { input: outputs.get('assets/icons/play-store-512.png'), left: 512, top: 32 }, { input: label('GENERATED PREVIEWS — simulated masks, not device screenshots', 1024), left: 0, top: 554 }];
  for (const item of [{ file: 'iphone-home-60pt@3x', x: 20, y: 622, text: 'Home 60pt @3x /180px' }, { file: 'iphone-settings-29pt@3x', x: 230, y: 622, text: 'Settings 29pt @3x /87px' }]) {
    sheet.push({ input: label(item.text, 280), left: item.x, top: item.y - 32 });
    sheet.push({ input: outputs.get('assets/icons/previews/' + item.file + '.png'), left: item.x, top: item.y });
  }
  sheet.push({ input: label('Android circular 72dp system viewport', 430), left: 570, top: 590 }, { input: await png(sharp(round).resize(240)), left: 600, top: 622 });
  sheet.push({ input: label('Nominal-size simulated iOS masks: 60px /29px', 500), left: 20, top: 838 }, { input: await png(sharp(master).resize(60).composite([{ input: iosMask(60), blend: 'dest-in' }])), left: 20, top: 875 }, { input: await png(sharp(master).resize(29).composite([{ input: iosMask(29), blend: 'dest-in' }])), left: 100, top: 875 });
  const storeCards = [
    { input: label('App Store — generated listing card, NOT published', 1024), left: 0, top: 0 },
    { input: await png(sharp(master).resize(120).composite([{ input: iosMask(120), blend: 'dest-in' }])), left: 24, top: 52 },
    { input: label('Google Play — generated listing card, NOT published', 1024), left: 0, top: 200 },
    { input: await png(sharp(master).resize(120).composite([{ input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="24" fill="white"/></svg>'), blend: 'dest-in' }])), left: 24, top: 252 },
  ];
  const appName = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="80"><text x="0" y="45" font-family="Arial" font-size="32" fill="#18232e">Tune Into Her</text></svg>');
  storeCards.push({ input: appName, left: 176, top: 78 }, { input: appName, left: 176, top: 278 });
  outputs.set('assets/icons/previews/store-listing-cards.png', await png(sharp({ create: { width: 1024, height: 400, channels: 3, background: 'white' } }).composite(storeCards)));
  outputs.set('assets/icons/previews/platform-preview-sheet.png', await png(sharp({ create: { width: 1024, height: 955, channels: 3, background: 'white' } }).composite(sheet)));
  const manifest = { schemaVersion: 2, iconVariant: 'silver-open-rings-no-wordmark', reference, referenceSHA256: sourceSHA256, referencePixels: [851, 1847], cropSourcePixels: crop, editSourceFile, editSourceSHA256, provenanceFile, provenanceSHA256: sha(fs.readFileSync(path.join(root, provenanceFile))), editBand, protectedOutsideBandSHA256, processing: 'Original square photograph plus bounded built-in imagegen wordmark-removal/reconstructed-arc patch. All RGB pixels outside the band are exact. No SVG replacement, new symbol, tint, stretch or pre-rounded production corners.', tool: { sharp: sharp.versions.sharp, vips: sharp.versions.vips }, adaptive: { ...adaptive, backgroundCropMasterPixels: backgroundCrop, safeCircleRadiusPixels: safeRadius, maximumLandmarkRadiusPixels: maxLandmarkRadius, conservativeSourceLandmarks: landmarks, limit: 'Foreground preserves entire photographed square with transparent system inset and alpha-only24px easing of outer steel margins; rings/endpoints/shadows remain opaque. Icon lettering is removed. Opaque background is a letter-free steel excerpt of that same master. OEM motion/mask behavior still needs Android runtime verification.' }, protectedSHA256: protectedHashes, outputs: [] };
  for (const [file, bytes] of outputs) {
    if (checkOnly) {
      if (!fs.existsSync(path.join(root, file)) || !fs.readFileSync(path.join(root, file)).equals(bytes)) throw new Error('Icon raster reproducibility failed: ' + file);
    } else {
      if (!fs.existsSync(path.join(root, file)) || !fs.readFileSync(path.join(root, file)).equals(bytes)) {
        fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
        fs.writeFileSync(path.join(root, file) + '.tmp', bytes); fs.renameSync(path.join(root, file) + '.tmp', path.join(root, file));
      }
    }
    const image = PNG.sync.read(bytes); manifest.outputs.push({ path: file, width: image.width, height: image.height, sha256: sha(bytes) });
  }
  if (!checkOnly) fs.writeFileSync(path.join(root, manifestFile), JSON.stringify(manifest, null, 2) + '\n');
  console.log(checkOnly ? 'All official icon rasters regenerate byte-for-byte from the approved photograph and selected bounded rings-only edit.' : 'Official photo icon assets generated; native AppIcon updated.');
}
(async () => { if (process.argv.includes('--check')) { verify(); if (process.argv.includes('--raster-check')) await generate(true); } else { await generate(); verify(); } })().catch(error => { console.error(error.message); process.exitCode = 1; });
