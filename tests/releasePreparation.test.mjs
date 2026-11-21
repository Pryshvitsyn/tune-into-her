import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { chmod, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { afterEach, describe, expect, it } from 'vitest';

import { handle } from '../backend/src/worker';
import { buildLegalSite, renderLegal } from '../scripts/build-legal-site.mjs';
import { storeDrafts } from '../scripts/prepare-store-drafts.mjs';
import { smokeTrial } from '../scripts/trial-sandbox-smoke.mjs';

const json = file => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const listings = json('../release/store-listings.json'); const config = json('../release/store-config.json'); const brand = json('../src/config/brand.json');
const billing = json('../src/i18n/billing.json');
const directories = [];
const temporary = async () => { const dir = await mkdtemp(path.join(tmpdir(), 'tih-release-test-')); directories.push(dir); return dir; };
afterEach(async () => { for (const dir of directories.splice(0)) await rm(dir, { recursive: true, force: true }); });

it('keeps credential-free native inspection separate from store distribution and private sample access', () => {
  const profiles = json('../eas.json').build;
  expect(profiles['native-audit'].distribution).toBe('internal');
  expect(profiles['native-audit'].android.withoutCredentials).toBe(true);
  for (const key of ['production', 'billing-test']) expect(profiles[key].android.withoutCredentials).not.toBe(true);
  const env = { ...process.env, ...profiles['native-audit'].env, EAS_BUILD_PROFILE: 'native-audit', EAS_BUILD_PLATFORM: 'android', ENTRY_FILE: '', BUNDLE_CONFIG: '', EXPO_OVERRIDE_METRO_CONFIG: '', TIH_STANDALONE_QA_BUNDLE: '' };
  const check = changes => spawnSync(process.execPath, ['scripts/eas-production-check.mjs'], { encoding: 'utf8', env: { ...env, ...changes } });
  expect(check({}).status).toBe(0);
  expect(check({ EAS_BUILD_PLATFORM: 'ios' }).status).toBe(1);
  expect(check({ ENTRY_FILE: '/private-qa/entry.cjs' }).status).toBe(1);
  expect(check({ EXPO_PUBLIC_USE_MOCK_BILLING: 'true' }).status).toBe(1);
  expect(spawnSync(process.execPath, ['scripts/android-native-audit.mjs', 'prepare'], { env: { ...process.env, EAS_BUILD_PROFILE: 'production' } }).status).toBe(0);
  expect(readFileSync('.easignore', 'utf8').split('\n')).toContain('/android');
});

describe('store metadata preparation', () => {
  it('exports supported storefronts while preserving source copy and withholding unsupported MBF', () => {
    const draft = storeDrafts(listings, config, brand, billing);
    expect(draft.issues).toEqual([]);
    expect(Object.keys(draft.apple)).toHaveLength(10); expect(Object.keys(draft.google)).toHaveLength(10);
    expect(draft.apple['en-AU'].description).toContain(listings.en.description);
    expect(draft.apple['en-AU'].subscriptionDisclosure).toContain(billing.en.trialPolicy);
    expect(draft.google['zh-CN'].description).toContain(listings['zh-Hans'].description);
    expect(draft.apple['en-AU'].description).not.toContain('{{source}}');
    expect(draft.excluded.map(row => row.language)).toEqual(['mbf']);
    expect(draft.apple['en-AU'].privacyUrl).toBeNull();
  });
  it('rejects actual platform limits and UTF-8 keyword overflow without silently truncating translations', () => {
    const changed = structuredClone(config); delete changed.locales.fr.appleSubtitle;
    changed.locales.ru.keywords = 'я'.repeat(51);
    const draft = storeDrafts(listings, changed, brand, billing);
    expect(draft.issues).toContain('fr.apple.subtitle: 36/30 characters');
    expect(draft.issues).toContain('ru.apple.keywords: 102/100 bytes');
    expect(draft.apple['fr-FR'].subtitle).toBe(listings.fr.shortDescription);
  });
});

describe('legal route export', () => {
  it('escapes text and blocks executable/unknown links while retaining canonical legal routes', () => {
    const html = renderLegal('# Notice\n\n<script>alert(1)</script> [bad](javascript:alert) [Privacy](PRIVACY.md)');
    expect(html).not.toContain('<script>'); expect(html).not.toContain('href="javascript:');
    expect(html).toContain('href="/privacy/"');
  });
  it('prepares all three routes as drafts and blocks unapproved public export before writing', async () => {
    const dir = await temporary(); const result = await buildLegalSite({ output: dir });
    expect(result.status).toBe('DRAFT_ONLY_NOT_PUBLIC');
    for (const route of result.routes) expect(readFileSync(path.join(dir, route, 'index.html'), 'utf8')).toContain('Not published or approved');
    await expect(buildLegalSite({ output: path.join(dir, 'blocked'), publish: true })).rejects.toThrow('Public legal export blocked');
  });
});

describe('sandbox verification across persisted test identity', () => {
  it('exercises the real Worker and SQLite through two runs without exposing or extending identity', async () => {
    const dir = await temporary(); const stateFile = path.join(dir, 'identity.private.json');
    const db = new DatabaseSync(':memory:'); db.exec(readFileSync(new URL('../backend/migrations/0001_billing.sql', import.meta.url), 'utf8'));
    const env = { ENVIRONMENT: 'sandbox', DB: { prepare(sql) { let args = []; const statement = { bind(...values) { args = values; return statement; }, async first() { return db.prepare(sql).get(...args) ?? null; }, async run() { return db.prepare(sql).run(...args); } }; return statement; } } };
    let now = Date.parse('2026-11-21T12:00:00Z');
    const fetchImpl = (url, init) => handle(new Request(url, init), env, now++);
    try {
      const first = await smokeTrial({ url: 'https://trial.fixture.test', stateFile, fetchImpl });
      const second = await smokeTrial({ url: 'https://trial.fixture.test', stateFile, fetchImpl });
      expect(first.resumedPrivateIdentity).toBe(false); expect(second.resumedPrivateIdentity).toBe(true);
      expect(first.requests).toBe(9); expect(second.exactFourteenDayInterval).toBe(true);
      expect(db.prepare('SELECT COUNT(*) AS n FROM app_trials').get().n).toBe(1);
      const identity = JSON.parse(readFileSync(stateFile, 'utf8'));
      expect(JSON.stringify([first, second])).not.toContain(identity.credential);
      expect(JSON.stringify([first, second])).not.toContain(identity.identity);
      await chmod(stateFile, 0o644);
      await expect(smokeTrial({ url: 'https://trial.fixture.test', stateFile, fetchImpl })).rejects.toThrow('0600');
    } finally { db.close(); }
  });
  it('rejects unsafe endpoints before any network operation', async () => {
    const dir = await temporary(); let calls = 0;
    const fetchImpl = () => { calls++; throw new Error('Unexpected network'); };
    await expect(smokeTrial({ url: 'http://remote.fixture.test', stateFile: path.join(dir, 'state'), fetchImpl })).rejects.toThrow('HTTPS');
    await expect(smokeTrial({ url: 'https://secret@trial.fixture.test', stateFile: path.join(dir, 'state'), fetchImpl })).rejects.toThrow('HTTPS');
    expect(calls).toBe(0);
  });
});

it('rejects malformed native binaries, bad alignment and unsafe IPA archives', () => {
  const result = execFileSync('python3', ['tests/native_artifact_audit.py'], { encoding: 'utf8' });
  expect(result).toContain('NATIVE_AUDIT_FIXTURES_PASS');
});
