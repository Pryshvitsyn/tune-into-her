import { YEARLY_SUBSCRIPTION_PRODUCT_ID } from "../../config/constants";

import type { EntitlementState, PurchaseResult, PurchaseService, StoreOffer } from "./types";

const fourteenDaysFromNow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString();
};

export class MockPurchaseService implements PurchaseService {
  private state: EntitlementState;
  private listeners = new Set<(state: EntitlementState) => void>();

  constructor(initialState: EntitlementState = { status: "inactive", isActive: false, isMock: true }, private readonly cancelPurchase = false) {
    this.state = initialState;
  }

  async configure(): Promise<void> {}
  async getEntitlement(): Promise<EntitlementState> { return this.state; }
  async getOffer(): Promise<StoreOffer> {
    return {
      packageIdentifier: "$rc_annual",
      productIdentifier: YEARLY_SUBSCRIPTION_PRODUCT_ID,
      localizedPrice: "$3.99",
      billingPeriod: "P1Y",
      isAutoRenewing: true,
      trialDuration: "P14D",
      trialEligible: true,
      rawPackage: {},
    };
  }
  async purchase(_offer: StoreOffer): Promise<PurchaseResult> {
    if (this.cancelPurchase) return "cancelled";
    this.state = { status: "active", isActive: true, expirationDate: fourteenDaysFromNow(), willRenew: true, isTrial: true, isMock: true };
    this.listeners.forEach((listener) => listener(this.state));
    return "purchased";
  }
  async restore(): Promise<EntitlementState> { return this.state; }
  async manageSubscription(): Promise<void> {}
  addEntitlementListener(listener: (state: EntitlementState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
