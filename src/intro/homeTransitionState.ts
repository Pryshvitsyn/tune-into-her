export interface HomeTransitionState { id: number; phase: 'idle' | 'playing' | 'routing' | 'fading' }
export type HomeTransitionEvent = { type: 'start'; id: number } | { type: 'complete' | 'ready' | 'not-ready' | 'finished'; id: number };
export const initialHomeTransition: HomeTransitionState = { id: 0, phase: 'idle' };
/** Explicit user replay, independent of the once-per-process cold-start latch. */
export function reduceHomeTransition(state: HomeTransitionState, event: HomeTransitionEvent): HomeTransitionState {
  if (event.type === 'start') return state.phase === 'idle' && event.id > state.id ? { id: event.id, phase: 'playing' } : state;
  if (event.id !== state.id) return state;
  if (event.type === 'complete' && state.phase === 'playing') return { ...state, phase: 'routing' };
  if (event.type === 'ready' && state.phase === 'routing') return { ...state, phase: 'fading' };
  if (event.type === 'not-ready' && state.phase === 'fading') return { ...state, phase: 'routing' };
  if (event.type === 'finished' && state.phase === 'fading') return { ...state, phase: 'idle' };
  return state;
}
