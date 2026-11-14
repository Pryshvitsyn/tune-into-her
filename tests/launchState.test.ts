import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  createLaunchState, ForegroundLaunchClock, getLaunchPhase, LAUNCH_HOLD_MS,
  reduceLaunch, type LaunchEvent, type LaunchState,
} from '../src/intro/launchState';
import { DEPTH_LAYERS, INTRO_MS, sceneAt } from '../src/intro/timeline';

const send = (state: LaunchState, ...events: LaunchEvent[]) => events.reduce(reduceLaunch, state);
const visible = () => send(createLaunchState(),
  { type: 'first-frame', kind: 'gpu' },
  { type: 'accessibility', reducedMotion: false });
const prepared = () => send(visible(),
  { type: 'initialization', status: 'ready', attempt: 0 },
  { type: 'destination-ready', attempt: 0 });
const completeMotion = (state: LaunchState) => send(state,
  { type: 'intro-complete' }, { type: 'tick', deltaMs: LAUNCH_HOLD_MS });

describe('global startup presentation', () => {
  it('keeps native-compatible preparation until a frame and accessibility decision exist', () => {
    const state = send(createLaunchState(),
      { type: 'initialization', status: 'ready', attempt: 0 },
      { type: 'destination-ready', attempt: 0 });
    expect(getLaunchPhase(state)).toBe('preparing');
    expect(getLaunchPhase(send(state, { type: 'first-frame', kind: 'fallback' }))).toBe('preparing');
    expect(getLaunchPhase(send(state, { type: 'accessibility', reducedMotion: false }))).toBe('preparing');
  });

  it('does not shorten nine seconds even if the destination is ready immediately', () => {
    const state = send(prepared(), { type: 'tick', deltaMs: 60_000 });
    expect(getLaunchPhase(state)).toBe('animating');
    expect(state.introComplete).toBe(false);
    // Only the scene's GPU complete event, not a JS loading timer, ends choreography.
    expect(INTRO_MS).toBe(9000);
    expect(DEPTH_LAYERS).toBe(6);
  });

  it('holds the final original V4 sphere for exactly one additional active second', () => {
    let state = send(prepared(), { type: 'intro-complete' });
    state = send(state, { type: 'tick', deltaMs: 999 });
    expect(getLaunchPhase(state)).toBe('holding');
    expect(state.holdElapsedMs).toBe(999);
    state = send(state, { type: 'tick', deltaMs: 1 });
    expect(getLaunchPhase(state)).toBe('fading');
    const target = { x: 201, y: 437, radius: 140 };
    const final = sceneAt(INTRO_MS, { width: 402, height: 874 }, target);
    expect(final).toMatchObject({ ...target, shell: 1, logoOpacity: 0, layers: 0 });
  });

  it('keeps the sphere after ten seconds while initialization is slow, then fades without another delay', () => {
    let state = completeMotion(visible());
    expect(getLaunchPhase(state)).toBe('waiting');
    state = send(state, { type: 'tick', deltaMs: 45_000 },
      { type: 'initialization', status: 'ready', attempt: 0 });
    expect(getLaunchPhase(state)).toBe('waiting');
    expect(getLaunchPhase(send(state, { type: 'destination-ready', attempt: 0 }))).toBe('fading');
  });

  it('requires destination layout readiness as well as data readiness', () => {
    const state = send(completeMotion(visible()), { type: 'initialization', status: 'ready', attempt: 0 });
    expect(getLaunchPhase(state)).toBe('waiting');
    expect(getLaunchPhase(send(state, { type: 'destination-ready', attempt: 0 }))).toBe('fading');
  });

  it('does not expose retry controls during the nine-second choreography or final hold', () => {
    let state = send(visible(), { type: 'initialization', status: 'error', attempt: 0 });
    expect(getLaunchPhase(state)).toBe('animating');
    state = send(state, { type: 'intro-complete' });
    expect(getLaunchPhase(state)).toBe('holding');
    expect(getLaunchPhase(send(state, { type: 'tick', deltaMs: 1000 }))).toBe('error');
  });

  it('recovers initialization in place without replay, ignoring late work from the failed attempt', () => {
    let state = send(completeMotion(visible()), { type: 'initialization', status: 'error', attempt: 0 });
    state = send(state, { type: 'retry' });
    expect(state.attempt).toBe(1);
    expect(getLaunchPhase(state)).toBe('waiting');
    const beforeStale = state;
    state = send(state,
      { type: 'initialization', status: 'ready', attempt: 0 },
      { type: 'destination-ready', attempt: 0 });
    expect(state).toBe(beforeStale);
    expect(getLaunchPhase(state)).toBe('waiting');
    state = send(state,
      { type: 'initialization', status: 'ready', attempt: 1 },
      { type: 'destination-ready', attempt: 1 });
    expect(getLaunchPhase(state)).toBe('fading');
    expect(state.introComplete).toBe(true);
    expect(state.holdElapsedMs).toBe(1000);
  });

  it('does not count background time in the additional hold or fade while backgrounded', () => {
    const clock = new ForegroundLaunchClock();
    let state = send(prepared(), { type: 'intro-complete' });
    clock.sample(9000, true);
    state = send(state, { type: 'tick', deltaMs: clock.sample(9400, true) });
    state = send(state, { type: 'active', value: false });
    clock.sample(9400, false);
    state = send(state, { type: 'tick', deltaMs: clock.sample(99_400, false) });
    expect(state.holdElapsedMs).toBe(400);
    state = send(state, { type: 'active', value: true },
      { type: 'tick', deltaMs: clock.sample(100_000, true) });
    expect(state.holdElapsedMs).toBe(400);
    state = send(state, { type: 'tick', deltaMs: clock.sample(100_600, true) });
    expect(getLaunchPhase(state)).toBe('fading');
    state = send(state, { type: 'active', value: false }, { type: 'fade-complete' });
    expect(state.fadeComplete).toBe(false);
    expect(getLaunchPhase(state)).toBe('waiting');
  });

  it.each([
    { reducedMotion: true, screenReader: false },
    { reducedMotion: false, screenReader: true },
  ])('skips the full sequence and hold for accessibility preference %j', preference => {
    const state = send(createLaunchState(),
      { type: 'accessibility', ...preference },
      { type: 'first-frame', kind: 'fallback' },
      { type: 'initialization', status: 'ready', attempt: 0 },
      { type: 'destination-ready', attempt: 0 });
    expect(getLaunchPhase(state)).toBe('fading');
    expect(state.holdElapsedMs).toBe(1000);
  });

  it('never replays a sequence skipped by a live Reduced Motion change', () => {
    let state = send(prepared(), { type: 'accessibility', reducedMotion: true });
    expect(getLaunchPhase(state)).toBe('fading');
    state = send(state, { type: 'accessibility', reducedMotion: false });
    expect(getLaunchPhase(state)).toBe('fading');
  });

  it('treats a compatible native image as frame readiness, not completed choreography', () => {
    const state = send(createLaunchState(),
      { type: 'first-frame', kind: 'fallback' },
      { type: 'accessibility', reducedMotion: false });
    expect(getLaunchPhase(state)).toBe('animating');
    expect(getLaunchPhase(send(state, { type: 'renderer-failed' }))).toBe('waiting');
  });

  it('requires a compatible frame even if GPU failure happens before it can draw', () => {
    const state = send(createLaunchState(),
      { type: 'accessibility', reducedMotion: false },
      { type: 'renderer-failed' },
      { type: 'initialization', status: 'ready', attempt: 0 },
      { type: 'destination-ready', attempt: 0 });
    expect(getLaunchPhase(state)).toBe('preparing');
    expect(getLaunchPhase(send(state, { type: 'first-frame', kind: 'fallback' }))).toBe('fading');
  });

  it('does not reset the one-second hold on duplicate completion or first-frame delivery', () => {
    const state = send(prepared(), { type: 'intro-complete' }, { type: 'tick', deltaMs: 600 });
    const next = send(state, { type: 'intro-complete' }, { type: 'first-frame', kind: 'gpu' });
    expect(next.holdElapsedMs).toBe(600);
    expect(getLaunchPhase(next)).toBe('holding');
  });

  it('does not reopen the launch gate after completion on navigation, foreground or late retry', () => {
    const state = send(completeMotion(prepared()), { type: 'fade-complete' });
    expect(getLaunchPhase(state)).toBe('complete');
    const next = send(state, { type: 'active', value: false }, { type: 'active', value: true },
      { type: 'intro-complete' }, { type: 'retry' }, { type: 'renderer-failed' });
    expect(next).toBe(state);
    expect(getLaunchPhase(next)).toBe('complete');
  });

  it('ignores invalid elapsed input and keeps a monotonic foreground clock', () => {
    const state = send(prepared(), { type: 'intro-complete' });
    expect(send(state, { type: 'tick', deltaMs: -1 }, { type: 'tick', deltaMs: NaN },
      { type: 'tick', deltaMs: Infinity })).toBe(state);
    const clock = new ForegroundLaunchClock();
    expect(clock.sample(1000, true)).toBe(0);
    expect(clock.sample(1100, true)).toBe(100);
    expect(clock.sample(1050, true)).toBe(0);
    expect(clock.sample(1120, true)).toBe(20);
  });
});

describe('approved Deep Intro V2 assets and motion contract', () => {
  it('preserves the exact timeline, generated scene, shaders and official logo geometry', () => {
    const hashes = {
      'timeline.ts': '20de443e222558f4e1fa7ad9aab952abf05b1c2054950bfe00b642dcf8a50eaf',
      'sceneRuntime.generated.ts': 'ac700a2e5274f5651444924e8f1be6f239f5b07256b9072739f64d79b7e6d4c2',
      'v4Shaders.generated.ts': 'ba777d69d0b7dc8af9fefef3328f0dc95ab86e89bc14b0b8e9403ba3b4b3823a',
      'brand.generated.ts': '00d2bb375b62d235cd915bda3c0797884e28bb7f6393bcec062b6d1c5d4a0fee',
      'brandTexture.generated.ts': 'b081f98ca837efde52545822bfeb5c617e6cdede1c5345a1608ea67e100b2910',
    };
    for (const [name, expected] of Object.entries(hashes)) {
      const content = readFileSync(new URL(`../src/intro/${name}`, import.meta.url));
      expect(createHash('sha256').update(content).digest('hex'), name).toBe(expected);
    }
  });
});
