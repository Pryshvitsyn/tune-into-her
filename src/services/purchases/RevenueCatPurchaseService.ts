import { Linking, Platform } from "react-native";

import { ENTITLEMENT_ID, YEARLY_SUBSCRIPTION_PRODUCT_ID } from "../../config/constants";

import type { EntitlementState, PurchaseResult, PurchaseService, StoreOffer } from "./types";

type RevenueCatModule = typeof import("react-native-purchases");
type CustomerInfo = Awaited<ReturnType<RevenueCatModule["default"]["getCustomerInfo"]>>;

function stateFromCustomerInfo(info: CustomerInfo): EntitlementState {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement) {
    const previous = info.entitlements.all[ENTITLEMENT_ID];
    return previous?.expirationDate && Date.parse(previous.expirationDate) <= Date.now()
      ? { status: "expired", isActive: false, expirationDate: previous.expirationDate, isMock: false }
      : { status: "inactive", isActive: false, isMock: false };
  }
  if (entitlement.productIdentifier !== YEARLY_SUBSCRIPTION_PRODUCT_ID) {
    return { status: "error", isActive: false, isMock: false, error: "YEARLY_PRODUCT_MISMATCH" };
  }
  const expirationDate = entitlement.expirationDate ?? undefined;
  if (!expirationDate) {
    return { status: "error", isActive: false, isMock: false, error: "YEARLY_SUBSCRIPTION_EXPIRATION_MISSING" };
  }
  if (Date.parse(expirationDate) <= Date.now()) {
    return { status: "expired", isActive: false, expirationDate, isMock: false };
  }
  return { status: "active", isActive: true, expirationDate, willRenew: entitlement.willRenew, isTrial: entitlement.periodType === "TRIAL", isMock: false };
}

export class RevenueCatPurchaseService implements PurchaseService {
  private module: RevenueCatModule | null = null;
  private configured = false;

  private async getModule(): Promise<RevenueCatModule> {
    this.module ??= await import("react-native-purchases");
    return this.module;
  }

  async configure(): Promise<void> {
    if (this.configured) return;
    const apiKey = Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    });
    if (!apiKey) throw new Error("REVENUECAT_API_KEY_MISSING");
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
      return { status: "error", isActive: false, isMock: false, error: error instanceof Error ? error.message : "UNKNOWN_PURCHASE_ERROR" };
    }
  }

  async getOffer(): Promise<StoreOffer | null> {
    await this.configure();
    const { default: Purchases } = await this.getModule();
    const offering = (await Purchases.getOfferings()).current;
    const yearlyPackage = offering?.availablePackages.find(({ product }) =>
      product.identifier === YEARLY_SUBSCRIPTION_PRODUCT_ID
      && product.productType === "AUTO_RENEWABLE_SUBSCRIPTION"
      && product.subscriptionPeriod === "P1Y"
    );
    if (!yearlyPackage) return null;

    const intro = yearlyPackage.product.introPrice;
    const androidFreePhase = yearlyPackage.product.defaultOption?.freePhase;
    const hasFourteenDayTrial = Platform.OS === "android"
      ? androidFreePhase?.billingPeriod.iso8601 === "P14D"
      : intro?.price === 0 && intro.periodNumberOfUnits === 14 && intro.periodUnit === "DAY";
    let trialEligible = false;
    if (hasFourteenDayTrial && Platform.OS === "android") {
      trialEligible = true;
    } else if (hasFourteenDayTrial) {
      const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility([yearlyPackage.product.identifier]);
      trialEligible = eligibility[yearlyPackage.product.identifier]?.status === Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE;
    }

    return {
      packageIdentifier: yearlyPackage.identifier,
      productIdentifier: yearlyPackage.product.identifier,
      localizedPrice: yearlyPackage.product.priceString,
      billingPeriod: "P1Y",
      isAutoRenewing: true,
      trialDuration: hasFourteenDayTrial ? "P14D" : undefined,
      trialEligible,
      rawPackage: yearlyPackage,
    };
  }

  async purchase(offer: StoreOffer): Promise<PurchaseResult> {
    await this.configure();
    const { default: Purchases, PURCHASES_ERROR_CODE } = await this.getModule();
    try {
      const result = await Purchases.purchasePackage(offer.rawPackage as Parameters<typeof Purchases.purchasePackage>[0]);
      if (!stateFromCustomerInfo(result.customerInfo).isActive) throw new Error("YEARLY_SUBSCRIPTION_ENTITLEMENT_NOT_ACTIVE");
      return "purchased";
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return "cancelled";
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
      const url = Platform.OS === "ios"
        ? "https://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions";
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
