import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  createLaunchState, getLaunchPhase, LAUNCH_FADE_MS,
  reduceLaunch, shouldAnimateLaunch, shouldPrepareDestinationSpheres, type LaunchEvent, type LaunchState,
} from '../src/intro/launchState';
import { DEPTH_LAYERS, INTRO_MS, sceneAt } from '../src/intro/timeline';

const send = (state: LaunchState, ...events: LaunchEvent[]) => events.reduce(reduceLaunch, state);
const visible = () => send(createLaunchState(),
  { type: 'first-frame', kind: 'gpu' },
  { type: 'accessibility', reducedMotion: false });
const prepared = () => send(visible(),
  { type: 'initialization', status: 'ready', attempt: 0 },
  { type: 'destination-ready', attempt: 0 });
const completeMotion = (state: LaunchState) => send(state, { type: 'intro-complete' });

describe('global startup presentation', () => {
  it('keeps native-compatible preparation until a frame and accessibility decision exist', () => {
    const state = send(createLaunchState(),
      { type: 'initialization', status: 'ready', attempt: 0 },
      { type: 'destination-ready', attempt: 0 });
    expect(getLaunchPhase(state)).toBe('preparing');
    expect(getLaunchPhase(send(state, { type: 'first-frame', kind: 'fallback' }))).toBe('preparing');
    expect(getLaunchPhase(send(state, { type: 'accessibility', reducedMotion: false }))).toBe('preparing');
  });

  it('preserves the six-layer scene and original reveal horizon when the destination is ready early', () => {
    const state = prepared();
    expect(getLaunchPhase(state)).toBe('animating');
    expect(state.introComplete).toBe(false);
    expect(shouldAnimateLaunch(state)).toBe(true);
    // GPU presentation completion owns the handoff; initialization never ends it.
    expect(INTRO_MS).toBe(9000);
    expect(DEPTH_LAYERS).toBe(6);
  });

  it('starts the existing fade as soon as the final scene and destination are ready, without an extra hold tick', () => {
    const state = completeMotion(prepared());
    expect(getLaunchPhase(state)).toBe('fading');
    expect(shouldAnimateLaunch(state)).toBe(false);
    expect(LAUNCH_FADE_MS).toBe(360);
    const target = { x: 201, y: 437, radius: 140 };
    const final = sceneAt(INTRO_MS, { width: 402, height: 874 }, target);
    expect(final).toMatchObject({ ...target, shell: 1, logoOpacity: 0, layers: 0 });
  });

  it('keeps the final sphere available while initialization is slow and fades on readiness without another delay', () => {
    let state = completeMotion(visible());
    expect(getLaunchPhase(state)).toBe('waiting');
    state = send(state, { type: 'initialization', status: 'ready', attempt: 0 });
    expect(getLaunchPhase(state)).toBe('waiting');
    state = send(state, { type: 'destination-ready', attempt: 0 });
    expect(getLaunchPhase(state)).toBe('fading');
    expect(state.introComplete).toBe(true);
  });

  it('fades immediately when initialization is the last dependency to become ready', () => {
    const state = send(completeMotion(visible()), { type: 'destination-ready', attempt: 0 });
    expect(getLaunchPhase(state)).toBe('waiting');
    expect(getLaunchPhase(send(state, { type: 'initialization', status: 'ready', attempt: 0 }))).toBe('fading');
  });

  it('requires destination layout readiness as well as data readiness', () => {
    const state = send(completeMotion(visible()), { type: 'initialization', status: 'ready', attempt: 0 });
    expect(getLaunchPhase(state)).toBe('waiting');
    expect(getLaunchPhase(send(state, { type: 'destination-ready', attempt: 0 }))).toBe('fading');
  });

  it('reveals recoverable errors after GPU presentation completion', () => {
    const state = send(visible(), { type: 'initialization', status: 'error', attempt: 0 });
    expect(getLaunchPhase(state)).toBe('animating');
    expect(getLaunchPhase(completeMotion(state))).toBe('error');
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
  });

  it('does not treat background or foreground events as choreography completion', () => {
    let state = send(prepared(), { type: 'active', value: false });
    expect(state.introComplete).toBe(false);
    expect(getLaunchPhase(state)).toBe('animating');
    state = send(state, { type: 'active', value: true });
    expect(getLaunchPhase(state)).toBe('animating');
    expect(getLaunchPhase(completeMotion(state))).toBe('fading');
  });

  it('waits in the background after scene completion and fades immediately on foreground', () => {
    let state = completeMotion(send(prepared(), { type: 'active', value: false }));
    state = send(state, { type: 'fade-complete' });
    expect(state.fadeComplete).toBe(false);
    expect(getLaunchPhase(state)).toBe('waiting');
    state = send(state, { type: 'active', value: true });
    expect(getLaunchPhase(state)).toBe('fading');
    state = send(state, { type: 'active', value: false }, { type: 'fade-complete' });
    expect(state.fadeComplete).toBe(false);
    expect(getLaunchPhase(state)).toBe('waiting');
  });

  it.each([
    { reducedMotion: true, screenReader: false },
    { reducedMotion: false, screenReader: true },
  ])('skips the full sequence for accessibility preference %j while retaining readiness', preference => {
    let state = send(createLaunchState(),
      { type: 'accessibility', ...preference },
      { type: 'first-frame', kind: 'fallback' });
    expect(getLaunchPhase(state)).toBe('waiting');
    state = send(state, { type: 'initialization', status: 'ready', attempt: 0 });
    expect(getLaunchPhase(state)).toBe('waiting');
    state = send(state, { type: 'destination-ready', attempt: 0 });
    expect(getLaunchPhase(state)).toBe('fading');
    expect(shouldAnimateLaunch(state)).toBe(false);
  });

  it('never replays a sequence skipped by a live Reduced Motion change', () => {
    let state = send(prepared(), { type: 'accessibility', reducedMotion: true });
    expect(getLaunchPhase(state)).toBe('fading');
    state = send(state, { type: 'accessibility', reducedMotion: false });
    expect(getLaunchPhase(state)).toBe('fading');
    expect(shouldAnimateLaunch(state)).toBe(false);
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

  it('does not add a delay after duplicate completion or first-frame delivery', () => {
    const state = completeMotion(prepared());
    const next = send(state, { type: 'intro-complete' }, { type: 'first-frame', kind: 'gpu' });
    expect(next.introComplete).toBe(true);
    expect(getLaunchPhase(next)).toBe('fading');
  });

  it('prepares hidden Today at assembly while retaining the complete GPU-owned visible hold', () => {
    let state = prepared();
    expect(shouldPrepareDestinationSpheres(state)).toBe(false);
    state = send(state, { type: 'intro-assembled' });
    expect(shouldPrepareDestinationSpheres(state)).toBe(true);
    expect(state.introComplete).toBe(false);
    expect(getLaunchPhase(state)).toBe('animating');
    expect(reduceLaunch(state, { type: 'intro-assembled' })).toBe(state);
    state = send(state, { type: 'intro-complete' });
    expect(getLaunchPhase(state)).toBe('fading');
  });

  it('retains a completed hold through late readiness and background without repeating it', () => {
    let state = send(visible(), { type: 'intro-assembled' }, { type: 'intro-complete' },
      { type: 'active', value: false }, { type: 'initialization', status: 'ready', attempt: 0 },
      { type: 'destination-ready', attempt: 0 });
    expect(getLaunchPhase(state)).toBe('waiting');
    expect(shouldPrepareDestinationSpheres(state)).toBe(true);
    state = send(state, { type: 'active', value: true });
    expect(getLaunchPhase(state)).toBe('fading');
  });

  it('prepares Today immediately for accessibility/fallback without needing assembly or a hold event', () => {
    const reduced = send(visible(), { type: 'accessibility', reducedMotion: true });
    expect(shouldPrepareDestinationSpheres(reduced)).toBe(true);
    expect(shouldAnimateLaunch(reduced)).toBe(false);
    expect(shouldPrepareDestinationSpheres(send(visible(), { type: 'renderer-failed' }))).toBe(true);
  });

  it('does not reopen the launch gate after completion on navigation, foreground or late retry', () => {
    const state = send(completeMotion(prepared()), { type: 'fade-complete' });
    expect(getLaunchPhase(state)).toBe('complete');
    const next = send(state, { type: 'active', value: false }, { type: 'active', value: true },
      { type: 'intro-complete' }, { type: 'retry' }, { type: 'renderer-failed' });
    expect(next).toBe(state);
    expect(getLaunchPhase(next)).toBe('complete');
  });
});

describe('approved Deep Intro V2 assets and motion contract', () => {
  it('preserves the exact timeline, generated scene, shaders and official logo geometry', () => {
    const hashes = {
      'timeline.ts': '20de443e222558f4e1fa7ad9aab952abf05b1c2054950bfe00b642dcf8a50eaf',
      'sceneRuntime.generated.ts': 'ac700a2e5274f5651444924e8f1be6f239f5b07256b9072739f64d79b7e6d4c2',
      'v4Shaders.generated.ts': 'ba777d69d0b7dc8af9fefef3328f0dc95ab86e89bc14b0b8e9403ba3b4b3823a',
      'brand.generated.ts': '0c619eecd599903ef02568c10ffbc0492ec24392fe5ed906f6cdb33561c851e5',
      'brandTexture.generated.ts': '56706ef4e4b2b8be5b2f2017e71580af9c89a4ce718f0b098cccf872057e74fe',
    };
    for (const [name, expected] of Object.entries(hashes)) {
      const content = readFileSync(new URL(`../src/intro/${name}`, import.meta.url));
      expect(createHash('sha256').update(content).digest('hex'), name).toBe(expected);
    }
  });
});
