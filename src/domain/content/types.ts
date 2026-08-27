import type { CyclePhase } from '../cycle/cycleEngine';

export interface CueMetadata {
  id: string;
  phases: CyclePhase[];
  dayRange: [number, number];
  tags: string[];
  learnMoreId: CyclePhase;
}

export interface LocalizedCue {
  context: string;
  cue: string;
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
