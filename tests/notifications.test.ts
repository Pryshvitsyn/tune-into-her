import { describe, expect, it } from 'vitest';

import type { DailySelection, SelectionStore } from '../src/domain/content/types';
import { NotificationScheduler, type NotificationBackend } from '../src/services/notifications/NotificationScheduler';

class MemoryStore implements SelectionStore { values: DailySelection[] = []; async readAll() { return this.values; } async writeAll(values: DailySelection[]) { this.values = values; } }
class FakeBackend implements NotificationBackend {
  scheduled: { identifier: string; date: Date; title: string; body: string; content: { data: Record<string, string> } }[] = [];
  async list() { return this.scheduled; }
  async cancel(identifier: string) { this.scheduled = this.scheduled.filter((item) => item.identifier !== identifier); }
  async schedule(date: Date, title: string, body: string, data: Record<string, string>) { const identifier = `notification-${data.date}`; this.scheduled.push({ identifier, date, title, body, content: { data } }); return identifier; }
  async requestPermission() { return true; }
  async permissionStatus() { return 'granted' as const; }
}

const base = { settings: { lastKnownPeriodStart: '2026-01-01' as const, typicalCycleLength: 28, typicalPeriodLength: 5 }, language: 'en' as const, reminder: { enabled: true, hour: 8, minute: 30 }, brandName: 'Test Brand' };

describe('notification scheduler', () => {
  it('schedules at most one reminder for each date', async () => {
    const backend = new FakeBackend(); const scheduler = new NotificationScheduler(backend, new MemoryStore());
    await scheduler.rebuild(base, new Date(2026, 0, 2, 7));
    expect(new Set(backend.scheduled.map((item) => item.content.data.date)).size).toBe(backend.scheduled.length);
  });

  it('rebuilds without duplicates after language, time, and cycle changes', async () => {
    const backend = new FakeBackend(); const scheduler = new NotificationScheduler(backend, new MemoryStore()); const now = new Date(2026, 0, 2, 7);
    await scheduler.rebuild(base, now);
    await scheduler.rebuild({ ...base, language: 'it', reminder: { enabled: true, hour: 9, minute: 15 }, settings: { ...base.settings, typicalCycleLength: 30 } }, now);
    expect(new Set(backend.scheduled.map((item) => item.content.data.date)).size).toBe(backend.scheduled.length);
    expect(backend.scheduled.every((item) => item.content.data.language === 'it')).toBe(true);
    expect(backend.scheduled.every((item) => item.date.getHours() === 9 && item.date.getMinutes() === 15)).toBe(true);
  });
});


describe('notification privacy and deletion', () => {
  it('never exposes cycle day or personalized context on the lock screen', async () => {
    const backend = new FakeBackend(); const scheduler = new NotificationScheduler(backend, new MemoryStore());
    await scheduler.rebuild(base, new Date(2026, 0, 2, 7));
    expect(backend.scheduled.length).toBeGreaterThan(0);
    for (const item of backend.scheduled) {
      expect(item.title).toBe('Test Brand');
      expect(item.body).toBe('A little context for today.');
    }
  });
  it('cancels all owned reminders for local-data deletion', async () => {
    const backend = new FakeBackend(); const scheduler = new NotificationScheduler(backend, new MemoryStore());
    await scheduler.rebuild(base, new Date(2026, 0, 2, 7));
    await scheduler.cancelAll();
    expect(backend.scheduled).toHaveLength(0);
  });
});
