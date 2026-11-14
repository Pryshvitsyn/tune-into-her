import { GUIDANCE_REFRESH_HOUR } from '../domain/content/guidanceDate';

/** Explicit synthetic time; never patches Date, performance or the device clock. */
export class ScenarioClock {
  private wall: number;
  private elapsed = 0;
  constructor(initial: number) {
    if (!Number.isSafeInteger(initial) || !Number.isFinite(new Date(initial).getTime())) throw new Error('QA_INVALID_TIME');
    this.wall = initial;
  }
  readonly now = (): number => this.wall;
  readonly monotonic = (): number => this.elapsed;
  advanceBy(milliseconds: number): void {
    if (!Number.isSafeInteger(milliseconds) || milliseconds < 0 || !Number.isSafeInteger(this.wall + milliseconds) || !Number.isFinite(new Date(this.wall + milliseconds).getTime())) throw new Error('QA_INVALID_ADVANCE');
    this.wall += milliseconds;
    this.elapsed += milliseconds;
  }
}

export function millisecondsToNextGuidanceBoundary(now: number): number {
  const next = new Date(now);
  if (!Number.isFinite(next.getTime())) throw new Error('QA_INVALID_TIME');
  next.setHours(GUIDANCE_REFRESH_HOUR, 0, 0, 0);
  if (next.getTime() <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now;
}
