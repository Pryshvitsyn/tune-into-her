/** Startup presentation state only. Entitlement and onboarding decisions stay in AppContext/routes. */
export const LAUNCH_FADE_MS = 360;

export type LaunchPhase = 'preparing' | 'animating' | 'waiting' | 'error' | 'fading' | 'complete';
export type LaunchInitialization = 'loading' | 'ready' | 'error';
export interface LaunchState {
  firstFrameReady: boolean;
  frameKind: 'gpu' | 'fallback' | null;
  accessibilityReady: boolean;
  reducedMotion: boolean;
  active: boolean;
  sphereAssembled: boolean;
  /** GPU-owned visible-assembly hold has ended (or accessibility/fallback skipped it). */
  introComplete: boolean;
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
  | { type: 'intro-assembled' }
  | { type: 'intro-complete' }
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
    sphereAssembled: false,
    introComplete: false,
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

/** Prepare the real Today frame during the visible sphere hold, still behind the cover. */
export function shouldPrepareDestinationSpheres(state: Pick<LaunchState,
  'fadeComplete' | 'sphereAssembled' | 'introComplete' | 'reducedMotion' | 'rendererFailed'>): boolean {
  return state.fadeComplete || state.sphereAssembled || state.introComplete || state.reducedMotion || state.rendererFailed;
}

export function getLaunchPhase(state: LaunchState): LaunchPhase {
  // This is a process/session latch, never reset by navigation or AppState changes.
  if (state.fadeComplete) return 'complete';
  if (!state.firstFrameReady || !state.accessibilityReady) return 'preparing';
  if (!state.reducedMotion && !state.rendererFailed && !state.introComplete) return 'animating';
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
      };
    }
    case 'intro-assembled':
      return state.sphereAssembled ? state : { ...state, sphereAssembled: true };
    case 'intro-complete':
      return state.introComplete ? state : { ...state, introComplete: true };
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
      return { ...state, rendererFailed: true, introComplete: true };
    case 'fade-complete':
      return getLaunchPhase(state) === 'fading'
        && (event.attempt === undefined || event.attempt === state.attempt)
        && (event.key === undefined || event.key === state.destinationKey)
        ? { ...state, fadeComplete: true } : state;
  }
}
