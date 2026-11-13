// Tokens exist only in memory. They never become Router params or persisted history.
let pending: string | null = null;
const listeners = new Set<() => void>();
export function isRedemptionSchemeURL(path: string, scheme = process.env.EXPO_PUBLIC_REVENUECAT_REDEMPTION_SCHEME): boolean {
  if (!scheme || !/^rc-[a-z0-9-]+$/i.test(scheme)) return false;
  return path.toLowerCase().startsWith(`${scheme.toLowerCase()}:`);
}
export function enqueueRedemption(url: string): void {
  pending = url;
  listeners.forEach(listener => listener());
}
export function takeRedemption(): string | null {
  const result = pending;
  pending = null;
  return result;
}
export function subscribeRedemption(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
