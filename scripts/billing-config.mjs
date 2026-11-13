import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

// Pure build-time validation. Never print environment values or credentials.
export function billingConfigIssues(env, { production = false, platform } = {}) {
  const issues = [];
  if (!['sandbox', 'production'].includes(env.EXPO_PUBLIC_BILLING_ENVIRONMENT)) {
    issues.push('Set EXPO_PUBLIC_BILLING_ENVIRONMENT to sandbox or production.');
  } else if (production && env.EXPO_PUBLIC_BILLING_ENVIRONMENT !== 'production') {
    issues.push('Production builds require the production billing environment.');
  }
  if (env.EXPO_PUBLIC_USE_MOCK_BILLING === 'true') issues.push('Mock billing must be disabled for distribution.');
  if (env.EXPO_PUBLIC_ACCELERATED_DEMO === 'true') issues.push('Accelerated demo must be disabled for billing/store builds.');
  const platforms = platform === 'ios' ? ['IOS'] : platform === 'android' ? ['ANDROID'] : ['IOS', 'ANDROID'];
  for (const value of platforms) {
    const key = env[`EXPO_PUBLIC_REVENUECAT_${value}_API_KEY`] ?? '';
    const expected = value === 'IOS' ? 'appl_' : 'goog_';
    if (!key) issues.push(`Missing public RevenueCat ${value} SDK key.`);
    else if (!key.startsWith(expected) && !(key.startsWith('test_') && !production)) {
      issues.push(`RevenueCat ${value} key must be a public platform SDK key${production ? '; Test Store keys are forbidden in production' : ' (Test Store is not store sandbox proof)'}.`);
    }
    if (/placeholder|replace|example/i.test(key)) issues.push(`Replace placeholder RevenueCat ${value} SDK key.`);
  }
  try {
    const url = new URL(env.EXPO_PUBLIC_TRIAL_API_URL ?? '');
    if (url.protocol !== 'https:' || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(url.hostname) || /(^|\.)(example\.com|invalid)$/.test(url.hostname) || url.username || url.password || url.search || url.hash) {
      issues.push('Trial API must be a deployed HTTPS origin/path without credentials or query.');
    }
  } catch {
    issues.push('Set EXPO_PUBLIC_TRIAL_API_URL to the deployed isolated trial service.');
  }
  if ((env.BILLING_REQUIRE_WEB_REDEMPTION === 'true' || env.EXPO_PUBLIC_REVENUECAT_REDEMPTION_SCHEME) && !/^rc-[a-z0-9-]+$/i.test(env.EXPO_PUBLIC_REVENUECAT_REDEMPTION_SCHEME ?? '')) {
    issues.push('Copy the actual RevenueCat Redemption Links scheme before enabling web redemption.');
  }
  for (const [name, value] of Object.entries(env)) {
    if (name.startsWith('EXPO_PUBLIC_') && (/SECRET|PRIVATE_KEY|SERVICE_ACCOUNT|SIGNING|CREDENTIAL|TOKEN/.test(name) || /^(sk_|rk_|whsec_|-----BEGIN)/.test(value ?? ''))) {
      issues.push(`Remove server-only credential from public build variable ${name}.`);
    }
  }
  return issues;
}

// This repository tracks ios/. Dynamic Expo config alone does not update that native target.
export async function nativeRedemptionIssues(env, { platform } = {}) {
  const scheme = env.EXPO_PUBLIC_REVENUECAT_REDEMPTION_SCHEME;
  if (!scheme || platform === 'android' || !existsSync('ios')) return [];
  try {
    const plist = await readFile('ios/TuneIntoHer/Info.plist', 'utf8');
    const urlSchemeArrays = plist.match(/<key>CFBundleURLSchemes<\/key>\s*<array>[\s\S]*?<\/array>/g) ?? [];
    if (urlSchemeArrays.some(array => array.includes(`<string>${scheme}</string>`))) return [];
  } catch { /* Missing native configuration is a build gate, without disclosing values. */ }
  return ['Tracked iOS Info.plist lacks the configured RevenueCat redemption scheme. Run reviewed iOS prebuild, then rebuild the native binary.'];
}
