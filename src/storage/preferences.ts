import AsyncStorage from '@react-native-async-storage/async-storage';

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../config/constants';

import { storageKeys } from './keys';

export interface Preferences {
  onboardingComplete: boolean;
  language: SupportedLanguage;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
}

export const defaultPreferences: Preferences = {
  onboardingComplete: false,
  language: 'en',
  reminderEnabled: false,
  reminderHour: 8,
  reminderMinute: 30,
};

export async function loadPreferences(): Promise<Preferences | null> {
  const value = await AsyncStorage.getItem(storageKeys.preferences);
  if (!value) return null;
  const saved = JSON.parse(value) as Partial<Preferences>;
  return { ...defaultPreferences, ...saved, language: SUPPORTED_LANGUAGES.includes(saved.language as SupportedLanguage) ? saved.language! : 'en' }; 
}

export async function savePreferences(preferences: Preferences): Promise<void> {
  await AsyncStorage.setItem(storageKeys.preferences, JSON.stringify(preferences));
}

