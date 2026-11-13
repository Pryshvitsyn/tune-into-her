import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import brand from '../config/brand.json';
import type { SupportedLanguage } from '../config/constants';
import { invalidateFutureSelections } from '../domain/content/dailyCueService';
import type { CycleSettings } from '../domain/cycle/cycleEngine';
import { toDateOnly } from '../domain/cycle/dateOnly';
import { i18n, initialLanguage } from '../i18n';
import { ExpoNotificationBackend } from '../services/notifications/ExpoNotificationBackend';
import { NotificationScheduler } from '../services/notifications/NotificationScheduler';
import { stopDemoSession } from '../services/notifications/acceleratedDemo';
import { purchaseService, type EntitlementState } from '../services/purchases';
import { appTrialService, type AppTrialState } from '../services/trial';
import { AsyncSelectionStore } from '../storage/AsyncSelectionStore';
import { LocalManualCycleProvider } from '../storage/LocalManualCycleProvider';
import { storageKeys } from '../storage/keys';
import { defaultPreferences, loadPreferences, savePreferences, type Preferences } from '../storage/preferences';

const cycleProvider = new LocalManualCycleProvider();
const selectionStore = new AsyncSelectionStore();
export const notificationScheduler = new NotificationScheduler(new ExpoNotificationBackend(), selectionStore);

interface AppContextValue {
  ready: boolean;
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
  const [ready, setReady] = useState(false);
  const [preferences, setPreferencesState] = useState<Preferences>({ ...defaultPreferences, language: initialLanguage });
  const [cycleSettings, setCycleSettingsState] = useState<CycleSettings | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementState>({ status: 'loading', isActive: false, isMock: false });

  const [appTrial, setAppTrial] = useState<AppTrialState>({ status: 'unavailable', isActive: false, verification: 'unavailable' });
  const applyEntitlement = useCallback((next: EntitlementState) => {
    setEntitlement(previous => previous.checkedAt && next.checkedAt && Date.parse(previous.checkedAt) > Date.parse(next.checkedAt) ? previous : next);
  }, []);
  const refreshEntitlement = useCallback(async () => {
    await Promise.all([
      purchaseService.getEntitlement().then(applyEntitlement),
      appTrialService.getState().then(setAppTrial),
    ]);
  }, [applyEntitlement]);
  const startAppTrial = useCallback(async () => {
    if (!preferences.onboardingComplete || !cycleSettings) throw new Error('ONBOARDING_REQUIRED');
    const trial = await appTrialService.start();
    setAppTrial(trial);
    return trial;
  }, [preferences.onboardingComplete, cycleSettings]);

  useEffect(() => {
    let disposed = false;
    void Promise.all([loadPreferences(), cycleProvider.get()]).then(([savedPreferences, savedCycle]) => {
      if (disposed) return;
      const nextPreferences = savedPreferences ?? { ...defaultPreferences, language: initialLanguage };
      setPreferencesState(nextPreferences);
      setCycleSettingsState(savedCycle);
      void i18n.changeLanguage(nextPreferences.language);
      setReady(true);
    });
    // A slow trial request must never overwrite a newer SDK purchase/refund event.
    void purchaseService.getEntitlement().then(state => { if (!disposed) applyEntitlement(state); });
    void appTrialService.getState().then(state => { if (!disposed) setAppTrial(state); });
    const removeListener = purchaseService.addEntitlementListener(applyEntitlement);
    return () => { disposed = true; removeListener(); };
  }, [applyEntitlement]);

  useEffect(() => {
    if (!appTrial.isActive || !appTrial.validForMs) return;
    const timer = setTimeout(() => { void appTrialService.getCachedState().then(state => { setAppTrial(state); void appTrialService.getState().then(setAppTrial); }); }, Math.min(appTrial.validForMs, 2_147_483_647));
    return () => clearTimeout(timer);
  }, [appTrial]);

  useEffect(() => {
    if (!entitlement.isActive || !entitlement.validForMs) return;
    const timer = setTimeout(() => { void purchaseService.getCachedEntitlement().then(state => { applyEntitlement(state); void purchaseService.getEntitlement().then(applyEntitlement); }); }, Math.min(entitlement.validForMs, 2_147_483_647));
    return () => clearTimeout(timer);
  }, [entitlement, applyEntitlement]);

  useEffect(() => {
    // Also detect clock changes while the app remains open, without network polling.
    const timer = setInterval(() => {
      void purchaseService.getCachedEntitlement().then(applyEntitlement);
      void appTrialService.getCachedState().then(setAppTrial);
    }, 30_000);
    return () => clearInterval(timer);
  }, [applyEntitlement]);

  const rebuildNotifications = useCallback(async () => {
    if (!cycleSettings) return;
    await notificationScheduler.rebuild({
      settings: cycleSettings,
      language: preferences.language,
      reminder: { enabled: preferences.reminderEnabled, hour: preferences.reminderHour, minute: preferences.reminderMinute },
      brandName: brand.displayName,
    });
  }, [cycleSettings, preferences]);

  useEffect(() => {
    const onStateChange = (state: AppStateStatus) => {
      if (state === 'active' && ready) {
        void refreshEntitlement();
        void rebuildNotifications();
      }
    };
    const subscription = AppState.addEventListener('change', onStateChange);
    return () => subscription.remove();
  }, [ready, rebuildNotifications, refreshEntitlement]);

  const setCycleSettings = useCallback(async (settings: CycleSettings) => {
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
    const next = { ...preferences, ...update };
    await savePreferences(next);
    setPreferencesState(next);
    if (update.language) await i18n.changeLanguage(update.language as SupportedLanguage);
    if (rebuild && cycleSettings) {
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
    await stopDemoSession();
    await notificationScheduler.cancelAll();
    await SecureStore.deleteItemAsync(storageKeys.cycleSettings);
    await AsyncStorage.multiRemove([storageKeys.preferences, storageKeys.selections, storageKeys.guidanceFeedback, storageKeys.entitlement]);
    setCycleSettingsState(null);
    setPreferencesState({ ...defaultPreferences, language: preferences.language });
  }, [preferences.language]);

  const hasAccess = entitlement.isActive || appTrial.isActive;
  const value = useMemo(() => ({ deleteLocalData, ready, preferences, cycleSettings, entitlement, appTrial, hasAccess, startAppTrial, refreshEntitlement, setCycleSettings, updatePreferences, completeOnboarding, rebuildNotifications }), [deleteLocalData, ready, preferences, cycleSettings, entitlement, appTrial, hasAccess, startAppTrial, refreshEntitlement, setCycleSettings, updatePreferences, completeOnboarding, rebuildNotifications]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}

