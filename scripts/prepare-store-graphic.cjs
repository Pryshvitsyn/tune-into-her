/* global __dirname */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// A store brand asset, not a fabricated application screenshot. Never edits the icon.
const root = path.resolve(__dirname, '..');
const toolsModules = process.env.TIH_BRAND_TOOLS_NODE_MODULES || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const sharp = require(toolsModules ? path.join(toolsModules, 'sharp') : 'sharp');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function main() {
  const source = fs.readFileSync(path.join(root, 'assets/icon.png'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/icons/manifest.generated.json'), 'utf8'));
  const expected = manifest.outputs.find(item => item.path === 'assets/icon.png');
  if (!expected || sha(source) !== expected.sha256 || manifest.iconVariant !== 'silver-open-rings-no-wordmark') throw new Error('Official rings-only master must pass its existing integrity check first');
  sharp.concurrency(1);
  const graphic = await sharp(source).resize(500, 500, { kernel: 'lanczos3' })
    .extend({ left: 262, right: 262, top: 0, bottom: 0, extendWith: 'copy' }).removeAlpha().png().toBuffer();
  const out = path.join(root, 'release/media'); fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'google-feature-1024x500.png'), graphic);
  fs.writeFileSync(path.join(out, 'graphic-provenance.json'), JSON.stringify({
    status: 'DRAFT_BRAND_ASSET_OWNER_REVIEW_REQUIRED', source: 'assets/icon.png', sourceSHA256: sha(source),
    file: 'google-feature-1024x500.png', sha256: sha(graphic), pixels: [1024, 500], alpha: false,
    processing: 'Uniform500x500 reduction of exact approved rings-only master;262px copied steel edge on each side. Entire emblem retained. No new logo, text, tint, AI generation or app-screen simulation.',
    applicationScreenshot: false, published: false,
  }, null, 2) + '\n');
  console.log('Prepared1024x500 draft feature graphic; original icon unchanged.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
