import type { CustomerInfo, PurchasesPackage, SubscriptionOption } from 'react-native-purchases';

import { ENTITLEMENT_ID } from '../../config/constants';

import type { EntitlementState, PurchaseSource, StoreOffer } from './types';

// A signed SDK response may be cached by the SDK itself. Its server requestDate,
// rather than the time of another local read, anchors this bounded fallback.
export const PAID_OFFLINE_LIMIT_MS = 24 * 60 * 60 * 1000;
export const CLOCK_TOLERANCE_MS = 0;
export interface PaidCache {
  state: EntitlementState;
  serverTime: number;
  receivedAt: number;
  lastDeviceTime: number;
  conflicted?: boolean;
}

export function purchaseSource(store: string): PurchaseSource {
  if (store === 'APP_STORE' || store === 'MAC_APP_STORE') return 'apple';
  if (store === 'PLAY_STORE') return 'google';
  if (store === 'RC_BILLING' || store === 'STRIPE') return 'web';
  return 'unknown';
}

export function stateFromCustomerInfo(info: CustomerInfo): EntitlementState {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  const previous = info.entitlements.all[ENTITLEMENT_ID];
  if (info.entitlements.verification === 'FAILED' || entitlement?.verification === 'FAILED') {
    throw new Error('ENTITLEMENT_VERIFICATION_FAILED');
  }
  const verified = info.entitlements.verification === 'VERIFIED' || info.entitlements.verification === 'VERIFIED_ON_DEVICE';
  if (!verified || !Number.isFinite(Date.parse(info.requestDate))) throw new Error('ENTITLEMENT_NOT_VERIFIED');
  const record = entitlement ?? previous;
  const source = record ? purchaseSource(record.store) : 'unknown';
  const subscription = record && info.subscriptionsByProductIdentifier?.[record.productIdentifier];
  // CustomerInfo.managementURL can point at another platform if there are several
  // subscriptions. Prefer the URL for the product that owns full_access.
  const managementURL = subscription?.managementURL ?? (source === 'web' ? undefined : info.managementURL ?? undefined);
  const expirationDate = entitlement?.billingIssueDetectedAt && subscription?.gracePeriodExpiresDate
    ? subscription.gracePeriodExpiresDate
    : record?.expirationDate ?? undefined;
  const isActive = Boolean(entitlement?.isActive) && (!expirationDate || Date.parse(expirationDate) > Date.parse(info.requestDate));
  return {
    status: !isActive ? (previous ? 'expired' : 'inactive')
      : entitlement?.billingIssueDetectedAt ? 'billing_issue'
      : !entitlement?.willRenew && expirationDate ? 'active_ending'
      : entitlement?.periodType === 'TRIAL' ? 'active_trial' : 'active_paid',
    isActive,
    expirationDate,
    isMock: false,
    source,
    verification: 'verified',
    checkedAt: info.requestDate,
    managementURL: managementURL ?? undefined,
    productIdentifier: record?.productIdentifier,
    productPlanIdentifier: record?.productPlanIdentifier ?? undefined,
    isSandbox: record?.isSandbox,
  };
}

export function readPaidCache(cache: PaidCache | null, now: number): EntitlementState | null {
  if (!cache || cache.conflicted || !Number.isFinite(now) || !Number.isFinite(cache.serverTime) || !Number.isFinite(cache.receivedAt) || !Number.isFinite(cache.lastDeviceTime) || typeof cache.state?.isActive !== 'boolean' || now + CLOCK_TOLERANCE_MS < cache.lastDeviceTime || now < cache.receivedAt - CLOCK_TOLERANCE_MS) return null;
  const elapsed = Math.max(0, now - cache.receivedAt);
  const estimatedServerNow = cache.serverTime + elapsed;
  const expiry = cache.state.expirationDate ? Date.parse(cache.state.expirationDate) : Infinity;
  if (Number.isNaN(expiry) || elapsed >= PAID_OFFLINE_LIMIT_MS) return null;
  if (cache.state.isActive && estimatedServerNow >= expiry) return { ...cache.state, status: 'expired', isActive: false, verification: 'cached', validForMs: 0 };
  return { ...cache.state, verification: 'cached', validForMs: Math.max(0, Math.min(PAID_OFFLINE_LIMIT_MS - elapsed, expiry - estimatedServerNow)) };
}

export function offerFromPackage(pkg: PurchasesPackage | null | undefined, plan: StoreOffer['plan'], platform: string): StoreOffer | null {
  if (!pkg) return null;
  const period = plan === 'monthly' ? 'P1M' : 'P1Y';
  const product = pkg.product;
  let option: SubscriptionOption | undefined;
  if (platform === 'android') {
    // Explicitly buy the full-price auto-renewing base plan, never SDK defaultOption
    // (which may automatically select a free or introductory offer).
    const options = product.subscriptionOptions?.filter(value => value.isBasePlan && !value.isPrepaid && !value.freePhase && !value.introPhase && value.billingPeriod?.iso8601 === period) ?? [];
    if (options.length !== 1) return null;
    option = options[0];
  } else if (platform === 'ios' && product.introPrice) {
    // StoreKit automatically applies an eligible intro offer. There is no supported
    // bypass flag, so a newly configured product with an intro cannot be sold here.
    return null;
  }
  const actualPeriod = option?.billingPeriod?.iso8601 ?? product.subscriptionPeriod;
  if (actualPeriod !== period) return null;
  const phasePrice = option?.fullPricePhase?.price;
  const price = phasePrice ? phasePrice.amountMicros / 1_000_000 : product.price;
  const currencyCode = phasePrice?.currencyCode ?? product.currencyCode;
  if (!Number.isFinite(price) || price <= 0 || !currencyCode) return null;
  return { plan, packageIdentifier: pkg.identifier, productIdentifier: product.identifier, localizedPrice: phasePrice?.formatted ?? product.priceString, price, currencyCode, billingPeriod: period, basePlanIdentifier: option?.id, rawPackage: pkg, rawSubscriptionOption: option };
}

export function isRedemptionURL(url: string, configuredScheme: string | undefined): boolean {
  if (!configuredScheme || !/^rc-[a-zA-Z0-9-]+$/.test(configuredScheme)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === `${configuredScheme}:` && parsed.hostname === 'redeem_web_purchase' &&
      !parsed.username && !parsed.password && !parsed.port &&
      (parsed.pathname === '' || parsed.pathname === '/') &&
      Boolean(parsed.searchParams.get('redemption_token'));
  } catch { return false; }
}
