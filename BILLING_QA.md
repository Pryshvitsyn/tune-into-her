# Billing QA and evidence

Current status, 2026-11-22: Apple group and monthly/annual drafts are now created after
explicit Founder approval, with equal level1,1month/1year and saved/read-back Italy prices
€3.99/€24.99. No introductory offers or sales availability configured. See the
[actual catalog and limits](release/evidence/apple-catalog-20261122/catalog.json).
RevenueCat Apple app `app3e066d34c5` now has valid In-App Purchase credentials, both
products attached to `full_access`, and current offering `default` with both standard
packages. EAS preview key/offering readback and iOS billing-test preflight pass. Actual
native store purchases remain unverified; see the current preparation below.
The November21 isolated Cloudflare sandbox HTTP and ordinary native Simulator
trial→Today→cold restart now pass; RevenueCat is partially configured and an actual internal
Android AAB has binary evidence. See [current release preparation](release/RELEASE_PREPARATION.md)
and [remaining owner actions](STORE_SETUP.md). The dated November13 observations below are
historical and do not override that new proof. Real Apple/Google store transactions and
store-distribution signing remain unverified.

## Final live audit — 22 November 2026

All existing mappings/prices/periods/levels were freshly verified. Apple Paid Applications
Agreement remains **New** (owner legal-entity update required); availability is unset,
Sandbox testers and TestFlight builds were absent at audit. The owner now intends to complete
the tester/Business forms, without reporting completion yet. Distribution creation consent
has now been explicitly received. After owner manual public-CSR selection, exactly one
Distribution certificate and App Store profile were issued, expiring22November2027.
Key/CSR/certificate equality, Apple trust and profile Team/bundle/certificate/debug/no-device
checks pass. Automatic review rejected persistent Login Keychain import outside prior consent;
no import was executed. Signed IPA and actual purchases remain unverified. No private key was
sent to EAS/Apple; existing Development credentials are unchanged.
[Signing follow-up](release/evidence/final-billing-20261122/signing-progress.json).

**Actual Apple Sandbox TEST notification delivery now passes:** request200/status200,
`sendAttemptResult=SUCCESS`, using the existing approved IAP key locally. This is technical
notification-path proof, not a subscription/CustomerInfo lifecycle. Production URL unchanged.
[Sanitized live evidence](release/evidence/final-billing-20261122/provider-audit.json).
Actual preview values pass iOS sandbox-preflight again;531application tests/55files pass.

A full native compile was stopped under measured host disk/swap pressure. A separate current
Hermes re-embed of the prior verified Simulator Release uses the real SDK key/no mock/demo;
its signature and unsigned native-payload equality are verified. Runtime results below/under
current evidence must not be labelled a new native build, signed store IPA or actual purchase.
The original Release artifact and personal iPhone data are preserved.

Current accepted runtime: prepared normal onboarding → explicit real isolated app trial →
authored Today → cold restart passes. Native store offer loading returns the normal unavailable
state; Retry and return to trial Today pass. Restore is enabled but was not tapped; no native
prices, sheet, transaction or paid entitlement is verified. The first reminder-wait XCTest
failure is retained separately. The exact accepted method is committed to the existing
[native-release harness](tests/native-release/ReleaseSandboxQA.swift).
[Full no-Metro Simulator launch](release/evidence/final-billing-20261122/native/startup-real-key-simulator.mp4):
40.036667s/1757frames/0black, same process. It is the described isolated re-embed, not an IPA.

## Apple sandbox preparation — 22 November 2026

The Founder authorized connecting the two existing Apple products to RevenueCat and
preparing purchase QA, without publication or personal-data changes. Reuse project
`5921ebba` and entitlement `full_access` (`entl23b5999e8c`). The current native service
already reads the configured/current offering's standard monthly and annual packages;
no purchase, trial, identity or persistence implementation change is needed.

| Configured package | Existing Apple product | Period | Access |
| --- | --- | --- | --- |
| `$rc_monthly` | `monthly_access` (Apple6837968807) | P1M | `full_access` |
| `$rc_annual` | `annual_access` (Apple6837969104) | P1Y, full yearly payment | `full_access` |

Configured offering: `default` (`ofrng36616cccd9`), display name **Tune Into Her Full Access**,
marked current by RevenueCat. Saved both standard packages under Apple app `app3e066d34c5`:
monthly product `prodb61c7ca0c5`, annual product `prod90bb80af69`. Both are attached to the
existing entitlement; a fresh entitlement page and reloaded offering verify the mapping.
[Dated configuration and screenshots](release/evidence/revenuecat-20261122/configuration.json).

The initial credential approval blocker was resolved by explicit Founder permission in
this chat. Created exactly one **Tune Into Her RevenueCat IAP** key and uploaded it only
to this RevenueCat Apple app, which reports **Valid credentials**. The downloaded key and
separate owner instructions are outside Git in owner-only local storage (directories700,
files600); no private key contents were printed, and no password was created. No App Store
Connect API key, signing certificate/profile or legacy shared secret was generated.
Products were registered manually using the verified existing Apple IDs. Automatic store
import/status/price synchronization still lacks the separate optional App Store Connect
API credential; RevenueCat shows **Could not check** for store status. This does not prove
that native StoreKit has fetched either product or completed a transaction.

An In-App Purchase key is required by the current React Native/StoreKit2 integration,
as documented by [RevenueCat](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration).
It is an account-level credential, not an app-scoped distribution certificate. Keep its
private file out of Git, chat, screenshots and public build variables. Creating any
additional security credential needs its own applicable permission.

Before running a real Apple sandbox transaction:

1. The preserved bundle `com.eliogenesis.tuneintoher`, both Apple product IDs, shared
   entitlement and standard packages are saved. On the actual native build, confirm
   `getOfferings()` resolves both expected products with P1M/P1Y and no introductory offer.
   No Play/Test Store substitute was added. Native metadata/transactions are still open.
2. The real public `appl_…` SDK key is now in EAS **preview**, visibility **sensitive**;
   `EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default` is explicit there. Readback matches the
   separate protected owner copy, and the existing iOS `billing-test` gate passes using
   the pulled remote values. SDK keys are bundled public identifiers, not server secrets;
   values are not printed or committed. Production is untouched.
3. Complete Apple owner prerequisites: the November21 Paid Applications Agreement/legal
   blocker (recheck current status), sales availability/tax/review metadata, and authorized
   signing. The sandbox account page showed **no testers** during this audit. The owner must create a separate tester
   with an owned email and enter its password directly in Apple, then sign into the
   device's Sandbox Apple Account. Never replace the personal iCloud account or send
   credentials in chat. TestFlight has no builds at the dated audit; no upload is implied.
   After owner password reauthentication, the exact RevenueCat callback was saved in
   Apple's **Sandbox** server URL and matched after reload. The production URL remains
   unset. Sandbox TEST delivery is now verified by Apple SUCCESS; purchase events remain untested.
   The opaque callback is stored only in the
   protected owner inventory, not this document.
4. Reuse `billing-test` in [eas.json](eas.json): store distribution, preview environment,
   sandbox trial service, demo=false and mocks=false. With authorized signing and real
   public SDK configuration, run `npx eas-cli build --profile billing-test --platform ios`.
   Check the existing `eas-production-check.mjs` before building. This build has **not**
   been started; no paid build, store upload or physical-device replacement was performed
   in this pass. The private Founder QA entry is rejected by the build gate.
   The app's sandbox flag alone does not select Apple's purchase environment: use the
   genuine sandbox/TestFlight build/account flow and inspect the native sheet before confirming.
5. Use a designated test device/installation, or a reviewed update preserving the existing
   app container. Do not uninstall, clear storage, erase cycle/history/trial credentials,
   reset the RevenueCat anonymous identity, change device time, or clear personal purchase
   history. Reach the paywall via Settings → Subscription; onboarding/data resets are not
   needed to test purchases. Record only redacted technical evidence.

Execution order once all prerequisites pass: fetch actual packages/prices → cancel each
plan's sandbox sheet → buy monthly → verify server-confirmed sandbox `full_access` →
cold restart/restore → cancel renewal and verify paid-through access → observe renewal/
expiry → test annual and both plan-change directions in Apple's subscription management.
Also cover network failure, pending/delayed entitlement delivery and retry. Check the
native sheet explicitly identifies the sandbox/test environment before confirmation.
The current matrix below defines expected state/error handling; local SDK mocks are not
transaction proof. Follow [RevenueCat's Apple sandbox guide](https://www.revenuecat.com/docs/test-and-launch/sandbox/apple-app-store)
for the actual OS/account flow and known storefront-metadata quirks.

Paid acceptance requires confirmed `CustomerInfo.entitlements.active.full_access`, the
expected product, sandbox status, expiration/renewal and successful verification. Today
being visible is insufficient: the independent 14-day app trial may still allow it. Paid
expiry must not erase that trial or saved data; locked-flow acceptance additionally requires
the app trial to be expired using the existing isolated scenario, not a personal-device
clock or persisted-date alteration. Preserve actual native localized prices; never hardcode
EUR or treat a sandbox currency quirk as permission to change approved pricing.

Current proof: **49 existing purchase/lifecycle/mock-isolation/build-configuration tests
passed across 4 files** on November22, live RC mapping verified after reload, actual EAS
preview readback and iOS billing-test configuration gate pass, sandbox callback saved/read
back with production unchanged. Real Apple purchases, subscription-lifecycle notifications and
native purchase acceptance remain unverified; all nine release-readiness flags remain false.

Date: 2026-11-13. Branch: `codex/monetization-20261113`, based on the current local
release candidate, not an older remote main. Tests below distinguish local deterministic
proof from native store/provider proof. No real payment was made.

## Observed local evidence

| Check | Result | Boundary |
| --- | --- | --- |
| Typecheck | PASS — final integration source | `npm run typecheck` |
| App test suite | PASS — 161 tests / 24 files | Final run reported at16:23:59 host log time; deterministic fixtures are not transactions |
| Content generation check | PASS — 610 bundles / 11 locales / 318 authored texts per locale | Existing catalog preserved |
| Content validation | PASS — 90-day reserve | Native-language/community review remains PENDING |
| Lint | PASS — 0 errors, 13 existing warnings | Captured final lint log: `/tmp/tih-monetization-lint.log` |
| Expo Doctor | 19 / 21 checks | Native config sync warning; package check flags intentional RNSVG 15.16.0 vs Expo recommendation 15.15.4 and 7 Expo patch updates. No blind stack upgrade |
| CocoaPods | PASS — 123 pods | Added ExpoCrypto 57.0.4; requires rebuilt binary |
| iOS Release Simulator build | PASS — normal Release, current arm64 iPhone17 Simulator | First universal build failed ENOSPC. Removed generated unused x86_64 intermediates (~1.3GB), retried with ONLY_ACTIVE_ARCH=YES ARCHS=arm64; `/tmp/tih-monetization-ios-arm64-build.log` ends BUILD SUCCEEDED. No signing/store transaction implied |
| Android JS export | PASS | `/tmp/tih-monetization-android-export`; no AAB or Play transaction proof |
| iOS native paywall | PASS — actual new Release binary, light and dark | Explicit14-day/no-charge policy, no mock label, missing-config messages and no invented prices observed; pre-onboarding trial action disabled. Header SVG marks render. Offer/transaction states still require sandbox config |
| Access integration source review | Implemented | Today creates new guidance only while access is active; saved history retained and future entries hidden. Native regression QA remains open |
| Distribution billing guard | PASS — 5 managed configuration tests | Rejects production mocks, Test Store keys, wrong env, absent/unsafe trial URL and public secrets; actual keys not supplied |
| Empty billing-test preflight | EXPECTED FAIL | Missing sandbox env, both SDK keys and deployed trial URL reported without logging values |
| Empty production release gate | EXPECTED FAIL | Legal/support URLs, owner identity, device/store/content evidence and billing config remain missing |
| iOS toolchain | Xcode 26.6 / build 17F113 observed | One valid Apple Development identity now exists; this is not distribution-signing, provisioning or device evidence |
| Android toolchain | BLOCKED | Main checkout has no Android project; isolated Expo Android prebuild passed. `dependencyInsight` and `bundleRelease` both stop at missing Java Runtime; SDK/adb also absent; no AAB exists |
| Android SDK dependency trace | Published POM/source inspected | `react-native-purchases` 10.8.0 → hybrid-common 18.32.1 → purchases-android 10.18.1 → Billing 8.3.0; not a resolved release graph |
| Android native generation | PASS — isolated temporary Expo prebuild | Preserved applicationId; fixture scheme registered. Fixture is not an actual RC dashboard scheme |
| Android target defaults | Source inspected | RN 0.86.3 catalog target/compile 36, buildTools 36.0.0, AGP 8.12.0, NDK 27.1.12297006; final generated manifest/artifact unverified |
| Expo/EAS identity/project | CONFIRMED — read-only authenticated metadata | Account `eliogenesis`, project `dc8938e7-7163-413a-9003-479d0afc8a17`, scope `@eliogenesis/tune-into-her`; no account/config changes |
| Billing configuration presence | CONFIRMED MISSING locally and in EAS metadata | No actual local `.env*` except template; current process, project/account target env-variable and legacy-secret metadata empty; no value fields requested |
| External billing catalogs/accounts | BLOCKED | Apple/Google/RC/Stripe console records, product availability and prices not accessible/confirmed |

Native purchases use pinned `react-native-purchases`, without a second RevenueCat native
SDK or manually forced Billing version. The published dependency chain is traceable in
[hybrid-common POM](https://repo.maven.apache.org/maven2/com/revenuecat/purchases/purchases-hybrid-common/18.32.1/purchases-hybrid-common-18.32.1.pom)
and [Android purchases POM](https://repo.maven.apache.org/maven2/com/revenuecat/purchases/purchases/10.18.1/purchases-10.18.1.pom).

Temporary Android tree: `/var/folders/z4/vj_m1xyn2qx60wnsmnvl5hn80000gp/T/tih-android-billing-14qna_b4`. The clearly labelled `rc-validation-fixture` scheme was used only there. Generated applicationId is preserved, default versionCode is 1; EAS remote autoIncrement must select the actual unused upload code. No fixture scheme was added to the source project.

The backend additionally passed its 19 focused managed-clock/authentication/SQLite tests
and a real local HTTP start → process restart → read/repeat-start check with unchanged
server dates. These are included in the integrated suite, not extra store transactions.
No row above is a claim of successful Apple/Google/web transaction.

## Configuration presence audit

The existing installed Expo client confirmed the authenticated account/project. No EAS
CLI was installed/cached; its installed Expo authenticated read-only GraphQL wrapper was
used for metadata. Queries requested only target variable names, environment scopes,
visibility and type, including legacy-secret names. **No environment value field was
requested, retrieved or logged**, and no login/configuration operation was performed.

| Target public variable | Actual local env file | Current process | EAS project metadata | EAS account metadata |
| --- | --- | --- | --- | --- |
| EXPO_PUBLIC_REVENUECAT_IOS_API_KEY | false | false | false | false |
| EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY | false | false | false | false |
| EXPO_PUBLIC_TRIAL_API_URL | false | false | false | false |
| EXPO_PUBLIC_BILLING_ENVIRONMENT | false | false | false | false |
| EXPO_PUBLIC_REVENUECAT_REDEMPTION_SCHEME | false | false | false | false |
| EXPO_PUBLIC_USE_MOCK_BILLING | false | false | false | false |
| EXPO_PUBLIC_ACCELERATED_DEMO | false | false | false | false |

Only `.env.example` exists locally. EAS profile literal values in `eas.json` still apply:
`billing-test` supplies sandbox/demo=false/mock=false; development/preview enable their
separate demonstration. The missing key/backend URL configuration blocks real billing
and trial-device tests. A missing optional flag is not itself proof of an unsafe build.

## Local checks to reproduce

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run content:check
npm run content:validate
npx expo-doctor
```

The backend has its own local persistent-store/typecheck instructions in
[backend/README](backend/README.md). Trial tests use controlled clocks and an isolated test
repository; they never wait fourteen real days or modify another product's database.

## Scenario matrix

| Scenario | Local verification route | Required native/provider result |
| --- | --- | --- |
| First trial, concurrent/repeated start, exact 14×24h expiry | AppTrialService and backend controlled-clock tests | Fresh native install → onboarding → explicit start; same server interval after restart/re-onboarding |
| Migration/timezone/clock rollback/offline | No import of old premium flag; UTC interval and bounded-cache tests | Existing install and OS date/zone changes; offline cache expires without extending term |
| Trial expiry without purchase | Trial/access rule tests; no purchase call in start path | No store sheet/card/renewal created; user data retained and settings/privacy/restore accessible |
| Monthly/annual mapping and prices | Package/period fixtures, unknown/mismatched period rejected | Actual offering contains both; total price/currency/period matches confirmation sheet; annual billed in one payment |
| Early purchase | Separate immediate-charge disclosure | Confirm actual first charge timing; no stacked store trial |
| Success/cancel/pending/error | SDK mocks and entitlement fixtures | Both plans on both stores; cancellation calm, pending never unlocks, success confirms `full_access` |
| Double tap/concurrent restore/purchase | Serialized action/configure/listener tests | One active sheet/action; delayed listener/entitlement updates preserve correct state |
| Active paid subscriber attempts purchase | Pre-purchase refresh/result tests | Management/plan change replaces purchase; no second known subscription |
| Restore/foreground/SDK event | Service and context integration checks | Explicit Apple/Google restore; foreground and SDK events update current CustomerInfo |
| Cancel renewal/expiry/refund/grace/hold | Active/ending/billing-issue/revoked fixtures | Sandbox renewal transitions and authoritative active entitlement; paid-until preserved after cancel |
| Temporary payer network error | Bounded verified-paid-cache and rollback tests | Existing payer retains eligible cached access within limit; confirmed expiry/revocation clears it |
| Source-specific management and period change | Apple/Google/web routing fixtures; explicit Google base-plan/deferred legacy replacement tests | Store subscription UI or RC portal; web missing URL requires purchase-email portal, no store fallback |
| Web cold/warm link, invalid/expired/reused | URL parser/redemption result fixtures | Real RC Redemption Link + installed native SDK + confirmed `full_access`; no query-only unlock |
| Not installed and cross-device recovery | Documented RC purchase email/download/redeem route | Actual store links; install then supported recovery proving ownership; no automatic anonymous transfer claim |
| Web checkout/locales/regions/tax | Prepared provider setup, no local surrogate charge | RC Billing sandbox both periods; final currency/amount/tax/receipt, renewal/cancel/portal; India blocked; hosted-language fallback observed |
| Webhooks | Backend auth/idempotency/environment/out-of-order tests | Actual RC sandbox event durably received, duplicate retried safely, delayed event does not grant/revoke blindly |
| Privacy boundaries | Whitelisted trial payload/event metadata; code review | Inspect outgoing native requests/logs for absence of cycle/health/history/relationship fields and tokens |
| Today/design/notifications | Existing content/cycle/history/notification/hash regression suite; generic reminder payload/source preserved | Physical native themes, three daily blocks, gated Today/history and local 08:00 reminder verified on device |

A locally mocked SDK result is not a purchase. A development mock is allowed only when
explicitly enabled under `__DEV__`; production preflight forbids it. TestFlight and Play
license-test transactions are allowed sandbox tests and are never reported as revenue.

## Per-platform completion boundary

**iOS: BLOCKED for real purchase QA.** Local StoreKit/RevenueCat product mapping and
state tests do not replace installed native sandbox/TestFlight runs. Need actual `appl_…`
key, confirmed subscriptions/offering/entitlement, Apple RevenueCat integration, signing/
provisioning and a sandbox tester/device. The observed development certificate alone is
insufficient. Rebuild after native scheme/dependency changes.

**Android: BLOCKED for AAB and real Play QA.** Need JDK/SDK/NDK/build host and verified
upload-signing/Play App Signing. Then import subscriptions/base plans, grant RC Google
permissions/notifications, use `goog_…` key and install from Play test track with license
testers. Exercise monthly/annual/pending/restore/cancel/expiry/hold and management. Expo
JS export, sideload or a mock cannot prove Google Play Billing.

**Web: BLOCKED for hosted checkout/redemption/portal QA.** Need project-owned authorized
Stripe sandbox connection to RC Billing, real web products/offering/WPL, actual redemption
scheme and download links, valid email/portal, legal/tax configuration and deployed trial
backend. No fake checkout URL is shipped. Do not create parallel Stripe Billing products
for this RC Billing architecture. Hosted Web Purchase Links cannot be claimed ready in
all eleven languages; `mbf` is absent from RC's SDK language list and hosted language
selection has its own limitation. India is currently unsupported by RC Billing.

## Android release artifact verification

After toolchain/config/signing are supplied, regenerate native Android in a clean reviewed
checkout (do not overwrite unrelated local native modifications):

```sh
npx expo prebuild --platform android --no-install
cd android
./gradlew :app:dependencyInsight --dependency billing --configuration releaseRuntimeClasspath
./gradlew :app:bundleRelease
```

Verify the resulting release graph still uses supported Billing 8+, merged release
manifest target API 36+, actual application ID `com.pryshvitsyn.tuneintoher`, unused
versionCode and correct upload signing. Expo's generated local release template may use
a debug keystore; **never upload that artifact as a signed release**. EAS `billing-test`
selects AAB/store distribution with remote autoIncrement and requires authorized signing.

For the real AAB, use bundletool to inspect the manifest and packaging:

```sh
bundletool dump manifest --bundle app/build/outputs/bundle/release/app-release.aab --module base
bundletool dump config --bundle app/build/outputs/bundle/release/app-release.aab
```

Expect 16KB page alignment configuration, then generate APKs and inspect every packaged
native library's ELF segments/ZIP alignment with Android's current official tools (including
`zipalign -c -P 16 -v 4 <apk>` and the official ELF check). Run the installed app on a 16KB
emulator/device and check `adb shell getconf PAGE_SIZE` returns `16384`. Record the AAB hash,
release graph, manifest, signing, alignment and Console result. Do not infer compatibility
from RN, AGP or NDK version alone. Follow the [current page-size guide](https://developer.android.com/guide/practices/page-sizes).
No such artifact/device check has completed here.

For applicable newer personal Google accounts, the [12-tester closed-test requirement](https://support.google.com/googleplay/android-developer/answer/14151465)
requires continuous opt-in for fourteen days followed by an application for production
access. It is independent of the app's fourteen-day guest access. Internal testing alone
does not satisfy it.

## Review and remaining actions

The exact external values/actions are centralized in [STORE_SETUP](STORE_SETUP.md).
`release/readiness.json` remains evidence-based and false where unverified. A release
guard failure is expected until the owner supplies legal/contact/config and real device/
store evidence. Production publication/submission remains a separate stage.

## Native artifact and visual evidence

Command (after generated x86_64 cleanup due ENOSPC):

```sh
xcodebuild -workspace ios/TuneIntoHer.xcworkspace -scheme TuneIntoHer -configuration Release -sdk iphonesimulator -destination 'platform=iOS Simulator,id=DF6B6E06-E5EE-437B-9827-D50E58D0AAE0' ONLY_ACTIVE_ARCH=YES ARCHS=arm64 CODE_SIGNING_ALLOWED=NO build
```

Artifact: `/Users/eliogenesis/Library/Developer/Xcode/DerivedData/TuneIntoHer-dsvcybzghimjmiaytiyjtjrkkgum/Build/Products/Release-iphonesimulator/TuneIntoHer.app`.
Embedded and installed `main.jsbundle` SHA256 both:
`0b1fa287615575213062442e44e7760a0c082d43f512d925f64f17ece20e8b84`.
The current bundle contains the new14-day policy/plan-change code and not the former mock “Store price” text. Exact built/installed bundle ID is `com.eliogenesis.tuneintoher`.

[Light screenshot](release/evidence/monetization-20261113/paywall-light.png) · [Dark screenshot](release/evidence/monetization-20261113/paywall-dark.png).
Screens show the real unconfigured Release paywall on iPhone17; the selected app theme was restored to Light after the check. No cycle settings/history were erased.

The Simulator also has a legacy `com.pryshvitsyn.tuneintoher` app that claims `tuneintoher`; initial links opened its old Debug/mock interface. Those observations were excluded from current evidence. The actual app was selected with its unique registered `com.eliogenesis.tuneintoher://paywall` scheme and verified against its installed bundle hash. The old app/data was preserved. Real RC redemption uses its separately configured unique `rc-…` scheme and remains BLOCKED until that actual value is supplied.

The native tracked Expo.plist has updates disabled; dynamic app.config alone is not native sync. Review prebuild changes before a distribution binary/OTA configuration. No update was published. Compact/large-text/all-language/device QA and real store/web transactions remain open.
