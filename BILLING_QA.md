# Billing QA and evidence

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
