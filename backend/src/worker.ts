/** Isolated billing metadata only. Never receive cycle/content/relationship data here. */
export interface Statement {
  bind(...values: (string | number | null)[]): Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}
export interface TrialDatabase { prepare(sql: string): Statement }
export interface Env {
  DB: TrialDatabase;
  ENVIRONMENT: 'sandbox' | 'production';
  REVENUECAT_WEBHOOK_AUTH?: string;
  REVENUECAT_WEBHOOK_SIGNING_SECRET?: string;
  REVENUECAT_APP_IDS?: string;
}
interface TrialRow { credential_hash: string; started_at: number; expires_at: number }
const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
const hash = async (value: string) => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
const response = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
async function equalSecret(actual: string, expected: string): Promise<boolean> {
  const a = await hash(actual); const b = await hash(expected);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
async function validSignature(raw: Uint8Array, header: string, secret: string, now: number) {
  const match = /^t=(\d+),v1=([a-fA-F0-9]{64})$/.exec(header);
  if (!match || Math.abs(now - Number(match[1]) * 1000) > 300_000) return false;
  const signature = Uint8Array.from(match[2]!.match(/.{2}/g)!, value => parseInt(value, 16));
  const prefix = encoder.encode(`${match[1]}.`);
  const payload = new Uint8Array(prefix.length + raw.length);
  payload.set(prefix); payload.set(raw, prefix.length);
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  return crypto.subtle.verify('HMAC', key, signature, payload);
}
async function readBody(request: Request, maximum: number): Promise<Uint8Array | null> {
  if (Number(request.headers.get('Content-Length') ?? 0) > maximum) return null;
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > maximum) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const result = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}
async function webhook(request: Request, env: Env, now: number): Promise<Response> {
  if (!env.REVENUECAT_WEBHOOK_AUTH || !env.REVENUECAT_APP_IDS) return response({ error: 'WEBHOOK_NOT_CONFIGURED' }, 503);
  if (!await equalSecret(request.headers.get('Authorization') ?? '', env.REVENUECAT_WEBHOOK_AUTH)) return response({ error: 'UNAUTHORIZED' }, 401);
  const raw = await readBody(request, 65_536);
  if (!raw) return response({ error: 'PAYLOAD_TOO_LARGE' }, 413);
  if (env.REVENUECAT_WEBHOOK_SIGNING_SECRET && !await validSignature(raw, request.headers.get('X-RevenueCat-Webhook-Signature') ?? '', env.REVENUECAT_WEBHOOK_SIGNING_SECRET, now)) return response({ error: 'INVALID_SIGNATURE' }, 401);
  let body: { event?: Record<string, unknown> };
  try { body = JSON.parse(new TextDecoder().decode(raw)); } catch { return response({ error: 'INVALID_JSON' }, 400); }
  const event = body?.event;
  if (!event || typeof event.id !== 'string' || !/^[\w.-]{1,200}$/.test(event.id) || typeof event.app_id !== 'string' || !env.REVENUECAT_APP_IDS.split(',').includes(event.app_id) || event.environment !== env.ENVIRONMENT.toUpperCase() || typeof event.type !== 'string' || event.type.length > 80 || typeof event.event_timestamp_ms !== 'number' || !Number.isFinite(event.event_timestamp_ms) || (event.type === 'TEST' && env.ENVIRONMENT !== 'sandbox')) return response({ error: 'INVALID_EVENT_OR_ENVIRONMENT' }, 400);
  // Journal only: delayed events cannot grant/revoke access. CustomerInfo is the authority.
  // Deliberately discard subscriber attributes, emails, payload and transaction details.
  await env.DB.prepare('INSERT INTO billing_events (environment, event_id, app_id, event_type, event_at, received_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(environment, event_id) DO NOTHING')
    .bind(env.ENVIRONMENT, event.id, event.app_id, event.type, event.event_timestamp_ms, now).run();
  return response({ received: true });
}
export async function handle(request: Request, env: Env, now = Date.now()): Promise<Response> {
  try {
    if (!['sandbox', 'production'].includes(env.ENVIRONMENT)) return response({ error: 'ENVIRONMENT_NOT_CONFIGURED' }, 503);
    const path = new URL(request.url).pathname;
    if (path === '/health' && request.method === 'GET') return response({ ok: true });
    if (path === '/v1/webhooks/revenuecat' && request.method === 'POST') return await webhook(request, env, now);
    if (path !== '/v1/trial' || !['GET', 'POST'].includes(request.method)) return response({ error: 'NOT_FOUND' }, 404);
    if (request.headers.get('X-App-Environment') !== env.ENVIRONMENT) return response({ error: 'ENVIRONMENT_MISMATCH' }, 400);
    const id = request.headers.get('X-Trial-Identity') ?? '';
    const credential = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('Authorization') ?? '')?.[1] ?? '';
    if (!/^[a-f0-9]{32}$/.test(id) || !/^[a-f0-9]{64}$/.test(credential)) return response({ error: 'UNAUTHORIZED' }, 401);
    const credentialHash = await hash(credential);
    if (request.method === 'POST') {
      // Start time is always server time; client payload is never a source of time/data.
      const bytes = await readBody(request, 4096);
      if (!bytes) return response({ error: 'PAYLOAD_TOO_LARGE' }, 413);
      const raw = new TextDecoder().decode(bytes);
      if (raw && raw !== '{}') return response({ error: 'UNEXPECTED_BODY' }, 400);
      await env.DB.prepare('INSERT INTO app_trials (environment, identity, credential_hash, started_at, expires_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(environment, identity) DO NOTHING')
        .bind(env.ENVIRONMENT, id, credentialHash, now, now + TRIAL_MS).run();
    }
    const row = await env.DB.prepare('SELECT credential_hash, started_at, expires_at FROM app_trials WHERE environment = ? AND identity = ?').bind(env.ENVIRONMENT, id).first<TrialRow>();
    if (row && !await equalSecret(row.credential_hash, credentialHash)) return response({ error: 'UNAUTHORIZED' }, 401);
    return response({ environment: env.ENVIRONMENT, serverNow: new Date(now).toISOString(), startedAt: row ? new Date(row.started_at).toISOString() : null, expiresAt: row ? new Date(row.expires_at).toISOString() : null });
  } catch {
    // No credential, payload or identity logging. 503 asks the sender to retry.
    return response({ error: 'TEMPORARILY_UNAVAILABLE' }, 503);
  }
}
export default { fetch(request: Request, env: Env): Promise<Response> { return handle(request, env); } };
