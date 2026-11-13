import { createInstance } from 'i18next';
import { describe, expect, it } from 'vitest';

import { SUPPORTED_LANGUAGES } from '../src/config/constants';
import billing from '../src/i18n/billing.json';
import { resources } from '../src/i18n/resources';

describe('billing localization', () => {
  it.each(SUPPORTED_LANGUAGES)('%s resolves every billing message and its placeholders', async language => {
    const instance = createInstance();
    await instance.init({ resources, lng: language, fallbackLng: 'en', interpolation: { escapeValue: false } });
    expect(Object.keys(billing[language]).sort()).toEqual(Object.keys(billing.en).sort());
    for (const key of Object.keys(billing.en)) {
      const result = instance.t(`billing.${key}`, { date: '2030-01-01', source: 'RevenueCat' });
      expect(result).not.toBe(`billing.${key}`);
      expect(result).not.toMatch(/{{|undefined/);
      expect(result.length).toBeGreaterThan(0);
    }
    expect(instance.t('privacy.body')).toBe(billing[language].privacyBody);
    const locale = language === 'mbf' ? 'ms' : language;
    expect(new Intl.DateTimeFormat(locale).format(new Date('2030-01-01T12:00:00Z'))).not.toContain('Invalid');
  });
  it('falls back to English for unsupported language preferences', async () => {
    const instance = createInstance(); await instance.init({ resources, lng: 'xx', fallbackLng: 'en' });
    expect(instance.t('billing.start')).toBe(billing.en.start);
  });
});
