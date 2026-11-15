import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import { createInstance } from 'i18next';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { SUPPORTED_LANGUAGES } from '../src/config/constants';
import languages from '../src/config/languages.json';
import { QA_SCENARIOS } from '../src/devQA/scenarios';
import { localeForLanguage } from '../src/i18n/locale';
import qa from '../src/i18n/qa.json';
import { resources } from '../src/i18n/resources';

function flat(object: object, prefix = ''): Record<string, string> {
  return Object.fromEntries(Object.entries(object).flatMap(([key, value]) => value && typeof value === 'object'
    ? Object.entries(flat(value, `${prefix}${key}.`)) : [[prefix + key, String(value)]]));
}

describe('selected-language consistency', () => {
  it.each(SUPPORTED_LANGUAGES)('%s resolves every core/QA/picker/legal key without English fallback', async language => {
    const expected = flat(resources.en.translation), own = flat(resources[language].translation);
    expect(Object.keys(own).sort()).toEqual(Object.keys(expected).sort());
    const instance = createInstance();
    await instance.init({ resources, lng: language, fallbackLng: false, load: 'currentOnly', interpolation: { escapeValue: false } });
    for (const [key, original] of Object.entries(expected)) {
      const variables = Object.fromEntries([...original.matchAll(/{{(\w+)}}/g)].map(match => [match[1]!, 2]));
      const result = instance.t(key, variables);
      expect(result, `${language}:${key}`).not.toBe(key);
      expect(result, `${language}:${key}`).not.toMatch(/{{|undefined/);
      expect(own[key]?.trim().length, `${language}:${key}`).toBeGreaterThan(0);
    }
    expect(instance.t(`language.${language}`)).toBe(languages.labels[language]);
    expect(Object.keys(qa[language].scenario).sort()).toEqual(QA_SCENARIOS.map(item => item.id).sort());
    for (const status of ['not_started', 'active', 'expired', 'unavailable', 'loading', 'inactive', 'active_paid', 'active_ending', 'active_trial', 'billing_issue', 'error']) {
      expect(instance.t(`qa.status.${status}`)).not.toBe(`qa.status.${status}`);
    }
    expect(instance.t('language.page', { index: 2, count: 11 })).not.toMatch(/{{/);
    expect(() => new Intl.DateTimeFormat(localeForLanguage(language)).format(new Date('2030-01-01T12:00:00Z'))).not.toThrow();
  });

  it.each(SUPPORTED_LANGUAGES)('%s survives the actual preference save/load path across a new reader', async language => {
    const values = new Map<string, string>();
    const storage = { getItem: async (key: string) => values.get(key) ?? null, setItem: async (key: string, value: string) => { values.set(key, value); } };
    const exports: Record<string, unknown> = {};
    const source = readFileSync(new URL('../src/storage/preferences.ts', import.meta.url), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    vm.runInNewContext(code, { exports, require(name: string) {
      if (name === '@react-native-async-storage/async-storage') return { __esModule: true, default: storage };
      if (name === '../config/constants') return { SUPPORTED_LANGUAGES };
      if (name === '../domain/content/guidanceDate') return { GUIDANCE_REFRESH_HOUR: 8 };
      if (name === './keys') return { storageKeys: { preferences: 'private-test-preferences' } };
      throw new Error('Unexpected preference dependency');
    } });
    const save = exports.savePreferences as (value: object) => Promise<void>;
    const load = exports.loadPreferences as () => Promise<{ language: string }>;
    await save({ language, theme: 'dark', onboardingComplete: true, reminderEnabled: false, reminderHour: 8, reminderMinute: 0 });
    expect((await load()).language).toBe(language);
  });
});
