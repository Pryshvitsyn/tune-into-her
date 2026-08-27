import * as Localization from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../config/constants';

import { resources } from './resources';

const deviceCode = Localization.getLocales()[0]?.languageCode;
const initialLanguage: SupportedLanguage = SUPPORTED_LANGUAGES.includes(deviceCode as SupportedLanguage)
  ? (deviceCode as SupportedLanguage)
  : 'en';

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export { i18n, initialLanguage };
