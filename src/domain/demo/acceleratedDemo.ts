import type { SupportedLanguage } from '../../config/constants';
import { getLocalizedCue } from '../content/contentRepository';
import { selectDailyCue } from '../content/dailyCueService';
import { dailyReminders } from '../content/dailyGuidance';
import type { DailySelection, LocalizedCue, SelectionStore } from '../content/types';
import { estimateCycle, type CyclePhase, type CycleSettings } from '../cycle/cycleEngine';
import { addCalendarDays, type DateOnly } from '../cycle/dateOnly';

export const DEMO_DAY_COUNT = 30;
export const DEMO_DAY_DURATION_MS = 5 * 60 * 1000;

export interface DemoProgress {
  day: number;
  completed: boolean;
  nextChangeAt: number | null;
  endsAt: number;
}

export interface DemoDay {
  day: number;
  /** Synthetic content key. Never display it as the partner's cycle date. */
  date: DateOnly;
  /** Part of a labelled demonstration, not a personal phase prediction. */
  phase: CyclePhase;
  cueId: string;
  cue: LocalizedCue;
  reminders: ReturnType<typeof dailyReminders>;
}

/**
 * Uses elapsed wall time so returning from the background catches up immediately.
 * Day 1 is visible at start, day 30 at 145 minutes, completion at 150 minutes.
 * A backwards clock is clamped to day 1; a completed demo never wraps to day 1.
 */
export function getDemoProgress(startedAt: number, now: number): DemoProgress {
  const endsAt = startedAt + DEMO_DAY_COUNT * DEMO_DAY_DURATION_MS;
  if (!Number.isFinite(startedAt) || !Number.isFinite(now) || !Number.isFinite(endsAt)) {
    throw new Error('INVALID_DEMO_TIMESTAMP');
  }
  const elapsed = Math.max(0, now - startedAt);
  const day = Math.min(DEMO_DAY_COUNT, Math.floor(elapsed / DEMO_DAY_DURATION_MS) + 1);
  const completed = now >= endsAt;
  return {
    day,
    completed,
    nextChangeAt: completed ? null : startedAt + day * DEMO_DAY_DURATION_MS,
    endsAt,
  };
}

/**
 * Builds a repeatable 30-day showcase from the existing offline content bank.
 * The fixed 30/5 scenario belongs only to the demonstration. This function accepts
 * neither real cycle settings nor a persistent selection store, and never reads
 * either. Every build gets a new private history, including concurrent builds.
 */
export async function buildDemoDays(language: SupportedLanguage): Promise<DemoDay[]> {
  // Keep synthetic dates at/after the dailyReminders epoch (2020-01-01).
  const settings: CycleSettings = {
    lastKnownPeriodStart: '2020-01-01',
    typicalCycleLength: DEMO_DAY_COUNT,
    typicalPeriodLength: 5,
  };
  let history: DailySelection[] = [];
  const store: SelectionStore = {
    async readAll() { return history; },
    async writeAll(selections) { history = selections; },
  };
  const days: DemoDay[] = [];
  for (let index = 0; index < DEMO_DAY_COUNT; index += 1) {
    const date = addCalendarDays(settings.lastKnownPeriodStart, index);
    const phase = estimateCycle({ ...settings, currentLocalDate: date }).estimatedPhase;
    const cueId = await selectDailyCue({ date, phase, settings, store });
    days.push({
      day: index + 1,
      date,
      phase,
      cueId,
      cue: { ...getLocalizedCue(language, cueId) },
      reminders: dailyReminders(date, language),
    });
  }
  return days;
}
