import { describe, expect, it } from 'vitest';

import { launchRouteState } from '../src/intro/launchRouting';

const existing = { localReady: true, accessReady: true, onboardingComplete: true, hasCycleSettings: true, pathname: '/today' };
describe('startup routing readiness', () => {
  it('never interprets not-yet-loaded local data as a new user', () => {
    expect(launchRouteState({ ...existing, localReady: false, hasCycleSettings: false })).toBe('loading');
  });
  it('requires onboarding before revealing a cold protected deep link', () => {
    expect(launchRouteState({ ...existing, onboardingComplete: false })).toBe('onboarding');
    expect(launchRouteState({ ...existing, hasCycleSettings: false })).toBe('onboarding');
  });
  it('does not make a new onboarding user wait for an unrelated billing request', () => {
    expect(launchRouteState({ ...existing, pathname: '/onboarding', onboardingComplete: false, hasCycleSettings: false, accessReady: false })).toBe('ready');
  });
  it('waits for known access before existing entry, then retains the existing Today access gate', () => {
    expect(launchRouteState({ ...existing, accessReady: false })).toBe('loading');
    expect(launchRouteState(existing)).toBe('ready');
    expect(launchRouteState({ ...existing, pathname: '/' })).toBe('loading');
  });
});
