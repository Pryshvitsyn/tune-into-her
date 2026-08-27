import type { CycleSettings } from './cycleEngine';

export interface CycleDataProvider {
  get(): Promise<CycleSettings | null>;
  save(settings: CycleSettings): Promise<void>;
}
