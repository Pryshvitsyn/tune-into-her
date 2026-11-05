import { describe, expect, it } from 'vitest';

import { DEMO_DAY_DURATION_MS } from '../src/domain/demo/acceleratedDemo';
import { demoNotificationCandidate, demoNotificationTarget } from '../src/domain/navigation/demoNotificationTarget';

const session = { runId: 'sample-run', startedAt: Date.parse('2024-03-08T12:00:00Z') };
const notification = { kind: 'accelerated-demo', runId: session.runId, demoDay: '2' };

describe('demo notification navigation', () => {
  it('opens the corresponding due demo day using the current session only', () => {
    expect(demoNotificationTarget(notification, session, session.startedAt + DEMO_DAY_DURATION_MS)).toEqual({
      pathname: '/demo', params: { runId: session.runId, day: '2' },
    });
    expect(demoNotificationTarget(notification, session, session.startedAt + 5 * DEMO_DAY_DURATION_MS)?.params.day).toBe('2');
  });

  it('ignores cancelled, old-run, unrelated, invalid and premature notifications', () => {
    const now = session.startedAt + DEMO_DAY_DURATION_MS;
    expect(demoNotificationTarget(notification, null, now)).toBeNull();
    expect(demoNotificationTarget({ ...notification, runId: 'old-run' }, session, now)).toBeNull();
    expect(demoNotificationTarget({ ...notification, kind: 'daily-cycle-cue' }, session, now)).toBeNull();
    for (const day of ['0', '31', '2bad', '2.5', '-1', 2, null]) {
      expect(demoNotificationTarget({ ...notification, demoDay: day }, session, now)).toBeNull();
    }
    expect(demoNotificationTarget(notification, session, session.startedAt)).toBeNull();
  });

  it('never trusts a URL from the notification payload', () => {
    expect(demoNotificationTarget({ ...notification, url: 'https://example.invalid' }, session, session.startedAt + DEMO_DAY_DURATION_MS)?.pathname).toBe('/demo');
  });

  it('retains only safe pending parameters through a failed storage read', () => {
    const pending = demoNotificationCandidate({ ...notification, url: 'https://example.invalid' });
    expect(pending).toEqual({ pathname: '/demo', params: { runId: session.runId, day: '2' } });
    expect(demoNotificationTarget(notification, { ...session, runId: 'replacement-run' }, session.startedAt + DEMO_DAY_DURATION_MS)).toBeNull();
    expect(demoNotificationCandidate({ ...notification, runId: '../other-route' })).toBeNull();
  });
});
