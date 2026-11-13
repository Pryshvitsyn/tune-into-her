import { MockPurchaseService } from './MockPurchaseService';
import { RevenueCatPurchaseService } from './RevenueCatPurchaseService';
import { isMockBillingEnabled } from './mockBilling';
import type { PurchaseService } from './types';

const useMockBilling = isMockBillingEnabled(
  __DEV__,
  process.env.EXPO_PUBLIC_USE_MOCK_BILLING,
);

export const purchaseService: PurchaseService = useMockBilling
  ? new MockPurchaseService()
  : new RevenueCatPurchaseService();

export { useMockBilling };
export { isMockBillingEnabled } from './mockBilling';
export type { EntitlementState, StoreOffer, PurchaseResult, PlanChangeResult, RedemptionResult, PurchaseSource } from './types';
