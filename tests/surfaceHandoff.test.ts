import { describe, expect, it } from 'vitest';

import { advanceSurfaceHandoff, type SurfaceHandoffStage } from '../src/intro/surfaceHandoff';

describe('native cover to GPU ownership', () => {
  it('keeps two GPU paints covered, reveals once, then releases after the next UI frame', () => {
    let stage: SurfaceHandoffStage = 1;
    const frames = Array.from({ length: 5 }, () => {
      const next = advanceSurfaceHandoff(stage, true);
      stage = next.stage;
      return { covered: stage < 4, release: next.release };
    });
    expect(frames).toEqual([
      { covered: true, release: false },
      { covered: true, release: false },
      { covered: false, release: false },
      { covered: false, release: true },
      { covered: false, release: false },
    ]);
  });

  it('does not count inactive frames and resumes the pending ownership transfer', () => {
    const painted = advanceSurfaceHandoff(1, true);
    expect(advanceSurfaceHandoff(painted.stage, false)).toEqual({ stage: 2, release: false });
    expect(advanceSurfaceHandoff(4, false)).toEqual({ stage: 4, release: false });
    expect(advanceSurfaceHandoff(4, true)).toEqual({ stage: 5, release: true });
  });

  it('cannot release an unprepared, failed/reset or already committed surface', () => {
    for (const active of [true, false]) {
      expect(advanceSurfaceHandoff(0, active)).toEqual({ stage: 0, release: false });
      expect(advanceSurfaceHandoff(5, active)).toEqual({ stage: 5, release: false });
    }
  });
});
