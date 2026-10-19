import type { ExpoConfig } from 'expo/config';

import brand from './src/config/brand.json';

const config: ExpoConfig = {
  name: brand.displayName,
  slug: 'tune-into-her',
  scheme: 'tuneintoher',
  version: '1.0.0',
  icon: './assets/icon.png',
  owner: 'eliogenesis',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: false,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
    bundleIdentifier: 'com.pryshvitsyn.tuneintoher',
  },
  android: {
    package: 'com.pryshvitsyn.tuneintoher',
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#F7F5F0' },
    allowBackup: false,
  },
  plugins: [
    'expo-router',
    'expo-localization',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        defaultChannel: 'daily-cue',
        color: '#52675B',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    brand,
    eas: {
      projectId: 'dc8938e7-7163-413a-9003-479d0afc8a17',
    },
  },
};

export default config;

