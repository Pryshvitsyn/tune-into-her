import { RevenueCatPurchaseService } from './RevenueCatPurchaseService';
import { isMockBillingEnabled } from './mockBilling';
import type { PurchaseService } from './types';

const useMockBilling = isMockBillingEnabled(
  __DEV__,
  process.env.EXPO_PUBLIC_USE_MOCK_BILLING,
);

// Only an explicit, isolated QA session selects MockPurchaseService. Enabling the
// panel must never grant mock access against real user history or billing caches.
export const purchaseService: PurchaseService = new RevenueCatPurchaseService();

export { useMockBilling };
export { isMockBillingEnabled } from './mockBilling';
export type { EntitlementState, StoreOffer, PurchaseResult, PlanChangeResult, RedemptionResult, PurchaseSource } from './types';
