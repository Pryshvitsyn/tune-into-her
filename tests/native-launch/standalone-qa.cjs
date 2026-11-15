#!/usr/bin/env node
'use strict';
/* global __dirname */

// Build tooling only. Nothing under app/ or src/ imports this module.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const MARKER = 'TIH_STANDALONE_QA_BUNDLE';
const PROTECTED_INPUTS = [
  'src/devQA/session.ts', 'src/services/purchases/mockBilling.ts',
  'src/context/AppContext.tsx', 'app/index.tsx', 'app/_layout.tsx',
];
const literal = value => JSON.stringify(value);
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function prepareStandaloneQA({ projectRoot, acknowledge = false, scenario = 'paid-active' } = {}) {
  if (!acknowledge) throw new Error('Explicit --standalone-qa acknowledgement required');
  if (scenario !== 'paid-active') throw new Error('Only the reviewed paid-active memory scenario is supported');
  const root = fs.realpathSync(projectRoot || path.resolve(__dirname, '../..'));
  for (const file of PROTECTED_INPUTS) if (!fs.statSync(path.join(root, file)).isFile()) throw new Error('Missing normal app input');
  const normalMain = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).main;
  if (normalMain !== 'expo-router/entry') throw new Error('Unexpected normal app entry; review before preparing QA');
  const output = path.join(root, '.expo/private-qa');
  fs.mkdirSync(output, { recursive: true });
  const files = {
    entry: path.join(output, 'entry.cjs'), session: path.join(output, 'session.cjs'),
    index: path.join(output, 'index.tsx'), config: path.join(output, 'metro.config.cjs'),
  };
  const originalSession = path.join(root, 'src/devQA/session.ts');
  const originalIndex = path.join(root, 'app/index.tsx');
  const inputsBefore = Object.fromEntries(PROTECTED_INPUTS.map(file => [file, sha(path.join(root, file))]));

  fs.writeFileSync(files.session, `'use strict';
const original = require(${literal(originalSession)});
// This private artifact must never leave its synthetic scope and resume real effects.
class StandaloneQASession extends original.InternalQASession {
  stop() { void this.startScenario(${literal(scenario)}); }
}
const internalQASession = new StandaloneQASession(true);
let startup;
function startStandaloneQA() {
  if (!startup) startup = internalQASession.startScenario(${literal(scenario)}).then(started => {
    if (!started || !internalQASession.getSnapshot().active) throw new Error('STANDALONE_QA_START_FAILED');
  });
  return startup;
}
module.exports = { ...original, internalQAEnabled: true, internalQASession, startStandaloneQA };
`);
  fs.writeFileSync(files.entry, `'use strict';
const qa = require(${literal(files.session)});
const startup = qa.startStandaloneQA();
// startScenario publishes the active private scope synchronously. Native main
// registration must also remain synchronous; Global waits for private accessReady.
if (!qa.internalQASession.getSnapshot().active) throw new Error('STANDALONE_QA_SCOPE_REQUIRED');
void startup.catch(() => { console.error('STANDALONE_QA_START_FAILED'); });
require('expo-router/entry');
`);
  fs.writeFileSync(files.index, `import { Redirect } from 'expo-router';
export default function StandaloneQAIndex() { return <Redirect href="/today" />; }
`);
  fs.writeFileSync(files.config, `'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { getDefaultConfig } = require('expo/metro-config');
const root = ${literal(root)};
const entry = ${literal(files.entry)};
const canonical = value => { try { return fs.realpathSync(value); } catch { return path.resolve(value); } };
if (process.env.${MARKER} !== '1' || process.env.CONFIGURATION !== 'Release'
    || !process.env.ENTRY_FILE || canonical(process.env.ENTRY_FILE) !== entry
    || !process.env.EXPO_OVERRIDE_METRO_CONFIG || canonical(process.env.EXPO_OVERRIDE_METRO_CONFIG) !== ${literal(files.config)}) {
  throw new Error('Standalone QA config requires explicit QA Release entry and build marker');
}
const config = getDefaultConfig(root);
const previous = config.resolver.resolveRequest;
const originalSession = ${literal(originalSession)};
const privateSession = ${literal(files.session)};
const originalIndex = ${literal(originalIndex)};
const privateIndex = ${literal(files.index)};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const result = previous ? previous(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
  if (result.type !== 'sourceFile') return result;
  const file = canonical(result.filePath);
  // Only the wrapper itself may load the original class/guard implementation.
  if (file === originalSession && canonical(context.originModulePath) !== privateSession) {
    return { ...result, filePath: privateSession };
  }
  if (file === originalIndex) return { ...result, filePath: privateIndex };
  return result;
};
module.exports = config;
`);
  const inputsAfter = Object.fromEntries(PROTECTED_INPUTS.map(file => [file, sha(path.join(root, file))]));
  if (JSON.stringify(inputsBefore) !== JSON.stringify(inputsAfter)) throw new Error('Normal app inputs changed during preparation');
  const manifest = {
    kind: 'Explicit standalone memory-only QA bundle; not the normal production entry',
    scenario, nativeConfiguration: 'Release', developmentJavaScript: false,
    requiredEnvironment: { [MARKER]: '1', CONFIGURATION: 'Release', ENTRY_FILE: files.entry, BUNDLE_CONFIG: files.config, EXPO_OVERRIDE_METRO_CONFIG: files.config },
    files, originalInputsSHA256: inputsAfter,
    generatedSHA256: Object.fromEntries(Object.entries(files).map(([key, file]) => [key, sha(file)])),
    normalEntryUnchanged: true, normalProductionGatesUnchanged: true,
    stopBehavior: 'Reset the private scenario; normal Release must be restored externally to leave standalone QA',
  };
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

/** Fail before signing/install if Expo ignored the custom resolver. Unminified
 * Metro __d(function...,numericId,[numericDependencies]) output is required. */
function verifyStandaloneBundle(source) {
  const starts = [...source.matchAll(/^__d\(function\s*\(/gm)].map(match => match.index);
  if (!starts.length) throw new Error('QA_BUNDLE_UNSUPPORTED_METRO_FORMAT');
  const modules = starts.map((start, index) => {
    const text = source.slice(start, starts[index + 1] ?? source.length);
    // The final module may be followed by Metro's entry invocation.
    const footers = [...text.matchAll(/\},\s*(\d+),\s*\[([\d,\s]*)\]\);/g)];
    const footer = footers.at(-1);
    if (!footer) throw new Error('QA_BUNDLE_UNSUPPORTED_MODULE_FOOTER');
    return { id: Number(footer[1]), dependencies: footer[2].trim() ? footer[2].split(',').map(Number) : [], text };
  });
  const find = pattern => {
    const matches = modules.filter(module => pattern.test(module.text));
    if (matches.length !== 1) throw new Error('QA_BUNDLE_REQUIRED_MODULE_MISSING_OR_DUPLICATED');
    return matches[0];
  };
  const wrapper = find(/class StandaloneQASession\b/);
  const original = find(/class InternalQASession\b/);
  const provider = find(/function AppProvider\s*\(/);
  const hook = find(/function useInternalQASession\s*\(/);
  const index = find(/function StandaloneQAIndex\s*\(/);
  const entry = find(/STANDALONE_QA_SCOPE_REQUIRED/);
  const sessionDependencies = module => {
    const bindings = [...module.text.matchAll(/\bvar\s+([\w$]+)\s*=\s*require\(_dependencyMap\[(\d+)\]\)/g)];
    return bindings.filter(binding => module.text.includes(binding[1] + '.internalQASession')
      || module.text.includes(binding[1] + '.internalQAEnabled')).map(binding => module.dependencies[Number(binding[2])]);
  };
  const providerBindings = sessionDependencies(provider), hookBindings = sessionDependencies(hook);
  if (providerBindings.length !== 1 || providerBindings[0] !== wrapper.id
      || hookBindings.length !== 1 || hookBindings[0] !== wrapper.id) throw new Error('QA_BUNDLE_APP_CONTEXT_USES_DISABLED_SINGLETON');
  const originalConsumers = modules.filter(module => module.dependencies.includes(original.id));
  if (!wrapper.dependencies.includes(original.id) || wrapper.dependencies.includes(wrapper.id)
      || originalConsumers.length !== 1 || originalConsumers[0].id !== wrapper.id) throw new Error('QA_BUNDLE_ORIGINAL_SESSION_ALIAS_LEAK_OR_CYCLE');
  if (!entry.dependencies.includes(wrapper.id) || !index.text.includes('/today')) throw new Error('QA_BUNDLE_STARTUP_NOT_PRIVATE_TODAY');
  return { result: 'PASS', format: 'Unminified numeric Metro modules', standaloneIndexPresent: true,
    AppProviderUsesPrivateSession: true, hookUsesSamePrivateSession: true,
    originalSessionConsumedOnlyByWrapper: true, synchronousEntryUsesPrivateSession: true };
}

module.exports = { prepareStandaloneQA, verifyStandaloneBundle, MARKER, PROTECTED_INPUTS };
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 2 && args[0] === '--verify-bundle') {
    try { process.stdout.write(JSON.stringify(verifyStandaloneBundle(fs.readFileSync(args[1], 'utf8')), null, 2) + '\n'); }
    catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 1; }
  } else if (args.length !== 1 || args[0] !== '--standalone-qa') {
    process.stderr.write('Usage: standalone-qa.cjs --standalone-qa | --verify-bundle <unminified-main.jsbundle>\n');
    process.exitCode = 1;
  } else {
    process.stdout.write(JSON.stringify(prepareStandaloneQA({ acknowledge: true }), null, 2) + '\n');
  }
}
