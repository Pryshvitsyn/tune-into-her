export type EntitlementStatus = 'loading' | 'active_trial' | 'active_paid' | 'active_ending' | 'inactive' | 'expired' | 'billing_issue' | 'error';
export type PurchaseSource = 'apple' | 'google' | 'web' | 'unknown';

export interface EntitlementState {
  status: EntitlementStatus;
  isActive: boolean;
  expirationDate?: string;
  isMock: boolean;
  source?: PurchaseSource;
  verification?: 'verified' | 'cached' | 'unavailable';
  checkedAt?: string;
  validForMs?: number;
  managementURL?: string;
  productIdentifier?: string;
  productPlanIdentifier?: string;
  isSandbox?: boolean;
  error?: string;
}

export interface StoreOffer {
  plan: 'monthly' | 'annual';
  packageIdentifier: string;
  productIdentifier: string;
  localizedPrice: string;
  price: number;
  currencyCode: string;
  billingPeriod: 'P1M' | 'P1Y';
  basePlanIdentifier?: string;
  rawPackage: unknown;
  rawSubscriptionOption?: unknown;
}

export type PurchaseResult = 'purchased' | 'cancelled' | 'pending' | 'already_active';
export type PlanChangeResult = 'change_requested' | 'cancelled' | 'pending' | 'already_active';
export type RedemptionResult = 'redeemed' | 'invalid' | 'expired' | 'already_redeemed' | 'error';

export interface PurchaseService {
  configure(): Promise<void>;
  getEntitlement(): Promise<EntitlementState>;
  getCachedEntitlement(): Promise<EntitlementState>;
  getOffer(): Promise<StoreOffer[]>;
  purchase(offer: StoreOffer): Promise<PurchaseResult>;
  changePlan(offer: StoreOffer): Promise<PlanChangeResult>;
  restore(): Promise<EntitlementState>;
  manageSubscription(): Promise<void>;
  redeemWebPurchase(url: string): Promise<RedemptionResult>;
  addEntitlementListener(listener: (state: EntitlementState) => void): () => void;
}
