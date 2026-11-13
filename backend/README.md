# Tune Into Her isolated trial backend

Prepared source; **not provisioned or deployed**. This service has no cycle, advice,
relationship, analytics or advertising data. Paid access remains RevenueCat
CustomerInfo's `full_access`; this database never synthesizes a paid entitlement.

## Local sandbox (no account, no new paid service)

Requires Node 24+ (verified locally with 26.5.1). No backend npm dependencies.

```sh
node backend/local.mjs
```

The loopback API is `http://127.0.0.1:8787`. SQLite persists in ignored
`backend/.local/sandbox.sqlite`. Stop with Ctrl-C. Do not delete this DB to test
idempotency. iOS Simulator can use loopback; Android emulator uses `10.0.2.2`.
Physical devices require a deliberately configured HTTPS development endpoint.
The app permits HTTP only for these localhost/emulator hosts under `__DEV__`.

Set public client configuration through the untracked development/EAS environment:

```dotenv
EXPO_PUBLIC_TRIAL_API_URL=http://127.0.0.1:8787
EXPO_PUBLIC_BILLING_ENVIRONMENT=sandbox
```

No API secret goes in `EXPO_PUBLIC_*`. Native rebuild is required when adding
`expo-crypto`. Backend does not start a trial on a read, onboarding completion, an
SDK callback or a server webhook. Only the explicit app action calls POST.

## API and identity

- `GET /v1/trial`: status; unknown identity returns an unstarted trial.
- `POST /v1/trial`, body exactly `{}`: start, or return original immutable dates.
- Headers: `X-Trial-Identity` = random 128-bit pseudonym; `Authorization: Bearer`
  followed by a separate random 256-bit credential; `X-App-Environment` =
  `sandbox` or `production`. The pseudonym is independent of RevenueCat App User ID.
- Server stores a SHA-256 credential hash, fixed start and expiry in UTC, environment
  and identity. Time comes from the server. SQL primary key `(environment, identity)`
  makes concurrent starts idempotent; expiry is exactly start + 1,209,600,000 ms.
- Missing/wrong credentials: 401; wrong environment: 400; transient DB error: 503.
  Responses disable HTTP caching. No credential/body/identity is logged by this code.
- SecureStore retains the credential/cache under `tih.trial-credential.v1.<env>` and
  `tih.trial-cache.v1.<env>`. Local cycle/history deletion deliberately leaves these
  keys and server trial dates, preventing re-onboarding from extending known access.

No mandatory account, fingerprinting or cross-device identity is introduced.
Deletion of all identity data or a new device can create another unknown guest;
absolute one-person trial enforcement is impossible here. An existing installation
without a server trial gets the same explicit opt-in start; local legacy premium
flags never grant access. There is no automatic charge when the trial expires.

## Offline policy

Only previously verified server responses can unlock the app. Cache lifetime is
at most 24 hours since server verification and never beyond known trial expiry.
The request round-trip duration is conservatively subtracted. A persistent device
clock high-water mark rejects rollback until online refresh; in-process monotonic
time also handles a held wall clock. Reads and restarts do not renew the cache.
This is bounded best-effort offline protection on a guest-controlled device, not
attestation against a tampered OS or deliberately frozen clock across process exits.
The app must re-evaluate `getCachedState()` at its returned `validForMs` deadline and
refresh `getState()` on foreground. A network failure differs from known expiry.

## Cloudflare Worker + D1 owner setup

No Cloudflare resources are created by these instructions or tests. An owner must
first approve any applicable service costs and use the project's own account.

1. Install an official current Wrangler CLI, record its exact version in build proof.
2. From `backend/`, create two D1 databases: `tune-into-her-trial-sandbox` and
   `tune-into-her-trial-production`. Replace only their respective placeholder IDs in
   `wrangler.jsonc`; never point them to another product's database.
3. Apply migration separately:
   `wrangler d1 migrations apply tune-into-her-trial-sandbox --remote` and
   `wrangler d1 migrations apply tune-into-her-trial-production --remote --env production`.
4. Configure separate HTTPS routes/custom domains. `workers_dev` is deliberately
   disabled until the owner configures the intended route. Add a conservative edge
   rate limit for trial requests; do not persist raw credentials, request bodies,
   query strings or identifying access logs. Configure retention and deletion policy.
5. Deploy to the authorized sandbox with `wrangler deploy`; separately authorize
   production before `wrangler deploy --env production`. Verify the health endpoint,
   environment rejection, repeat start, UTC boundary and database restart/retention.
6. Put the corresponding HTTPS base URL and matching billing environment in EAS;
   no trailing endpoint path is needed (`/v1/trial` is appended by the client).

Verify pricing, data region, data processing terms, backup/retention and abuse
controls before production. Deleting trial records permits another trial; document
that consequence in a verified ownership-based privacy deletion process. A remote
self-service trial deletion endpoint is not implemented. Trial state is pseudonymous
personal data; legal retention duration and contact are owner actions.

## Optional RevenueCat lifecycle journal

`POST /v1/webhooks/revenuecat` is an optional diagnostic/durable metadata journal.
It is not required for mobile access. It does not create a parallel billing engine,
sync a second entitlement database or require a custom Stripe webhook.

Before enabling in the RevenueCat console, configure per environment:

- Secret `REVENUECAT_WEBHOOK_AUTH`, e.g. an unpredictable `Bearer …` header value.
- If console HMAC signing is enabled, secret
  `REVENUECAT_WEBHOOK_SIGNING_SECRET`; the handler then requires and verifies the
  documented `X-RevenueCat-Webhook-Signature: t=…,v1=…` over the original raw body,
  with five-minute delivery timestamp tolerance. Retries get freshly signed delivery
  timestamps. This protocol is independent of Stripe's webhook signature protocol.
- Public server-only `REVENUECAT_APP_IDS` = exact comma-separated allowed RC app IDs.
- Choose only the matching SANDBOX/PRODUCTION events. TEST is sandbox-only.

Store secrets with `wrangler secret put NAME` (use `--env production` for the
production worker); never commit them or send them through the chat. If signing is
not enabled, the configured authorization header is still mandatory. Only the event
ID, type, app ID, environment, event timestamp and receipt time are persisted.
Subscriber attributes, emails, tokens and the full payload are discarded. Durable
insert precedes 200; duplicate IDs return 200; DB failure returns 503 for retry.
Delayed/out-of-order events cannot mutate access. The SDK's refreshed CustomerInfo
is authoritative. If future server behavior depends on paid access, fetch current
RevenueCat subscriber state with a server-held API key rather than blindly applying
an event. Journal retention is also an owner privacy-policy setting.

## Verification

From project root:

```sh
npx vitest run tests/appTrial.test.ts tests/billingBackend.test.ts
npm run typecheck
```

Focused tests use controlled clocks, real SQLite statements, concurrent starts,
wrong credentials/env/body, cache TTL/rollback/restart, exact UTC expiry, delayed
webhooks, raw-body HMAC/timestamp authentication, duplicates and DB failure. Local
HTTP start → process restart → GET/repeated POST was also verified with unchanged
server dates. No cloud deployment, billing transaction or store test is implied.

Official references checked 13 November 2026:
[Cloudflare D1 API](https://developers.cloudflare.com/d1/worker-api/d1-database/),
[RevenueCat webhooks and signing](https://www.revenuecat.com/docs/integrations/webhooks),
[event fields](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields).
