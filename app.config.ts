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
    bundleIdentifier: 'com.placeholder.partnercyclecontext',
  },
  android: {
    package: 'com.placeholder.partnercyclecontext',
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
  },
};

export default config;
