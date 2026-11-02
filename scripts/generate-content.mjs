import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Editorial source of truth: aligned, independently readable sentences per locale.
// Combinations are varied daily bundles, not hundreds of independent principles.
const root = process.cwd();
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
    if (bank[key]?.length !== 24 || new Set(bank[key]).size !== 24 || bank[key].some(s => !s.trim())) {
      throw new Error(`Invalid editorial bank: ${language}:${key}`);
    }
  }
  for (const [phase] of phases) {
    if (bank.phaseActions[phase]?.length !== 4 || bank.phaseActions[phase].some(s => !s.trim())) {
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
await mkdir(path.join(root, 'content/locales'), { recursive: true });
await writeFile(path.join(root, 'content/catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
for (const language of languages) {
  await writeFile(path.join(root, `content/locales/${language}.json`), `${JSON.stringify(locales[language], null, 2)}\n`);
}
console.log(`Generated ${catalog.length} distinct three-part bundles across ${languages.length} locales from 88 editorial texts per locale.`);
