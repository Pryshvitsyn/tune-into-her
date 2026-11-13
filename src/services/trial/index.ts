import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { AppTrialService } from './AppTrialService';

export const appTrialService = new AppTrialService({
  endpoint: process.env.EXPO_PUBLIC_TRIAL_API_URL,
  environment: process.env.EXPO_PUBLIC_BILLING_ENVIRONMENT,
  storage: { getItem: SecureStore.getItemAsync, setItem: SecureStore.setItemAsync },
  randomBytes: Crypto.getRandomBytesAsync,
  allowLocalhost: __DEV__,
});
export { AppTrialService, APP_TRIAL_MS, APP_TRIAL_OFFLINE_MS } from './AppTrialService';
export type { AppTrialState, BillingEnvironment } from './AppTrialService';
