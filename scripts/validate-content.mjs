import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const languages = ['en', 'it', 'ru', 'uk', 'es'];
const validLearnIds = new Set(['menstrual', 'follicular', 'mid_cycle', 'luteal']);
const catalog = JSON.parse(await readFile(path.join(root, 'content/catalog.json'), 'utf8'));
const ids = catalog.map((record) => record.id);
const problems = [];

if (catalog.length < 365) problems.push(`Expected at least 365 records; found ${catalog.length}.`);
if (new Set(ids).size !== ids.length) problems.push('Duplicate cue IDs found.');
for (const record of catalog) {
  if (!validLearnIds.has(record.learnMoreId)) problems.push(`${record.id} has invalid Learn More ID.`);
}
for (const language of languages) {
  const locale = JSON.parse(await readFile(path.join(root, `content/locales/${language}.json`), 'utf8'));
  for (const id of ids) {
    const entry = locale[id];
    if (!entry) problems.push(`${language}: missing ${id}.`);
    else if (!entry.context?.trim() || !entry.cue?.trim()) problems.push(`${language}: empty text for ${id}.`);
  }
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Validated ${catalog.length} unique cues across ${languages.length} languages.`);
