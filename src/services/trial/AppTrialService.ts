export type BillingEnvironment = 'sandbox' | 'production';
export interface AppTrialState {
  status: 'not_started' | 'active' | 'expired' | 'unavailable';
  isActive: boolean;
  startedAt?: string;
  expiresAt?: string;
  verification: 'verified' | 'cached' | 'unavailable';
  /** Remaining access duration; use for an exact UI expiry timer, not a device date. */
  validForMs?: number;
  error?: string;
}
export interface TrialStorage { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> }
interface Credentials { id: string; secret: string }
interface TrialResponse { environment: BillingEnvironment; serverNow: string; startedAt: string | null; expiresAt: string | null }
interface TrialCache { version: 1; response: TrialResponse; requestDurationMs: number; deviceAt: number; lastDeviceAt: number; invalidClock: boolean }
interface Options {
  endpoint?: string;
  environment?: string;
  storage: TrialStorage;
  randomBytes(length: number): Promise<Uint8Array>;
  fetch?: typeof fetch;
  clock?: { now(): number; monotonic(): number };
  allowLocalhost?: boolean;
}
export const APP_TRIAL_MS = 14 * 24 * 60 * 60 * 1000;
export const APP_TRIAL_OFFLINE_MS = 24 * 60 * 60 * 1000;
const bytesToHex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
const unavailable = (error: string): AppTrialState => ({ status: 'unavailable', isActive: false, verification: 'unavailable', error });

/** Independent from store introductory offers and RevenueCat anonymous identity. */
export class AppTrialService {
  private credentials?: Credentials;
  private cache?: TrialCache;
  private initialized?: Promise<void>;
  private monotonicAnchor?: { serverAt: string; value: number };
  private queue: Promise<unknown> = Promise.resolve();
  private readonly clock: { now(): number; monotonic(): number };
  private readonly storageKey: string;
  private readonly credentialKey: string;
  constructor(private readonly options: Options) {
    this.clock = options.clock ?? { now: Date.now, monotonic: () => performance.now() };
    this.storageKey = `tih.trial-cache.v1.${options.environment ?? 'unconfigured'}`;
    this.credentialKey = `tih.trial-credential.v1.${options.environment ?? 'unconfigured'}`;
  }
  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation, operation);
    this.queue = result.catch(() => undefined);
    return result;
  }
  private initialize(): Promise<void> {
    this.initialized ??= (async () => {
      const raw = await this.options.storage.getItem(this.credentialKey);
      if (raw) {
        const value = JSON.parse(raw) as Credentials;
        if (!/^[a-f0-9]{32}$/.test(value.id) || !/^[a-f0-9]{64}$/.test(value.secret)) throw new Error('TRIAL_CREDENTIAL_INVALID');
        this.credentials = value;
      } else {
        const identity = bytesToHex(await this.options.randomBytes(16));
        const secret = bytesToHex(await this.options.randomBytes(32));
        this.credentials = { id: identity, secret };
        // One atomic credential object prevents partially saved/recreated identities.
        await this.options.storage.setItem(this.credentialKey, JSON.stringify(this.credentials));
      }
      const cached = await this.options.storage.getItem(this.storageKey);
      if (cached) {
        try {
          const value = JSON.parse(cached) as TrialCache;
          if (value.version === 1 && this.validResponse(value.response) && Number.isFinite(value.requestDurationMs) && value.requestDurationMs >= 0 && Number.isFinite(value.deviceAt) && Number.isFinite(value.lastDeviceAt) && typeof value.invalidClock === 'boolean') this.cache = value;
        } catch { /* Invalid cache never grants access; refresh from authenticated server. */ }
      }
    })();
    return this.initialized;
  }
  private validResponse(value: TrialResponse): boolean {
    if (!value || value.environment !== this.options.environment || !Number.isFinite(Date.parse(value.serverNow))) return false;
    if (value.startedAt === null && value.expiresAt === null) return true;
    return typeof value.startedAt === 'string' && typeof value.expiresAt === 'string' && Number.isFinite(Date.parse(value.startedAt)) && Date.parse(value.expiresAt) - Date.parse(value.startedAt) === APP_TRIAL_MS && Date.parse(value.startedAt) <= Date.parse(value.serverNow);
  }
  private async evaluate(verification: 'verified' | 'cached'): Promise<AppTrialState> {
    const cache = this.cache;
    if (!cache) return unavailable('TRIAL_NOT_VERIFIED');
    const current = this.clock.now();
    if (current < cache.lastDeviceAt) cache.invalidClock = true;
    cache.lastDeviceAt = Math.max(cache.lastDeviceAt, current);
    await this.options.storage.setItem(this.storageKey, JSON.stringify(cache));
    if (cache.invalidClock) return unavailable('TRIAL_CLOCK_CHANGED');
    const { response } = cache;
    if (response.startedAt === null || response.expiresAt === null) return { status: 'not_started', isActive: false, verification };
    const monotonicElapsed = this.monotonicAnchor?.serverAt === response.serverNow ? this.clock.monotonic() - this.monotonicAnchor.value : 0;
    const elapsed = Math.max(0, current - cache.deviceAt, monotonicElapsed);
    const serverNow = Date.parse(response.serverNow);
    const estimatedNow = serverNow + cache.requestDurationMs + elapsed;
    const expiration = Date.parse(response.expiresAt);
    const dates = { startedAt: response.startedAt, expiresAt: response.expiresAt };
    if (estimatedNow >= expiration) return { ...dates, status: 'expired', isActive: false, verification };
    const validForMs = Math.min(expiration, serverNow + APP_TRIAL_OFFLINE_MS) - estimatedNow;
    if (validForMs <= 0) return { ...unavailable('TRIAL_OFFLINE_CACHE_EXPIRED'), ...dates };
    return { ...dates, status: 'active', isActive: true, verification, validForMs };
  }
  private async request(start: boolean): Promise<AppTrialState> {
    try {
      if (!['sandbox', 'production'].includes(this.options.environment ?? '')) return unavailable('BILLING_ENVIRONMENT_MISSING');
      if (!this.options.endpoint) return unavailable('TRIAL_API_URL_MISSING');
      const url = new URL(this.options.endpoint);
      const local = this.options.allowLocalhost && url.protocol === 'http:' && ['127.0.0.1', 'localhost', '10.0.2.2'].includes(url.hostname);
      if ((!local && url.protocol !== 'https:') || url.username || url.password || url.search || url.hash) return unavailable('TRIAL_API_URL_INVALID');
      await this.initialize();
      const requestStarted = this.clock.monotonic();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      let result: Response;
      try {
        result = await (this.options.fetch ?? fetch)(`${this.options.endpoint.replace(/\/$/, '')}/v1/trial`, {
          method: start ? 'POST' : 'GET',
          headers: { Authorization: `Bearer ${this.credentials!.secret}`, 'X-Trial-Identity': this.credentials!.id, 'X-App-Environment': this.options.environment!, ...(start ? { 'Content-Type': 'application/json' } : {}) },
          ...(start ? { body: '{}' } : {}),
          signal: controller.signal,
        });
      } finally { clearTimeout(timeout); }
      if (!result.ok) {
        // Authentication/configuration failure invalidates cache; network/5xx may use bounded cache.
        if (result.status < 500) { this.cache = undefined; await this.options.storage.setItem(this.storageKey, 'null'); return unavailable('TRIAL_VERIFICATION_REJECTED'); }
        throw new Error('TRIAL_NETWORK_ERROR');
      }
      const value = await result.json() as TrialResponse;
      if (!this.validResponse(value)) { this.cache = undefined; await this.options.storage.setItem(this.storageKey, 'null'); return unavailable('TRIAL_INVALID_RESPONSE'); }
      const now = this.clock.now();
      this.cache = { version: 1, response: value, requestDurationMs: Math.max(0, this.clock.monotonic() - requestStarted), deviceAt: now, lastDeviceAt: now, invalidClock: false };
      this.monotonicAnchor = { serverAt: value.serverNow, value: this.clock.monotonic() };
      return this.evaluate('verified');
    } catch {
      try { return await this.evaluate('cached'); } catch { return unavailable('TRIAL_STORAGE_OR_NETWORK_ERROR'); }
    }
  }
  getState(): Promise<AppTrialState> { return this.serialize(() => this.request(false)); }
  start(): Promise<AppTrialState> { return this.serialize(() => this.request(true)); }
  /** Purely local re-evaluation for foreground expiry timers; never extends the cache. */
  getCachedState(): Promise<AppTrialState> {
    return this.serialize(async () => {
      try { await this.initialize(); return await this.evaluate('cached'); } catch { return unavailable('TRIAL_STORAGE_ERROR'); }
    });
  }
}
