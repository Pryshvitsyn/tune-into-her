import { invalidateFutureSelections } from '../domain/content/dailyCueService';
import { GUIDANCE_REFRESH_HOUR } from '../domain/content/guidanceDate';
import { validateCycleSettings, type CycleSettings } from '../domain/cycle/cycleEngine';
import { toDateOnly } from '../domain/cycle/dateOnly';
import { isMockBillingEnabled } from '../services/purchases/mockBilling';
import type { EntitlementState } from '../services/purchases/types';
import type { AppTrialState } from '../services/trial/AppTrialService';
import type { Preferences } from '../storage/preferences';

import { millisecondsToNextGuidanceBoundary } from './clock';
import { makeQAScenario, type QAScenarioId } from './scenarios';
import { createQARuntime, type QARuntime } from './services';

export type InternalQASnapshot = { active: false; revision: number } | (QARuntime & {
  active: true; revision: number; sessionId: number; scenarioId: QAScenarioId;
  nowMs: number; accessReady: boolean; preferences: Preferences; cycleSettings: CycleSettings | null;
  entitlement: EntitlementState; appTrial: AppTrialState;
});

export class InternalQASession {
  private snapshot: InternalQASnapshot = Object.freeze({ active: false, revision: 0 });
  private readonly listeners = new Set<() => void>();
  private generation = 0;
  private removePurchaseListener?: () => void;
  constructor(readonly enabled: boolean) {}
  readonly getSnapshot = (): InternalQASnapshot => this.snapshot;
  readonly subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  private publish(next: InternalQASnapshot): void {
    this.snapshot = Object.freeze({ ...next, revision: this.snapshot.revision + 1 });
    this.listeners.forEach(listener => listener());
  }
  private current(sessionId: number): Extract<InternalQASnapshot, { active: true }> | undefined {
    return this.snapshot.active && this.snapshot.sessionId === sessionId ? this.snapshot : undefined;
  }
  async startScenario(id: QAScenarioId, initialPreferences?: Pick<Preferences, 'language' | 'theme'>): Promise<boolean> {
    if (!this.enabled) return false;
    const scenario = makeQAScenario(id), runtime = createQARuntime(scenario), sessionId = ++this.generation;
    this.removePurchaseListener?.();
    const previous = this.snapshot.active ? this.snapshot.preferences : undefined;
    const preferences: Preferences = { theme: previous?.theme ?? initialPreferences?.theme ?? 'light', language: previous?.language ?? initialPreferences?.language ?? 'en', onboardingComplete: scenario.onboardingComplete, reminderEnabled: false, reminderHour: GUIDANCE_REFRESH_HOUR, reminderMinute: 0 };
    this.publish({ ...runtime, active: true, sessionId, scenarioId: id, revision: 0, nowMs: runtime.clock.now(), accessReady: false, preferences: Object.freeze(preferences), cycleSettings: scenario.cycleSettings ? Object.freeze({ ...scenario.cycleSettings }) : null, entitlement: { status: 'loading', isActive: false, isMock: true }, appTrial: { status: 'unavailable', isActive: false, verification: 'unavailable' } });
    this.removePurchaseListener = runtime.purchases.addEntitlementListener(entitlement => {
      const current = this.current(sessionId); if (current) this.publish({ ...current, entitlement });
    });
    await this.refreshAccess();
    return !!this.current(sessionId);
  }
  stop(): void { this.removePurchaseListener?.(); this.removePurchaseListener = undefined; ++this.generation; this.publish({ active: false, revision: 0 }); }
  async refreshAccess(): Promise<void> {
    const active = this.snapshot; if (!active.active) return;
    const [entitlement, appTrial] = await Promise.all([active.purchases.getEntitlement(), active.trialService.getState()]);
    const current = this.current(active.sessionId); if (current) this.publish({ ...current, entitlement, appTrial, accessReady: true, nowMs: current.clock.now() });
  }
  async advanceBy(milliseconds: number): Promise<void> {
    const active = this.snapshot; if (!active.active) return;
    active.clock.advanceBy(milliseconds); this.publish({ ...active, nowMs: active.clock.now() }); await this.refreshAccess();
  }
  async setStoreAvailable(available: boolean): Promise<void> {
    const active = this.snapshot; if (!active.active) return;
    await active.setStoreAvailable(available); await this.refreshAccess();
  }
  async advanceToNextGuidanceBoundary(): Promise<void> {
    const active = this.snapshot; if (active.active) await this.advanceBy(millisecondsToNextGuidanceBoundary(active.clock.now()));
  }
  async setCycleSettings(settings: CycleSettings | null): Promise<void> {
    const active = this.snapshot; if (!active.active) return;
    if (settings && validateCycleSettings(settings, toDateOnly(new Date(active.clock.now()))).length) throw new Error('QA_INVALID_CYCLE');
    await invalidateFutureSelections(active.memorySelectionStore, toDateOnly(new Date(active.clock.now())));
    const current = this.current(active.sessionId); if (current) this.publish({ ...current, cycleSettings: settings ? Object.freeze({ ...settings }) : null });
  }
  async updatePreferences(update: Partial<Preferences>): Promise<void> {
    if (this.snapshot.active) this.publish({ ...this.snapshot, preferences: Object.freeze({ ...this.snapshot.preferences, ...update }) });
  }
  async completeOnboarding(): Promise<void> {
    if (!this.snapshot.active || !this.snapshot.cycleSettings) throw new Error('ONBOARDING_REQUIRED');
    await this.updatePreferences({ onboardingComplete: true });
  }
  async startAppTrial(): Promise<AppTrialState> {
    const active = this.snapshot;
    if (!active.active || !active.preferences.onboardingComplete || !active.cycleSettings) throw new Error('ONBOARDING_REQUIRED');
    const appTrial = await active.trialService.start();
    const current = this.current(active.sessionId); if (current) this.publish({ ...current, appTrial });
    return appTrial;
  }
}
export function createInternalQASession(isDevelopment: boolean, requested: string | undefined): InternalQASession {
  return new InternalQASession(isMockBillingEnabled(isDevelopment, requested));
}
// Build descriptor only; the private build wrapper overrides this export. It grants no access.
export const standaloneQAEnabled = false;
export const internalQAEnabled = isMockBillingEnabled(typeof __DEV__ !== 'undefined' && __DEV__, process.env.EXPO_PUBLIC_USE_MOCK_BILLING);
export const internalQASession = new InternalQASession(internalQAEnabled);
