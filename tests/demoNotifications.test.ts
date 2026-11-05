import { describe, expect, it, vi } from 'vitest';

import { AcceleratedDemoScheduler } from '../src/services/notifications/AcceleratedDemoScheduler';
import type { NotificationBackend } from '../src/services/notifications/NotificationScheduler';
import {
  AcceleratedDemoStore,
  DEMO_SESSION_STORAGE_KEY,
  type AcceleratedDemoSession,
  type DemoSessionStore,
} from '../src/storage/AcceleratedDemoStore';
import { storageKeys } from '../src/storage/keys';

vi.mock('@react-native-async-storage/async-storage', () => ({ default: {} }));

class MemorySessionStore implements DemoSessionStore {
  session: AcceleratedDemoSession | null = null;
  failWrite = false;
  async read() { return this.session; }
  async write(session: AcceleratedDemoSession) {
    if (this.failWrite) throw new Error('disk full');
    this.session = { ...session, notificationIds: [...session.notificationIds] };
  }
  async clear() { this.session = null; }
}

class FakeBackend implements NotificationBackend {
  scheduled: { identifier: string; date: Date; title: string; body: string; content: { data: Record<string, string> } }[] = [];
  permissionGranted = true;
  scheduleCount = 0;
  failScheduleAt = 0;
  acceptBeforeFailure = false;
  failCancelIds = new Set<string>();
  async list() { return this.scheduled; }
  async cancel(identifier: string) {
    if (this.failCancelIds.has(identifier)) throw new Error('native cancellation failed');
    this.scheduled = this.scheduled.filter((item) => item.identifier !== identifier);
  }
  async schedule(date: Date, title: string, body: string, data: Record<string, string>) {
    this.scheduleCount += 1;
    const identifier = `test-notification-${this.scheduleCount}`;
    const failing = this.scheduleCount === this.failScheduleAt;
    if (!failing || this.acceptBeforeFailure) this.scheduled.push({ identifier, date, title, body, content: { data } });
    if (failing) throw new Error('native schedule failed');
    return identifier;
  }
  async requestPermission() { return this.permissionGranted; }
  async permissionStatus() { return this.permissionGranted ? 'granted' as const : 'denied' as const; }
  addUnrelated() {
    this.scheduled.push(
      { identifier: 'daily-owned-by-another-scheduler', date: new Date(0), title: 'Daily', body: '', content: { data: { kind: 'daily-cycle-cue' } } },
      { identifier: 'unrelated', date: new Date(0), title: 'Other', body: '', content: { data: { kind: 'other' } } },
    );
  }
}

const startedAt = Date.parse('2024-03-08T12:00:00+01:00');
const copy = { title: 'Tune Into Her', body: 'Новая подсказка готова' };

function setup() {
  const backend = new FakeBackend();
  backend.addUnrelated();
  const store = new MemorySessionStore();
  let run = 0;
  const scheduler = new AcceleratedDemoScheduler(backend, store, { now: () => startedAt, createRunId: () => `demo-run-${++run}` });
  return { backend, store, scheduler };
}

describe('accelerated demo notifications', () => {
  it('schedules 29 private one-off reminders from +5 through +145 minutes with day links', async () => {
    const { backend, store, scheduler } = setup();
    const session = await scheduler.start('ru', copy);
    const reminders = backend.scheduled.filter((item) => item.content.data.kind === 'accelerated-demo');
    expect(reminders).toHaveLength(29);
    expect(reminders[0]?.date.getTime()).toBe(startedAt + 5 * 60_000);
    expect(reminders[28]?.date.getTime()).toBe(startedAt + 145 * 60_000);
    expect(reminders.map((item) => item.content.data.demoDay)).toEqual(Array.from({ length: 29 }, (_, index) => String(index + 2)));
    for (const reminder of reminders) {
      expect(reminder.title).toBe(copy.title);
      expect(reminder.body).toBe(copy.body);
      expect(reminder.content.data.url).toBe(`/demo?runId=${session.runId}&day=${reminder.content.data.demoDay}`);
      expect(Object.keys(reminder.content.data).sort()).toEqual(['demoDay', 'kind', 'runId', 'url']);
    }
    expect(store.session).toEqual(session);
    expect(session.notificationIds).toHaveLength(29);
  });

  it('restarts cleanly while preserving daily reminders and other notification kinds', async () => {
    const { backend, store, scheduler } = setup();
    const first = await scheduler.start('ru', copy);
    const second = await scheduler.start('it', copy);
    expect(second.runId).not.toBe(first.runId);
    expect(backend.scheduled).toHaveLength(31);
    expect(backend.scheduled.filter((item) => item.content.data.kind === 'accelerated-demo').every((item) => item.content.data.runId === second.runId)).toBe(true);
    expect(backend.scheduled.some((item) => item.identifier === 'daily-owned-by-another-scheduler')).toBe(true);
    expect(store.session?.language).toBe('it');
  });

  it('stops only native demo notifications, even if saved IDs wrongly mention a daily reminder', async () => {
    const { backend, store, scheduler } = setup();
    await scheduler.start('ru', copy);
    store.session!.notificationIds.push('daily-owned-by-another-scheduler');
    await scheduler.stop();
    expect(backend.scheduled.map((item) => item.identifier)).toEqual(['daily-owned-by-another-scheduler', 'unrelated']);
    expect(store.session).toBeNull();
  });

  it('reports denied permission and does not replace an already running demo', async () => {
    const { backend, store, scheduler } = setup();
    const first = await scheduler.start('ru', copy);
    backend.permissionGranted = false;
    await expect(scheduler.start('ru', copy)).rejects.toMatchObject({ code: 'DEMO_PERMISSION_DENIED' });
    expect(store.session?.runId).toBe(first.runId);
    expect(backend.scheduleCount).toBe(29);
  });

  it('rolls back a partially accepted native schedule without claiming a saved session', async () => {
    const { backend, store, scheduler } = setup();
    backend.failScheduleAt = 4;
    backend.acceptBeforeFailure = true;
    await expect(scheduler.start('ru', copy)).rejects.toMatchObject({ code: 'DEMO_SCHEDULING_FAILED' });
    expect(store.session).toBeNull();
    expect(backend.scheduled.map((item) => item.identifier)).toEqual(['daily-owned-by-another-scheduler', 'unrelated']);
  });

  it('rolls back the native queue if session persistence fails', async () => {
    const { backend, store, scheduler } = setup();
    store.failWrite = true;
    await expect(scheduler.start('ru', copy)).rejects.toMatchObject({ code: 'DEMO_STORAGE_FAILED' });
    expect(backend.scheduled).toHaveLength(2);
    expect(store.session).toBeNull();
  });

  it('does not claim cleanup succeeded if a native cancellation fails', async () => {
    const { backend, store, scheduler } = setup();
    backend.failScheduleAt = 3;
    backend.failCancelIds.add('test-notification-1');
    await expect(scheduler.start('ru', copy)).rejects.toMatchObject({ code: 'DEMO_CLEANUP_FAILED' });
    expect(backend.scheduled.some((item) => item.identifier === 'test-notification-1')).toBe(true);
    expect(store.session).toBeNull();
  });

  it('serializes overlapping starts and a stop so no extra reminders survive', async () => {
    const { backend, store, scheduler } = setup();
    await Promise.all([scheduler.start('ru', copy), scheduler.start('en', copy), scheduler.stop()]);
    expect(backend.scheduled).toHaveLength(2);
    expect(store.session).toBeNull();
  });

  it('ignores completion of an old run and retains the final current session after cleanup', async () => {
    const { backend, store, scheduler } = setup();
    const first = await scheduler.start('ru', copy);
    const current = await scheduler.start('ru', copy);
    await scheduler.complete(first.runId);
    expect(backend.scheduled).toHaveLength(31);
    expect(store.session?.runId).toBe(current.runId);
    await scheduler.complete(current.runId);
    expect(backend.scheduled).toHaveLength(2);
    expect(store.session).toEqual({ ...current, notificationIds: [] });
  });
});

class MemoryKeyValueStorage {
  values = new Map<string, string>();
  async getItem(key: string) { return this.values.get(key) ?? null; }
  async setItem(key: string, value: string) { this.values.set(key, value); }
  async removeItem(key: string) { this.values.delete(key); }
}

describe('separate accelerated demo storage', () => {
  it('persists across instances without reading or changing real cycle/preferences/history keys', async () => {
    const storage = new MemoryKeyValueStorage();
    const unrelated = Object.fromEntries(Object.values(storageKeys).map((key) => [key, 'keep-original-value']));
    for (const [key, value] of Object.entries(unrelated)) storage.values.set(key, value);
    const session: AcceleratedDemoSession = { version: 1, runId: 'demo-test', startedAt, language: 'ru', notificationIds: [] };
    await new AcceleratedDemoStore(storage).write(session);
    expect(await new AcceleratedDemoStore(storage).read()).toEqual(session);
    await new AcceleratedDemoStore(storage).clear();
    expect(Object.fromEntries(storage.values)).toEqual(unrelated);
    expect(Object.values(storageKeys)).not.toContain(DEMO_SESSION_STORAGE_KEY);
  });

  it('rejects corrupt session values and never persists extra profile fields', async () => {
    const storage = new MemoryKeyValueStorage();
    const store = new AcceleratedDemoStore(storage);
    storage.values.set(DEMO_SESSION_STORAGE_KEY, '{bad json');
    expect(await store.read()).toBeNull();
    storage.values.set(DEMO_SESSION_STORAGE_KEY, JSON.stringify({ version: 1, runId: 'bad?path', startedAt, language: 'ru', notificationIds: [] }));
    expect(await store.read()).toBeNull();
    const session = { version: 1 as const, runId: 'demo-test', startedAt, language: 'ru' as const, notificationIds: [], actualCycle: 'must-not-persist' };
    await store.write(session);
    expect(storage.values.get(DEMO_SESSION_STORAGE_KEY)).not.toContain('actualCycle');
    expect(await store.read()).toEqual({ version: 1, runId: 'demo-test', startedAt, language: 'ru', notificationIds: [] });
  });
});
