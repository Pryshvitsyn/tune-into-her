import type { ExpoConfig } from 'expo/config';

import brand from './src/config/brand.json';

const config: ExpoConfig = {
  name: brand.displayName,
  slug: 'tune-into-her',
  scheme: 'tuneintoher',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.eliogenesis.tuneintoher',
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: 'com.pryshvitsyn.tuneintoher',
  },
  plugins: [
    'expo-router',
    'expo-localization',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        defaultChannel: 'daily-cue',
        color: '#344F70',
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
