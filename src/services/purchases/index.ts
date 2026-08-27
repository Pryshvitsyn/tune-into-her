import { MockPurchaseService } from './MockPurchaseService';
import { RevenueCatPurchaseService } from './RevenueCatPurchaseService';
import type { PurchaseService } from './types';

const useMockBilling = __DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_BILLING === 'true';

export const purchaseService: PurchaseService = useMockBilling
  ? new MockPurchaseService()
  : new RevenueCatPurchaseService();

export { useMockBilling };
export type { EntitlementState, StoreOffer } from './types';
