import { describe, expect, it } from 'vitest';

import {
  initialHomeTransition, reduceHomeTransition,
  type HomeTransitionEvent, type HomeTransitionState,
} from '../src/intro/homeTransitionState';

function apply(state: HomeTransitionState, ...events: HomeTransitionEvent[]) {
  return events.reduce(reduceHomeTransition, state);
}

function routing(id = 1) {
  return apply(initialHomeTransition, { type: 'start', id }, { type: 'complete', id });
}

describe('explicit Home transition', () => {
  it('requires both scene completion and destination readiness before revealing Today', () => {
    let state = reduceHomeTransition(initialHomeTransition, { type: 'start', id: 1 });
    expect(state.phase).toBe('playing');
    expect(reduceHomeTransition(state, { type: 'ready', id: 1 })).toBe(state);
    expect(reduceHomeTransition(state, { type: 'finished', id: 1 })).toBe(state);
    state = reduceHomeTransition(state, { type: 'complete', id: 1 });
    expect(state.phase).toBe('routing');
    expect(reduceHomeTransition(state, { type: 'finished', id: 1 })).toBe(state);
    state = reduceHomeTransition(state, { type: 'ready', id: 1 });
    expect(state.phase).toBe('fading');
    state = reduceHomeTransition(state, { type: 'finished', id: 1 });
    expect(state).toEqual({ ...initialHomeTransition, id: 1 });
  });

  it.each(['playing', 'routing', 'fading'] as const)(
    'coalesces repeated emblem presses while %s without restarting the scene', phase => {
      const state = { ...initialHomeTransition, id: 1, phase };
      expect(reduceHomeTransition(state, { type: 'start', id: 2 })).toBe(state);
      expect(reduceHomeTransition(state, { type: 'start', id: 1 })).toBe(state);
    },
  );

  it('waits for a slow destination without replaying the completed scene', () => {
    let state = routing();
    for (let i = 0; i < 20; i++) {
      const waiting = state;
      state = apply(state, { type: 'complete', id: 1 }, { type: 'not-ready', id: 1 });
      expect(state).toBe(waiting);
    }
    state = reduceHomeTransition(state, { type: 'ready', id: 1 });
    expect(state.phase).toBe('fading');
  });

  it('cancels a pending reveal when the destination becomes unready and rejects its late completion', () => {
    let state = reduceHomeTransition(routing(), { type: 'ready', id: 1 });
    state = reduceHomeTransition(state, { type: 'not-ready', id: 1 });
    expect(state.phase).toBe('routing');
    const waiting = state;
    expect(reduceHomeTransition(state, { type: 'finished', id: 1 })).toBe(waiting);
    state = reduceHomeTransition(state, { type: 'ready', id: 1 });
    expect(state.phase).toBe('fading');
    expect(reduceHomeTransition(state, { type: 'finished', id: 1 }).phase).toBe('idle');
  });

  it('permits an immediate reduced-motion scene completion while retaining the readiness gate', () => {
    let state = routing();
    expect(state.phase).toBe('routing');
    expect(reduceHomeTransition(state, { type: 'finished', id: 1 })).toBe(state);
    state = apply(state, { type: 'ready', id: 1 }, { type: 'finished', id: 1 });
    expect(state.phase).toBe('idle');
  });

  it('rejects callbacks from an older Home gesture throughout the next gesture', () => {
    const completed = apply(routing(), { type: 'ready', id: 1 }, { type: 'finished', id: 1 });
    let state = reduceHomeTransition(completed, { type: 'start', id: 2 });
    for (const phase of ['playing', 'routing', 'fading'] as const) {
      expect(state.phase).toBe(phase);
      for (const type of ['assembled', 'complete', 'ready', 'not-ready', 'finished'] as const) {
        expect(reduceHomeTransition(state, { type, id: 1 })).toBe(state);
      }
      if (phase === 'playing') state = reduceHomeTransition(state, { type: 'complete', id: 2 });
      else if (phase === 'routing') state = reduceHomeTransition(state, { type: 'ready', id: 2 });
    }
    expect(reduceHomeTransition(state, { type: 'finished', id: 2 })).toEqual({ ...initialHomeTransition, id: 2 });
  });

  it('does not reopen a completed transition in response to duplicated scene/readiness callbacks', () => {
    const done = apply(routing(), { type: 'ready', id: 1 }, { type: 'finished', id: 1 });
    for (const type of ['assembled', 'complete', 'ready', 'not-ready', 'finished', 'start'] as const) {
      expect(reduceHomeTransition(done, { type, id: 1 })).toBe(done);
    }
    expect(reduceHomeTransition(done, { type: 'start', id: 2 })).toEqual({ ...initialHomeTransition, id: 2, phase: 'playing' });
  });

  it('routes at assembly and latches an early Today frame without ending the visible hold', () => {
    let state = apply(initialHomeTransition, { type: 'start', id: 1 }, { type: 'assembled', id: 1 });
    expect(state).toMatchObject({ phase: 'routing', holdComplete: false, destinationReady: false });
    state = reduceHomeTransition(state, { type: 'ready', id: 1 });
    expect(state).toMatchObject({ phase: 'routing', holdComplete: false, destinationReady: true });
    expect(reduceHomeTransition(state, { type: 'finished', id: 1 })).toBe(state);
    expect(reduceHomeTransition(state, { type: 'assembled', id: 1 })).toBe(state);
    state = reduceHomeTransition(state, { type: 'complete', id: 1 });
    expect(state.phase).toBe('fading'); // no second routing/paint delay after hold end
  });

  it('keeps a completed hold while waiting for late Today and never starts another hold', () => {
    let state = apply(initialHomeTransition, { type: 'start', id: 1 },
      { type: 'assembled', id: 1 }, { type: 'complete', id: 1 });
    expect(state).toMatchObject({ phase: 'routing', holdComplete: true, destinationReady: false });
    for (let frame = 0; frame < 100; frame++) {
      expect(reduceHomeTransition(state, { type: 'assembled', id: 1 })).toBe(state);
      expect(reduceHomeTransition(state, { type: 'complete', id: 1 })).toBe(state);
    }
    state = reduceHomeTransition(state, { type: 'ready', id: 1 });
    expect(state.phase).toBe('fading');
  });

  it('invalidates an early ready frame during the hold without losing hold completion', () => {
    let state = apply(initialHomeTransition, { type: 'start', id: 1 },
      { type: 'assembled', id: 1 }, { type: 'ready', id: 1 }, { type: 'not-ready', id: 1 });
    expect(state).toMatchObject({ phase: 'routing', holdComplete: false, destinationReady: false });
    state = reduceHomeTransition(state, { type: 'complete', id: 1 });
    expect(state).toMatchObject({ phase: 'routing', holdComplete: true, destinationReady: false });
    expect(reduceHomeTransition(state, { type: 'ready', id: 1 }).phase).toBe('fading');
  });
});
