import { describe, expect, it } from 'vitest';

import { billingConfigIssues, nativeRedemptionIssues } from '../scripts/billing-config.mjs';

const valid = {
  EXPO_PUBLIC_BILLING_ENVIRONMENT: 'production',
  EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: 'appl_fixture',
  EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY: 'goog_fixture',
  EXPO_PUBLIC_TRIAL_API_URL: 'https://trial.fixture.test',
};
describe('distribution billing preflight', () => {
  it('requires the configured redemption scheme in the tracked iOS target while allowing an Android-only build', async () => {
    const env = { ...valid, EXPO_PUBLIC_REVENUECAT_REDEMPTION_SCHEME: 'rc-preflight-missing-fixture' };
    expect(await nativeRedemptionIssues(env, { platform: 'ios' })).toHaveLength(1);
    expect(await nativeRedemptionIssues(env, { platform: 'android' })).toEqual([]);
  });
  it('accepts platform public keys without mistaking legitimate store sandbox transactions for Test Store keys', () => {
    expect(billingConfigIssues(valid, { production: true })).toEqual([]);
    expect(billingConfigIssues({ ...valid, EXPO_PUBLIC_BILLING_ENVIRONMENT: 'sandbox' })).toEqual([]);
  });
  it('blocks production mocks, Test Store keys and wrong environment without printing secrets', () => {
    const issues = billingConfigIssues({ ...valid, EXPO_PUBLIC_USE_MOCK_BILLING: 'true', EXPO_PUBLIC_BILLING_ENVIRONMENT: 'sandbox', EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: 'test_sensitive', EXPO_PUBLIC_STRIPE_SECRET: 'sk_sensitive' }, { production: true });
    expect(issues.length).toBeGreaterThanOrEqual(4);
    expect(issues.join(' ')).not.toContain('sensitive');
  });
  it('requires deployed HTTPS trial service and real platform keys', () => {
    expect(billingConfigIssues({ ...valid, EXPO_PUBLIC_TRIAL_API_URL: 'http://localhost:8787', EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY: '' }, { production: true })).toHaveLength(2);
  });
  it('checks only a selected build platform and requires actual web scheme if requested', () => {
    expect(billingConfigIssues({ ...valid, EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY: undefined }, { production: true, platform: 'ios' })).toEqual([]);
    expect(billingConfigIssues({ ...valid, BILLING_REQUIRE_WEB_REDEMPTION: 'true', EXPO_PUBLIC_REVENUECAT_REDEMPTION_SCHEME: 'tuneintoher' }, { production: true })).toHaveLength(1);
  });
});
