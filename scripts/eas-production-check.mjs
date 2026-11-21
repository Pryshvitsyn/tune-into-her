import { spawnSync } from 'node:child_process';

import { billingConfigIssues, nativeRedemptionIssues, privateQAEntryConfigured } from './billing-config.mjs';

const profile = process.env.EAS_BUILD_PROFILE;
if (profile === 'native-audit') {
  if (process.env.EAS_BUILD_PLATFORM !== 'android' || process.env.TIH_NATIVE_ARTIFACT_AUDIT !== '1' || process.env.EXPO_PUBLIC_ACCELERATED_DEMO !== 'false' || process.env.EXPO_PUBLIC_USE_MOCK_BILLING !== 'false' || process.env.EXPO_PUBLIC_BILLING_ENVIRONMENT !== 'sandbox' || privateQAEntryConfigured(process.env)) {
    console.error('Native audit requires explicit Android-only sandbox, normal entry and demo/mocks disabled.');
    process.exitCode = 1;
  } else {
    console.log('NATIVE BINARY AUDIT ONLY: no upload credentials, store approval, configured trial or real purchase is implied. Normal app access stays gated.');
  }
}
if (profile === 'production') {
  const result = spawnSync(process.execPath, ['scripts/release-check.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
if (profile === 'billing-test') {
  const issues = billingConfigIssues(process.env, { storeDistribution: true, platform: process.env.EAS_BUILD_PLATFORM });
  issues.push(...await nativeRedemptionIssues(process.env, { platform: process.env.EAS_BUILD_PLATFORM }));
  if (process.env.EXPO_PUBLIC_BILLING_ENVIRONMENT !== 'sandbox') issues.push('billing-test requires sandbox environment.');
  if (issues.length) {
    console.error('BILLING TEST CONFIGURATION INCOMPLETE\n' + issues.map(issue => '• ' + issue).join('\n'));
    process.exitCode = 1;
  }
}
