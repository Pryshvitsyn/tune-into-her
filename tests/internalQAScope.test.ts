import { describe, expect, it, vi } from 'vitest';

import type { AppContextValue } from '../src/context/AppContext';
import { scopeAppContext } from '../src/devQA/appScope';
import { createInternalQASession } from '../src/devQA/session';
import { MockPurchaseService } from '../src/services/purchases/MockPurchaseService';
import { AppTrialService } from '../src/services/trial/AppTrialService';

function baseContext() {
  const inactive = { status: 'inactive', isActive: false, isMock: false } as const;
  const trialInactive = { status: 'not_started', isActive: false, verification: 'unavailable' } as const;
  const purchases = new MockPurchaseService(inactive);
  const purchaseSpies = [vi.spyOn(purchases, 'getEntitlement'), vi.spyOn(purchases, 'getCachedEntitlement'), vi.spyOn(purchases, 'getOffer'), vi.spyOn(purchases, 'purchase'), vi.spyOn(purchases, 'restore'), vi.spyOn(purchases, 'manageSubscription')];
  const trialStorage = { getItem: vi.fn(async () => null), setItem: vi.fn(async () => undefined) };
  const trial = new AppTrialService({ endpoint: 'https://base.invalid', environment: 'sandbox', storage: trialStorage, randomBytes: async length => new Uint8Array(length), fetch: vi.fn(async () => { throw new Error('BASE_TRIAL_MUST_NOT_RUN'); }) });
  const trialSpies = [vi.spyOn(trial, 'getState'), vi.spyOn(trial, 'getCachedState'), vi.spyOn(trial, 'start')];
  const selectionStore = { readAll: vi.fn(async () => []), writeAll: vi.fn(async () => undefined) };
  const feedbackStore = { readAll: vi.fn(async () => []), read: vi.fn(async () => null), set: vi.fn(async () => undefined) };
  const callbacks = {
    retryInitialization: vi.fn(), deleteLocalData: vi.fn(async () => undefined),
    setCycleSettings: vi.fn(async () => undefined), updatePreferences: vi.fn(async () => undefined),
    completeOnboarding: vi.fn(async () => undefined), startAppTrial: vi.fn(async () => trialInactive),
    refreshEntitlement: vi.fn(async () => undefined), rebuildNotifications: vi.fn(async () => undefined),
    now: vi.fn(() => new Date('2020-01-01T12:00:00Z')),
  };
  const base: AppContextValue = {
    ...callbacks, ready: false, accessReady: false, initializationError: true, initializationAttempt: 4,
    qaActive: false, dataScope: 'real', preferences: { theme: 'light', language: 'en', onboardingComplete: true, reminderEnabled: true, reminderHour: 8, reminderMinute: 0 },
    cycleSettings: { lastKnownPeriodStart: '2020-01-01', typicalCycleLength: 30, typicalPeriodLength: 6 },
    entitlement: inactive, appTrial: trialInactive, hasAccess: false,
    purchases, trial, selectionStore, feedbackStore,
  };
  const spies = [...purchaseSpies, ...trialSpies, ...Object.values(callbacks), ...Object.values(selectionStore), ...Object.values(feedbackStore), ...Object.values(trialStorage)];
  return { base, spies };
}
function active(session: ReturnType<typeof createInternalQASession>) {
  const value = session.getSnapshot(); if (!value.active) throw new Error('Expected active QA'); return value;
}

describe('AppContext QA facade isolation', () => {
  it('returns the exact base object when inactive or when production gates disable the controller', async () => {
    const { base, spies } = baseContext(), development = createInternalQASession(true, 'true');
    expect(scopeAppContext(base, development, development.getSnapshot())).toBe(base);
    await development.startScenario('paid-active');
    const disabled = createInternalQASession(false, 'true');
    expect(scopeAppContext(base, disabled, development.getSnapshot())).toBe(base);
    spies.forEach(spy => expect(spy).not.toHaveBeenCalled());
  });

  it('selects only private QA state, clocks, services and stores', async () => {
    const { base, spies } = baseContext(), controller = createInternalQASession(true, 'true');
    await controller.startScenario('paid-active'); const snapshot = active(controller);
    const scoped = scopeAppContext(base, controller, snapshot);
    expect(scoped).toMatchObject({ ready: true, accessReady: true, initializationError: false, qaActive: true, hasAccess: true });
    expect(scoped.dataScope).toBe(`qa:${snapshot.sessionId}`);
    expect(scoped.preferences).toBe(snapshot.preferences); expect(scoped.cycleSettings).toBe(snapshot.cycleSettings);
    expect(scoped.purchases).toBe(snapshot.purchases); expect(scoped.trial).toBe(snapshot.trialService);
    expect(scoped.selectionStore).toBe(snapshot.memorySelectionStore); expect(scoped.feedbackStore).toBe(snapshot.memoryFeedbackStore);
    expect(scoped.now().getTime()).toBe(snapshot.clock.now());
    await scoped.purchases.getOffer(); await scoped.purchases.restore(); await scoped.trial.getState();
    await scoped.selectionStore.writeAll([]); await scoped.feedbackStore.set('2026-11-09', 'synthetic', 'helpful');
    expect(await scoped.feedbackStore.readAll()).toHaveLength(1);
    spies.forEach(spy => expect(spy).not.toHaveBeenCalled());
  });

  it('routes every facade mutation to the private controller and never real callbacks or notification/storage services', async () => {
    const { base, spies } = baseContext(), controller = createInternalQASession(true, 'true');
    await controller.startScenario('trial-not-started');
    const scoped = scopeAppContext(base, controller, controller.getSnapshot());
    await scoped.updatePreferences({ theme: 'dark', language: 'fr', reminderEnabled: true }, true);
    await scoped.setCycleSettings({ lastKnownPeriodStart: '2026-11-03', typicalCycleLength: 28, typicalPeriodLength: 5 });
    await scoped.completeOnboarding(); await scoped.startAppTrial(); await scoped.refreshEntitlement();
    expect(active(controller).preferences).toMatchObject({ theme: 'dark', language: 'fr' });
    expect(active(controller).appTrial.isActive).toBe(true);
    const refresh = vi.spyOn(controller, 'refreshAccess');
    scoped.retryInitialization(); await refresh.mock.results.at(-1)?.value;
    await scoped.rebuildNotifications();
    await scoped.deleteLocalData();
    expect(active(controller)).toMatchObject({ scenarioId: 'fresh', cycleSettings: null, preferences: { onboardingComplete: false } });
    expect(base.preferences).toMatchObject({ theme: 'light', reminderEnabled: true });
    expect(base.cycleSettings?.lastKnownPeriodStart).toBe('2020-01-01');
    spies.forEach(spy => expect(spy).not.toHaveBeenCalled());
  });

  it('ignores stale delete/preferences callbacks after reset/exit and restores the exact base scope', async () => {
    const { base, spies } = baseContext(), controller = createInternalQASession(true, 'true');
    await controller.startScenario('returning');
    const oldFacade = scopeAppContext(base, controller, controller.getSnapshot());
    await controller.startScenario('paid-active');
    const nextFacade = scopeAppContext(base, controller, controller.getSnapshot());
    expect(nextFacade.dataScope).not.toBe(oldFacade.dataScope);
    await oldFacade.deleteLocalData(); await oldFacade.updatePreferences({ theme: 'dark' });
    expect(active(controller)).toMatchObject({ scenarioId: 'paid-active', preferences: { theme: 'light' } });
    controller.stop(); const stopped = controller.getSnapshot();
    await oldFacade.deleteLocalData(); await oldFacade.updatePreferences({ theme: 'dark' });
    await oldFacade.setCycleSettings({ lastKnownPeriodStart: '2026-11-03', typicalCycleLength: 28, typicalPeriodLength: 5 });
    await oldFacade.completeOnboarding(); await oldFacade.refreshEntitlement(); await oldFacade.rebuildNotifications(); oldFacade.retryInitialization();
    await expect(oldFacade.startAppTrial()).rejects.toThrow('QA_SESSION_ENDED');
    expect(controller.getSnapshot()).toBe(stopped);
    expect(scopeAppContext(base, controller, controller.getSnapshot())).toBe(base);
    expect(base.dataScope).toBe('real');
    spies.forEach(spy => expect(spy).not.toHaveBeenCalled());
  });
});
