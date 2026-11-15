export interface HomeTransitionState {
  id: number;
  phase: 'idle' | 'playing' | 'routing' | 'fading';
  holdComplete: boolean;
  destinationReady: boolean;
}
export type HomeTransitionEvent = { type: 'start'; id: number } | { type: 'assembled' | 'complete' | 'ready' | 'not-ready' | 'finished'; id: number };
export const initialHomeTransition: HomeTransitionState = { id: 0, phase: 'idle', holdComplete: false, destinationReady: false };
/** Explicit user replay, independent of the once-per-process cold-start latch. */
export function reduceHomeTransition(state: HomeTransitionState, event: HomeTransitionEvent): HomeTransitionState {
  if (event.type === 'start') return state.phase === 'idle' && event.id > state.id
    ? { ...initialHomeTransition, id: event.id, phase: 'playing' } : state;
  if (event.id !== state.id) return state;
  if (event.type === 'assembled' && state.phase === 'playing') return { ...state, phase: 'routing' };
  if (event.type === 'complete' && !state.holdComplete && (state.phase === 'playing' || state.phase === 'routing')) {
    return { ...state, holdComplete: true, phase: state.destinationReady ? 'fading' : 'routing' };
  }
  if (event.type === 'ready' && state.phase === 'routing' && !state.destinationReady) {
    return { ...state, destinationReady: true, phase: state.holdComplete ? 'fading' : 'routing' };
  }
  if (event.type === 'not-ready' && state.destinationReady && (state.phase === 'routing' || state.phase === 'fading')) {
    return { ...state, destinationReady: false, phase: 'routing' };
  }
  if (event.type === 'finished' && state.phase === 'fading') return { ...initialHomeTransition, id: state.id };
  return state;
}
