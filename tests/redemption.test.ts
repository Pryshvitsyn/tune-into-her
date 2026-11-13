import type { CustomerInfo } from 'react-native-purchases';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RevenueCatPurchaseService } from '../src/services/purchases/RevenueCatPurchaseService';
import { isRedemptionURL } from '../src/services/purchases/paidAccess';

const sdk = vi.hoisted(() => ({
  configure: vi.fn(), setLogHandler: vi.fn(), setLogLevel: vi.fn(), LOG_LEVEL: { ERROR: 'ERROR' }, parseAsWebPurchaseRedemption: vi.fn(), redeemWebPurchase: vi.fn(),
  ENTITLEMENT_VERIFICATION_MODE: { INFORMATIONAL: 'INFORMATIONAL' },
}));
vi.mock('react-native', () => ({ Platform: { OS: 'ios', select: (values: Record<string, string>) => values.ios }, Linking: { openURL: vi.fn() } }));
vi.mock('expo-secure-store', () => ({ getItemAsync: vi.fn(async () => null), setItemAsync: vi.fn(async () => undefined) }));
vi.mock('react-native-purchases', () => ({ default: sdk }));


const link = 'rc-ownerconfig://redeem_web_purchase?redemption_token=never-log-this';
beforeEach(() => {
  vi.clearAllMocks();
  process.env.EXPO_PUBLIC_REVENUECAT_REDEMPTION_SCHEME = 'rc-ownerconfig';
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = 'appl_public';
  sdk.parseAsWebPurchaseRedemption.mockResolvedValue({ redemptionLink: link });
});

describe('web purchase proof', () => {
  it('requires the configured real RC scheme and expected route/token', () => {
    expect(isRedemptionURL(link, 'rc-ownerconfig')).toBe(true);
    expect(isRedemptionURL(link, undefined)).toBe(false);
    expect(isRedemptionURL(link, 'tuneintoher')).toBe(false);
    expect(isRedemptionURL('tuneintoher://success?premium=true', 'rc-ownerconfig')).toBe(false);
    expect(isRedemptionURL('https://attacker.example/success?redemption_token=x', 'rc-ownerconfig')).toBe(false);
    expect(isRedemptionURL('rc-ownerconfig://redeem_web_purchase', 'rc-ownerconfig')).toBe(false);
  });
  it.each([
    ['INVALID_TOKEN', 'invalid'], ['EXPIRED', 'expired'], ['PURCHASE_BELONGS_TO_OTHER_USER', 'already_redeemed'], ['ERROR', 'error'],
  ])('maps SDK %s without granting access', async (result, expected) => {
    sdk.redeemWebPurchase.mockResolvedValue({ result });
    expect(await new RevenueCatPurchaseService().redeemWebPurchase(link)).toBe(expected);
  });
  it('uses signed full_access from SDK success rather than a success redirect', async () => {
    const entitlement = { isActive: true, willRenew: true, expirationDate: new Date(Date.now() + 86400000).toISOString(), store: 'RC_BILLING', productIdentifier: 'web_annual', verification: 'VERIFIED' };
    const info = { requestDate: new Date().toISOString(), entitlements: { active: { full_access: entitlement }, all: { full_access: entitlement }, verification: 'VERIFIED' }, subscriptionsByProductIdentifier: {} } as unknown as CustomerInfo;
    sdk.redeemWebPurchase.mockResolvedValue({ result: 'SUCCESS', customerInfo: info });
    const service = new RevenueCatPurchaseService();
    expect(await service.redeemWebPurchase(link)).toBe('redeemed');
    expect(await service.redeemWebPurchase('tuneintoher://success?premium=true')).toBe('invalid');
    expect(sdk.redeemWebPurchase).toHaveBeenCalledTimes(1);
  });
});
