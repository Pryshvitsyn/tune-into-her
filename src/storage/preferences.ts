import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "../config/constants";
import { GUIDANCE_REFRESH_HOUR } from "../domain/content/guidanceDate";

import { storageKeys } from "./keys";

export interface Preferences {
  theme: "light" | "dark";
  onboardingComplete: boolean;
  language: SupportedLanguage;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
}

export const defaultPreferences: Preferences = {
  theme: "light",
  onboardingComplete: false,
  language: "en",
  reminderEnabled: false,
  reminderHour: GUIDANCE_REFRESH_HOUR,
  reminderMinute: 0,
};

export async function loadPreferences(): Promise<Preferences | null> {
  const value = await AsyncStorage.getItem(storageKeys.preferences);
  if (!value) return null;
  let saved: Partial<Preferences>;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return null;
    saved = parsed as Partial<Preferences>;
  } catch {
    return null;
  }
  return {
    ...defaultPreferences,
    ...saved,
    theme: saved.theme === "dark" ? "dark" : "light",
    language: SUPPORTED_LANGUAGES.includes(saved.language as SupportedLanguage)
      ? saved.language!
      : "en",
  };
}

export async function savePreferences(preferences: Preferences): Promise<void> {
  await AsyncStorage.setItem(
    storageKeys.preferences,
    JSON.stringify(preferences),
  );
}
