import type { EntitlementState, PurchaseResult, PurchaseService, StoreOffer } from './types';

export class MockPurchaseService implements PurchaseService {
  private state: EntitlementState;
  private listeners = new Set<(state: EntitlementState) => void>();

  constructor(initialState: EntitlementState = { status: 'inactive', isActive: false, isMock: true }, private readonly cancelPurchase = false) {
    this.state = initialState;
  }

  async configure(): Promise<void> {}
  async getEntitlement(): Promise<EntitlementState> { return this.state; }
  async getOffer(): Promise<StoreOffer> {
    return { packageIdentifier: '$rc_monthly', productIdentifier: 'monthly_access', localizedPrice: 'Store price', billingPeriod: 'P1M', trialDuration: 'P1M', trialEligible: true, rawPackage: {} };
  }
  async purchase(_offer: StoreOffer): Promise<PurchaseResult> {
    if (this.cancelPurchase) return 'cancelled';
    this.state = { status: 'active_trial', isActive: true, isMock: true };
    this.listeners.forEach((listener) => listener(this.state));
    return 'purchased';
  }
  async restore(): Promise<EntitlementState> { return this.state; }
  async manageSubscription(): Promise<void> {}
  addEntitlementListener(listener: (state: EntitlementState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
