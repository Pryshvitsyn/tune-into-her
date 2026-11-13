import { spawnSync } from 'node:child_process';

import { billingConfigIssues, nativeRedemptionIssues } from './billing-config.mjs';

const profile = process.env.EAS_BUILD_PROFILE;
if (profile === 'production') {
  const result = spawnSync(process.execPath, ['scripts/release-check.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
if (profile === 'billing-test') {
  const issues = billingConfigIssues(process.env, { platform: process.env.EAS_BUILD_PLATFORM });
  issues.push(...await nativeRedemptionIssues(process.env, { platform: process.env.EAS_BUILD_PLATFORM }));
  if (process.env.EXPO_PUBLIC_BILLING_ENVIRONMENT !== 'sandbox') issues.push('billing-test requires sandbox environment.');
  if (issues.length) {
    console.error('BILLING TEST CONFIGURATION INCOMPLETE\n' + issues.map(issue => '• ' + issue).join('\n'));
    process.exitCode = 1;
  }
}
