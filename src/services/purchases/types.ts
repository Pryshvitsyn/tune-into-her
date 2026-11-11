export type EntitlementStatus = "loading" | "active" | "inactive" | "expired" | "error";

export interface EntitlementState {
  status: EntitlementStatus;
  isActive: boolean;
  expirationDate?: string;
  willRenew?: boolean;
  isTrial?: boolean;
  isMock: boolean;
  error?: string;
}

export interface StoreOffer {
  packageIdentifier: string;
  productIdentifier: string;
  localizedPrice: string;
  billingPeriod: "P1Y";
  isAutoRenewing: true;
  trialDuration?: "P14D";
  trialEligible: boolean;
  rawPackage: unknown;
}

export type PurchaseResult = "purchased" | "cancelled";

export interface PurchaseService {
  configure(): Promise<void>;
  getEntitlement(): Promise<EntitlementState>;
  getOffer(): Promise<StoreOffer | null>;
  purchase(offer: StoreOffer): Promise<PurchaseResult>;
  restore(): Promise<EntitlementState>;
  manageSubscription(): Promise<void>;
  addEntitlementListener(listener: (state: EntitlementState) => void): () => void;
}
