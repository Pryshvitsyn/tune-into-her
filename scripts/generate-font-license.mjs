import { readFile, writeFile } from 'node:fs/promises';

// Canonical human-authored notices remain OFL.txt and LICENCE.txt. JSON is transport
// because Metro does not automatically bundle arbitrary .txt files for user viewing.
const directory = new URL('../assets/fonts/', import.meta.url);
const notice = {
  ofl: await readFile(new URL('OFL.txt', directory), 'utf8'),
  originalDistributionNotice: await readFile(new URL('LICENCE.txt', directory), 'utf8'),
};
if (!notice.ofl.includes('SIL OPEN FONT LICENSE Version 1.1') || !notice.originalDistributionNotice.includes('Open Fonts License')) {
  throw new Error('Canonical font license notices are missing or changed; review before packaging.');
}
const destination = new URL('license.generated.json', directory);
const serialized = JSON.stringify(notice, null, 2) + '\n';
if (process.argv.includes('--check')) {
  const current = await readFile(destination, 'utf8').catch(() => null);
  if (current !== serialized) throw new Error('Bundled font license is stale; run node scripts/generate-font-license.mjs.');
  console.log('Bundled font license matches both canonical notices.');
} else {
  await writeFile(destination, serialized);
  console.log('Generated Metro-readable font license from canonical notices.');
}
