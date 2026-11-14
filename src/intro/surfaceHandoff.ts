/** UI-frame ownership stages: hidden, two covered GPU paints, reveal, committed. */
export type SurfaceHandoffStage = 0 | 1 | 2 | 3 | 4 | 5;

export function advanceSurfaceHandoff(stage: SurfaceHandoffStage, active: boolean): {
  stage: SurfaceHandoffStage; release: boolean;
} {
  'worklet';
  if (!active || stage === 0 || stage === 5) return { stage, release: false };
  const next = (stage + 1) as SurfaceHandoffStage;
  return { stage: next, release: stage === 4 };
}
