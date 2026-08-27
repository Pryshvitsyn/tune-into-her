import type { CyclePhase } from '../domain/cycle/cycleEngine';

export interface VerifiedSource {
  title: string;
  url: string;
  reviewedAt: string;
}

// External links stay disabled until each source has been verified and reviewed.
export const verifiedSources: Record<CyclePhase, VerifiedSource[]> = {
  menstrual: [],
  follicular: [],
  mid_cycle: [],
  luteal: [],
};
