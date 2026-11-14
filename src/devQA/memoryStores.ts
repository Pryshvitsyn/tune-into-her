import type { FeedbackStatus, GuidanceFeedback } from '../domain/content/feedback';
import type { DailySelection, SelectionStore } from '../domain/content/types';
import type { DateOnly } from '../domain/cycle/dateOnly';
import type { TrialStorage } from '../services/trial/AppTrialService';

export class MemorySelectionStore implements SelectionStore {
  private entries: DailySelection[] = [];
  async readAll(): Promise<DailySelection[]> { return this.entries.map(entry => ({ ...entry })); }
  async writeAll(entries: DailySelection[]): Promise<void> { this.entries = entries.map(entry => ({ ...entry })); }
}
export class MemoryFeedbackStore {
  private entries: GuidanceFeedback[] = [];
  async readAll(): Promise<GuidanceFeedback[]> { return this.entries.map(entry => ({ ...entry })); }
  async read(date: DateOnly, cueId: string): Promise<GuidanceFeedback | null> {
    return (await this.readAll()).find(entry => entry.date === date && entry.cueId === cueId) ?? null;
  }
  async set(date: DateOnly, cueId: string, status: FeedbackStatus): Promise<void> {
    this.entries = [...this.entries.filter(entry => entry.date !== date || entry.cueId !== cueId), { date, cueId, status }];
  }
}
export class MemoryTrialStorage implements TrialStorage {
  private readonly entries = new Map<string, string>();
  async getItem(key: string): Promise<string | null> { return this.entries.get(key) ?? null; }
  async setItem(key: string, value: string): Promise<void> { this.entries.set(key, value); }
}
