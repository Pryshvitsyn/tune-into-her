import { describe, expect, it } from 'vitest';

import { hasValidPreviousDestination, navigationForRoute } from '../src/navigation/screenNavigation';

describe('screen-owned fixed navigation', () => {
  it.each(['today', 'cycle', 'settings/index', '/today/', '/cycle/index', '/settings/index/'])(
    'keeps the primary navigation on %s', route => {
      expect(navigationForRoute(route)).toBe('primary');
    },
  );

  it.each(['index', '', '/', 'onboarding', 'demo', 'dev-qa', 'intro-preview'])(
    'does not add a competing footer to %s', route => {
      expect(navigationForRoute(route)).toBe('none');
    },
  );

  it.each([
    'privacy', 'terms', 'disclaimer', 'about', 'thea', 'history', 'paywall', 'redeem',
    'learn/[phase]', 'settings/appearance', 'settings/language', 'settings/reminder', 'settings/subscription',
  ])('uses the shared secondary footer on %s', route => {
    expect(navigationForRoute(route)).toBe('secondary');
  });

  it('classifies a kept-alive document by its owner route independently of the newly focused primary route', () => {
    expect(navigationForRoute('privacy')).toBe('secondary');
    expect(navigationForRoute('today')).toBe('primary');
    expect(navigationForRoute('privacy')).toBe('secondary');
  });
});

describe('safe secondary Back destination', () => {
  it('falls back to Today when no previous route exists', () => {
    expect(hasValidPreviousDestination(undefined)).toBe(false);
    expect(hasValidPreviousDestination({ routes: [] })).toBe(false);
    expect(hasValidPreviousDestination({ index: 0, routes: [{ name: 'privacy' }] })).toBe(false);
  });

  it.each(['index', '+not-found', '_sitemap'])(
    'does not back into the routing placeholder %s', previous => {
      expect(hasValidPreviousDestination({ index: 1, routes: [{ name: previous }, { name: 'privacy' }] })).toBe(false);
    },
  );

  it.each(['today', 'cycle', 'settings/index', 'settings/subscription', 'terms'])(
    'retains the actual previous destination %s', previous => {
      expect(hasValidPreviousDestination({ index: 1, routes: [{ name: previous }, { name: 'privacy' }] })).toBe(true);
    },
  );

  it('uses the active index rather than assuming that the final route is focused', () => {
    expect(hasValidPreviousDestination({ index: 1, routes: [{ name: 'today' }, { name: 'privacy' }, { name: 'index' }] })).toBe(true);
    expect(hasValidPreviousDestination({ index: 2, routes: [{ name: 'today' }, { name: 'index' }, { name: 'privacy' }] })).toBe(false);
  });
});
