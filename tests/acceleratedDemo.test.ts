import { describe, expect, it } from 'vitest';

import { SUPPORTED_LANGUAGES } from '../src/config/constants';
import { getCatalog, getLocalizedCue } from '../src/domain/content/contentRepository';
import { dailyReminders } from '../src/domain/content/dailyGuidance';
import {
  buildDemoDays,
  DEMO_DAY_COUNT,
  DEMO_DAY_DURATION_MS,
  getDemoProgress,
  nextDemoTestDay,
} from '../src/domain/demo/acceleratedDemo';
import { getDemoCopy } from '../src/i18n/acceleratedDemo';

const startedAt = Date.UTC(2026, 10, 3, 3);

describe('accelerated demonstration clock', () => {
  it('advances the isolated QA view one synthetic day without wrapping', () => {
    expect(nextDemoTestDay(1)).toBe(2);
    expect(nextDemoTestDay(29)).toBe(30);
    expect(nextDemoTestDay(30)).toBe(30);
    for (const invalid of [0, 31, 1.5, NaN, Infinity]) {
      expect(() => nextDemoTestDay(invalid)).toThrow('INVALID_DEMO_DAY');
    }
  });

  it('shows day 1 immediately and changes only at each five-minute boundary', () => {
    expect(DEMO_DAY_COUNT).toBe(30);
    expect(DEMO_DAY_DURATION_MS).toBe(300000);
    expect(getDemoProgress(startedAt, startedAt)).toEqual({
      day: 1,
      completed: false,
      nextChangeAt: startedAt + 300000,
      endsAt: startedAt + 9000000,
    });
    for (let day = 2; day <= 30; day += 1) {
      const boundary = startedAt + (day - 1) * 300000;
      expect(getDemoProgress(startedAt, boundary - 1).day).toBe(day - 1);
      expect(getDemoProgress(startedAt, boundary)).toMatchObject({
        day,
        completed: false,
        nextChangeAt: boundary + 300000,
      });
    }
  });

  it('keeps the final day visible for five minutes, then completes without wrapping', () => {
    const endsAt = startedAt + 150 * 60 * 1000;
    expect(getDemoProgress(startedAt, startedAt + 145 * 60 * 1000)).toEqual({
      day: 30, completed: false, nextChangeAt: endsAt, endsAt,
    });
    expect(getDemoProgress(startedAt, endsAt - 1).completed).toBe(false);
    for (const now of [endsAt, endsAt + 1, endsAt + 24 * 60 * 60 * 1000]) {
      expect(getDemoProgress(startedAt, now)).toEqual({
        day: 30, completed: true, nextChangeAt: null, endsAt,
      });
    }
  });

  it('catches up after background time and safely handles a clock before the start', () => {
    expect(getDemoProgress(startedAt, startedAt + 72 * 60 * 1000)).toMatchObject({
      day: 15, completed: false, nextChangeAt: startedAt + 75 * 60 * 1000,
    });
    expect(getDemoProgress(startedAt, startedAt - 60000)).toMatchObject({
      day: 1, completed: false, nextChangeAt: startedAt + 300000,
    });
    for (const invalid of [NaN, Infinity, -Infinity]) {
      expect(() => getDemoProgress(invalid, startedAt)).toThrow('INVALID_DEMO_TIMESTAMP');
      expect(() => getDemoProgress(startedAt, invalid)).toThrow('INVALID_DEMO_TIMESTAMP');
    }
  });
});

describe('accelerated demonstration content', () => {
  it('has explicit isolated-QA labels for the manual test-day control in every locale', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const copy = getDemoCopy(language);
      expect(copy.nextTestDay.trim(), `${language}:nextTestDay`).not.toBe('');
      expect(copy.manualTestOnly.trim(), `${language}:manualTestOnly`).not.toBe('');
    }
  });

  it('provides 30 distinct three-card days and exactly one gratitude reminder in all eleven locales', async () => {
    const catalog = new Map(getCatalog().map(item => [item.id, item]));
    const plans = await Promise.all(SUPPORTED_LANGUAGES.map(language => buildDemoDays(language)));
    const referenceIds = plans[0]!.map(day => day.cueId);
    expect(plans).toHaveLength(11);
    for (const [localeIndex, days] of plans.entries()) {
      const language = SUPPORTED_LANGUAGES[localeIndex]!;
      expect(days).toHaveLength(30);
      expect(days.map(day => day.day)).toEqual(Array.from({ length: 30 }, (_, index) => index + 1));
      expect(days.map(day => day.cueId)).toEqual(referenceIds);
      expect(new Set(days.map(day => day.cueId)).size).toBe(30);
      expect(new Set(days.map(day => JSON.stringify(day.cue))).size).toBe(30);
      for (const day of days) {
        expect(catalog.get(day.cueId)!.phases).toContain(day.phase);
        expect(day.cue).toEqual(getLocalizedCue(language, day.cueId));
        expect([day.cue.cue, day.cue.support, day.cue.context].every(text => text.trim().length > 0)).toBe(true);
        expect(day.reminders).toEqual(dailyReminders(day.date, language));
        expect(day.reminders).toHaveLength(3);
        expect(day.reminders.filter(reminder => reminder.id === 'gratitude')).toHaveLength(1);
        expect(new Set(day.reminders.map(reminder => reminder.id)).size).toBe(3);
        expect(day.reminders.every(reminder => reminder.text.trim().length > 0)).toBe(true);
      }
    }
  });

  it('uses the fixed synthetic scenario and covers all four demonstration phases', async () => {
    const days = await buildDemoDays('en');
    expect(days[0]!.date).toBe('2020-01-01');
    expect(days[29]!.date).toBe('2020-01-30');
    expect(days.map(day => day.phase)).toEqual([
      ...Array<string>(5).fill('menstrual'),
      ...Array<string>(9).fill('follicular'),
      ...Array<string>(3).fill('mid_cycle'),
      ...Array<string>(13).fill('luteal'),
    ]);
    expect(new Set(days.map(day => day.reminders.findIndex(reminder => reminder.id === 'gratitude'))).size).toBe(3);
  });

  it('restarts with the same plan and does not leak returned edits into the content bank', async () => {
    const first = await buildDemoDays('en');
    const originalCue = { ...first[0]!.cue };
    first[0]!.cue.cue = 'A caller changed this demo card';
    first[0]!.reminders[0]!.text = 'A caller changed this reminder';
    const second = await buildDemoDays('en');
    expect(second.map(day => day.cueId)).toEqual(first.map(day => day.cueId));
    expect(second[0]!.cue).toEqual(originalCue);
    expect(getLocalizedCue('en', first[0]!.cueId)).toEqual(originalCue);
    expect(second[0]!.reminders).toEqual(dailyReminders(second[0]!.date, 'en'));
  });
});
