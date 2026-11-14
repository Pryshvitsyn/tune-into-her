/** Startup presentation state only. Entitlement and onboarding decisions stay in AppContext/routes. */
export const LAUNCH_HOLD_MS = 1000;
export const LAUNCH_FADE_MS = 360;

export type LaunchPhase = 'preparing' | 'animating' | 'holding' | 'waiting' | 'error' | 'fading' | 'complete';
export type LaunchInitialization = 'loading' | 'ready' | 'error';
export interface LaunchState {
  firstFrameReady: boolean;
  frameKind: 'gpu' | 'fallback' | null;
  accessibilityReady: boolean;
  reducedMotion: boolean;
  active: boolean;
  introComplete: boolean;
  holdElapsedMs: number;
  initialization: LaunchInitialization;
  attempt: number;
  destinationReady: boolean;
  destinationKey: string;
  rendererFailed: boolean;
  fadeComplete: boolean;
}
export type LaunchEvent =
  | { type: 'first-frame'; kind: 'gpu' | 'fallback' }
  | { type: 'accessibility'; reducedMotion: boolean; screenReader?: boolean }
  | { type: 'intro-complete' }
  | { type: 'tick'; deltaMs: number }
  | { type: 'active'; value: boolean }
  | { type: 'initialization'; status: LaunchInitialization; attempt: number }
  | { type: 'destination-selected'; attempt: number; key: string }
  | { type: 'destination-ready'; attempt: number; key?: string }
  | { type: 'destination-not-ready'; attempt: number; key: string }
  | { type: 'renderer-failed' }
  | { type: 'retry' }
  | { type: 'fade-complete'; attempt?: number; key?: string };

export function createLaunchState(active = true): LaunchState {
  return {
    firstFrameReady: false,
    frameKind: null,
    accessibilityReady: false,
    reducedMotion: false,
    active,
    introComplete: false,
    holdElapsedMs: 0,
    initialization: 'loading',
    attempt: 0,
    destinationReady: false,
    destinationKey: '',
    rendererFailed: false,
    fadeComplete: false,
  };
}

/** Turning motion back on cannot revive a sequence that this launch already skipped. */
export function shouldAnimateLaunch(state: Pick<LaunchState, 'introComplete'>): boolean {
  return !state.introComplete;
}

export function getLaunchPhase(state: LaunchState): LaunchPhase {
  // This is a process/session latch, never reset by navigation or AppState changes.
  if (state.fadeComplete) return 'complete';
  if (!state.firstFrameReady || !state.accessibilityReady) return 'preparing';
  if (!state.reducedMotion && !state.rendererFailed) {
    if (!state.introComplete) return 'animating';
    if (state.holdElapsedMs < LAUNCH_HOLD_MS) return 'holding';
  }
  // Error/retry controls cannot cover the approved full-motion choreography.
  if (state.initialization === 'error') return 'error';
  if (state.initialization !== 'ready' || !state.destinationReady || !state.active) return 'waiting';
  return 'fading';
}

export function reduceLaunch(state: LaunchState, event: LaunchEvent): LaunchState {
  if (state.fadeComplete) return state;
  switch (event.type) {
    case 'first-frame':
      return { ...state, firstFrameReady: true, frameKind: event.kind === 'gpu' ? 'gpu' : state.frameKind ?? 'fallback' };
    case 'accessibility': {
      const reducedMotion = event.reducedMotion || Boolean(event.screenReader);
      return {
        ...state, accessibilityReady: true, reducedMotion,
        // A live preference change must not later replay a sequence already skipped.
        introComplete: state.introComplete || reducedMotion,
        holdElapsedMs: reducedMotion ? LAUNCH_HOLD_MS : state.holdElapsedMs,
      };
    }
    case 'intro-complete':
      return state.introComplete ? state : { ...state, introComplete: true };
    case 'tick': {
      if (!state.active || getLaunchPhase(state) !== 'holding' || !Number.isFinite(event.deltaMs) || event.deltaMs <= 0) return state;
      return { ...state, holdElapsedMs: Math.min(LAUNCH_HOLD_MS, state.holdElapsedMs + event.deltaMs) };
    }
    case 'active':
      return state.active === event.value ? state : { ...state, active: event.value };
    case 'initialization':
      return event.attempt === state.attempt ? { ...state, initialization: event.status } : state;
    case 'destination-selected':
      return event.attempt === state.attempt && event.key !== state.destinationKey
        ? { ...state, destinationKey: event.key, destinationReady: false } : state;
    case 'destination-ready':
      return event.attempt === state.attempt && (event.key === undefined || event.key === state.destinationKey)
        ? { ...state, destinationReady: true } : state;
    case 'destination-not-ready':
      return event.attempt === state.attempt && event.key === state.destinationKey && state.destinationReady
        ? { ...state, destinationReady: false } : state;
    case 'retry':
      return { ...state, attempt: state.attempt + 1, initialization: 'loading', destinationReady: false };
    case 'renderer-failed':
      return { ...state, rendererFailed: true, introComplete: true, holdElapsedMs: LAUNCH_HOLD_MS };
    case 'fade-complete':
      return getLaunchPhase(state) === 'fading'
        && (event.attempt === undefined || event.attempt === state.attempt)
        && (event.key === undefined || event.key === state.destinationKey)
        ? { ...state, fadeComplete: true } : state;
  }
}

/** Feed performance.now() at each frame AND each AppState edge; hidden time never becomes hold time. */
export class ForegroundLaunchClock {
  private previous: number | null = null;
  private wasActive = false;

  sample(now: number, active: boolean): number {
    if (!Number.isFinite(now)) {
      this.previous = null;
      this.wasActive = active;
      return 0;
    }
    const current = Math.max(this.previous ?? now, now);
    const elapsed = active && this.wasActive && this.previous !== null ? current - this.previous : 0;
    this.previous = current;
    this.wasActive = active;
    return elapsed;
  }
}
