import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

import { FIRST_FRAME_LOGO_CENTER_X, FIRST_FRAME_LOGO_CENTER_Y, FIRST_FRAME_LOGO_WIDTH_CAP, FIRST_FRAME_LOGO_WIDTH_FRACTION } from '../src/intro/brandBackground.generated';
import { createLaunchState, reduceLaunch, shouldAnimateLaunch } from '../src/intro/launchState';
import { createNativeSplashGate } from '../src/intro/nativeSplashGate';
import { makeAssociatedAlphaFragment, makeSceneFragment, makeSphereHtml } from '../src/intro/sphereHtml';
import { advanceSurfaceHandoff, type SurfaceHandoffStage } from '../src/intro/surfaceHandoff';
import { INTRO_MS, sceneAt } from '../src/intro/timeline';
import { V4_FRAGMENT } from '../src/intro/v4Shaders.generated';

interface RuntimeMessage { type: string; elapsed: number; started: boolean; running: boolean; motionMs?: number; heldMs?: number }
interface RuntimeState { elapsed: number; active: boolean; reduced: boolean; draws: number; scene: { x: number; y: number; radius: number; layers: number } }

/** Execute the real control/clock runtime; this is not a real GPU or visual test. */
async function bootRuntime(width = 400, height = 800) {
  let now = 100;
  let frameId = 0;
  const frames = new Map<number, (time: number) => void>();
  const documentEvents = new Map<string, () => void>();
  const windowEvents = new Map<string, () => void>();
  const messages: RuntimeMessage[] = [];
  const values: Record<string, number | number[]> = {};
  const uploads: { unit: number; premultiplied: boolean }[] = [];
  let textureUnit = -1;
  let premultiplied = false;
  const gl = {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4,
    ARRAY_BUFFER: 5, STATIC_DRAW: 6, FLOAT: 7, SCISSOR_TEST: 8, COLOR_BUFFER_BIT: 9,
    TRIANGLES: 10, MAX_TEXTURE_SIZE: 11, TEXTURE0: 12, TEXTURE_2D: 13,
    TEXTURE_MIN_FILTER: 14, TEXTURE_MAG_FILTER: 15, LINEAR: 16,
    TEXTURE_WRAP_S: 17, TEXTURE_WRAP_T: 18, CLAMP_TO_EDGE: 19,
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: 20, RGBA: 21, UNSIGNED_BYTE: 22, NO_ERROR: 0,
    createShader: () => ({}), shaderSource() {}, compileShader() {}, getShaderParameter: () => true,
    createProgram: () => ({}), attachShader() {}, linkProgram() {}, getProgramParameter: () => true,
    useProgram() {}, createBuffer: () => ({}), bindBuffer() {}, bufferData() {},
    getAttribLocation: () => 0, enableVertexAttribArray() {}, vertexAttribPointer() {},
    getUniformLocation: (_program: object, key: string) => key,
    getParameter: () => 4096, createTexture: () => ({}), activeTexture(unit: number) { textureUnit = unit - 12; }, bindTexture() {},
    texParameteri() {}, pixelStorei(_key: number, value: boolean) { premultiplied = value; },
    texImage2D() { uploads.push({ unit: textureUnit, premultiplied }); }, getError: () => 0,
    uniform1i() {}, viewport() {}, disable() {}, clearColor() {}, clear() {}, enable() {}, scissor: (...box: number[]) => { values.scissor = box; },
    uniform1f: (key: string, value: number) => { values[key] = value; },
    uniform2f: (key: string, ...value: number[]) => { values[key] = value; },
    uniform3f: (key: string, ...value: number[]) => { values[key] = value; },
    drawArrays() {}, finish() {}, deleteTexture() {}, deleteShader() {}, deleteBuffer() {}, deleteProgram() {},
  };
  const canvas = { width: 0, height: 0, getContext: () => gl, addEventListener() {} };
  const document = {
    hidden: false,
    getElementById: () => canvas,
    addEventListener: (name: string, listener: () => void) => documentEvents.set(name, listener),
  };
  const window: {
    ReactNativeWebView: { postMessage(raw: string): void };
    addEventListener(name: string, listener: () => void): void;
    dispatchEvent(): void;
    __TIH_CONTROL__?: (command: object) => void;
    __TIH_TEST__?: { state(): RuntimeState };
  } = {
    ReactNativeWebView: { postMessage: raw => messages.push(JSON.parse(raw)) },
    addEventListener: (name, listener) => { windowEvents.set(name, listener); },
    dispatchEvent() {},
  };
  class LocalImage {
    width = 512;
    height = 512;
    onload?: () => void;
    set src(_value: string) { queueMicrotask(() => this.onload?.()); }
  }
  const script = makeSphereHtml('AAAA', true).split('<script>')[1]!.split('</script>')[0]!;
  vm.runInNewContext(script, {
    window, document, Image: LocalImage, innerWidth: width, innerHeight: height,
    devicePixelRatio: 2, Date: { now: () => now },
    requestAnimationFrame: (callback: (time: number) => void) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    CustomEvent: class { constructor(readonly type: string, readonly options: object) {} },
  });
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  const command = (value: object) => window.__TIH_CONTROL__!(value);
  return {
    command, messages, values, frames, uploads,
    state: () => window.__TIH_TEST__!.state(),
    step(ms: number) {
      now += ms;
      const queued = [...frames.values()]; frames.clear(); queued.forEach(callback => callback(now));
    },
    visibility(hidden: boolean) { document.hidden = hidden; documentEvents.get('visibilitychange')!(); },
    unload() { windowEvents.get('beforeunload')!(); },
  };
}

function start(runtime: Awaited<ReturnType<typeof bootRuntime>>, animate = true, reducedMotion = false, launch = false) {
  runtime.command({ type: 'configure', target: { x: 200, y: 470, radius: 100 }, ink: [.16, .27, .35] });
  runtime.command({ type: 'prepare', token: 1, animate, reducedMotion, launch });
  runtime.command({ type: 'release', token: 1 });
  runtime.step(1); // first RAF establishes its monotonic anchor
}

describe('V5 intro presentation boundaries', () => {
  it('associates only the final canvas output, retaining the original straight V4/scene calculations', () => {
    const straight = makeSceneFragment();
    const associated = makeAssociatedAlphaFragment(straight);
    expect(associated.slice(0, associated.indexOf('\nvoid main() {')))
      .toBe(straight.replace('void main() {', 'void composeScene() {'));
    expect(associated).toContain('clamp(gl_FragColor.rgb, 0.0, 1.0) * gl_FragColor.a');
    expect(makeSphereHtml('AAAA')).toContain('"associatedAlpha":true');
    expect(makeSphereHtml('AAAA', true, true)).toContain('"associatedAlpha":false');
    expect(() => makeSphereHtml('AAAA', false, true)).toThrow('restricted');
  });

  it('uploads the original V4 texture unchanged and premultiplies only the metallic foreground', async () => {
    const runtime = await bootRuntime();
    expect(runtime.uploads).toEqual([
      { unit: 0, premultiplied: false },
      { unit: 1, premultiplied: true },
    ]);
    // Theme ink must not turn the authored metallic RGB into a monochrome logo.
    runtime.command({ type: 'configure', ink: [1, 0, 0] });
    expect(runtime.values).not.toHaveProperty('u_ink');
  });

  it('uses the shared native first-frame composition without changing the sphere geometry', async () => {
    const runtime = await bootRuntime();
    start(runtime);
    const original = sceneAt(0, { width: 400, height: 800 }, { x: 200, y: 470, radius: 100 });
    expect(runtime.values.u_logoWidth).toBe(Math.min(400 * FIRST_FRAME_LOGO_WIDTH_FRACTION, FIRST_FRAME_LOGO_WIDTH_CAP));
    expect(runtime.values.u_logoCenter).toEqual([400 * FIRST_FRAME_LOGO_CENTER_X, 800 * FIRST_FRAME_LOGO_CENTER_Y]);
    expect(runtime.values.u_introTime).toBe(0);
    expect(runtime.values.u_center).toEqual([original.x, original.y]);
    expect(runtime.values.u_radius).toBe(original.radius);
  });

  it('retains the original shrink and camera progress while intro light uses the paused scene clock', async () => {
    const runtime = await bootRuntime(); start(runtime); runtime.step(2000);
    const original = sceneAt(2000, { width: 400, height: 800 }, { x: 200, y: 470, radius: 100 });
    const camera = Math.min(1, original.camera / 3.55);
    const width = Math.min(400 * FIRST_FRAME_LOGO_WIDTH_FRACTION, FIRST_FRAME_LOGO_WIDTH_CAP);
    expect(runtime.values.u_logoWidth).toBeCloseTo(width * original.logoWidth / (400 * .76));
    expect(runtime.values.u_logoCenter).toEqual([
      400 * FIRST_FRAME_LOGO_CENTER_X + (original.x - 400 * FIRST_FRAME_LOGO_CENTER_X) * camera,
      800 * FIRST_FRAME_LOGO_CENTER_Y + (original.y - 800 * FIRST_FRAME_LOGO_CENTER_Y) * camera,
    ]);
    expect(runtime.values.u_center).toEqual([original.x, original.y]);
    expect(runtime.values.u_radius).toBe(original.radius);
    expect(runtime.values.u_introTime).toBe(2);
    runtime.command({ type: 'active', value: false }); runtime.step(80_000);
    expect(runtime.values.u_introTime).toBe(2);
    runtime.command({ type: 'active', value: true }); runtime.step(1); runtime.step(500);
    expect(runtime.values.u_introTime).toBe(2.5);
  });

  it('embeds the protected V4 body verbatim and bypasses intro material at the destination', () => {
    const expected = V4_FRAGMENT
      .replace('void main() {\n  vec2 p = v_uv * 2.0 - 1.0;', 'vec4 shadeV4(vec2 p) {')
      .replace('gl_FragColor = vec4(0.0);\n    return;', 'return vec4(0.0);')
      .replace('gl_FragColor = vec4(col, alpha);', 'return vec4(col, alpha);');
    const fragment = makeSceneFragment();
    expect(fragment.slice(0, fragment.indexOf('\nuniform sampler2D u_logo;'))).toBe(expected + '\n');
    expect(fragment).toContain('if (u_logoOpacity <= 0. && u_shell >= 1. && u_layers <= 0.) {\n    gl_FragColor = sphere;\n    return;');
  });
});

describe('shared scene runtime lifecycle', () => {
  it('keeps the real scene clock frozen behind a pending native hide and releases once after four UI frames', async () => {
    const runtime = await bootRuntime();
    let resolveHide!: () => void;
    const gate = createNativeSplashGate(() => new Promise<void>(resolve => { resolveHide = resolve; }));
    gate.subscribe(() => undefined);
    gate.request();
    runtime.command({ type: 'active', value: false });
    runtime.command({ type: 'prepare', token: 1, animate: true, photographicOpening: true });
    let stage: SurfaceHandoffStage = 1;
    let releases = 0;
    const uiFrame = (active = true) => {
      const allowed = active && gate.getState().queued;
      const next = advanceSurfaceHandoff(stage, allowed); stage = next.stage;
      if (next.release) { releases++; runtime.command({ type: 'release', token: 1 }); }
    };
    await Promise.resolve();
    for (let frame = 0; frame < 100; frame++) { uiFrame(); runtime.step(1000); }
    expect(stage).toBe(1);
    expect(runtime.state().elapsed).toBe(0);
    expect(runtime.frames.size).toBe(0);
    resolveHide();
    // Flush the hide promise's assimilation and its queued-state continuation.
    for (let turn = 0; turn < 5; turn++) await Promise.resolve();
    expect(gate.getState().queued).toBe(true);
    runtime.command({ type: 'active', value: true });
    for (let frame = 0; frame < 3; frame++) { uiFrame(); runtime.step(1000); }
    expect(runtime.state().elapsed).toBe(0);
    expect(releases).toBe(0);
    uiFrame(false); expect(releases).toBe(0);
    uiFrame(); runtime.step(1); runtime.step(250);
    expect(releases).toBe(1);
    expect(runtime.state().elapsed).toBe(250);
    uiFrame(); expect(releases).toBe(1);
  });

  it('lets the exact photograph yield to the unchanged metal scene without a reconstructed second emblem', async () => {
    const runtime = await bootRuntime();
    runtime.command({ type: 'configure', target: { x: 200, y: 470, radius: 100 } });
    runtime.command({ type: 'prepare', token: 1, animate: true, photographicOpening: true });
    expect(runtime.values.u_logoOpacity).toBe(0);
    runtime.command({ type: 'release', token: 1 }); runtime.step(1);
    for (const delta of [650, 200, 500, 1000, 2150, 4500]) {
      runtime.step(delta);
      const scene = sceneAt(runtime.state().elapsed, { width: 400, height: 800 }, { x: 200, y: 470, radius: 100 });
      expect(runtime.values.u_logoOpacity).toBe(0);
      expect(runtime.values.u_radius).toBe(scene.radius);
      expect(runtime.values.u_camera).toBe(scene.camera);
      expect(runtime.values.u_layers).toBe(scene.layers);
      expect(runtime.values.u_shell).toBe(scene.shell);
    }
    expect(runtime.state().elapsed).toBe(INTRO_MS);
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(1);
  });

  it('keeps the prepared GPU frame frozen until the matching native visibility acknowledgment', async () => {
    const runtime = await bootRuntime();
    runtime.command({ type: 'configure', target: { x: 200, y: 470, radius: 100 } });
    runtime.command({ type: 'prepare', token: 7, animate: true, reducedMotion: false });
    const prepared = runtime.state();
    expect(runtime.messages.at(-1)).toMatchObject({ type: 'prepared', elapsed: 0, started: false, running: false });
    expect(runtime.frames.size).toBe(0);
    runtime.step(80_000);
    expect(runtime.state()).toEqual(prepared);
    runtime.command({ type: 'release', token: 6 });
    runtime.command({ type: 'start', animate: true }); // obsolete one-step protocol cannot run unseen
    expect(runtime.frames.size).toBe(0);
    runtime.command({ type: 'release', token: 7 });
    runtime.step(1); runtime.step(600);
    expect(runtime.state().elapsed).toBe(600);
    runtime.command({ type: 'prepare', token: 8, animate: true });
    runtime.command({ type: 'release', token: 7 });
    expect(runtime.state().elapsed).toBe(600); // duplicate/stale bridge commands never replay
  });

  it('keeps a prepared reduced-motion final sphere still until visibility commits', async () => {
    const runtime = await bootRuntime();
    runtime.command({ type: 'prepare', token: 'reduced', animate: true, reducedMotion: true });
    expect(runtime.state()).toMatchObject({ elapsed: INTRO_MS, reduced: true });
    runtime.step(90_000);
    expect(runtime.frames.size).toBe(0);
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(0);
    runtime.command({ type: 'release', token: 'reduced' });
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(1);
    expect(runtime.frames.size).toBe(0);
  });

  it('commits a live accessibility skip before release without hidden completion or replay', async () => {
    const runtime = await bootRuntime();
    runtime.command({ type: 'prepare', token: 1, animate: true });
    runtime.command({ type: 'reduce-motion', value: true });
    runtime.command({ type: 'reduce-motion', value: false });
    expect(runtime.state().elapsed).toBe(INTRO_MS);
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(0);
    expect(runtime.frames.size).toBe(0);
    runtime.command({ type: 'release', token: 1 }); runtime.step(1); runtime.step(1000);
    expect(runtime.state().elapsed).toBe(INTRO_MS);
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(1);
  });

  it('does not start a prepared frame in the background or count time before foreground presentation', async () => {
    const runtime = await bootRuntime();
    runtime.command({ type: 'prepare', token: 1, animate: true });
    runtime.command({ type: 'active', value: false });
    runtime.command({ type: 'release', token: 1 });
    runtime.step(90_000);
    expect(runtime.state().elapsed).toBe(0);
    expect(runtime.frames.size).toBe(0);
    runtime.command({ type: 'active', value: true }); runtime.step(1); runtime.step(300);
    expect(runtime.state().elapsed).toBe(300);
  });

  it.each([
    [200, -200], [200, 1200], [-500, 400], [1000, 400],
    [0, 0], [400, 800], [200, 400],
  ])('intersects the completed sphere scissor with its viewport at (%s,%s)', async (x, y) => {
    const runtime = await bootRuntime();
    runtime.command({ type: 'configure', target: { x, y, radius: 140 } });
    runtime.command({ type: 'prepare', token: 1, animate: false, reducedMotion: false });
    runtime.command({ type: 'release', token: 1 });
    const [left, bottom, width, height] = runtime.values.scissor as [number, number, number, number];
    expect([left, bottom, width, height].every(Number.isFinite)).toBe(true);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(bottom).toBeGreaterThanOrEqual(0);
    expect(width).toBeGreaterThanOrEqual(0);
    expect(height).toBeGreaterThanOrEqual(0);
    expect(left + width).toBeLessThanOrEqual(800);
    expect(bottom + height).toBeLessThanOrEqual(1600);
    if (x < -140 || x > 540 || y < -140 || y > 940) {
      expect(width * height).toBe(0);
    } else {
      expect(width * height).toBeGreaterThan(0);
    }
  });
  it('completes the unchanged nine-second sequence once, then keeps V4 internally animated', async () => {
    const runtime = await bootRuntime();
    expect(runtime.messages.filter(message => message.type === 'ready')).toHaveLength(1);
    start(runtime);
    const startFrame = runtime.messages.find(message => message.type === 'clock' && message.started);
    expect(startFrame).toMatchObject({ elapsed: 0, started: true, running: true });
    runtime.step(INTRO_MS - 1);
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(0);
    runtime.step(1);
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(1);
    expect(runtime.state().scene).toMatchObject({ x: 200, y: 470, radius: 100, layers: 0 });
    const phaseAtEnd = runtime.values.u_phase;
    const drawsAtEnd = runtime.state().draws;
    runtime.step(1000);
    expect(runtime.state().elapsed).toBe(INTRO_MS);
    expect(runtime.state().draws).toBeGreaterThan(drawsAtEnd);
    expect(runtime.values.u_phase).not.toBe(phaseAtEnd);
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(1);
  });

  it('does not count background time or replay choreography when activity resumes', async () => {
    const runtime = await bootRuntime(); start(runtime); runtime.step(3000);
    runtime.command({ type: 'active', value: false });
    runtime.step(90_000);
    expect(runtime.state().elapsed).toBe(3000);
    runtime.command({ type: 'active', value: true }); runtime.step(1);
    expect(runtime.state().elapsed).toBe(3000);
    runtime.step(1000);
    expect(runtime.state().elapsed).toBe(4000);
  });

  it('resumes visibility only while RN requested active rendering', async () => {
    const runtime = await bootRuntime(); start(runtime); runtime.step(2000);
    runtime.visibility(true); runtime.step(90_000);
    expect(runtime.state().elapsed).toBe(2000);
    runtime.visibility(false); runtime.step(1); runtime.step(1000);
    expect(runtime.state().elapsed).toBe(3000);
    runtime.command({ type: 'active', value: false });
    runtime.visibility(true); runtime.visibility(false);
    expect(runtime.frames.size).toBe(0);
  });

  it('starts an already-consumed intro directly at the final sphere', async () => {
    const runtime = await bootRuntime(); start(runtime, false);
    expect(runtime.state().scene).toMatchObject({ x: 200, y: 470, radius: 100, layers: 0 });
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(1);
    runtime.step(1000);
    expect(runtime.values.u_phase).not.toBe(0);
  });

  it('honors reduced motion and can stop a running intro without a second completion', async () => {
    const runtime = await bootRuntime(); start(runtime); runtime.step(2500);
    runtime.command({ type: 'reduce-motion', value: true });
    expect(runtime.state()).toMatchObject({ elapsed: INTRO_MS, reduced: true });
    expect(runtime.values.u_phase).toBe(0);
    expect(runtime.frames.size).toBe(0);
    runtime.command({ type: 'finish' });
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(1);
  });

  it('does not replay a reduced-motion skip when motion is enabled again before GPU startup', async () => {
    let launch = createLaunchState();
    launch = reduceLaunch(launch, { type: 'accessibility', reducedMotion: true });
    launch = reduceLaunch(launch, { type: 'accessibility', reducedMotion: false });
    // The real launch-to-renderer decision crosses into the real WebView control runtime.
    const runtime = await bootRuntime();
    start(runtime, shouldAnimateLaunch(launch), launch.reducedMotion);
    expect(runtime.state().elapsed).toBe(INTRO_MS);
    expect(runtime.state().scene).toMatchObject({ x: 200, y: 470, radius: 100, layers: 0 });
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(1);
    runtime.step(2000);
    expect(runtime.state().elapsed).toBe(INTRO_MS);
    expect(runtime.values.u_phase).not.toBe(0); // internal V4 motion may resume; choreography does not
  });

  it('disposes scheduled work on native renderer teardown', async () => {
    const runtime = await bootRuntime(); start(runtime); runtime.unload();
    expect(runtime.frames.size).toBe(0);
    const draws = runtime.state().draws; runtime.step(10_000);
    expect(runtime.state().draws).toBe(draws);
  });
});

describe('visible final sphere launch hold', () => {
  it('waits for final geometry, another presentation frame, and one active second without changing scene time', async () => {
    const runtime = await bootRuntime(); start(runtime, true, false, true);
    runtime.step(4300); // exact V4 shading, but the camera/radius have not settled
    expect(runtime.messages.filter(message => message.type === 'assembled')).toHaveLength(0);
    runtime.step(200); // first settled GPU draw is complete, not a presentation ACK
    expect(runtime.messages.filter(message => message.type === 'assembled')).toHaveLength(0);
    runtime.step(16);
    expect(runtime.messages.filter(message => message.type === 'assembled')).toEqual([
      expect.objectContaining({ elapsed: 4516, motionMs: 4516 }),
    ]);
    runtime.step(999);
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(0);
    runtime.step(1);
    expect(runtime.messages.filter(message => message.type === 'complete')).toEqual([
      expect.objectContaining({ elapsed: 5516, heldMs: 1000 }),
    ]);
    expect(runtime.state().elapsed).toBe(5516);
    const phase = runtime.values.u_phase;
    runtime.step(1500); // slow destination readiness keeps the same V4 moving
    expect(runtime.values.u_phase).not.toBe(phase);
    runtime.step(10_000);
    expect(runtime.messages.filter(message => message.type === 'assembled')).toHaveLength(1);
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(1);
  });

  it.each([[320, 568], [393, 852], [412, 915], [414, 896], [430, 932]])(
    'completes for the real fractional launch target at %s×%s', async (width, height) => {
      const runtime = await bootRuntime(width, height);
      const radius = Math.max(1, Math.min(width * .38, height * .25, 180));
      runtime.command({ type: 'configure', target: { x: width / 2, y: height / 2, radius } });
      runtime.command({ type: 'prepare', token: 1, animate: true, launch: true });
      runtime.command({ type: 'release', token: 1 }); runtime.step(1);
      runtime.step(4499);
      expect(runtime.messages.filter(message => message.type === 'assembled')).toHaveLength(0);
      runtime.step(1); runtime.step(16); runtime.step(1000);
      expect(runtime.state().scene.radius).toBeCloseTo(radius, 10);
      expect(runtime.messages.filter(message => message.type === 'assembled')).toHaveLength(1);
      expect(runtime.messages.filter(message => message.type === 'complete')).toEqual([
        expect.objectContaining({ elapsed: 5516, heldMs: 1000 }),
      ]);
    },
  );

  it('counts a full hold after a delayed first assembled frame beyond the capped scene clock', async () => {
    const runtime = await bootRuntime(); start(runtime, true, false, true);
    runtime.step(12_000);
    expect(runtime.state().elapsed).toBe(INTRO_MS);
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(0);
    runtime.step(16);
    expect(runtime.messages.at(-1)).toMatchObject({ type: 'assembled', elapsed: INTRO_MS, motionMs: 12_016 });
    runtime.step(999);
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(0);
    runtime.step(1);
    expect(runtime.messages.at(-1)).toMatchObject({ type: 'complete', elapsed: INTRO_MS, heldMs: 1000 });
  });

  it('does not reuse an unpresented final candidate across backgrounding', async () => {
    const runtime = await bootRuntime(); start(runtime, true, false, true);
    runtime.step(4500); runtime.visibility(true); runtime.step(90_000);
    runtime.visibility(false); runtime.step(1);
    expect(runtime.messages.filter(message => message.type === 'assembled')).toHaveLength(0);
    runtime.step(16);
    expect(runtime.messages.at(-1)).toMatchObject({ type: 'assembled', elapsed: 4516 });
    runtime.step(1000);
    expect(runtime.messages.at(-1)).toMatchObject({ type: 'complete', heldMs: 1000 });
  });

  it.each(['activity', 'visibility'])('pauses an already visible hold during %s loss', async mode => {
    const runtime = await bootRuntime(); start(runtime, true, false, true);
    runtime.step(4500); runtime.step(16); runtime.step(300);
    if (mode === 'activity') runtime.command({ type: 'active', value: false });
    else runtime.visibility(true);
    runtime.step(90_000);
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(0);
    if (mode === 'activity') runtime.command({ type: 'active', value: true });
    else runtime.visibility(false);
    runtime.step(1); runtime.step(699);
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(0);
    runtime.step(1);
    expect(runtime.messages.at(-1)).toMatchObject({ type: 'complete', heldMs: 1000 });
  });

  it.each(['finish', 'reduce-motion'])('bypasses the hold after an explicit %s skip, completing once', async type => {
    const runtime = await bootRuntime(); start(runtime, true, false, true);
    runtime.step(2000); runtime.command({ type, value: true });
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(1);
    expect(runtime.messages.filter(message => message.type === 'assembled')).toHaveLength(0);
    runtime.command({ type: 'finish' }); runtime.step(10_000);
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(1);
  });

  it.each([[false, false], [true, true]])('does not hold a consumed or reduced-motion launch (%s,%s)', async (animate, reduced) => {
    const runtime = await bootRuntime(); start(runtime, animate, reduced, true);
    expect(runtime.messages.filter(message => message.type === 'complete')).toHaveLength(1);
    expect(runtime.messages.filter(message => message.type === 'assembled')).toHaveLength(0);
  });
});

describe('approved Deep Intro V2 boundaries', () => {
  it('preserves the original scene/V4 sources and reviewed V5 material/compositor', () => {
    const approved = {
      'timeline.ts': '20de443e222558f4e1fa7ad9aab952abf05b1c2054950bfe00b642dcf8a50eaf',
      'sceneRuntime.generated.ts': 'ac700a2e5274f5651444924e8f1be6f239f5b07256b9072739f64d79b7e6d4c2',
      'v4Shaders.generated.ts': 'ba777d69d0b7dc8af9fefef3328f0dc95ab86e89bc14b0b8e9403ba3b4b3823a',
      'brand.generated.ts': '0c619eecd599903ef02568c10ffbc0492ec24392fe5ed906f6cdb33561c851e5',
      'brandTexture.generated.ts': '56706ef4e4b2b8be5b2f2017e71580af9c89a4ce718f0b098cccf872057e74fe',
    };
    for (const [name, expected] of Object.entries(approved)) {
      const data = readFileSync(new URL(`../src/intro/${name}`, import.meta.url));
      expect(createHash('sha256').update(data).digest('hex'), name).toBe(expected);
    }
    const html = readFileSync(new URL('../src/intro/sphereHtml.ts', import.meta.url), 'utf8');
    const shader = html.slice(html.indexOf('export function makeSceneFragment'), html.indexOf('\nfunction json'));
    expect(createHash('sha256').update(shader).digest('hex')).toBe('732932e023147b71fb2d239e17bc8ef02e9fb62e3284617ab6234ac8c2573492');
  });
});
