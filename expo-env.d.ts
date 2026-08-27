/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?: string;
    EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?: string;
    EXPO_PUBLIC_USE_MOCK_BILLING?: string;
  }
}
