import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

import { createLaunchState, reduceLaunch, shouldAnimateLaunch } from '../src/intro/launchState';
import { makeSphereHtml } from '../src/intro/sphereHtml';
import { INTRO_MS } from '../src/intro/timeline';

interface RuntimeMessage { type: string; elapsed: number; started: boolean; running: boolean }
interface RuntimeState { elapsed: number; active: boolean; reduced: boolean; draws: number; scene: { x: number; y: number; radius: number; layers: number } }

/** Execute the real control/clock runtime; this is not a real GPU or visual test. */
async function bootRuntime() {
  let now = 100;
  let frameId = 0;
  const frames = new Map<number, (time: number) => void>();
  const documentEvents = new Map<string, () => void>();
  const windowEvents = new Map<string, () => void>();
  const messages: RuntimeMessage[] = [];
  const values: Record<string, number | number[]> = {};
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
    getParameter: () => 4096, createTexture: () => ({}), activeTexture() {}, bindTexture() {},
    texParameteri() {}, pixelStorei() {}, texImage2D() {}, getError: () => 0,
    uniform1i() {}, viewport() {}, disable() {}, clearColor() {}, clear() {}, enable() {}, scissor() {},
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
    window, document, Image: LocalImage, innerWidth: 400, innerHeight: 800,
    devicePixelRatio: 2, Date: { now: () => now },
    requestAnimationFrame: (callback: (time: number) => void) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    CustomEvent: class { constructor(readonly type: string, readonly options: object) {} },
  });
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  const command = (value: object) => window.__TIH_CONTROL__!(value);
  return {
    command, messages, values, frames,
    state: () => window.__TIH_TEST__!.state(),
    step(ms: number) {
      now += ms;
      const queued = [...frames.values()]; frames.clear(); queued.forEach(callback => callback(now));
    },
    visibility(hidden: boolean) { document.hidden = hidden; documentEvents.get('visibilitychange')!(); },
    unload() { windowEvents.get('beforeunload')!(); },
  };
}

function start(runtime: Awaited<ReturnType<typeof bootRuntime>>, animate = true, reducedMotion = false) {
  runtime.command({ type: 'configure', target: { x: 200, y: 470, radius: 100 }, ink: [.16, .27, .35] });
  runtime.command({ type: 'start', animate, reducedMotion });
  runtime.step(1); // first RAF establishes its monotonic anchor
}

describe('shared scene runtime lifecycle', () => {
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

describe('approved Deep Intro V2 boundaries', () => {
  it('preserves the original nine-second scene, six-layer shader and official logo sources', () => {
    const approved = {
      'timeline.ts': '20de443e222558f4e1fa7ad9aab952abf05b1c2054950bfe00b642dcf8a50eaf',
      'sceneRuntime.generated.ts': 'ac700a2e5274f5651444924e8f1be6f239f5b07256b9072739f64d79b7e6d4c2',
      'v4Shaders.generated.ts': 'ba777d69d0b7dc8af9fefef3328f0dc95ab86e89bc14b0b8e9403ba3b4b3823a',
      'brand.generated.ts': '00d2bb375b62d235cd915bda3c0797884e28bb7f6393bcec062b6d1c5d4a0fee',
      'brandTexture.generated.ts': 'b081f98ca837efde52545822bfeb5c617e6cdede1c5345a1608ea67e100b2910',
    };
    for (const [name, expected] of Object.entries(approved)) {
      const data = readFileSync(new URL(`../src/intro/${name}`, import.meta.url));
      expect(createHash('sha256').update(data).digest('hex'), name).toBe(expected);
    }
    const html = readFileSync(new URL('../src/intro/sphereHtml.ts', import.meta.url), 'utf8');
    const shader = html.slice(html.indexOf('export function makeSceneFragment'), html.indexOf('\nfunction json'));
    expect(createHash('sha256').update(shader).digest('hex')).toBe('7b7f2fd4836d6fbaba39d5d17715d0aa89fcb856942448a9797f84abcc41936e');
  });
});
