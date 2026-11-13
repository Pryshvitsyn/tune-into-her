import { enqueueRedemption, isRedemptionSchemeURL } from '../src/domain/billing/redemptionInbox';

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  if (isRedemptionSchemeURL(path)) {
    enqueueRedemption(path);
    return '/redeem';
  }
  // Invalid/old schemes must not leak a token into unmatched-route logs or params.
  if (/^rc-[a-z0-9-]+:/i.test(path) || /[?&]redemption_token=/i.test(path)) return '/redeem';
  return path;
}
