import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Editorial source of truth: aligned, independently readable sentences per locale.
// Combinations are varied daily bundles, not hundreds of independent principles.
const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const { codes: languages } = JSON.parse(await readFile(path.join(root, 'src/config/languages.json'), 'utf8'));
const phases = [
  ['menstrual', 100, [1, 20]],
  ['follicular', 104, [2, 76]],
  ['mid_cycle', 100, [2, 90]],
  ['luteal', 180, [4, 90]],
];
const banks = {};
for (const language of languages) {
  const bank = JSON.parse(await readFile(path.join(root, `content/editorial/${language}.json`), 'utf8'));
  for (const key of ['actions', 'support', 'context']) {
    if (bank[key]?.length !== 90 || new Set(bank[key]).size !== 90 || bank[key].some(s => !s.trim())) {
      throw new Error(`Invalid editorial bank: ${language}:${key}`);
    }
  }
  for (const [phase] of phases) {
    if (bank.phaseActions[phase]?.length !== 12 || new Set(bank.phaseActions[phase]).size !== 12 || bank.phaseActions[phase].some(s => !s.trim())) {
      throw new Error(`Invalid phase bank: ${language}:${phase}`);
    }
  }
  banks[language] = bank;
}
const catalog = [];
const locales = Object.fromEntries(languages.map(language => [language, {}]));
const used = new Set();
for (const [phaseIndex, [phase, count, dayRange]] of phases.entries()) {
  for (let index = 0; index < count; index++) {
    const id = `${phase}_${String(index + 1).padStart(3, '0')}`;
    const action = index % 28;
    const actionId = action < 24 ? `action_${action}` : `${phase}_action_${action - 24}`;
    // Resolve collisions across phases as well as within a phase.
    let support, context, signature;
    for (let attempt = 0; attempt < 576; attempt++) {
      support = (index + phaseIndex * 7 + Math.floor(index / 28) * 5 + attempt) % 24;
      context = (index * 7 + phaseIndex * 5 + Math.floor(index / 28) * 11 + Math.floor(attempt / 24)) % 24;
      signature = `${actionId}:${support}:${context}`;
      if (!used.has(signature)) break;
    }
    if (used.has(signature)) throw new Error(`Exhausted combinations: ${id}`);
    used.add(signature);
    catalog.push({ id, phases: [phase], dayRange, tags: ['practical', 'support', 'boundaries'], learnMoreId: phase,
      actionId, supportId: `support_${support}`, contextId: `context_${context}` });
    for (const language of languages) {
      const bank = banks[language];
      locales[language][id] = {
        cue: action < 24 ? bank.actions[action] : bank.phaseActions[phase][action - 24],
        support: bank.support[support],
        context: bank.context[context],
      };
    }
  }
}
// Append the v4 reserve without changing any v3 ID, text or identity. Most
// practical actions suit every phase; twelve slots retain phase-specific options.
// Each slot has one support and context identity across ALL phases. This makes
// 90-day component freshness achievable across arbitrary phase transitions.
for (let index = 0; index < 90; index++) {
  const variants = index < 12 ? phases : [['all', 0, [1, 90]]];
  for (const [phase, , dayRange] of variants) {
    const id = `reserve_${phase}_${String(index + 1).padStart(3, '0')}`;
    const support = (index + 24) % 90;
    const context = (index + 48) % 90;
    const actionId = index < 12 ? `${phase}_action_${index}` : `action_${index}`;
    catalog.push({ id, phases: phase === 'all' ? phases.map(([name]) => name) : [phase],
      dayRange, tags: ['practical', 'support', 'boundaries', 'reserve-v4'],
      learnMoreId: phase === 'all' ? 'follicular' : phase,
      actionId, supportId: `support_${support}`, contextId: `context_${context}` });
    for (const language of languages) {
      const bank = banks[language];
      locales[language][id] = {
        cue: index < 12 ? bank.phaseActions[phase][index] : bank.actions[index],
        support: bank.support[support], context: bank.context[context],
      };
    }
  }
}
const outputs = { 'content/catalog.json': catalog,
  ...Object.fromEntries(languages.map(language => [`content/locales/${language}.json`, locales[language]])) };
if (!checkOnly) await mkdir(path.join(root, 'content/locales'), { recursive: true });
for (const [file, value] of Object.entries(outputs)) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (checkOnly) {
    if (await readFile(path.join(root, file), 'utf8') !== text) throw new Error(`Stale generated content: ${file}`);
  } else await writeFile(path.join(root, file), text);
}
console.log(`${checkOnly ? 'Checked' : 'Generated'} ${catalog.length} distinct three-part bundles across ${languages.length} locales from 318 editorial texts per locale (90 per section plus 48 phase actions).`);
