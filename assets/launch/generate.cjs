/* global __dirname */
/* Preserve animation PNGs; the opening photograph is copied verbatim, never rasterized. */
const { Buffer } = require('node:buffer');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { PNG } = require('pngjs');
const root = path.resolve(__dirname, '../..');
for (const [moduleFile, prefix, output, width, height] of [
  ['src/intro/brandTexture.generated.ts', 'BRAND_TEXTURE', 'official-launch-mark.png', 1600, 1120],
  ['src/intro/brandBackground.generated.ts', 'INTRO_BACKGROUND', 'steel-background.png', 900, 1950],
]) {
  const text = fs.readFileSync(path.join(root, moduleFile), 'utf8');
  const encoded = text.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/)?.[1];
  const expected = text.match(new RegExp(prefix + "_SHA256 = '([a-f0-9]{64})'"))?.[1];
  if (!encoded || !expected) throw new Error('Missing shared brand PNG: ' + moduleFile);
  const bytes = Buffer.from(encoded, 'base64');
  if (crypto.createHash('sha256').update(bytes).digest('hex') !== expected) throw new Error('Shared brand PNG integrity failed');
  const image = PNG.sync.read(bytes);
  if (image.width !== width || image.height !== height) throw new Error('Shared brand PNG bounds changed');
  fs.writeFileSync(path.join(__dirname, output), bytes);
}
const approved = fs.readFileSync(path.join(root, 'assets/brand/reference/founder-approved-premium-v5-20261114.png'));
if (crypto.createHash('sha256').update(approved).digest('hex') !== 'dfce7d014d6107bdad02a54886dba3bbb8e5f216065774dc7b7c34e7e3da1c58') throw new Error('Immutable Founder opening photograph changed');
const photograph = PNG.sync.read(approved);
if (photograph.width !== 851 || photograph.height !== 1847) throw new Error('Approved opening photograph bounds changed');
fs.writeFileSync(path.join(__dirname, 'approved-opening.png'), approved);
console.log('Animation PNGs are unchanged; the native opening is byte-identical to the approved photograph.');
