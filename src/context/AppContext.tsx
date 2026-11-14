import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import brand from '../config/brand.json';
import type { SupportedLanguage } from '../config/constants';
import { scopeAppContext } from '../devQA/appScope';
import { internalQAEnabled, internalQASession } from '../devQA/session';
import { useInternalQASession } from '../devQA/useInternalQA';
import { invalidateFutureSelections } from '../domain/content/dailyCueService';
import type { SelectionStore } from '../domain/content/types';
import { validateCycleSettings, type CycleSettings } from '../domain/cycle/cycleEngine';
import { toDateOnly } from '../domain/cycle/dateOnly';
import { i18n, initialLanguage } from '../i18n';
import { ExpoNotificationBackend } from '../services/notifications/ExpoNotificationBackend';
import { NotificationScheduler } from '../services/notifications/NotificationScheduler';
import { stopDemoSession } from '../services/notifications/acceleratedDemo';
import { purchaseService, type EntitlementState } from '../services/purchases';
import type { PurchaseService } from '../services/purchases/types';
import { appTrialService, type AppTrialState, type AppTrialService } from '../services/trial';
import { AsyncFeedbackStore } from '../storage/AsyncFeedbackStore';
import { AsyncSelectionStore } from '../storage/AsyncSelectionStore';
import { LocalManualCycleProvider } from '../storage/LocalManualCycleProvider';
import { storageKeys } from '../storage/keys';
import { defaultPreferences, loadPreferences, savePreferences, type Preferences } from '../storage/preferences';

const cycleProvider = new LocalManualCycleProvider();
const selectionStore = new AsyncSelectionStore();
const feedbackStore = new AsyncFeedbackStore();
const now = () => new Date();
const activeQA = () => internalQAEnabled && internalQASession.getSnapshot().active;
export const notificationScheduler = new NotificationScheduler(new ExpoNotificationBackend(), selectionStore);

export interface AppContextValue {
  qaActive: boolean;
  dataScope: string;
  now(): Date;
  purchases: PurchaseService;
  trial: AppTrialService;
  selectionStore: SelectionStore;
  feedbackStore: Pick<AsyncFeedbackStore, 'readAll' | 'read' | 'set'>;
  ready: boolean;
  accessReady: boolean;
  initializationError: boolean;
  initializationAttempt: number;
  retryInitialization(): void;
  deleteLocalData(): Promise<void>;
  preferences: Preferences;
  cycleSettings: CycleSettings | null;
  entitlement: EntitlementState;
  appTrial: AppTrialState;
  hasAccess: boolean;
  startAppTrial(): Promise<AppTrialState>;
  refreshEntitlement(): Promise<void>;
  setCycleSettings(settings: CycleSettings): Promise<void>;
  updatePreferences(update: Partial<Preferences>, rebuildNotifications?: boolean): Promise<void>;
  completeOnboarding(): Promise<void>;
  rebuildNotifications(): Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const qaSnapshot = useInternalQASession();
  const qaActive = internalQAEnabled && qaSnapshot.active;
  const qaEpoch = internalQAEnabled && !qaActive ? qaSnapshot.revision : 0;
  const [verifiedAccessEpoch, setVerifiedAccessEpoch] = useState(-1);
  const [ready, setReady] = useState(false);
  const [accessReady, setAccessReady] = useState(false);
  const [initializationError, setInitializationError] = useState(false);
  const [initializationAttempt, setInitializationAttempt] = useState(0);
  const retryInitialization = useCallback(() => {
    setReady(false); setAccessReady(false); setInitializationError(false);
    setInitializationAttempt(value => value + 1);
  }, []);
  const [preferences, setPreferencesState] = useState<Preferences>({ ...defaultPreferences, language: initialLanguage });
  const [cycleSettings, setCycleSettingsState] = useState<CycleSettings | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementState>({ status: 'loading', isActive: false, isMock: false });

  const [appTrial, setAppTrial] = useState<AppTrialState>({ status: 'unavailable', isActive: false, verification: 'unavailable' });
  const applyEntitlement = useCallback((next: EntitlementState) => {
    setEntitlement(previous => previous.checkedAt && next.checkedAt && Date.parse(previous.checkedAt) > Date.parse(next.checkedAt) ? previous : next);
  }, []);
  const refreshEntitlement = useCallback(async () => {
    if (activeQA()) return internalQASession.refreshAccess();
    await Promise.all([
      purchaseService.getEntitlement().then(applyEntitlement),
      appTrialService.getState().then(setAppTrial),
    ]);
  }, [applyEntitlement]);
  const startAppTrial = useCallback(async () => {
    if (activeQA()) return internalQASession.startAppTrial();
    if (!preferences.onboardingComplete || !cycleSettings) throw new Error('ONBOARDING_REQUIRED');
    const trial = await appTrialService.start();
    setAppTrial(trial);
    return trial;
  }, [preferences.onboardingComplete, cycleSettings]);

  useEffect(() => {
    if (qaActive) return;
    let disposed = false;
    void Promise.all([loadPreferences(), cycleProvider.get()]).then(async ([savedPreferences, savedCycle]) => {
      if (disposed) return;
      const nextPreferences = savedPreferences ?? { ...defaultPreferences, language: initialLanguage };
      if (!activeQA()) await i18n.changeLanguage(nextPreferences.language);
      if (disposed) return;
      setPreferencesState(nextPreferences);
      setCycleSettingsState(savedCycle);
      setReady(true);
    }).catch(() => {
      if (!disposed) setInitializationError(true);
    });
    // Services retain their existing access/cache policy. Readiness only coordinates presentation.
    const paid = purchaseService.getEntitlement().then(state => {
      if (!disposed) applyEntitlement(state);
    }).catch(() => {
      if (!disposed) applyEntitlement({ status: 'error', isActive: false, isMock: false, verification: 'unavailable' });
    });
    const trial = appTrialService.getState().then(state => {
      if (!disposed) setAppTrial(state);
    }).catch(() => {
      if (!disposed) setAppTrial({ status: 'unavailable', isActive: false, verification: 'unavailable' });
    });
    void Promise.all([paid, trial]).then(() => { if (!disposed) { setAccessReady(true); setVerifiedAccessEpoch(qaEpoch); } });
    const removeListener = purchaseService.addEntitlementListener(applyEntitlement);
    return () => { disposed = true; removeListener(); };
  }, [applyEntitlement, initializationAttempt, qaActive, qaEpoch]);

  useEffect(() => {
    if (qaActive || !appTrial.isActive || !appTrial.validForMs) return;
    const timer = setTimeout(() => { if (activeQA()) return; void appTrialService.getCachedState().then(state => { setAppTrial(state); if (!activeQA()) void appTrialService.getState().then(setAppTrial); }); }, Math.min(appTrial.validForMs, 2_147_483_647));
    return () => clearTimeout(timer);
  }, [appTrial, qaActive]);

  useEffect(() => {
    if (qaActive || !entitlement.isActive || !entitlement.validForMs) return;
    const timer = setTimeout(() => { if (activeQA()) return; void purchaseService.getCachedEntitlement().then(state => { applyEntitlement(state); if (!activeQA()) void purchaseService.getEntitlement().then(applyEntitlement); }); }, Math.min(entitlement.validForMs, 2_147_483_647));
    return () => clearTimeout(timer);
  }, [entitlement, applyEntitlement, qaActive]);

  useEffect(() => {
    // QA has its own clock/cache; never poll real services using simulated state.
    if (qaActive) return;
    const timer = setInterval(() => {
      if (activeQA()) return;
      void purchaseService.getCachedEntitlement().then(applyEntitlement);
      void appTrialService.getCachedState().then(setAppTrial);
    }, 30_000);
    return () => clearInterval(timer);
  }, [applyEntitlement, qaActive]);

  const rebuildNotifications = useCallback(async () => {
    if (activeQA() || !cycleSettings) return;
    await notificationScheduler.rebuild({
      settings: cycleSettings,
      language: preferences.language,
      reminder: { enabled: preferences.reminderEnabled, hour: preferences.reminderHour, minute: preferences.reminderMinute },
      brandName: brand.displayName,
    });
  }, [cycleSettings, preferences]);

  useEffect(() => {
    const onStateChange = (state: AppStateStatus) => {
      if (state === 'active' && ready && !activeQA()) {
        void refreshEntitlement();
        void rebuildNotifications();
      }
    };
    const subscription = AppState.addEventListener('change', onStateChange);
    return () => subscription.remove();
  }, [ready, rebuildNotifications, refreshEntitlement, qaActive]);

  const setCycleSettings = useCallback(async (settings: CycleSettings) => {
    if (activeQA()) return internalQASession.setCycleSettings(settings);
    if (validateCycleSettings(settings, toDateOnly(now())).length) throw new Error('INVALID_CYCLE_SETTINGS');
    await cycleProvider.save(settings);
    await invalidateFutureSelections(selectionStore, toDateOnly(new Date()));
    setCycleSettingsState(settings);
    await notificationScheduler.rebuild({
      settings,
      language: preferences.language,
      reminder: { enabled: preferences.reminderEnabled, hour: preferences.reminderHour, minute: preferences.reminderMinute },
      brandName: brand.displayName,
    });
  }, [preferences]);

  const updatePreferences = useCallback(async (update: Partial<Preferences>, rebuild = false) => {
    if (activeQA()) return internalQASession.updatePreferences(update);
    const next = { ...preferences, ...update };
    await savePreferences(next);
    setPreferencesState(next);
    if (update.language && !activeQA()) await i18n.changeLanguage(update.language as SupportedLanguage);
    if (!activeQA() && rebuild && cycleSettings) {
      await notificationScheduler.rebuild({
        settings: cycleSettings,
        language: next.language,
        reminder: { enabled: next.reminderEnabled, hour: next.reminderHour, minute: next.reminderMinute },
        brandName: brand.displayName,
      });
    }
  }, [cycleSettings, preferences]);

  const completeOnboarding = useCallback(() => updatePreferences({ onboardingComplete: true }, true), [updatePreferences]);

  const deleteLocalData = useCallback(async () => {
    if (activeQA()) { await internalQASession.startScenario('fresh'); return; }
    await stopDemoSession();
    await notificationScheduler.cancelAll();
    await SecureStore.deleteItemAsync(storageKeys.cycleSettings);
    await AsyncStorage.multiRemove([storageKeys.preferences, storageKeys.selections, storageKeys.guidanceFeedback, storageKeys.entitlement]);
    setCycleSettingsState(null);
    setPreferencesState({ ...defaultPreferences, language: preferences.language });
  }, [preferences.language]);

  // On QA exit, deny stale access until the real services have checked their clocks.
  const realAccessReady = accessReady && (!internalQAEnabled || verifiedAccessEpoch === qaEpoch);
  const hasAccess = realAccessReady && (entitlement.isActive || appTrial.isActive);
  const value = useMemo<AppContextValue>(() => ({ qaActive: false, dataScope: 'real', now, purchases: purchaseService, trial: appTrialService, selectionStore, feedbackStore, deleteLocalData, ready, accessReady: realAccessReady, initializationError, initializationAttempt, retryInitialization, preferences, cycleSettings, entitlement, appTrial, hasAccess, startAppTrial, refreshEntitlement, setCycleSettings, updatePreferences, completeOnboarding, rebuildNotifications }), [deleteLocalData, ready, realAccessReady, initializationError, initializationAttempt, retryInitialization, preferences, cycleSettings, entitlement, appTrial, hasAccess, startAppTrial, refreshEntitlement, setCycleSettings, updatePreferences, completeOnboarding, rebuildNotifications]);
  const effective = useMemo(() => scopeAppContext(value, internalQASession, qaSnapshot), [value, qaSnapshot]);
  useEffect(() => { void i18n.changeLanguage(effective.preferences.language); }, [effective.preferences.language]);
  return <AppContext.Provider value={effective}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}

