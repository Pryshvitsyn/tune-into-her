import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => vi.resetModules());

describe('intro process lifetime', () => {
  it('consumes the launch before Today mounts and preserves it across repeated imports', async () => {
    const session = await import('../src/intro/introSession');
    expect(session.hasConsumedAppIntro()).toBe(false);
    session.markAppIntroConsumed();
    session.markAppIntroConsumed();
    const afterNavigation = await import('../src/intro/introSession');
    expect(afterNavigation.hasConsumedAppIntro()).toBe(true);
  });
  it('starts fresh in a new JS process rather than persisting consumption', async () => {
    const first = await import('../src/intro/introSession');
    first.markAppIntroConsumed();
    vi.resetModules();
    const afterColdStart = await import('../src/intro/introSession');
    expect(afterColdStart.hasConsumedAppIntro()).toBe(false);
  });
});
