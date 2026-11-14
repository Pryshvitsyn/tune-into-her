export type ScreenNavigation = 'primary' | 'secondary' | 'none';
/** Route ownership is stable even when another kept-alive page is focused. */
export function navigationForRoute(name: string): ScreenNavigation {
  const path = '/' + name.replace(/^\/+|\/+$/g, '').replace(/\/index$/, '');
  if (['/today', '/cycle', '/settings'].includes(path)) return 'primary';
  if (['/index', '/', '/onboarding', '/demo', '/dev-qa', '/intro-preview'].includes(path)) return 'none';
  return 'secondary';
}
export function hasValidPreviousDestination(state: { index?: number; routes: readonly { name: string }[] } | undefined): boolean {
  const index = state?.index ?? 0;
  const previous = index > 0 ? state?.routes[index - 1] : undefined;
  return Boolean(previous && !['index', '+not-found', '_sitemap'].includes(previous.name));
}
