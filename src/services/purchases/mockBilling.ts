export function isMockBillingEnabled(
  isDevelopment: boolean,
  requested: string | undefined,
): boolean {
  return isDevelopment && requested === 'true';
}
