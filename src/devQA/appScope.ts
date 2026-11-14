import type { AppContextValue } from '../context/AppContext';

import type { InternalQASession, InternalQASnapshot } from './session';

/** Presentation facade only; no base callback runs while an explicit QA session owns it. */
export function scopeAppContext(base: AppContextValue, controller: InternalQASession, snapshot: InternalQASnapshot): AppContextValue {
  if (!controller.enabled || !snapshot.active) return base;
  const isCurrent = () => {
    const current = controller.getSnapshot();
    return current.active && current.sessionId === snapshot.sessionId;
  };
  return {
    ...base,
    ready: true,
    accessReady: snapshot.accessReady,
    initializationError: false,
    qaActive: true,
    dataScope: `qa:${snapshot.sessionId}`,
    preferences: snapshot.preferences,
    cycleSettings: snapshot.cycleSettings,
    entitlement: snapshot.entitlement,
    appTrial: snapshot.appTrial,
    hasAccess: snapshot.entitlement.isActive || snapshot.appTrial.isActive,
    purchases: snapshot.purchases,
    trial: snapshot.trialService,
    selectionStore: snapshot.memorySelectionStore,
    feedbackStore: snapshot.memoryFeedbackStore,
    now: () => new Date(snapshot.clock.now()),
    async setCycleSettings(settings) { if (isCurrent()) await controller.setCycleSettings(settings); },
    async updatePreferences(update) { if (isCurrent()) await controller.updatePreferences(update); },
    async completeOnboarding() { if (isCurrent()) await controller.completeOnboarding(); },
    async startAppTrial() {
      if (!isCurrent()) throw new Error('QA_SESSION_ENDED');
      return controller.startAppTrial();
    },
    async refreshEntitlement() { if (isCurrent()) await controller.refreshAccess(); },
    retryInitialization() { if (isCurrent()) void controller.refreshAccess(); },
    async rebuildNotifications() { /* Synthetic preference changes never schedule real notifications. */ },
    async deleteLocalData() { if (isCurrent()) await controller.startScenario('fresh'); },
  };
}
