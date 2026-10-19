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
import { purchaseService, type EntitlementState } from '../services/purchases';
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

  const refreshEntitlement = useCallback(async () => setEntitlement(await purchaseService.getEntitlement()), []);

  useEffect(() => {
    void Promise.all([loadPreferences(), cycleProvider.get(), purchaseService.getEntitlement()]).then(([savedPreferences, savedCycle, access]) => {
      const nextPreferences = savedPreferences ?? { ...defaultPreferences, language: initialLanguage };
      setPreferencesState(nextPreferences);
      setCycleSettingsState(savedCycle);
      setEntitlement(access);
      void i18n.changeLanguage(nextPreferences.language);
      setReady(true);
    });
    return purchaseService.addEntitlementListener(setEntitlement);
  }, []);

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
    await notificationScheduler.cancelAll();
    await SecureStore.deleteItemAsync(storageKeys.cycleSettings);
    await AsyncStorage.multiRemove([storageKeys.preferences, storageKeys.selections, storageKeys.entitlement]);
    setCycleSettingsState(null);
    setPreferencesState({ ...defaultPreferences, language: preferences.language });
  }, [preferences.language]);

  const value = useMemo(() => ({ deleteLocalData, ready, preferences, cycleSettings, entitlement, refreshEntitlement, setCycleSettings, updatePreferences, completeOnboarding, rebuildNotifications }), [deleteLocalData, ready, preferences, cycleSettings, entitlement, refreshEntitlement, setCycleSettings, updatePreferences, completeOnboarding, rebuildNotifications]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}

