import { describe, expect, it } from 'vitest';

import { AppTrialService, APP_TRIAL_MS, APP_TRIAL_OFFLINE_MS, type TrialStorage } from '../src/services/trial/AppTrialService';

const initial = Date.parse('2026-11-13T12:00:00.000Z');
function setup() {
  let wall = initial; let monotonic = 0; let server = initial; let online = true;
  let startAt: number | null = null; let starts = 0;
  const requests: RequestInit[] = [];
  const memory = new Map<string, string>();
  const storage: TrialStorage = { async getItem(key) { return memory.get(key) ?? null; }, async setItem(key, value) { memory.set(key, value); } };
  const options = {
    endpoint: 'https://trial.example.test', environment: 'sandbox', storage,
    randomBytes: async (length: number) => new Uint8Array(length).fill(length),
    clock: { now: () => wall, monotonic: () => monotonic },
    fetch: (async (_url, init) => {
      requests.push(init!);
      if (!online) throw new Error('offline');
      if (init?.method === 'POST') { starts++; startAt ??= server; }
      return Response.json({ environment: 'sandbox', serverNow: new Date(server).toISOString(), startedAt: startAt === null ? null : new Date(startAt).toISOString(), expiresAt: startAt === null ? null : new Date(startAt + APP_TRIAL_MS).toISOString() });
    }) as typeof fetch,
  };
  return { service: new AppTrialService(options), options, requests, memory, setOnline: (v: boolean) => { online = v; }, advance: (ms: number) => { wall += ms; monotonic += ms; server += ms; }, setWall: (n: number) => { wall = n; }, advanceMonotonic: (ms: number) => { monotonic += ms; }, starts: () => starts };
}
describe('server-authoritative app trial', () => {
  it('requires an explicit start and never calls a store or starts on status reads', async () => {
    const x = setup();
    expect(await x.service.getState()).toMatchObject({ status: 'not_started', isActive: false });
    expect(x.starts()).toBe(0);
    expect(await x.service.start()).toMatchObject({ status: 'active', startedAt: new Date(initial).toISOString(), expiresAt: new Date(initial + APP_TRIAL_MS).toISOString() });
    expect(x.requests.at(-1)?.body).toBe('{}');
    const headers = x.requests.at(-1)?.headers as Record<string, string>;
    expect(headers['X-Trial-Identity']).toHaveLength(32);
    expect(headers.Authorization).toHaveLength(71);
    expect(JSON.stringify(x.requests)).not.toMatch(/cycle|symptom|relationship|advice|periodLength/);
  });
  it('reuses the same identity and unchanged term through restart and repeated onboarding/start', async () => {
    const x = setup(); const original = await x.service.start();
    x.advance(86_400_000);
    const restarted = new AppTrialService(x.options);
    expect((await restarted.start()).expiresAt).toBe(original.expiresAt);
    const ids = x.requests.map(r => (r.headers as Record<string, string>)['X-Trial-Identity']);
    expect(new Set(ids).size).toBe(1);
  });
  it('expires at the exact 14x24-hour UTC boundary', async () => {
    const x = setup(); await x.service.start();
    x.advance(APP_TRIAL_MS - 1);
    expect(await x.service.getState()).toMatchObject({ status: 'active', validForMs: 1 });
    x.advance(1);
    expect(await x.service.getCachedState()).toMatchObject({ status: 'expired', isActive: false });
    expect(x.starts()).toBe(1); // No automatic purchase or renewal operation exists.
  });
  it('limits offline access to 24 hours after verification without extending on reads', async () => {
    const x = setup(); await x.service.start(); x.setOnline(false);
    x.advance(APP_TRIAL_OFFLINE_MS - 1);
    expect(await x.service.getState()).toMatchObject({ isActive: true, verification: 'cached', validForMs: 1 });
    x.advance(1);
    expect(await x.service.getCachedState()).toMatchObject({ isActive: false, error: 'TRIAL_OFFLINE_CACHE_EXPIRED' });
  });
  it('detects rollback, including across app restarts, until refreshed online', async () => {
    const x = setup(); await x.service.start(); x.advance(60_000); await x.service.getCachedState();
    x.setOnline(false); x.setWall(initial);
    const restarted = new AppTrialService(x.options);
    expect(await restarted.getState()).toMatchObject({ isActive: false, error: 'TRIAL_CLOCK_CHANGED' });
    x.setWall(initial + 120_000);
    expect(await new AppTrialService(x.options).getCachedState()).toMatchObject({ isActive: false, error: 'TRIAL_CLOCK_CHANGED' });
    x.setOnline(true);
    expect(await restarted.getState()).toMatchObject({ isActive: true, verification: 'verified' });
  });
  it('uses monotonic elapsed time if device wall time is held constant in a live session', async () => {
    const x = setup(); await x.service.start(); x.setOnline(false);
    x.advanceMonotonic(APP_TRIAL_OFFLINE_MS);
    expect(await x.service.getCachedState()).toMatchObject({ isActive: false, error: 'TRIAL_OFFLINE_CACHE_EXPIRED' });
  });
  it('uses server UTC even when the device clock starts far ahead, and subtracts request transit time', async () => {
    const x = setup(); x.setWall(initial + 365 * 86_400_000);
    const slowFetch = (async (...args: Parameters<typeof fetch>) => {
      const result = await x.options.fetch(...args); x.advanceMonotonic(5000); return result;
    }) as typeof fetch;
    const state = await new AppTrialService({ ...x.options, fetch: slowFetch }).start();
    expect(state.startedAt).toBe(new Date(initial).toISOString());
    expect(state.validForMs).toBe(APP_TRIAL_OFFLINE_MS - 5000);
  });
  it('keeps UTC dates unchanged across formatting in different timezones', async () => {
    const x = setup(); const original = await x.service.start();
    const dates = ['Europe/Rome', 'Asia/Kolkata', 'America/Los_Angeles'].map(timeZone => new Intl.DateTimeFormat('en', { timeZone }).format(new Date(original.expiresAt!)));
    expect(dates).toHaveLength(3);
    expect((await x.service.start()).expiresAt).toBe(original.expiresAt);
  });
  it('does not extend cache on application restart', async () => {
    const x = setup(); await x.service.start(); x.advance(APP_TRIAL_OFFLINE_MS); x.setOnline(false);
    expect((await new AppTrialService(x.options).getState()).isActive).toBe(false);
  });
  it('never grants a local-only legacy premium flag a trial', async () => {
    const x = setup(); x.memory.set('partner-cycle:entitlement-cache:v1', JSON.stringify({ isPremium: true })); x.setOnline(false);
    expect((await x.service.getState()).isActive).toBe(false);
  });
  it('rejects wrong environment and invalid server durations', async () => {
    const x = setup();
    const badFetch = (async () => Response.json({ environment: 'production', serverNow: new Date(initial).toISOString(), startedAt: new Date(initial).toISOString(), expiresAt: new Date(initial + APP_TRIAL_MS * 2).toISOString() })) as typeof fetch;
    expect(await new AppTrialService({ ...x.options, fetch: badFetch }).start()).toMatchObject({ isActive: false, error: 'TRIAL_INVALID_RESPONSE' });
  });
  it('fails closed for missing config and non-HTTPS remote endpoints', async () => {
    const x = setup();
    expect((await new AppTrialService({ ...x.options, environment: undefined }).start()).isActive).toBe(false);
    expect((await new AppTrialService({ ...x.options, endpoint: 'http://remote.example.test' }).start()).isActive).toBe(false);
  });
});
