import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const { codes: languages } = JSON.parse(await readFile(path.join(root, 'src/config/languages.json'), 'utf8'));
const phases = ['menstrual', 'follicular', 'mid_cycle', 'luteal'];
const catalog = JSON.parse(await readFile(path.join(root, 'content/catalog.json'), 'utf8'));
const ids = catalog.map(record => record.id);
const problems = [];
const totals = {};
if (new Set(ids).size !== ids.length) problems.push('Duplicate cue IDs.');
for (const record of catalog) {
  if (!phases.includes(record.learnMoreId) || !record.phases?.length || record.phases.some(p => !phases.includes(p))) problems.push(`${record.id}: invalid phase.`);
  if (![record.actionId, record.supportId, record.contextId].every(Boolean)) problems.push(`${record.id}: missing editorial identity.`);
}
for (const phase of phases) {
  totals[phase] = catalog.filter(record => record.phases.includes(phase)).length;
  if (totals[phase] < 90) problems.push(`${phase}: fewer than 90 eligible bundles.`);
}
let reference;
for (const language of languages) {
  const bank = JSON.parse(await readFile(path.join(root, `content/editorial/${language}.json`), 'utf8'));
  if (language === 'en') reference = bank;
  for (const section of ['actions', 'support', 'context']) {
    if (bank[section].length !== 24 || new Set(bank[section]).size !== 24) problems.push(`${language}:${section}: incomplete or repeated source.`);
  }
  const locale = JSON.parse(await readFile(path.join(root, `content/locales/${language}.json`), 'utf8'));
  if (Object.keys(locale).sort().join() !== [...ids].sort().join()) problems.push(`${language}: ID set differs.`);
  const bundles = new Set();
  for (const record of catalog) {
    const entry = locale[record.id];
    if (!entry || !['cue', 'support', 'context'].every(k => typeof entry[k] === 'string' && entry[k].trim())) {
      problems.push(`${language}:${record.id}: missing three-part copy.`); continue;
    }
    const signature = JSON.stringify([entry.cue, entry.support, entry.context]);
    if (bundles.has(signature)) problems.push(`${language}:${record.id}: repeated visible bundle.`);
    bundles.add(signature);
    const [kind, number] = record.actionId.match(/^(.*)_(\d+)$/).slice(1);
    const expected = kind === 'action' ? bank.actions[Number(number)] : bank.phaseActions[record.phases[0]][Number(number)];
    if (entry.cue !== expected || entry.support !== bank.support[Number(record.supportId.split('_')[1])] || entry.context !== bank.context[Number(record.contextId.split('_')[1])]) problems.push(`${language}:${record.id}: generated text differs from editorial source.`);
  }
  if (reference && language !== 'en') {
    for (const section of ['actions', 'support', 'context']) {
      bank[section].forEach((text, i) => { if (text === reference[section][i]) problems.push(`${language}:${section}:${i}: untranslated English.`); });
    }
  }
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(JSON.stringify({ bundles: catalog.length, locales: languages.length, eligibleBundlesPerPhase: totals, minimumReserveDays: 90, editorialTextsPerLocale: 88, uniqueFullBundles: true, repeatedConstituentIdeas: true, nativeLanguageReview: 'PENDING' }, null, 2));
