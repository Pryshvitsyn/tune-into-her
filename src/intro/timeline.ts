/** TIH_DEEP_INTRO_V2. Milliseconds from the first ready GPU frame. */
export const DEEP_TRAVEL_MS = 1000;
export const DEPTH_LAYERS = 6;
export const INTRO_MS = 9000;
export const REVEAL = {
  phase: [4500, 5100],
  mind: [5500, 6100],
  support: [6500, 7100],
  action: [7500, 8100],
  chrome: [8400, 9000],
} as const;
export type RevealName = keyof typeof REVEAL;
export interface Size { width: number; height: number }
export interface Circle { x: number; y: number; radius: number }
export interface SceneSample {
  x: number; y: number; radius: number;
  shell: number; depth: number; logoWidth: number; logoOpacity: number;
  /** Travel along the additional planes, not the eight-second material clock. */
  camera: number;
  /** Extra layers fade to exactly zero before the original V4 settles. */
  layers: number;
}

/** Self-contained; generated into the WebView at BUILD time, never by Hermes. */
export function sceneAt(ms: number, view: Size, target: Circle): SceneSample {
  const unit = (x: number) => Math.max(0, Math.min(1, x));
  const smooth = (x: number) => { const q = unit(x); return q * q * (3 - 2 * q); };
  const between = (a: number, b: number, p: number) => a + (b - a) * p;
  const t = Math.max(0, Number.isFinite(ms) ? ms : 0);
  const extraMs = 1000;
  const entryMs = 1350;
  const exitMs = entryMs + extraMs;
  const r0 = Math.max(target.radius, Math.hypot(view.width, view.height) * .72);
  const distance = r0 - target.radius;
  const u = (entryMs - 650) / 2850;
  // This is the derivative of the ORIGINAL zoom at the splice point (px/ms).
  const velocity = distance * 6 * u * (1 - u) / 2850;
  const extraDistance = velocity * extraMs;
  // Existing curve is never stretched. The inserted segment covers MORE distance
  // at the instantaneous old speed. Both joins have continuous position/velocity.
  const oldTime = t < entryMs ? t : t < exitMs ? entryMs : t - extraMs;
  const basePull = smooth((oldTime - 650) / 2850);
  const extraRemaining = t < entryMs ? extraDistance
    : t < exitMs ? velocity * (exitMs - t) : 0;
  const radius = between(r0, target.radius, basePull) + extraRemaining;
  const startRadius = r0 + extraDistance;
  const traveled = Math.max(0, startRadius - radius);
  const camera = distance > 0 ? (traveled / distance) * 3.2 : 0;
  // No position hold: the center continues travelling while the depth pass runs.
  const position = startRadius > target.radius
    ? unit(traveled / (startRadius - target.radius)) : 1;
  const logoProgress = unit(camera / 3.55);
  return {
    x: between(view.width / 2, target.x, position),
    y: between(view.height / 2, target.y, position),
    radius,
    shell: smooth((t - 850) / 1700),
    depth: smooth(camera / 2.85),
    logoWidth: Math.min(view.width * .76, 420) * between(1, .19, logoProgress),
    logoOpacity: 1 - smooth((t - 3100) / 1200),
    camera,
    layers: smooth((t - 900) / 450) * (1 - smooth((t - 3500) / 800)),
  };
}

export function fadeAt(ms: number, stage: RevealName): number {
  const [start, end] = REVEAL[stage];
  const p = Math.max(0, Math.min(1, (ms - start) / (end - start)));
  return p * p * (3 - 2 * p);
}
export function validCircle(value: Circle): boolean {
  return [value.x, value.y, value.radius].every(Number.isFinite) && value.radius > 0;
}
