import AsyncStorage from '@react-native-async-storage/async-storage';

import type { FeedbackStatus, GuidanceFeedback } from '../domain/content/feedback';
import type { DateOnly } from '../domain/cycle/dateOnly';

import { storageKeys } from './keys';

function isEntry(value: unknown): value is GuidanceFeedback {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entry = value as Partial<GuidanceFeedback>;
  return typeof entry.date === 'string'
    && typeof entry.cueId === 'string'
    && ['helpful', 'not_helpful', 'not_tried'].includes(entry.status ?? '');
}

export class AsyncFeedbackStore {
  async readAll(): Promise<GuidanceFeedback[]> {
    const value = await AsyncStorage.getItem(storageKeys.guidanceFeedback);
    if (!value) return [];
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
    } catch {
      return [];
    }
  }

  async read(date: DateOnly, cueId: string): Promise<GuidanceFeedback | null> {
    return (await this.readAll()).find((item) => item.date === date && item.cueId === cueId) ?? null;
  }

  async set(date: DateOnly, cueId: string, status: FeedbackStatus): Promise<void> {
    const existing = await this.readAll();
    const next = existing.filter((item) => item.date !== date || item.cueId !== cueId);
    next.push({ date, cueId, status });
    await AsyncStorage.setItem(storageKeys.guidanceFeedback, JSON.stringify(next));
  }
}
