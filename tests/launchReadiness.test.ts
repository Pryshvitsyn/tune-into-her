import { describe, expect, it } from 'vitest';

import { launchDestinationKey } from '../src/intro/launchRouting';
import { createLaunchState, getLaunchPhase, LAUNCH_HOLD_MS, reduceLaunch, type LaunchState } from '../src/intro/launchState';

function readyToFade(pathname = '/today', hasAccess = false): LaunchState {
  const key = launchDestinationKey(0, pathname, hasAccess);
  let state = createLaunchState();
  state = reduceLaunch(state, { type: 'first-frame', kind: 'gpu' });
  state = reduceLaunch(state, { type: 'accessibility', reducedMotion: false });
  state = reduceLaunch(state, { type: 'initialization', status: 'ready', attempt: 0 });
  state = reduceLaunch(state, { type: 'destination-selected', attempt: 0, key });
  state = reduceLaunch(state, { type: 'destination-ready', attempt: 0, key });
  state = reduceLaunch(state, { type: 'intro-complete' });
  return reduceLaunch(state, { type: 'tick', deltaMs: LAUNCH_HOLD_MS });
}

describe('destination readiness generations', () => {
  it('waits for the real guidance frame after a late paid/trial activation replaces the locked Today', () => {
    let state = readyToFade();
    expect(getLaunchPhase(state)).toBe('fading');
    const locked = state.destinationKey;
    const full = launchDestinationKey(0, '/today', true);
    // Same route, new access mode: the previously painted locked screen is no longer sufficient.
    state = reduceLaunch(state, { type: 'destination-selected', attempt: 0, key: full });
    expect(getLaunchPhase(state)).toBe('waiting');
    state = reduceLaunch(state, { type: 'destination-ready', attempt: 0, key: locked });
    expect(getLaunchPhase(state)).toBe('waiting');
    expect(state.holdElapsedMs).toBe(LAUNCH_HOLD_MS);
    state = reduceLaunch(state, { type: 'destination-ready', attempt: 0, key: full });
    expect(getLaunchPhase(state)).toBe('fading'); // no repeated intro or extra fixed hold
  });

  it('rejects the old native fade completion even after a new destination is ready', () => {
    let state = readyToFade();
    const oldKey = state.destinationKey;
    const newKey = launchDestinationKey(0, '/settings', false);
    state = reduceLaunch(state, { type: 'destination-selected', attempt: 0, key: newKey });
    state = reduceLaunch(state, { type: 'destination-ready', attempt: 0, key: newKey });
    expect(getLaunchPhase(state)).toBe('fading');
    state = reduceLaunch(state, { type: 'fade-complete', attempt: 0, key: oldKey });
    expect(getLaunchPhase(state)).toBe('fading');
    state = reduceLaunch(state, { type: 'fade-complete', attempt: 0, key: newKey });
    expect(getLaunchPhase(state)).toBe('complete');
  });

  it('invalidates a painted full-access Today when paid/trial access ends before reveal', () => {
    let state = readyToFade('/today', true);
    const locked = launchDestinationKey(0, '/today', false);
    state = reduceLaunch(state, { type: 'destination-selected', attempt: 0, key: locked });
    expect(getLaunchPhase(state)).toBe('waiting');
    expect(state.destinationReady).toBe(false);
    state = reduceLaunch(state, { type: 'destination-ready', attempt: 0, key: locked });
    expect(getLaunchPhase(state)).toBe('fading');
  });

  it('rejects callbacks from a previous initialization retry while preserving completed choreography', () => {
    let state = readyToFade();
    const oldKey = state.destinationKey;
    state = reduceLaunch(state, { type: 'retry' });
    const nextKey = launchDestinationKey(1, '/today', false);
    state = reduceLaunch(state, { type: 'destination-selected', attempt: 1, key: nextKey });
    state = reduceLaunch(state, { type: 'initialization', attempt: 1, status: 'ready' });
    state = reduceLaunch(state, { type: 'destination-ready', attempt: 0, key: oldKey });
    expect(getLaunchPhase(state)).toBe('waiting');
    state = reduceLaunch(state, { type: 'destination-ready', attempt: 1, key: nextKey });
    expect(getLaunchPhase(state)).toBe('fading');
    expect(state.holdElapsedMs).toBe(LAUNCH_HOLD_MS);
  });

  it('waits for a new selected-day frame when midnight invalidates the same-route content', () => {
    let state = readyToFade('/today', true);
    const key = state.destinationKey;
    state = reduceLaunch(state, { type: 'destination-not-ready', attempt: 0, key });
    expect(getLaunchPhase(state)).toBe('waiting');
    state = reduceLaunch(state, { type: 'fade-complete', attempt: 0, key });
    expect(getLaunchPhase(state)).toBe('waiting');
    state = reduceLaunch(state, { type: 'destination-ready', attempt: 0, key });
    expect(getLaunchPhase(state)).toBe('fading');
    expect(state.holdElapsedMs).toBe(LAUNCH_HOLD_MS);
  });

  it('ignores invalidation from an old destination or initialization attempt', () => {
    const state = readyToFade('/today', true);
    expect(reduceLaunch(state, { type: 'destination-not-ready', attempt: 1, key: state.destinationKey })).toBe(state);
    expect(reduceLaunch(state, { type: 'destination-not-ready', attempt: 0, key: launchDestinationKey(0, '/today', false) })).toBe(state);
  });

  it('does not invalidate generic screens for an unrelated access update or reopen after completion', () => {
    expect(launchDestinationKey(0, '/settings', false)).toBe(launchDestinationKey(0, '/settings', true));
    let state = readyToFade('/settings');
    state = reduceLaunch(state, { type: 'fade-complete', attempt: 0, key: state.destinationKey });
    const complete = state;
    state = reduceLaunch(state, { type: 'destination-selected', attempt: 0, key: launchDestinationKey(0, '/today', true) });
    expect(state).toBe(complete);
  });
});
