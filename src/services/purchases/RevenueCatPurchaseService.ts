import { Linking, Platform } from 'react-native';

import { ENTITLEMENT_ID } from '../../config/constants';

import type { EntitlementState, PurchaseResult, PurchaseService, StoreOffer } from './types';

type RevenueCatModule = typeof import('react-native-purchases');
type CustomerInfo = Awaited<ReturnType<RevenueCatModule['default']['getCustomerInfo']>>;

function stateFromCustomerInfo(info: CustomerInfo): EntitlementState {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement) return { status: 'inactive', isActive: false, isMock: false };
  const expirationDate = entitlement.expirationDate ?? undefined;
  if (entitlement.billingIssueDetectedAt) return { status: 'billing_issue', isActive: true, expirationDate, isMock: false };
  if (!entitlement.willRenew && expirationDate) return { status: 'active_ending', isActive: true, expirationDate, isMock: false };
  return {
    status: entitlement.periodType === 'TRIAL' ? 'active_trial' : 'active_paid',
    isActive: true,
    expirationDate,
    isMock: false,
  };
}

export class RevenueCatPurchaseService implements PurchaseService {
  private module: RevenueCatModule | null = null;
  private configured = false;

  private async getModule(): Promise<RevenueCatModule> {
    this.module ??= await import('react-native-purchases');
    return this.module;
  }

  async configure(): Promise<void> {
    if (this.configured) return;
    const apiKey = Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    });
    if (!apiKey) throw new Error('REVENUECAT_API_KEY_MISSING');
    const { default: Purchases } = await this.getModule();
    Purchases.configure({ apiKey });
    this.configured = true;
  }

  async getEntitlement(): Promise<EntitlementState> {
    try {
      await this.configure();
      const { default: Purchases } = await this.getModule();
      return stateFromCustomerInfo(await Purchases.getCustomerInfo());
    } catch (error) {
      return { status: 'error', isActive: false, isMock: false, error: error instanceof Error ? error.message : 'UNKNOWN_PURCHASE_ERROR' };
    }
  }

  async getOffer(): Promise<StoreOffer | null> {
    await this.configure();
    const { default: Purchases } = await this.getModule();
    const offering = (await Purchases.getOfferings()).current;
    const monthly = offering?.monthly ?? offering?.availablePackages[0];
    if (!monthly) return null;
    const intro = monthly.product.introPrice;
    const androidFreePhase = monthly.product.defaultOption?.freePhase;
    let trialEligible = false;
    let trialDuration: string | undefined;
    if (Platform.OS === 'android' && androidFreePhase) {
      // Google Play filters the selected subscription option to offers available to this user.
      trialEligible = true;
      trialDuration = androidFreePhase.billingPeriod.iso8601;
    } else if (intro?.price === 0) {
      const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility([monthly.product.identifier]);
      trialEligible = eligibility[monthly.product.identifier]?.status === Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE;
      if (trialEligible) {
        const unit = intro.periodUnit === 'DAY' ? 'D' : intro.periodUnit === 'WEEK' ? 'W' : intro.periodUnit === 'MONTH' ? 'M' : intro.periodUnit === 'YEAR' ? 'Y' : '';
        trialDuration = unit ? `P${intro.periodNumberOfUnits}${unit}` : undefined;
      }
    }
    return {
      packageIdentifier: monthly.identifier,
      productIdentifier: monthly.product.identifier,
      localizedPrice: monthly.product.priceString,
      billingPeriod: monthly.product.subscriptionPeriod ?? 'P1M',
      trialDuration,
      trialEligible,
      rawPackage: monthly,
    };
  }

  async purchase(offer: StoreOffer): Promise<PurchaseResult> {
    await this.configure();
    const { default: Purchases, PURCHASES_ERROR_CODE } = await this.getModule();
    try {
      const result = await Purchases.purchasePackage(offer.rawPackage as Parameters<typeof Purchases.purchasePackage>[0]);
      if (!stateFromCustomerInfo(result.customerInfo).isActive) throw new Error('ENTITLEMENT_NOT_ACTIVE');
      return 'purchased';
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return 'cancelled';
      throw error;
    }
  }

  async restore(): Promise<EntitlementState> {
    await this.configure();
    const { default: Purchases } = await this.getModule();
    return stateFromCustomerInfo(await Purchases.restorePurchases());
  }

  async manageSubscription(): Promise<void> {
    try {
      await this.configure();
      const { default: Purchases } = await this.getModule();
      await Purchases.showManageSubscriptions();
    } catch {
      const url = Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
      await Linking.openURL(url);
    }
  }

  addEntitlementListener(listener: (state: EntitlementState) => void): () => void {
    let callback: ((info: CustomerInfo) => void) | undefined;
    void this.configure().then(async () => {
      const { default: Purchases } = await this.getModule();
      callback = (info) => listener(stateFromCustomerInfo(info));
      Purchases.addCustomerInfoUpdateListener(callback);
    }).catch(() => undefined);
    return () => {
      if (callback && this.module) this.module.default.removeCustomerInfoUpdateListener(callback);
    };
  }
}
