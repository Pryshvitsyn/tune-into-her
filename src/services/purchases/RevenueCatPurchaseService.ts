import * as SecureStore from 'expo-secure-store';
import { Linking, Platform } from 'react-native';

import { isRedemptionURL, offerFromPackage, readPaidCache, stateFromCustomerInfo, type PaidCache } from './paidAccess';
import type { EntitlementState, PlanChangeResult, PurchaseResult, PurchaseService, RedemptionResult, StoreOffer } from './types';

type RevenueCatModule = typeof import('react-native-purchases');
type CustomerInfo = Awaited<ReturnType<RevenueCatModule['default']['getCustomerInfo']>>;

function cacheNamespace(apiKey: string): string {
  // Namespace public SDK keys without persisting them as part of the storage key.
  let hash = 5381;
  for (const char of apiKey) hash = ((hash << 5) + hash) ^ char.charCodeAt(0);
  return `tih.paid.v1.${Platform.OS}.${process.env.EXPO_PUBLIC_BILLING_ENVIRONMENT ?? 'sandbox'}.${(hash >>> 0).toString(16)}`;
}

export interface PurchaseClock { wallNow(): number; monotonicNow(): number }

export class RevenueCatPurchaseService implements PurchaseService {
  private module: RevenueCatModule | null = null;
  private configurePromise: Promise<void> | null = null;
  private refreshPromise: Promise<EntitlementState> | null = null;
  private cache: PaidCache | null = null;
  private cacheKey: string | null = null;
  private working = false;
  private readonly freshWindowMs = 5 * 60 * 1000;
  private acceptQueue: Promise<void> = Promise.resolve();
  private readonly clockAnchor: { wall: number; monotonic: number };

  constructor(private readonly clock: PurchaseClock = { wallNow: () => Date.now(), monotonicNow: () => performance.now() }) {
    this.clockAnchor = { wall: clock.wallNow(), monotonic: clock.monotonicNow() };
  }

  private effectiveNow(): number {
    return Math.max(this.clock.wallNow(), this.clockAnchor.wall + Math.max(0, this.clock.monotonicNow() - this.clockAnchor.monotonic));
  }

  private async getModule(): Promise<RevenueCatModule> {
    this.module ??= await import('react-native-purchases');
    return this.module;
  }

  configure(): Promise<void> {
    this.configurePromise ??= this.configureOnce().catch(error => {
      this.configurePromise = null;
      throw error;
    });
    return this.configurePromise;
  }

  private async configureOnce(): Promise<void> {
    const apiKey = Platform.select({ ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY, android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY });
    if (!apiKey) throw new Error('REVENUECAT_API_KEY_MISSING');
    if (Platform.OS === 'web') throw new Error('NATIVE_PURCHASES_REQUIRED');
    const { default: Purchases } = await this.getModule();
    // Never forward SDK diagnostics that might contain receipts or redemption URLs.
    Purchases.setLogHandler(() => undefined);
    await Purchases.setLogLevel(Purchases.LOG_LEVEL.ERROR);
    // Keep the SDK's existing anonymous identity. A trial credential is not a
    // RevenueCat App User ID, and this change must not orphan earlier purchases.
    Purchases.configure({ apiKey, entitlementVerificationMode: Purchases.ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL });
    this.cacheKey = cacheNamespace(apiKey);
    try {
      const saved = await SecureStore.getItemAsync(this.cacheKey);
      if (saved) {
        const value = JSON.parse(saved) as PaidCache;
        if (value.state && Number.isFinite(value.serverTime) && Number.isFinite(value.receivedAt) && Number.isFinite(value.lastDeviceTime)) this.cache = value;
      }
    } catch { this.cache = null; }
  }

  private async saveCache(): Promise<void> {
    if (!this.cacheKey || !this.cache) return;
    try { await SecureStore.setItemAsync(this.cacheKey, JSON.stringify(this.cache)); } catch { /* Access remains bounded in memory if local persistence is unavailable. */ }
  }

  private accept(info: CustomerInfo): Promise<EntitlementState> {
    const result = this.acceptQueue.then(() => this.acceptOnce(info));
    this.acceptQueue = result.then(() => undefined, () => undefined);
    return result;
  }

  private async acceptOnce(info: CustomerInfo): Promise<EntitlementState> {
    const state = stateFromCustomerInfo(info);
    const serverTime = Date.parse(info.requestDate);
    const now = this.effectiveNow();
    if (this.cache && serverTime < this.cache.serverTime) return this.cachedOrUnavailable();
    if (this.cache && serverTime === this.cache.serverTime) {
      // Contradictory equal-time results cannot prove which came last. Deny until
      // a strictly newer signed response arrives; duplicate success cannot undo a refund.
      if (this.cache.state.isActive !== state.isActive) {
        this.cache.conflicted = true;
        this.cache.state = { ...state, isActive: false, status: 'error', verification: 'unavailable' };
      }
      await this.saveCache();
      const cached = await this.cachedOrUnavailable();
      return cached.verification === 'cached' && now - this.cache.receivedAt < this.freshWindowMs
        ? { ...cached, verification: 'verified' } : cached;
    }
    // A fresh signed requestDate anchors the fallback. Cached SDK responses cannot
    // reset this deadline each launch; an obviously old first response is bounded too.
    const receivedAt = Math.abs(now - serverTime) < this.freshWindowMs ? now : Math.min(now, serverTime);
    this.cache = { state, serverTime, receivedAt, lastDeviceTime: this.clock.wallNow() };
    await this.saveCache();
    const bounded = await this.cachedOrUnavailable();
    return receivedAt === now && bounded.verification === 'cached' ? { ...bounded, verification: 'verified' } : bounded;
  }

  private async cachedOrUnavailable(): Promise<EntitlementState> {
    const wallNow = this.clock.wallNow();
    const now = this.effectiveNow();
    const state = this.cache && wallNow < this.cache.lastDeviceTime ? null : readPaidCache(this.cache, now);
    if (this.cache && wallNow > this.cache.lastDeviceTime) {
      this.cache.lastDeviceTime = wallNow;
      await this.saveCache();
    }
    return state ?? { status: 'error', isActive: false, isMock: false, source: this.cache?.state.source, verification: 'unavailable', error: 'ACCESS_CHECK_UNAVAILABLE' };
  }

  async getCachedEntitlement(): Promise<EntitlementState> {
    try { await this.configure(); } catch { /* Return a bounded unavailable state. */ }
    return this.cachedOrUnavailable();
  }

  getEntitlement(): Promise<EntitlementState> {
    this.refreshPromise ??= this.refresh().finally(() => { this.refreshPromise = null; });
    return this.refreshPromise;
  }

  private async refresh(): Promise<EntitlementState> {
    try {
      await this.configure();
      const { default: Purchases } = await this.getModule();
      await Purchases.invalidateCustomerInfoCache();
      return await this.accept(await Purchases.getCustomerInfo());
    } catch { return this.cachedOrUnavailable(); }
  }

  async getOffer(): Promise<StoreOffer[]> {
    await this.configure();
    const { default: Purchases } = await this.getModule();
    const offerings = await Purchases.getOfferings();
    const chosenID = process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID;
    const offering = chosenID ? offerings.all[chosenID] : offerings.current;
    return [offerFromPackage(offering?.monthly, 'monthly', Platform.OS), offerFromPackage(offering?.annual, 'annual', Platform.OS)].filter((value): value is StoreOffer => value !== null);
  }

  private async exclusive<T>(action: () => Promise<T>): Promise<T> {
    if (this.working) throw new Error('BILLING_ACTION_IN_PROGRESS');
    this.working = true;
    try { return await action(); } finally { this.working = false; }
  }

  purchase(offer: StoreOffer): Promise<PurchaseResult> {
    return this.exclusive(async () => {
      const state = await this.getEntitlement();
      if (state.isActive) return 'already_active';
      if (state.verification !== 'verified') throw new Error('ACCESS_CHECK_UNAVAILABLE');
      // Re-fetch so a stale view cannot purchase a removed/changed product.
      const current = (await this.getOffer()).find(value => value.plan === offer.plan && value.productIdentifier === offer.productIdentifier && value.packageIdentifier === offer.packageIdentifier);
      if (!current || current.price !== offer.price || current.currencyCode !== offer.currencyCode) throw new Error('OFFER_CHANGED');
      const { default: Purchases, PURCHASES_ERROR_CODE } = await this.getModule();
      try {
        const result = Platform.OS === 'android'
          ? await Purchases.purchaseSubscriptionOption(current.rawSubscriptionOption as Parameters<typeof Purchases.purchaseSubscriptionOption>[0])
          : await Purchases.purchasePackage(current.rawPackage as Parameters<typeof Purchases.purchasePackage>[0]);
        // Some store results are delivered before entitlement propagation. Treat
        // those as pending and let listener/foreground refresh resolve them.
        return (await this.accept(result.customerInfo)).isActive ? 'purchased' : 'pending';
      } catch (error) {
        const code = typeof error === 'object' && error && 'code' in error ? error.code : undefined;
        if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return 'cancelled';
        if (code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'pending';
        throw new Error('PURCHASE_FAILED');
      }
    });
  }

  changePlan(offer: StoreOffer): Promise<PlanChangeResult> {
    return this.exclusive(async () => {
      const state = await this.getEntitlement();
      if (Platform.OS !== 'android' || !state.isActive || state.source !== 'google' || state.verification !== 'verified' || !state.productIdentifier) throw new Error('NATIVE_GOOGLE_SUBSCRIPTION_REQUIRED');
      const current = (await this.getOffer()).find(value => value.plan === offer.plan && value.productIdentifier === offer.productIdentifier && value.packageIdentifier === offer.packageIdentifier);
      if (!current || current.price !== offer.price || current.currencyCode !== offer.currencyCode || !current.rawSubscriptionOption || !current.basePlanIdentifier) throw new Error('OFFER_CHANGED');
      const oldProduct = state.productIdentifier.split(':')[0]!;
      const oldBasePlan = state.productPlanIdentifier ?? state.productIdentifier.split(':')[1];
      const targetProduct = current.productIdentifier.split(':')[0]!;
      if (targetProduct === oldProduct) {
        // Never blindly re-purchase a base plan when the existing plan is unknown.
        if (!oldBasePlan) throw new Error('CURRENT_BASE_PLAN_UNKNOWN');
        if (oldBasePlan === current.basePlanIdentifier) return 'already_active';
      }
      const { default: Purchases, PURCHASES_ERROR_CODE } = await this.getModule();
      const option = current.rawSubscriptionOption as Parameters<typeof Purchases.purchaseSubscriptionOption>[0];
      try {
        // Play automatically replaces base plans inside one subscription using its
        // Console policy. Between legacy separate products, explicitly replace the
        // known old subscription at renewal; never create an independent purchase.
        const result = targetProduct === oldProduct
          ? await Purchases.purchaseSubscriptionOption(option)
          : await Purchases.purchaseSubscriptionOption(option, { oldProductIdentifier: oldProduct, replacementMode: Purchases.STORE_REPLACEMENT_MODE.DEFERRED });
        await this.accept(result.customerInfo);
        // An accepted deferred change is not proof the new plan is already active.
        return 'change_requested';
      } catch (error) {
        const code = typeof error === 'object' && error && 'code' in error ? error.code : undefined;
        if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return 'cancelled';
        if (code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'pending';
        throw new Error('PLAN_CHANGE_FAILED');
      }
    });
  }

  restore(): Promise<EntitlementState> {
    return this.exclusive(async () => {
      await this.configure();
      const { default: Purchases } = await this.getModule();
      return this.accept(await Purchases.restorePurchases());
    });
  }

  async manageSubscription(): Promise<void> {
    const state = await this.getEntitlement();
    if (state.source === 'web') {
      // RevenueCat Billing emails contain the authenticated portal URL. Never send
      // web customers into a device-store subscription list or a Stripe portal.
      if (!state.managementURL) throw new Error('WEB_PORTAL_EMAIL_REQUIRED');
      const url = new URL(state.managementURL);
      if (url.protocol !== 'https:' || url.hostname === 'apps.apple.com' || url.hostname === 'play.google.com') throw new Error('WEB_PORTAL_EMAIL_REQUIRED');
      await Linking.openURL(state.managementURL);
      return;
    }
    if (state.source === 'apple') {
      if (Platform.OS === 'ios') {
        const { default: Purchases } = await this.getModule();
        try { await Purchases.showManageSubscriptions(); return; } catch { /* Official store URL remains a safe fallback. */ }
      }
      await Linking.openURL('https://apps.apple.com/account/subscriptions');
      return;
    }
    if (state.source === 'google') {
      await Linking.openURL('https://play.google.com/store/account/subscriptions');
      return;
    }
    throw new Error('SUBSCRIPTION_SOURCE_UNAVAILABLE');
  }

  redeemWebPurchase(url: string): Promise<RedemptionResult> {
    return this.exclusive(async () => {
      if (!isRedemptionURL(url, process.env.EXPO_PUBLIC_REVENUECAT_REDEMPTION_SCHEME)) return 'invalid';
      try {
        await this.configure();
        const { default: Purchases } = await this.getModule();
        const redemption = await Purchases.parseAsWebPurchaseRedemption(url);
        if (!redemption) return 'invalid';
        const result = await Purchases.redeemWebPurchase(redemption);
        switch (result.result) {
          case 'SUCCESS': return (await this.accept(result.customerInfo)).isActive ? 'redeemed' : 'error';
          case 'INVALID_TOKEN': return 'invalid';
          case 'EXPIRED': return 'expired';
          case 'PURCHASE_BELONGS_TO_OTHER_USER': return 'already_redeemed';
          default: return 'error';
        }
      } catch { return 'error'; }
    });
  }

  addEntitlementListener(listener: (state: EntitlementState) => void): () => void {
    let disposed = false;
    let callback: ((info: CustomerInfo) => void) | undefined;
    void this.configure().then(async () => {
      const { default: Purchases } = await this.getModule();
      if (disposed) return;
      callback = info => { void this.accept(info).then(state => { if (!disposed) listener(state); }).catch(() => undefined); };
      Purchases.addCustomerInfoUpdateListener(callback);
    }).catch(() => undefined);
    return () => {
      disposed = true;
      if (callback && this.module) this.module.default.removeCustomerInfoUpdateListener(callback);
    };
  }
}
