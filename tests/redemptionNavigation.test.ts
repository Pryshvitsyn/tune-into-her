import { afterEach, describe, expect, it, vi } from 'vitest';

import { redirectSystemPath } from '../app/+native-intent';
import { enqueueRedemption, isRedemptionSchemeURL, subscribeRedemption, takeRedemption } from '../src/domain/billing/redemptionInbox';

afterEach(() => { takeRedemption(); vi.unstubAllEnvs(); });
describe('native web redemption routing', () => {
  it('retains a cold-start link only in memory and strips it from navigation', () => {
    vi.stubEnv('EXPO_PUBLIC_REVENUECAT_REDEMPTION_SCHEME', 'rc-configured');
    const link = 'rc-configured://redeem_web_purchase?redemption_token=secret';
    expect(redirectSystemPath({ path: link, initial: true })).toBe('/redeem');
    expect(takeRedemption()).toBe(link);
    expect(takeRedemption()).toBeNull();
  });
  it('notifies an open screen, and consumes a delivered link once', () => {
    const listener = vi.fn();
    const stop = subscribeRedemption(listener);
    enqueueRedemption('private');
    expect(listener).toHaveBeenCalledOnce();
    expect(takeRedemption()).toBe('private');
    stop(); enqueueRedemption('next');
    expect(listener).toHaveBeenCalledOnce();
  });
  it('strips token-bearing invalid links without delivering them to the SDK', () => {
    expect(redirectSystemPath({ path: 'rc-old://redeem_web_purchase?redemption_token=secret', initial: true })).toBe('/redeem');
    expect(redirectSystemPath({ path: 'tuneintoher://success?redemption_token=secret', initial: false })).toBe('/redeem');
    expect(takeRedemption()).toBeNull();
  });
  it('does not treat a success URL, lookalike prefix or unknown scheme as proof', () => {
    expect(isRedemptionSchemeURL('https://example.test/success?premium=true', 'rc-configured')).toBe(false);
    expect(isRedemptionSchemeURL('rc-configured-evil://redeem_web_purchase', 'rc-configured')).toBe(false);
    expect(isRedemptionSchemeURL('tuneintoher://success', undefined)).toBe(false);
  });
});
