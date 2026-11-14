/* global __dirname */
/* Deterministic native copies of approved Deep Intro V2 pixels. No new logo design. */
const { Buffer } = require('node:buffer');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '../..');
const text = fs.readFileSync(path.join(root, 'src/intro/brandTexture.generated.ts'), 'utf8');
const encoded = text.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/)?.[1];
if (!encoded) throw new Error('Approved brand texture missing');
const original = Buffer.from(encoded, 'base64');
const expectedHash = text.match(/BRAND_TEXTURE_SHA256 = '([a-f0-9]{64})'/)?.[1];
if (!expectedHash || crypto.createHash('sha256').update(original).digest('hex') !== expectedHash) throw new Error('Shared brand texture integrity failed');
const logo = PNG.sync.read(original);
if (logo.width !== 1600 || logo.height !== 1120) throw new Error('Approved logo bounds changed');
for (let i = 0; i < logo.data.length; i += 4) {
  logo.data[i] = 0x29; logo.data[i + 1] = 0x44; logo.data[i + 2] = 0x58;
}
fs.writeFileSync(path.join(__dirname, 'official-launch-mark.png'), PNG.sync.write(logo));
const gradient = new PNG({ width: 1024, height: 1 });
const edge = [0xDC, 0xE3, 0xE9], center = [0xF9, 0xFB, 0xFC];
for (let x = 0; x < gradient.width; x += 1) {
  const weight = 1 - Math.abs(2 * x / (gradient.width - 1) - 1);
  for (let channel = 0; channel < 3; channel += 1) gradient.data[x * 4 + channel] = Math.round(edge[channel] + (center[channel] - edge[channel]) * weight);
  gradient.data[x * 4 + 3] = 255;
}
fs.writeFileSync(path.join(__dirname, 'silver-gradient.png'), PNG.sync.write(gradient));
console.log('Native assets derived from approved alpha mask and existing silver palette.');
