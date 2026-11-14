import { describe, expect, it } from 'vitest';

import { todayEntry } from '../src/domain/navigation/todayEntry';

const saved = { ready: true, onboardingComplete: true, hasCycleSettings: true, hasAccess: true };
describe('Today warm Home setup/access policy', () => {
  it('waits for real persisted settings before deciding what to show', () => {
    expect(todayEntry({ ...saved, ready: false })).toBe('loading');
  });
  it.each([false, true])('never creates cycle information for a fresh user, access=%s', hasAccess => {
    expect(todayEntry({ ...saved, hasCycleSettings: false, onboardingComplete: false, hasAccess })).toBe('setup');
    expect(todayEntry({ ...saved, hasCycleSettings: false, hasAccess })).toBe('setup');
  });
  it('keeps retained paid access separate from onboarding consent after local reset', () => {
    const reset = { ...saved, onboardingComplete: false, hasCycleSettings: false };
    expect(todayEntry(reset)).toBe('setup');
    const manuallySavedDate = { ...reset, hasCycleSettings: true };
    expect(todayEntry(manuallySavedDate)).toBe('setup');
    expect(todayEntry({ ...manuallySavedDate, onboardingComplete: true })).toBe('guidance');
  });
  it('does not unlock a fully configured user without verified paid or app-trial access', () => {
    expect(todayEntry({ ...saved, hasAccess: false })).toBe('locked');
    expect(todayEntry(saved)).toBe('guidance');
  });
});
