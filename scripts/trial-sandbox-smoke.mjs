import { randomBytes } from 'node:crypto';
import { lstat, open, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const INTERVAL = 14 * 24 * 60 * 60 * 1000;
export async function smokeTrial({ url, stateFile, allowLocal = false, fetchImpl = fetch }) {
  const base = new URL(url);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
  if ((base.protocol !== 'https:' && !(allowLocal && local && base.protocol === 'http:')) || base.username || base.password || base.search || base.hash) throw new Error('Use an HTTPS sandbox URL without credentials, query or fragment.');
  if (!stateFile) throw new Error('A private state file is required for restart/idempotency verification.');
  let state; let resumed = false;
  try {
    const info = await lstat(stateFile);
    if (!info.isFile() || info.isSymbolicLink() || (info.mode & 0o077)) throw new Error('State must be a private regular file (0600).');
    state = JSON.parse(await readFile(stateFile, 'utf8')); resumed = true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    state = { url: base.href, environment: 'sandbox', identity: randomBytes(16).toString('hex'), credential: randomBytes(32).toString('hex') };
    const file = await open(stateFile, 'wx', 0o600);
    try { await file.writeFile(JSON.stringify(state) + '\n'); } finally { await file.close(); }
  }
  if (state.url !== base.href || state.environment !== 'sandbox' || !/^[a-f0-9]{32}$/.test(state.identity) || !/^[a-f0-9]{64}$/.test(state.credential)) throw new Error('Private state does not match this sandbox. No request sent.');
  const headers = { 'X-App-Environment': 'sandbox', 'X-Trial-Identity': state.identity, Authorization: `Bearer ${state.credential}` };
  let requests = 0;
  const request = async (endpoint, method, expectedStatus, body, custom = headers) => {
    const response = await fetchImpl(new URL(base.href.replace(/\/$/, '') + endpoint), { method, headers: custom, ...(body === undefined ? {} : { body }), redirect: 'error', signal: AbortSignal.timeout(20_000) }); requests++;
    if (response.status !== expectedStatus) throw new Error(`Sandbox check failed: ${method} ${endpoint} expected ${expectedStatus}, received ${response.status}. No credentials logged.`);
    if (!/no-store/.test(response.headers.get('Cache-Control') ?? '')) throw new Error('Sandbox response must disable caching.');
    return response.json();
  };
  await request('/health', 'GET', 200);
  const before = await request('/v1/trial', 'GET', 200);
  if (!resumed && (before.startedAt !== null || before.expiresAt !== null)) throw new Error('Fresh test identity unexpectedly has a trial.');
  const started = await request('/v1/trial', 'POST', 200, '{}');
  if (started.environment !== 'sandbox' || Date.parse(started.expiresAt) - Date.parse(started.startedAt) !== INTERVAL || !Number.isFinite(Date.parse(started.serverNow))) throw new Error('Sandbox must return its exact server-controlled 14-day interval.');
  for (const next of [await request('/v1/trial', 'POST', 200, '{}'), await request('/v1/trial', 'GET', 200)]) {
    if (next.startedAt !== started.startedAt || next.expiresAt !== started.expiresAt) throw new Error('Known trial interval changed across repeated requests.');
  }
  if (before.startedAt !== null && (before.startedAt !== started.startedAt || before.expiresAt !== started.expiresAt)) throw new Error('Restart extended the persisted known trial.');
  await request('/v1/trial', 'GET', 401, undefined, { ...headers, Authorization: '' });
  const wrongCredential = (state.credential === 'f'.repeat(64) ? 'e' : 'f').repeat(64);
  await request('/v1/trial', 'GET', 401, undefined, { ...headers, Authorization: `Bearer ${wrongCredential}` });
  await request('/v1/trial', 'GET', 400, undefined, { ...headers, 'X-App-Environment': 'production' });
  await request('/v1/trial', 'POST', 400, '{"clientNow":0}');
  return { status: 'PASS_SANDBOX_HTTP', resumedPrivateIdentity: resumed, requests, exactFourteenDayInterval: true, repeatsAndRestartDoNotExtendKnownInterval: true, wrongOrMissingCredentialRejected: true, productionEnvironmentRejected: true, clientTimestampRejected: true, noCardOrStorePurchaseRequested: true, privateStatePrinted: false, limits: ['No real 14-day wait, server process restart, offline native cache or store purchase is inferred from this HTTP smoke. Controlled-clock expiry/offline tests remain separate.'] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); const value = name => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; };
  smokeTrial({ url: value('--url'), stateFile: value('--state'), allowLocal: args.includes('--local') })
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(() => { console.error('Sandbox verification failed. Check endpoint, permissions and private state locally; credentials and raw responses are not printed.'); process.exitCode = 1; });
}
