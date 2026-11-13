import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RevenueCatPurchaseService } from '../src/services/purchases/RevenueCatPurchaseService';
import { offerFromPackage, PAID_OFFLINE_LIMIT_MS, readPaidCache, stateFromCustomerInfo, type PaidCache } from '../src/services/purchases/paidAccess';

const native = vi.hoisted(() => ({ platform: 'ios', openURL: vi.fn() }));
const sdk = vi.hoisted(() => ({
  configure: vi.fn(), setLogHandler: vi.fn(), setLogLevel: vi.fn(), LOG_LEVEL: { ERROR: 'ERROR' }, invalidateCustomerInfoCache: vi.fn(), getCustomerInfo: vi.fn(), getOfferings: vi.fn(),
  purchasePackage: vi.fn(), purchaseSubscriptionOption: vi.fn(), restorePurchases: vi.fn(),
  showManageSubscriptions: vi.fn(), addCustomerInfoUpdateListener: vi.fn(), removeCustomerInfoUpdateListener: vi.fn(),
  parseAsWebPurchaseRedemption: vi.fn(), redeemWebPurchase: vi.fn(),
  ENTITLEMENT_VERIFICATION_MODE: { INFORMATIONAL: 'INFORMATIONAL' },
  STORE_REPLACEMENT_MODE: { DEFERRED: 'DEFERRED' },
}));
vi.mock('react-native', () => ({ Platform: { get OS() { return native.platform; }, select: (values: Record<string, string>) => values[native.platform] }, Linking: { openURL: native.openURL } }));
vi.mock('expo-secure-store', () => ({ getItemAsync: vi.fn(async () => null), setItemAsync: vi.fn(async () => undefined) }));
vi.mock('react-native-purchases', () => ({ default: sdk, PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: 'cancelled', PAYMENT_PENDING_ERROR: 'pending' } }));


const now = Date.parse('2026-11-13T09:00:00Z');
function info(active = true, overrides: Record<string, unknown> = {}): CustomerInfo {
  const entitlement = { isActive: active, willRenew: true, expirationDate: new Date(now + 3600000).toISOString(), store: 'APP_STORE', productIdentifier: 'monthly_access', periodType: 'NORMAL', verification: 'VERIFIED', isSandbox: true, ...overrides };
  return { requestDate: new Date(Date.now()).toISOString(), managementURL: null, subscriptionsByProductIdentifier: {}, entitlements: { active: active ? { full_access: entitlement } : {}, all: { full_access: entitlement }, verification: 'VERIFIED' } } as unknown as CustomerInfo;
}
function pkg(period: string | null = 'P1M', intro = false): PurchasesPackage {
  return { identifier: '$rc_monthly', product: { identifier: 'monthly_access', priceString: '€3.99', price: 3.99, currencyCode: 'EUR', subscriptionPeriod: period, introPrice: intro ? { price: 0 } : null } } as PurchasesPackage;
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(now);
  native.platform = 'ios';
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = 'appl_public_test';
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY = 'goog_public_test';
  process.env.EXPO_PUBLIC_REVENUECAT_REDEMPTION_SCHEME = 'rc-actualdashboard';
  sdk.getCustomerInfo.mockImplementation(async () => info(false));
  sdk.getOfferings.mockResolvedValue({ current: { monthly: pkg(), annual: null } });
});

describe('exact full-price plan mapping', () => {
  it('rejects unknown or mismatched periods and iOS intro offers', () => {
    expect(offerFromPackage(pkg(null), 'monthly', 'ios')).toBeNull();
    expect(offerFromPackage(pkg('P1Y'), 'monthly', 'ios')).toBeNull();
    expect(offerFromPackage(pkg('P1M', true), 'monthly', 'ios')).toBeNull();
    expect(offerFromPackage(pkg('P1Y'), 'annual', 'ios')).toMatchObject({ plan: 'annual', billingPeriod: 'P1Y' });
  });
  it('uses Android full-price base plan rather than the SDK introductory default', () => {
    const value = pkg();
    Object.assign(value.product, { subscriptionOptions: [{ isBasePlan: false, freePhase: {}, billingPeriod: { iso8601: 'P1M' } }, { isBasePlan: true, isPrepaid: false, freePhase: null, introPhase: null, billingPeriod: { iso8601: 'P1M' }, fullPricePhase: { price: { formatted: '€3.99', amountMicros: 3990000, currencyCode: 'EUR' } } }] });
    expect(offerFromPackage(value, 'monthly', 'android')).toMatchObject({ price: 3.99, rawSubscriptionOption: { isBasePlan: true } });
  });
  it('never uses an arbitrary available package', async () => {
    sdk.getOfferings.mockResolvedValue({ current: { availablePackages: [pkg()], monthly: null, annual: null } });
    expect(await new RevenueCatPurchaseService().getOffer()).toEqual([]);
  });
});

describe('signed paid access and bounded fallback', () => {
  it('preserves cancelled renewal and grace while revocation/hold expire', () => {
    expect(stateFromCustomerInfo(info(true, { willRenew: false }))).toMatchObject({ status: 'active_ending', isActive: true });
    const grace = info(true, { billingIssueDetectedAt: '2026-11-13T00:00:00Z' });
    Object.assign(grace, { subscriptionsByProductIdentifier: { monthly_access: { gracePeriodExpiresDate: '2026-11-15T00:00:00Z' } } });
    expect(stateFromCustomerInfo(grace)).toMatchObject({ status: 'billing_issue', isActive: true, expirationDate: '2026-11-15T00:00:00Z' });
    expect(stateFromCustomerInfo(info(false))).toMatchObject({ status: 'expired', isActive: false });
  });
  it('rejects a failed signature', () => {
    const bad = info();
    Object.assign(bad.entitlements, { verification: 'FAILED' });
    expect(() => stateFromCustomerInfo(bad)).toThrow('VERIFICATION_FAILED');
  });
  it('expires at the paid boundary, 24h limit, and on clock rollback', () => {
    const cache: PaidCache = { state: stateFromCustomerInfo(info()), serverTime: now, receivedAt: now, lastDeviceTime: now };
    expect(readPaidCache(cache, now + 1000)?.isActive).toBe(true);
    expect(readPaidCache(cache, now + 3600000)).toMatchObject({ status: 'expired', isActive: false });
    cache.state.expirationDate = undefined;
    expect(readPaidCache(cache, now + PAID_OFFLINE_LIMIT_MS)).toBeNull();
    expect(readPaidCache({ ...cache, lastDeviceTime: now + 600000 }, now)).toBeNull();
  });
  it('uses monotonic elapsed time when the wall clock freezes', async () => {
    let monotonic = 0;
    sdk.getCustomerInfo.mockResolvedValue(info());
    const service = new RevenueCatPurchaseService({ wallNow: () => now, monotonicNow: () => monotonic });
    expect((await service.getEntitlement()).isActive).toBe(true);
    monotonic = 3600000;
    expect(await service.getCachedEntitlement()).toMatchObject({ isActive: false, status: 'expired' });
  });
  it('does not regrant an equal-timestamp revoked result or extend an old SDK response', async () => {
    sdk.getCustomerInfo.mockResolvedValue(info());
    const service = new RevenueCatPurchaseService();
    expect((await service.getEntitlement()).isActive).toBe(true);
    sdk.getCustomerInfo.mockResolvedValue(info(false));
    expect(await service.getEntitlement()).toMatchObject({ isActive: false, verification: 'unavailable' });
    sdk.getCustomerInfo.mockResolvedValue(info());
    expect((await service.getEntitlement()).isActive).toBe(false);
    vi.setSystemTime(now + 1000);
    sdk.getCustomerInfo.mockResolvedValue(info());
    expect((await service.getEntitlement()).isActive).toBe(true);
    vi.setSystemTime(now + PAID_OFFLINE_LIMIT_MS + 1000);
    expect((await service.getEntitlement()).isActive).toBe(false);
  });
  it('rejects malformed cached expiry', () => {
    const cache: PaidCache = { state: { ...stateFromCustomerInfo(info()), expirationDate: 'invalid' }, serverTime: now, receivedAt: now, lastDeviceTime: now };
    expect(readPaidCache(cache, now)).toBeNull();
  });
  it('retains an existing payer on a temporary network failure without resetting expiry', async () => {
    sdk.getCustomerInfo.mockResolvedValueOnce(info());
    const service = new RevenueCatPurchaseService();
    expect((await service.getEntitlement()).isActive).toBe(true);
    sdk.getCustomerInfo.mockRejectedValue(new Error('offline'));
    vi.setSystemTime(now + 60000);
    expect(await service.getEntitlement()).toMatchObject({ isActive: true, verification: 'cached' });
    vi.setSystemTime(now + 3600000);
    expect(await service.getEntitlement()).toMatchObject({ status: 'expired', isActive: false, verification: 'cached' });
  });
});

describe('purchase and lifecycle actions', () => {
  it.each(['cancelled', 'pending'])('returns %s without granting paid access', async code => {
    sdk.purchasePackage.mockRejectedValue({ code });
    const service = new RevenueCatPurchaseService();
    expect(await service.purchase((await service.getOffer())[0]!)).toBe(code);
  });
  it('verifies success and blocks repeat purchase despite an older equal-date read', async () => {
    const service = new RevenueCatPurchaseService();
    sdk.purchasePackage.mockResolvedValue({ customerInfo: { ...info(), requestDate: new Date(now + 1).toISOString() } });
    expect(await service.purchase((await service.getOffer())[0]!)).toBe('purchased');
    expect(await service.purchase((await service.getOffer())[0]!)).toBe('already_active');
    expect(sdk.purchasePackage).toHaveBeenCalledTimes(1);
  });
  it('treats a result without full_access as pending and reports technical failures', async () => {
    const service = new RevenueCatPurchaseService();
    const offer = (await service.getOffer())[0]!;
    sdk.purchasePackage.mockResolvedValueOnce({ customerInfo: info(false) });
    expect(await service.purchase(offer)).toBe('pending');
    sdk.purchasePackage.mockRejectedValueOnce({ code: 'failure' });
    await expect(service.purchase(offer)).rejects.toThrow('PURCHASE_FAILED');
  });
  it('serializes purchase/restore/redemption and configures once', async () => {
    let finish: ((value: { customerInfo: CustomerInfo }) => void) | undefined;
    sdk.purchasePackage.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const service = new RevenueCatPurchaseService();
    const offer = (await service.getOffer())[0]!;
    const purchase = service.purchase(offer);
    await expect(service.restore()).rejects.toThrow('IN_PROGRESS');
    for (let index = 0; index < 50 && !finish; index++) await Promise.resolve();
    finish!({ customerInfo: { ...info(), requestDate: new Date(now + 1).toISOString() } });
    expect(await purchase).toBe('purchased');
    expect(sdk.configure).toHaveBeenCalledTimes(1);
  });
  it('buys the explicit Android base plan and restores only verified SDK rights', async () => {
    native.platform = 'android';
    const android = pkg();
    const basePlan = { isBasePlan: true, isPrepaid: false, freePhase: null, introPhase: null, billingPeriod: { iso8601: 'P1M' }, fullPricePhase: { price: { formatted: '€3.99', amountMicros: 3990000, currencyCode: 'EUR' } } };
    Object.assign(android.product, { subscriptionOptions: [basePlan] });
    sdk.getOfferings.mockResolvedValue({ current: { monthly: android } });
    sdk.purchaseSubscriptionOption.mockResolvedValue({ customerInfo: { ...info(true, { store: 'PLAY_STORE' }), requestDate: new Date(now + 1).toISOString() } });
    const service = new RevenueCatPurchaseService();
    expect(await service.purchase((await service.getOffer())[0]!)).toBe('purchased');
    expect(sdk.purchaseSubscriptionOption).toHaveBeenCalledWith(basePlan);
    expect(sdk.purchasePackage).not.toHaveBeenCalled();
    vi.setSystemTime(now + 1000);
    sdk.restorePurchases.mockResolvedValue(info(true, { store: 'PLAY_STORE' }));
    expect(await service.restore()).toMatchObject({ isActive: true, source: 'google' });
  });
  it('does not attach a listener after disposal during asynchronous configure', async () => {
    const service = new RevenueCatPurchaseService();
    const dispose = service.addEntitlementListener(vi.fn());
    dispose();
    await service.configure();
    await Promise.resolve();
    expect(sdk.addCustomerInfoUpdateListener).not.toHaveBeenCalled();
  });
  it('routes web management to its matching portal and never to a native store', async () => {
    const web = info(true, { store: 'RC_BILLING' });
    Object.assign(web, { managementURL: 'https://apps.apple.com/account/subscriptions', subscriptionsByProductIdentifier: { monthly_access: { managementURL: 'https://billing.revenuecat.com/portal/example' } } });
    sdk.getCustomerInfo.mockResolvedValue(web);
    await new RevenueCatPurchaseService().manageSubscription();
    expect(native.openURL).toHaveBeenCalledWith('https://billing.revenuecat.com/portal/example');
    expect(sdk.showManageSubscriptions).not.toHaveBeenCalled();
  });
});


describe('explicit Google plan replacements', () => {
  function googlePlans(subscription = 'membership') {
    native.platform = 'android';
    const create = (basePlan: string, period: string) => {
      const value = pkg(period);
      const option = { id: basePlan, productId: subscription, isBasePlan: true, isPrepaid: false, freePhase: null, introPhase: null, billingPeriod: { iso8601: period }, fullPricePhase: { price: { formatted: period === 'P1M' ? '€3.99' : '€24.99', amountMicros: period === 'P1M' ? 3990000 : 24990000, currencyCode: 'EUR' } } };
      Object.assign(value, { identifier: period === 'P1M' ? '$rc_monthly' : '$rc_annual' });
      Object.assign(value.product, { identifier: `${subscription}:${basePlan}`, subscriptionOptions: [option] });
      return { pkg: value, option };
    };
    const monthly = create('monthly', 'P1M');
    const annual = create('annual', 'P1Y');
    sdk.getOfferings.mockResolvedValue({ current: { monthly: monthly.pkg, annual: annual.pkg } });
    return { monthly, annual };
  }
  it('switches both directions within one subscription through explicit base plans', async () => {
    const plans = googlePlans();
    sdk.getCustomerInfo.mockImplementation(async () => info(true, { store: 'PLAY_STORE', productIdentifier: 'membership', productPlanIdentifier: 'monthly' }));
    sdk.purchaseSubscriptionOption.mockImplementation(async () => ({ customerInfo: info(true, { store: 'PLAY_STORE', productIdentifier: 'membership', productPlanIdentifier: 'monthly' }) }));
    const service = new RevenueCatPurchaseService();
    const offers = await service.getOffer();
    expect(await service.changePlan(offers.find(value => value.plan === 'annual')!)).toBe('change_requested');
    expect(sdk.purchaseSubscriptionOption).toHaveBeenLastCalledWith(plans.annual.option);
    vi.setSystemTime(now + 1000);
    sdk.getCustomerInfo.mockImplementation(async () => info(true, { store: 'PLAY_STORE', productIdentifier: 'membership', productPlanIdentifier: 'annual' }));
    expect(await service.changePlan(offers.find(value => value.plan === 'monthly')!)).toBe('change_requested');
    expect(sdk.purchaseSubscriptionOption).toHaveBeenLastCalledWith(plans.monthly.option);
  });
  it('replaces a legacy separate product rather than buying a second subscription', async () => {
    const plans = googlePlans('new_membership');
    sdk.getCustomerInfo.mockResolvedValue(info(true, { store: 'PLAY_STORE', productIdentifier: 'legacy_monthly', productPlanIdentifier: 'monthly' }));
    sdk.purchaseSubscriptionOption.mockResolvedValue({ customerInfo: info(true, { store: 'PLAY_STORE', productIdentifier: 'legacy_monthly', productPlanIdentifier: 'monthly' }) });
    const service = new RevenueCatPurchaseService();
    expect(await service.changePlan((await service.getOffer()).find(value => value.plan === 'annual')!)).toBe('change_requested');
    expect(sdk.purchaseSubscriptionOption).toHaveBeenCalledWith(plans.annual.option, { oldProductIdentifier: 'legacy_monthly', replacementMode: 'DEFERRED' });
  });
  it('rejects unknown current base plans and no-ops an already selected base plan', async () => {
    googlePlans();
    sdk.getCustomerInfo.mockResolvedValue(info(true, { store: 'PLAY_STORE', productIdentifier: 'membership', productPlanIdentifier: null }));
    const service = new RevenueCatPurchaseService();
    const offers = await service.getOffer();
    await expect(service.changePlan(offers[0]!)).rejects.toThrow('CURRENT_BASE_PLAN_UNKNOWN');
    vi.setSystemTime(now + 1000);
    sdk.getCustomerInfo.mockResolvedValue(info(true, { store: 'PLAY_STORE', productIdentifier: 'membership', productPlanIdentifier: 'monthly' }));
    expect(await service.changePlan(offers[0]!)).toBe('already_active');
    expect(sdk.purchaseSubscriptionOption).not.toHaveBeenCalled();
  });
  it('does not switch another platform or an unverified/offline entitlement', async () => {
    googlePlans();
    const service = new RevenueCatPurchaseService();
    const offer = (await service.getOffer())[0]!;
    sdk.getCustomerInfo.mockResolvedValue(info(true, { store: 'RC_BILLING', productIdentifier: 'membership', productPlanIdentifier: 'annual' }));
    await expect(service.changePlan(offer)).rejects.toThrow('NATIVE_GOOGLE_SUBSCRIPTION_REQUIRED');
    vi.setSystemTime(now + 1000);
    sdk.getCustomerInfo.mockResolvedValue(info(true, { store: 'PLAY_STORE', productIdentifier: 'membership', productPlanIdentifier: 'annual' }));
    await service.getEntitlement();
    sdk.getCustomerInfo.mockRejectedValue(new Error('offline'));
    await expect(service.changePlan(offer)).rejects.toThrow('NATIVE_GOOGLE_SUBSCRIPTION_REQUIRED');
    expect(sdk.purchaseSubscriptionOption).not.toHaveBeenCalled();
  });
  it.each(['cancelled', 'pending'])('returns %s without claiming an effective plan change', async code => {
    googlePlans();
    sdk.getCustomerInfo.mockResolvedValue(info(true, { store: 'PLAY_STORE', productIdentifier: 'membership', productPlanIdentifier: 'monthly' }));
    sdk.purchaseSubscriptionOption.mockRejectedValue({ code });
    const service = new RevenueCatPurchaseService();
    expect(await service.changePlan((await service.getOffer()).find(value => value.plan === 'annual')!)).toBe(code);
  });
});
