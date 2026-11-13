import type { EntitlementState, PlanChangeResult, PurchaseResult, PurchaseService, RedemptionResult, StoreOffer } from './types';

export class MockPurchaseService implements PurchaseService {
  private state: EntitlementState;
  private listeners = new Set<(state: EntitlementState) => void>();

  constructor(initialState: EntitlementState = { status: 'inactive', isActive: false, isMock: true }, private readonly cancelPurchase = false) {
    this.state = initialState;
  }

  async configure(): Promise<void> {}
  async getEntitlement(): Promise<EntitlementState> { return this.state; }
  async getCachedEntitlement(): Promise<EntitlementState> { return this.state; }
  async getOffer(): Promise<StoreOffer[]> {
    return [
      { plan: 'monthly', packageIdentifier: '$rc_monthly', productIdentifier: 'monthly_access', localizedPrice: '€3.99', price: 3.99, currencyCode: 'EUR', billingPeriod: 'P1M', rawPackage: {} },
      { plan: 'annual', packageIdentifier: '$rc_annual', productIdentifier: 'annual_access', localizedPrice: '€24.99', price: 24.99, currencyCode: 'EUR', billingPeriod: 'P1Y', rawPackage: {} },
    ];
  }
  async purchase(_offer: StoreOffer): Promise<PurchaseResult> {
    if (this.state.isActive) return 'already_active';
    if (this.cancelPurchase) return 'cancelled';
    this.state = { status: 'active_paid', isActive: true, isMock: true, source: 'unknown', verification: 'verified' };
    this.listeners.forEach((listener) => listener(this.state));
    return 'purchased';
  }
  async changePlan(_offer: StoreOffer): Promise<PlanChangeResult> { return 'already_active'; }
  async restore(): Promise<EntitlementState> { return this.state; }
  async manageSubscription(): Promise<void> {}
  async redeemWebPurchase(_url: string): Promise<RedemptionResult> { return 'invalid'; }
  addEntitlementListener(listener: (state: EntitlementState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
