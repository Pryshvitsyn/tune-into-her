import type { ExpoConfig } from 'expo/config';

import brand from './src/config/brand.json';

// Copy the actual unique scheme from RevenueCat Web Billing; never invent it.
const redemptionScheme = process.env.EXPO_PUBLIC_REVENUECAT_REDEMPTION_SCHEME;
if (redemptionScheme && !/^rc-[a-z0-9-]+$/i.test(redemptionScheme)) throw new Error('INVALID_REDEMPTION_SCHEME');

const config: ExpoConfig = {
  name: brand.displayName,
  slug: 'tune-into-her',
  scheme: redemptionScheme ? ['tuneintoher', redemptionScheme] : 'tuneintoher',
  version: '1.0.0',
  runtimeVersion: { policy: 'fingerprint' },
  updates: {
    url: 'https://u.expo.dev/dc8938e7-7163-413a-9003-479d0afc8a17',
    checkAutomatically: 'ON_LOAD',
  },
  icon: './assets/icon.png',
  owner: 'eliogenesis',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
    bundleIdentifier: 'com.eliogenesis.tuneintoher',
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
    acceleratedDemo: process.env.EAS_BUILD_PROFILE !== 'production' && process.env.EXPO_PUBLIC_ACCELERATED_DEMO === 'true',
    brand,
    eas: {
      projectId: 'dc8938e7-7163-413a-9003-479d0afc8a17',
    },
  },
};

export default config;

