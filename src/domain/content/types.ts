import type { CyclePhase } from '../cycle/cycleEngine';

export interface CueMetadata {
  id: string;
  phases: CyclePhase[];
  dayRange: [number, number];
  tags: string[];
  learnMoreId: CyclePhase;
  actionId?: string;
  supportId?: string;
  contextId?: string;
}

export interface LocalizedCue {
  context: string;
  cue: string;
  support: string;
}

export interface DailySelection {
  date: string;
  cueId: string;
  cycleFingerprint: string;
  contentVersion: number;
}

export interface SelectionStore {
  readAll(): Promise<DailySelection[]>;
  writeAll(selections: DailySelection[]): Promise<void>;
}
