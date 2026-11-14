import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { ScenarioClock, millisecondsToNextGuidanceBoundary } from '../src/devQA/clock';
import { QA_DAY_MS, makeQAScenario } from '../src/devQA/scenarios';
import { createInternalQASession } from '../src/devQA/session';
import { selectDailyCue } from '../src/domain/content/dailyCueService';
import { guidanceDate } from '../src/domain/content/guidanceDate';
import { estimateCycle } from '../src/domain/cycle/cycleEngine';
import { toDateOnly } from '../src/domain/cycle/dateOnly';
import { APP_TRIAL_MS } from '../src/services/trial/AppTrialService';

const active = (session: ReturnType<typeof createInternalQASession>) => {
  const value = session.getSnapshot();
  if (!value.active) throw new Error('Expected active QA');
  return value;
};
describe('isolated internal QA', () => {
  it.each([[false, undefined], [false, 'true'], [true, undefined], [true, 'false']] as const)('cannot activate outside both development gates: %s/%s', async (development, flag) => {
    const session = createInternalQASession(development, flag);
    expect(await session.startScenario('paid-active')).toBe(false);
    expect(session.getSnapshot().active).toBe(false);
  });
  it('advances only explicit synthetic wall/monotonic time, without patching device APIs', () => {
    const original = Date.now, clock = new ScenarioClock(1_000);
    clock.advanceBy(20);
    expect([clock.now(), clock.monotonic()]).toEqual([1_020, 20]);
    expect(Date.now).toBe(original);
    expect(() => clock.advanceBy(-1)).toThrow('QA_INVALID_ADVANCE');
    expect(() => clock.advanceBy(NaN)).toThrow('QA_INVALID_ADVANCE');
    expect(() => new ScenarioClock(NaN)).toThrow('QA_INVALID_TIME');
  });
  it.each([1, 7, 14, 21, 28] as const)('uses the real date-only engine for synthetic day %s', day => {
    const scenario = makeQAScenario(`cycle-${day}`);
    expect(estimateCycle({ ...scenario.cycleSettings!, currentLocalDate: toDateOnly(new Date(scenario.nowMs)) }).estimatedCycleDay).toBe(day);
    expect(scenario.cycleSettings?.lastKnownPeriodStart).toBe('2026-11-03');
  });
  it('starts fresh without a fabricated date/day and requires cycle setup before trial start', async () => {
    const session = createInternalQASession(true, 'true');
    await session.startScenario('fresh');
    expect(active(session)).toMatchObject({ cycleSettings: null, preferences: { onboardingComplete: false }, entitlement: { isActive: false }, appTrial: { status: 'not_started' } });
    await expect(session.startAppTrial()).rejects.toThrow('ONBOARDING_REQUIRED');
    await expect(session.completeOnboarding()).rejects.toThrow('ONBOARDING_REQUIRED');
  });
  it('retains the prior daily selection at 07:59 and changes the guidance key at local 08:00', async () => {
    const session = createInternalQASession(true, 'true'); await session.startScenario('before-0800');
    const before = active(session), settings = before.cycleSettings!;
    const oldDate = guidanceDate(new Date(before.nowMs), settings.lastKnownPeriodStart);
    expect(oldDate).toBe('2026-11-09');
    expect(millisecondsToNextGuidanceBoundary(before.nowMs)).toBe(60_000);
    const phase = estimateCycle({ ...settings, currentLocalDate: oldDate }).estimatedPhase;
    const cue = await selectDailyCue({ date: oldDate, phase, settings, store: before.memorySelectionStore });
    expect(await selectDailyCue({ date: oldDate, phase, settings, store: before.memorySelectionStore })).toBe(cue);
    await session.advanceToNextGuidanceBoundary();
    const after = active(session), nextDate = guidanceDate(new Date(after.nowMs), settings.lastKnownPeriodStart);
    expect(nextDate).toBe('2026-11-10');
    await selectDailyCue({ date: nextDate, phase: estimateCycle({ ...settings, currentLocalDate: nextDate }).estimatedPhase, settings, store: after.memorySelectionStore });
    expect((await after.memorySelectionStore.readAll()).map(item => item.date)).toEqual([oldDate, nextDate]);
  });
  it('uses the real trial evaluator for explicit start and exact 14x24-hour expiry without a purchase', async () => {
    const session = createInternalQASession(true, 'true'); await session.startScenario('trial-not-started');
    expect(active(session).trialStartRequests()).toBe(0);
    const started = await session.startAppTrial();
    expect(started.isActive).toBe(true);
    expect(Date.parse(started.expiresAt!) - Date.parse(started.startedAt!)).toBe(APP_TRIAL_MS);
    await session.advanceBy(APP_TRIAL_MS - 1); expect(active(session).appTrial.isActive).toBe(true);
    await session.advanceBy(1); expect(active(session).appTrial.status).toBe('expired');
    expect(active(session).entitlement.isActive).toBe(false);
    expect(active(session).trialStartRequests()).toBe(1);
  });
  it.each([['trial-begin', true, 0], ['trial-middle', true, 7 * QA_DAY_MS], ['trial-expired', false, APP_TRIAL_MS]] as const)('loads %s from an isolated server fixture', async (scenario, isActive, elapsed) => {
    const session = createInternalQASession(true, 'true'); await session.startScenario(scenario);
    expect(active(session).appTrial.isActive).toBe(isActive);
    expect(active(session).nowMs - Date.parse(active(session).appTrial.startedAt!)).toBe(elapsed);
    expect(active(session).trialStartRequests()).toBe(0);
  });
  it.each([['paid-active', true], ['paid-expired', false]] as const)('loads %s without an app-trial fallback', async (scenario, expectedAccess) => {
    const session = createInternalQASession(true, 'true'); await session.startScenario(scenario);
    expect(active(session).entitlement).toMatchObject({ isActive: expectedAccess, isMock: true });
    expect(active(session).appTrial.isActive).toBe(false);
  });
  it('keeps cancelled paid access until its term ends, separate from expired app access', async () => {
    const session = createInternalQASession(true, 'true'); await session.startScenario('paid-cancelled');
    expect(active(session).entitlement).toMatchObject({ status: 'active_ending', isActive: true, isMock: true });
    expect(active(session).appTrial.isActive).toBe(false);
    await session.advanceBy(2 * QA_DAY_MS);
    expect(active(session).entitlement).toMatchObject({ status: 'expired', isActive: false });
  });
  it('exercises unavailable offerings, recovery and explicit Restore through the existing Mock service', async () => {
    const session = createInternalQASession(true, 'true'); await session.startScenario('store-unavailable');
    await expect(active(session).purchases.getOffer()).rejects.toThrow('MOCK_STORE_UNAVAILABLE');
    await session.setStoreAvailable(true);
    expect(await active(session).purchases.getOffer()).toHaveLength(2);
    await session.startScenario('restore'); expect(active(session).entitlement.isActive).toBe(false);
    await active(session).purchases.restore();
    expect(active(session).entitlement).toMatchObject({ isActive: true, isMock: true });
  });
  it('keeps edits/history in the private session, replaces them on reset and drops stale listeners on exit', async () => {
    const session = createInternalQASession(true, 'true'); await session.startScenario('returning');
    await session.updatePreferences({ theme: 'dark', language: 'fr', reminderEnabled: true });
    const previous = active(session);
    await previous.memoryFeedbackStore.set('2026-11-09', 'synthetic-cue', 'helpful');
    await session.startScenario('restore');
    expect(active(session).preferences).toMatchObject({ theme: 'dark', language: 'fr', reminderEnabled: false });
    expect(await active(session).memoryFeedbackStore.readAll()).toEqual([]);
    const stalePurchases = active(session).purchases;
    session.stop(); const stopped = session.getSnapshot();
    await stalePurchases.restore(); expect(session.getSnapshot()).toBe(stopped);
    expect(session.getSnapshot().active).toBe(false);
    expect(await previous.memoryFeedbackStore.readAll()).toHaveLength(1);
  });
  it('ignores earlier access readiness after a newer scenario has replaced it', async () => {
    const session = createInternalQASession(true, 'true');
    const earlier = session.startScenario('paid-active'), latest = session.startScenario('fresh');
    expect(await earlier).toBe(false); expect(await latest).toBe(true);
    expect(active(session)).toMatchObject({ scenarioId: 'fresh', cycleSettings: null, entitlement: { isActive: false } });
  });
  it('has no native persistence/notification imports or clock monkey patches in the QA implementation', () => {
    for (const file of ['clock', 'scenarios', 'memoryStores', 'services', 'session']) {
      const source = readFileSync(new URL(`../src/devQA/${file}.ts`, import.meta.url), 'utf8');
      expect(source).not.toMatch(/from ['"](?:@react-native-async-storage|expo-secure-store|expo-notifications)|notificationScheduler|Date\.now\s*=/);
    }
  });
});
