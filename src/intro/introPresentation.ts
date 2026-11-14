/** Presentation only: the protected scene clock and V4 shader remain unchanged. */
export function introBackgroundOpacity(milliseconds: number): number {
  'worklet';
  const progress = Math.max(0, Math.min(1, (milliseconds - 2000) / 4500));
  return 1 - progress * progress * (3 - 2 * progress);
}

/** Use the existing camera-entry/depth reveal interval, without adding scene time.
 * The photograph yields to metal, never to a second reconstructed emblem.
 */
export function approvedOpeningOpacity(milliseconds: number): number {
  'worklet';
  const progress = Math.max(0, Math.min(1, (milliseconds - 650) / 700));
  return 1 - progress * progress * (3 - 2 * progress);
}
