import type { EntitlementState, PlanChangeResult, PurchaseResult, PurchaseService, RedemptionResult, StoreOffer } from './types';

export interface MockPurchaseScenario {
  entitlement: EntitlementState;
  storeAvailable?: boolean;
  purchaseResult?: 'purchased' | 'cancelled' | 'pending' | 'error';
  restoreState?: EntitlementState;
}

/** In-memory development fixture; never calls a store, backend or persistent storage. */
export class MockPurchaseService implements PurchaseService {
  private state: EntitlementState;
  private listeners = new Set<(state: EntitlementState) => void>();
  private storeAvailable = true;
  private purchaseResult: 'purchased' | 'cancelled' | 'pending' | 'error';
  private restoreState?: EntitlementState;

  constructor(initialState: EntitlementState = { status: 'inactive', isActive: false, isMock: true }, cancelPurchase = false, private readonly clock: { now(): number } = { now: () => Date.now() }) {
    this.state = { ...initialState, isMock: true };
    this.purchaseResult = cancelPurchase ? 'cancelled' : 'purchased';
  }

  setScenario(scenario: MockPurchaseScenario): void {
    this.state = { ...scenario.entitlement, isMock: true };
    this.storeAvailable = scenario.storeAvailable ?? true;
    this.purchaseResult = scenario.purchaseResult ?? 'purchased';
    this.restoreState = scenario.restoreState ? { ...scenario.restoreState, isMock: true } : undefined;
    this.emit();
  }

  private evaluatedState(): EntitlementState {
    const now = this.clock.now();
    const expiry = this.state.expirationDate ? Date.parse(this.state.expirationDate) : undefined;
    if (this.state.isActive && expiry !== undefined) {
      if (!Number.isFinite(expiry) || expiry <= now) this.state = { ...this.state, status: 'expired', isActive: false, validForMs: 0 };
      else return { ...this.state, validForMs: expiry - now };
    }
    return { ...this.state };
  }

  private emit(): void {
    const value = this.evaluatedState();
    this.listeners.forEach(listener => listener({ ...value }));
  }

  async configure(): Promise<void> {}
  async getEntitlement(): Promise<EntitlementState> { return this.evaluatedState(); }
  async getCachedEntitlement(): Promise<EntitlementState> { return this.evaluatedState(); }
  async getOffer(): Promise<StoreOffer[]> {
    if (!this.storeAvailable) throw new Error('MOCK_STORE_UNAVAILABLE');
    return [
      { plan: 'monthly', packageIdentifier: '$rc_monthly', productIdentifier: 'monthly_access', localizedPrice: '€3.99', price: 3.99, currencyCode: 'EUR', billingPeriod: 'P1M', rawPackage: {} },
      { plan: 'annual', packageIdentifier: '$rc_annual', productIdentifier: 'annual_access', localizedPrice: '€24.99', price: 24.99, currencyCode: 'EUR', billingPeriod: 'P1Y', rawPackage: {} },
    ];
  }
  async purchase(_offer: StoreOffer): Promise<PurchaseResult> {
    if (this.evaluatedState().isActive) return 'already_active';
    if (!this.storeAvailable || this.purchaseResult === 'error') throw new Error('MOCK_PURCHASE_UNAVAILABLE');
    if (this.purchaseResult !== 'purchased') return this.purchaseResult;
    this.state = { status: 'active_paid', isActive: true, isMock: true, source: 'unknown', verification: 'verified' };
    this.emit();
    return 'purchased';
  }
  async changePlan(_offer: StoreOffer): Promise<PlanChangeResult> { return 'already_active'; }
  async restore(): Promise<EntitlementState> {
    if (!this.storeAvailable) throw new Error('MOCK_STORE_UNAVAILABLE');
    if (this.restoreState) this.state = { ...this.restoreState, isMock: true };
    this.emit();
    return this.evaluatedState();
  }
  async manageSubscription(): Promise<void> {}
  async redeemWebPurchase(_url: string): Promise<RedemptionResult> { return 'invalid'; }
  addEntitlementListener(listener: (state: EntitlementState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
