# Store and billing setup

Updated: 2026-11-13. External consoles have **not** been configured or verified by this
change. No production charge, deployment, store upload or submission was performed.
The current model supersedes earlier undecided billing drafts: free download, explicit
14-day application access without a card/subscription, then voluntary monthly or annual
purchase. Base eurozone prices: €3.99/month and €24.99/year (one annual payment).
Both plans grant `full_access`. Real storefront prices/currencies are displayed by the SDK.

## Identity and catalog

Preserve these source identifiers while confirming the existing console records:
iOS `com.eliogenesis.tuneintoher`, Android `com.pryshvitsyn.tuneintoher`, EAS project
`dc8938e7-7163-413a-9003-479d0afc8a17`. The package mismatch is preserved deliberately;
it is not grounds to replace an already registered application. `monthly_access` is a
legacy **source expectation**, not evidence that a store product exists. A read-only
authenticated Expo metadata audit confirmed the existing EAS project belongs to
`eliogenesis`; the target billing variables are absent from both project and account
metadata, and no actual local `.env` exists. Values were never requested or exposed;
see [configuration audit](BILLING_QA.md#configuration-presence-audit).

| Platform | Product ID | Base plan / RevenueCat package | Period | Eurozone base target | Entitlement | Sandbox / production status |
| --- | --- | --- | --- | --- | --- | --- |
| Apple | `monthly_access` (legacy source; verify) | Same subscription group / `$rc_monthly` | P1M | EUR 3.99 | `full_access` | Both unverified |
| Apple | `annual_access` **proposed** | Same group and level / `$rc_annual` | P1Y | EUR 24.99 | `full_access` | Not created/verified |
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

## One owner checklist

This is the canonical external action list. Enter credentials directly in EAS,
RevenueCat, Cloudflare or the store's secret storage; never send secrets in chat or git.

| Service | Missing concrete action/value | Where to obtain/configure | Already prepared | Verification unlocked |
| --- | --- | --- | --- | --- |
| Apple account/signing | Confirm app record for existing bundle ID and free download pricing after existing-listing audit; Developer membership/team, distribution profile, device/TestFlight access and next build number | Apple Developer; App Store Connect; EAS Credentials | Bundle ID preserved; local Xcode 26.6 and one valid development identity observed (distribution/profile/device unverified) | Signed development/TestFlight install |
| Apple subscriptions | Verify legacy ID; create/confirm annual ID, same subscription group/level, EUR base prices, regions, localized terms/screenshots; audit introductory offers and existing subscribers | App Store Connect → app → Monetization → Subscriptions | Two explicit package periods and paid entitlement lifecycle | Both sandbox purchases, renew/cancel/expiry, plan change |
| RevenueCat Apple | Confirm project/app; grant current Apple integration credentials and notifications; import actual products and attach entitlement | RevenueCat → iOS app configuration; Apple API keys/notifications | Existing `full_access` preserved | Server-confirmed Apple CustomerInfo and notifications |
| Google account/app | Confirm existing Android app/package and free download pricing after listing audit, account type/date and health-app Organization requirement applicability, payment profile, Play App Signing, upload key and next unused versionCode | Play Console; EAS Credentials/version management | Package/EAS project preserved, remote version source and autoIncrement retained | Play-signed AAB upload/internal install |
| Android toolchain/artifact | Provision JDK and Android SDK/NDK; generate native project; resolve release graph, build AAB and inspect 16KB compatibility | Authorized build host or existing EAS project | AAB build profile; pinned SDK dependency trace documented in BILLING_QA | Actual release manifest, dependency graph, AAB, 16KB device result |
| Google subscriptions | Verify existing subscription; create monthly+annual auto-renewing base plans if compatible, EUR target prices, regions and localized disclosures; audit offers | Play Console → Monetize → Products → Subscriptions | Two exact periods, paid base-plan purchase and explicit same-store plan-change flow | Monthly/annual and pending-payment sandbox tests |
| RevenueCat Google | Google Play service account with permissions requested by current RevenueCat guide, app connection and real-time developer notifications; license testers | RevenueCat Android app; Google Cloud/Play Console | One native RevenueCat SDK; same entitlement | Google purchase/renewal/hold/restore updates |
| RevenueCat catalog/keys | Confirm `full_access`, current offering, monthly/annual mappings, actual public `appl_…` and `goog_…` keys | RevenueCat project/catalog and platform SDK keys → EAS env | Runtime mapping and distribution preflight | Native offerings and sandbox transactions; `test_` Test Store keys are not store proof |
| Trial backend | Create separate sandbox/production D1 databases, apply migration, set ENVIRONMENT, routes, retention/rate limits and deploy isolated Worker; set real HTTPS public URL and matching app environment (trial itself needs no webhook secret) | Project-owned Cloudflare account; [backend README](backend/README.md) | Local service, schema and client; no cycle fields | Server-authoritative trial on real devices and durable webhook delivery |
| RevenueCat webhook | If enabling the optional journal, configure each environment's endpoint, REVENUECAT_WEBHOOK_AUTH and exact REVENUECAT_APP_IDS allowlist; if console HMAC signing is enabled also set REVENUECAT_WEBHOOK_SIGNING_SECRET; send sandbox events and verify persistence/redelivery | RevenueCat → Integrations → Webhooks; Cloudflare secrets | Authorization plus optional raw-body HMAC/timestamp verification; durable event idempotency; no Stripe lifecycle duplicate | Wrong auth, replay and out-of-order live-delivery QA |
| RevenueCat Billing + Stripe | Audit existing Stripe subscriptions first; connect project-owned Stripe in authorized test mode; configure two RC products/offering and sandbox Web Purchase Link | RevenueCat Web configuration → Stripe connection; Funnels → Purchase Links | Chosen architecture and redemption client integration | Hosted test checkout; no live payment authorized |
| Web redemption | Enable Redemption Links; copy its actual unique `rc-…` scheme to `EXPO_PUBLIC_REVENUECAT_REDEMPTION_SCHEME`; populate actual store download links in RC, rebuild native apps | RevenueCat web config → Redemption Links; EAS env | Conditional Expo/native registration; SDK redemption with confirmed entitlement | Cold/warm/not-installed, invalid/expired/reused proof-of-purchase tests |
| Web portal/lifecycle | Configure RC Customer Portal, transactional email identity and monthly↔annual switching; verify email portal link/CustomerInfo management URL | RevenueCat Billing settings and Customer Portal | Source-aware management, no guessed Stripe portal | Web cancel, renew, receipt, payment update, refund and recovery |
| Web regions/locales | Approve supported sales regions (India excluded currently); verify actual hosted language/fallback and legal translations | RevenueCat Billing configuration and test checkout | Native path retained; no external checkout CTA in global native app | Regional checkout and native fallback evidence |
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
- `production`: production backend/environment, public platform keys, no mocks/demo;
  release evidence and legal gates must also pass. Store sandbox/TestFlight transactions
  are valid tests even when using production platform SDK keys; they are not revenue.

After filling EAS preview environment values and authorized signing:

```sh
npx eas-cli build --profile billing-test --platform ios
npx eas-cli build --profile billing-test --platform android
```

These are prepared commands, **not executed cloud builds**. Verify service cost/authorization
before starting a remote build. Install Android via Play internal testing/license testers,
not merely sideloading an export. iOS requires development sandbox/TestFlight. The current
native dependency change requires a new binary; an OTA update cannot add native code/schemes.

## Current platform requirements

For the 2026-11-13 check, Google requires API 36+ for new mobile apps/updates; Billing 7's
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
