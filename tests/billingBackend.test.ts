import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

import { describe, expect, it } from 'vitest';

import { handle, type Env, type Statement } from '../backend/src/worker';

const now = Date.parse('2026-11-13T12:00:00.000Z');
function setup() {
  const database = new DatabaseSync(':memory:');
  database.exec(readFileSync(new URL('../backend/migrations/0001_billing.sql', import.meta.url), 'utf8'));
  const env: Env = { ENVIRONMENT: 'sandbox', DB: { prepare(sql) {
    let args: (string | number | null)[] = [];
    const statement: Statement = {
      bind(...values) { args = values; return statement; },
      async first<T>() { return (database.prepare(sql).get(...args) ?? null) as T | null; },
      async run() { return database.prepare(sql).run(...args); },
    };
    return statement;
  } } };
  const headers = { Authorization: `Bearer ${'a'.repeat(64)}`, 'X-Trial-Identity': 'b'.repeat(32), 'X-App-Environment': 'sandbox' };
  const request = (method: 'GET' | 'POST' = 'GET', body?: string, custom = headers) => new Request('https://trial.example.test/v1/trial', { method, headers: custom, ...(body ? { body } : {}) });
  return { database, env, headers, request };
}
describe('persistent trial backend', () => {
  it('has no implicit start; inserts exactly once even with concurrent requests', async () => {
    const x = setup();
    expect(await (await handle(x.request(), x.env, now)).json()).toMatchObject({ startedAt: null });
    const results = await Promise.all([handle(x.request('POST', '{}'), x.env, now), handle(x.request('POST', '{}'), x.env, now + 1)]);
    const values = await Promise.all(results.map(r => r.json()));
    expect(values[0].expiresAt).toBe(values[1].expiresAt);
    const later = await (await handle(x.request('POST', '{}'), x.env, now + 86_400_000)).json();
    expect(Date.parse(later.expiresAt) - Date.parse(later.startedAt)).toBe(14 * 24 * 60 * 60 * 1000);
    expect(later.startedAt).toBe(new Date(now).toISOString());
    expect(x.database.prepare('SELECT COUNT(*) AS n FROM app_trials').get()?.n).toBe(1);
  });
  it('rejects App User ID alone, guessed credentials and mismatched environment', async () => {
    const x = setup(); await handle(x.request('POST', '{}'), x.env, now);
    expect((await handle(x.request('GET', undefined, { ...x.headers, Authorization: `Bearer ${'c'.repeat(64)}` }), x.env, now)).status).toBe(401);
    expect((await handle(x.request('GET', undefined, { ...x.headers, Authorization: '' }), x.env, now)).status).toBe(401);
    expect((await handle(x.request('GET', undefined, { ...x.headers, 'X-App-Environment': 'production' }), x.env, now)).status).toBe(400);
  });
  it('bounds incoming trial payloads before reading or storing unexpected data', async () => {
    const x = setup();
    expect((await handle(x.request('POST', 'x'.repeat(4097)), x.env, now)).status).toBe(413);
    expect(x.database.prepare('SELECT COUNT(*) AS n FROM app_trials').get()?.n).toBe(0);
  });
  it('rejects client timestamps, cycle and extra data and only stores a credential hash', async () => {
    const x = setup();
    expect((await handle(x.request('POST', '{"startedAt":"2027-01-01","cycle":"secret"}'), x.env, now)).status).toBe(400);
    await handle(x.request('POST', '{}'), x.env, now);
    const row = x.database.prepare('SELECT * FROM app_trials').get();
    expect(row?.credential_hash).not.toBe('a'.repeat(64));
    expect(Object.keys(row!)).toEqual(['environment', 'identity', 'credential_hash', 'started_at', 'expires_at']);
  });
});
async function signedRequest(body: string, secret: string, time = now) {
  const timestamp = String(Math.floor(time / 1000));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${body}`)));
  const hex = Array.from(signed, byte => byte.toString(16).padStart(2, '0')).join('');
  return new Request('https://trial.example.test/v1/webhooks/revenuecat', { method: 'POST', headers: { Authorization: 'Bearer webhook-test', 'X-RevenueCat-Webhook-Signature': `t=${timestamp},v1=${hex}` }, body });
}
describe('RevenueCat webhook durable journal', () => {
  const event = (id = 'event-1', eventTime = now) => JSON.stringify({ event: { id, type: 'RENEWAL', app_id: 'app-test', environment: 'SANDBOX', event_timestamp_ms: eventTime, subscriber_attributes: { ignored: 'never persisted' } } });
  function configured() { const x = setup(); x.env.REVENUECAT_WEBHOOK_AUTH = 'Bearer webhook-test'; x.env.REVENUECAT_WEBHOOK_SIGNING_SECRET = 'local-test-secret'; x.env.REVENUECAT_APP_IDS = 'app-test'; return x; }
  it('authenticates raw-body HMAC and timestamp; rejects invalid replay and environment', async () => {
    const x = configured();
    expect((await handle(await signedRequest(event(), 'wrong'), x.env, now)).status).toBe(401);
    expect((await handle(await signedRequest(event(), 'local-test-secret', now - 301_000), x.env, now)).status).toBe(401);
    expect((await handle(await signedRequest(event().replace('SANDBOX', 'PRODUCTION'), 'local-test-secret'), x.env, now)).status).toBe(400);
    const badAuth = await signedRequest(event(), 'local-test-secret'); badAuth.headers.set('Authorization', 'wrong');
    expect((await handle(badAuth, x.env, now)).status).toBe(401);
  });
  it('acknowledges only durable writes and deduplicates retried IDs', async () => {
    const x = configured();
    expect((await handle(await signedRequest(event(), 'local-test-secret'), x.env, now)).status).toBe(200);
    expect((await handle(await signedRequest(event(), 'local-test-secret'), x.env, now)).status).toBe(200);
    expect(x.database.prepare('SELECT COUNT(*) AS n FROM billing_events').get()?.n).toBe(1);
    const row = x.database.prepare('SELECT * FROM billing_events').get();
    expect(JSON.stringify(row)).not.toContain('never persisted');
    x.env.DB.prepare = () => { throw new Error('disk failure'); };
    expect((await handle(await signedRequest(event('event-2'), 'local-test-secret'), x.env, now)).status).toBe(503);
  });
  it('accepts delayed out-of-order events without mutating trial or paid access', async () => {
    const x = configured();
    await handle(await signedRequest(event('newer', now), 'local-test-secret'), x.env, now);
    await handle(await signedRequest(event('older', now - 86400_000), 'local-test-secret'), x.env, now);
    expect(x.database.prepare('SELECT COUNT(*) AS n FROM billing_events').get()?.n).toBe(2);
    expect(x.database.prepare('SELECT COUNT(*) AS n FROM app_trials').get()?.n).toBe(0);
  });
});
