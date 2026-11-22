# Store and billing setup

Updated: 2026-11-22. [Current evidence](release/RELEASE_PREPARATION.md) records the
actual sandbox deployment, partial RevenueCat configuration and native build results.
Production billing, store submission and Stripe checkout remain inactive; all readiness
gates are false. This is the canonical remaining external-action list.

## Identity and catalog

Preserve these source identifiers while confirming the existing console records:
iOS `com.eliogenesis.tuneintoher`, Android `com.pryshvitsyn.tuneintoher`, EAS project
`dc8938e7-7163-413a-9003-479d0afc8a17`. The package mismatch is preserved deliberately;
it is not grounds to replace an already registered application. The authenticated Apple
audit found existing app6832290282, SKU`tuneintoher-ios-001`, primary locale`en-AU`,
version1.0 in Prepare for Submission and no TestFlight builds on November21.
After explicit Founder approval, November22 created group22605485 and registered
`monthly_access`/`annual_access` as drafts, both at level1. Saved Italy/EUR prices were
read back as€3.99/€24.99. [Catalog evidence](release/evidence/apple-catalog-20261122/catalog.json)
records actual Apple IDs, periods, localization and remaining limits. Sales availability
is not configured; the calculated175-territory price schedule does not enable sales.
The existing EAS project belongs to`eliogenesis`; preview now contains the public sandbox
URL and Android SDK key. Production is untouched. Earlier missing-variable findings in
[the configuration audit](BILLING_QA.md#configuration-presence-audit) are historical.

| Platform | Product ID | Base plan / RevenueCat package | Period | Eurozone base target | Entitlement | Sandbox / production status |
| --- | --- | --- | --- | --- | --- | --- |
| Apple | `monthly_access` / Apple6837968807 | Tune Into Her Full Access22605485, level1 / current default `$rc_monthly` | P1M | EUR 3.99 saved/read back (Italy) | `full_access` attached/reloaded | Prepare for Submission; no introductory offer; availability unset; native purchase unverified |
| Apple | `annual_access` / Apple6837969104 | Same group and level1 / current default `$rc_annual` | P1Y | EUR 24.99 saved/read back (Italy) | `full_access` attached/reloaded | Prepare for Submission; yearly upfront, no introductory offer; availability unset; native purchase unverified |
| Google Play | `monthly_access` (preserve if registered) | `monthly` **proposed** / `$rc_monthly` | P1M | EUR 3.99 | `full_access` | Both unverified |
| Google Play | Same subscription as above | `annual` **proposed** / `$rc_annual` | P1Y | EUR 24.99 | `full_access` | Not created/verified |
| RevenueCat Billing web | `web_monthly` **proposed** | `$rc_monthly` in web offering | P1M | EUR 3.99 | `full_access` | Not created/verified |
| RevenueCat Billing web | `web_annual` **proposed** | `$rc_annual` in web offering | P1Y | EUR 24.99 | `full_access` | Not created/verified |

Inspect current store/Stripe catalogs and paid agreements **before** creating or changing
anything. Existing prices, terms, offers, IDs and subscriptions require a migration review;
this source change does not alter them. If Stripe Billing subscriptions already exist,
preserve that engine and use the [official Stripe integration](https://www.revenuecat.com/docs/web/integrations/stripe)
instead of also subscribing the same customer in RevenueCat Billing.

Select a current RevenueCat offering whose explicit monthly and annual packages match
these periods. Do not rely on package order. Attach both actual products/base plans to
`full_access`. Do not configure store introductory trials for this new model: the app trial
is independent. iOS offers that would introduce another trial must be removed from the
new offering/catalog or require migration analysis; Android selects the paid base plan.

November22 connection pass: after specific Founder permission, created exactly one Apple
In-App Purchase key and Apple RC app `app3e066d34c5`; RevenueCat reports **Valid credentials**.
Registered both exact Apple IDs manually, attached them to `full_access` and saved current
offering `default` (`ofrng36616cccd9`) with `$rc_monthly` / `$rc_annual`. Reload verifies both.
Real iOS public SDK key (sensitive visibility) and explicit `default` are in EAS preview;
readback and the existing iOS billing-test gate pass. Private key/owner inventory are in
owner-only storage outside Git, not chat. No Test Store/Play substitute or app data write.
The Apple sandbox tester list was empty at this pass's audit. Owner reauthentication is
complete; the exact RC callback is saved/read back only in Apple's Sandbox URL, production
URL still unset. Sandbox TEST delivery now passes (Apple request/status200, SUCCESS); actual purchase/lifecycle events remain unverified. Automatic store import/
status sync has no separate App Store Connect API key; that optional key was not created.
[Sandbox execution preparation and data-preservation steps](BILLING_QA.md#apple-sandbox-preparation--22-november-2026)
are ready;49 focused purchase/configuration tests pass. This does not prove a transaction.

## One owner checklist

This is the canonical external action list. Enter credentials directly in EAS,
RevenueCat, Cloudflare or the store's secret storage; never send secrets in chat or git.

| Service | Missing concrete action/value | Where to obtain/configure | Already prepared | Verification unlocked |
| --- | --- | --- | --- | --- |
| Apple account/signing | Separate approval for apple: partition on only new key (automatic review rejected broader scope); adequate build-host capacity, next build number/free-download pricing remain open | Apple Developer; local protected signing storage and Login Keychain | One certificate/profile valid through22November2027; Apple trust/profile checks pass. Approved local import complete, identities1→2/prior identity/search list intact. Owner system confirmations reported; exact-key readback still lacks apple:. No ACL update, IPA/TestFlight build or private-key upload | Signed TestFlight-capable IPA/install |
| Apple agreements/catalog | Owner must update legal entity and accept Paid Applications Agreement (New, not active at fresh November22 audit); confirm sales regions and tax category, finish review screenshot/metadata. Draft creation approval is resolved | App Store Connect → Business; app → Monetization → Subscriptions | Founder-approved group22605485 and both products created November22; periods1month/1year, equal level1, en-AU draft names/descriptions, Italy€3.99/€24.99 saved/read back; no introductory offer, availability unset, tax category inherits app without attestation | Catalog mapping and both sandbox purchase/lifecycle matrices |
| RevenueCat Apple | Run actual native purchases/lifecycle after tester/Apple/signing prerequisites. Independent Sandbox TEST delivery already passes. Optional automatic import/status sync needs a separately authorized App Store Connect API key | RevenueCat → iOS app configuration; Apple sandbox notifications | Apple app3e066d34c5 / preserved bundle, valid authorized In-App Purchase key; both products attached to full_access. Owner reauth complete; Sandbox callback saved/matched after reload, production URL unset; no extra API/signing key | Server-confirmed Apple CustomerInfo and notifications |
| Google account/app | Owner must choose eligible account type/health classification and separately authorize any paid registration before Console setup; then verify app/package, account date, merchant, signing and versionCode | Play Console; EAS Credentials/version management | Founder explicitly confirms no existing developer account. None created/paid. Package/EAS preserved; remote versionCode1 initialized only for internal native-audit | Play-signed AAB upload/internal install |
| Android runtime/signing | Supply owner-verified upload key/Play App Signing and Android runtime equipment; run actual16KB device/emulator, launcher/splash/routing/notification/store QA | Play Console; authorized test host/device | Real EAS AAB/API36/Billing8.3.0; all50 64-bit ELF/RELRO and same-AAB derived APK ZIP checks pass. Internal debug signature is not upload signing | Store-signed artifact and actual16KB/runtime acceptance |
| Google subscriptions | Verify existing subscription; create monthly+annual auto-renewing base plans if compatible, EUR target prices, regions and localized disclosures; audit offers | Play Console → Monetize → Products → Subscriptions | Two exact periods, paid base-plan purchase and explicit same-store plan-change flow | Monthly/annual and pending-payment sandbox tests |
| RevenueCat Google | Google Play service account with permissions requested by current RevenueCat guide, app connection and real-time developer notifications; license testers | RevenueCat Android app; Google Cloud/Play Console | Play app445ba93d10 created with preserved package; public SDK key in EAS preview; service credentials/notifications missing | Google purchase/renewal/hold/restore updates |
| RevenueCat catalog/keys | Finish genuine Google catalog/connection and map its paid base plans. Fetch actual native Apple offerings and test transactions | RevenueCat project/catalog and platform SDK keys → EAS env | Apple monthly/annual → full_access → current default offering saved/reloaded; both platform public SDK keys and explicit offering in EAS preview, iOS readback/preflight pass. Production untouched | Native offerings and sandbox transactions; `test_` Test Store keys are not store proof |
| Trial backend | Sandbox deployed/HTTP/native-Simulator verified with EU D1 and hashed-IP edge rate limit; preview EAS URL configured. Before separately authorized production: finalize legal retention/deletion/provider terms, production D1/route/rate binding and production URL. Never recreate sandbox or deploy production implicitly | Project-owned Cloudflare account; [backend README](backend/README.md) | Live explicit14-day start/repeat/credentials/env/time-body/redeploy/429 pass; ordinary signed Simulator onboarding→real trial→Today→cold restart pass. Controlled-clock offline/expiry separate | Production/device trial acceptance and optional webhook delivery |
| RevenueCat webhook | If enabling the optional journal, configure each environment's endpoint, REVENUECAT_WEBHOOK_AUTH and exact REVENUECAT_APP_IDS allowlist; if console HMAC signing is enabled also set REVENUECAT_WEBHOOK_SIGNING_SECRET; send sandbox events and verify persistence/redelivery | RevenueCat → Integrations → Webhooks; Cloudflare secrets | Authorization plus optional raw-body HMAC/timestamp verification; durable event idempotency; no Stripe lifecycle duplicate | Wrong auth, replay and out-of-order live-delivery QA |
| RevenueCat Billing + Stripe — **deferred, not a native-launch blocker** | Audit existing Stripe subscriptions first; connect project-owned Stripe in authorized test mode; configure two RC products/offering and sandbox Web Purchase Link | RevenueCat Web configuration → Stripe connection; Funnels → Purchase Links | Chosen architecture and redemption client integration | Hosted test checkout; no live payment authorized |
| Web redemption — **deferred, not a native-launch blocker** | Enable Redemption Links; copy its actual unique `rc-…` scheme to `EXPO_PUBLIC_REVENUECAT_REDEMPTION_SCHEME`; populate actual store download links in RC, rebuild native apps | RevenueCat web config → Redemption Links; EAS env | Conditional Expo/native registration; SDK redemption with confirmed entitlement | Cold/warm/not-installed, invalid/expired/reused proof-of-purchase tests |
| Web portal/lifecycle — **deferred, not a native-launch blocker** | Configure RC Customer Portal, transactional email identity and monthly↔annual switching; verify email portal link/CustomerInfo management URL | RevenueCat Billing settings and Customer Portal | Source-aware management, no guessed Stripe portal | Web cancel, renew, receipt, payment update, refund and recovery |
| Web regions/locales — **deferred, not a native-launch blocker** | Approve supported sales regions (India excluded currently); verify actual hosted language/fallback and legal translations | RevenueCat Billing configuration and test checkout | Native path retained; no external checkout CTA in global native app | Regional checkout and native fallback evidence |
| Seller/legal/tax | Supply legal seller name/address, tax/VAT status, receipt details, monitored support/privacy contact, Terms/Privacy HTTPS URLs; decide tax provider/registrations in test first | Brand config; RC Billing invoice footer; Stripe/tax authority; legal adviser | Privacy/disclosure drafts and local screens | Final amount/currency/tax/receipt and compliant notices; RC+Stripe is not assumed merchant of record |
| Google testing access | Confirm applicability to personal account created after 2023-11-13; if applicable 12 opted-in testers continuously 14 days, then apply for production access | Play Console → Closed testing and Dashboard | Separate billing-test AAB profile/instructions | Production-track eligibility (internal testing does not replace it) |
| Store declarations/review | Complete Apple privacy/age/trader forms; Google Data Safety, Health Apps declaration, content rating and app access instructions from actual flows; publish verified privacy URL | App Store Connect; Play Console → App content | Data inventory/reviewer notes below; readiness evidence remains false | Accurate store review/submission after device and legal sign-off |

## Build and test environments

`EXPO_PUBLIC_*` values are bundled and public. Only platform public SDK keys, backend URL,
environment name and non-secret redemption scheme belong there. Never place Stripe
`sk_…`, RevenueCat secret keys, webhook auth tokens, Apple keys or service-account JSON there.

- `development`: native dev client; existing accelerated demonstration may be enabled.
- `preview`: existing stakeholder accelerated demo; not a billing test result.
- `billing-test`: store-distributed binary, demo/mocks disabled, sandbox app/backend environment.
  Use Apple/Google platform public keys for genuine store sandboxes. RevenueCat Test Store
  keys may test SDK UI but do not prove an Apple/Google purchase.
- `native-audit`: internal ordinary Android native inspection, explicit audit guard, no QA/sample access and no owner-verified upload signing. Never submit this artifact as a verified Play release.
- `production`: production backend/environment, public platform keys, no mocks/demo;
  release evidence and legal gates must also pass. Store sandbox/TestFlight transactions
  are valid tests even when using production platform SDK keys; they are not revenue.

After filling EAS preview environment values and authorized signing:

```sh
npx eas-cli build --profile billing-test --platform ios
npx eas-cli build --profile billing-test --platform android
```

These store-distribution commands have **not** been executed. Separate Free EAS `native-audit` build10288699… finished; actual binaries/static proof are in the current report, with debug signing explicitly excluded from Play upload proof. Verify service cost/authorization
before starting a remote build. Install Android via Play internal testing/license testers,
not merely sideloading an export. iOS requires development sandbox/TestFlight. The current
native dependency change requires a new binary; an OTA update cannot add native code/schemes.

## Current platform requirements

For the 2026-11-21 check, Google requires API 36+ for new mobile apps/updates; Billing 7's
extension expired on November 1, so use Billing 8+. See [target API](https://support.google.com/googleplay/android-developer/answer/11926878)
and [billing deadlines](https://developer.android.com/google/play/billing/deprecation-faq).
The [16KB guide](https://developer.android.com/guide/practices/page-sizes) requires checking
native binaries and final packaging; a modern Expo/RN version alone is not proof.
Apple uploads currently require Xcode 26+/iOS 26 SDK; verify again before uploading
([requirements](https://developer.apple.com/news/upcoming-requirements/)).

Native purchase buttons use platform stores. This release has no external checkout button.
Any later external-payment UI needs verified storefront/program eligibility and current
[Apple rules](https://developer.apple.com/app-store/review/guidelines/) /
[Google rules](https://support.google.com/googleplay/android-developer/answer/9858738),
not inference from language, IP or currency.

Google's [account requirements](https://support.google.com/googleplay/android-developer/answer/10788890) require an Organization account for providers of listed services, including health apps such as medical/research apps. Verify classification for these actual cycle-related features in the existing Play account; do not infer Personal eligibility from the close-person audience or register another account blindly. If an Organization route is required, complete its verified business/D-U-N-S information through the owner.

## Store disclosures and reviewer notes draft

Tune Into Her gives practical attention/support guidance for a woman, informed by locally
entered estimated cycle context. The recipient can be a partner of any gender or another
close person. It does not predict mood, provide medical/fertility decisions or guarantee
an outcome. Declare cycle-related health features accurately; Google includes health data
used to support non-health functionality in its [Health Apps declaration](https://support.google.com/googleplay/android-developer/answer/14738291).

Cycle dates/lengths, guidance history and feedback stay on the device. Billing identifiers,
purchase status and provider technical data are processed by RevenueCat and stores;
pseudonymous trial identity/authentication and access dates reach the isolated backend.
Web checkout additionally processes the buyer's billing/contact/payment information with
RevenueCat/Stripe. Review each provider's current disclosure guidance and hosting/security
logs before answering Apple App Privacy and Play Data Safety. Do not declare that the app
has no backend or no purchase/identifier processing. No advertising/behavioral analytics is added.

Review notes: complete onboarding, then explicitly start 14 days of full app access. No
card, registration or subscription is required and there is no charge at expiry. A separate
voluntary monthly or annual purchase renews under the selected platform's terms; an early
purchase can charge immediately. Settings, privacy, restore and management remain reachable
after expiry. To test store purchases during review, open Settings → Subscription; use the
store sandbox. Provide a live trial backend during review. Controlled-clock expiry tests
are automated/local tests, not a hidden production payment bypass. Supply any review QR/link
through the store's protected review channel, never a public restoration token.

See [monetization contract](MONETIZATION.md), [actual QA and remaining matrix](BILLING_QA.md),
and [privacy draft](PRIVACY.md). No readiness flag is set true by this checklist.
