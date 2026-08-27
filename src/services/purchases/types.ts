export type EntitlementStatus = 'loading' | 'active_trial' | 'active_paid' | 'active_ending' | 'inactive' | 'expired' | 'billing_issue' | 'error';

export interface EntitlementState {
  status: EntitlementStatus;
  isActive: boolean;
  expirationDate?: string;
  isMock: boolean;
  error?: string;
}

export interface StoreOffer {
  packageIdentifier: string;
  productIdentifier: string;
  localizedPrice: string;
  billingPeriod: string;
  trialDuration?: string;
  trialEligible: boolean;
  rawPackage: unknown;
}

export type PurchaseResult = 'purchased' | 'cancelled';

export interface PurchaseService {
  configure(): Promise<void>;
  getEntitlement(): Promise<EntitlementState>;
  getOffer(): Promise<StoreOffer | null>;
  purchase(offer: StoreOffer): Promise<PurchaseResult>;
  restore(): Promise<EntitlementState>;
  manageSubscription(): Promise<void>;
  addEntitlementListener(listener: (state: EntitlementState) => void): () => void;
}
