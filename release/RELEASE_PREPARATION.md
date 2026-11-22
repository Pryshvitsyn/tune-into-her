# Native store release preparation — updated 22 November 2026

Status: **NOT READY FOR STORE SUBMISSION**. All nine readiness flags remain false.
Baseline `9b6e0311a8f63d0762e649d3803f5302f8961ecf` is preserved by
`codex/checkpoint-release-prep-20261121`. Work continues on
`codex/release-preparation-20261121`; `main` and the monetization baseline are untouched.
[Tracking issue #7](https://github.com/Pryshvitsyn/tune-into-her/issues/7) and
[existing listing draft PR #8](https://github.com/Pryshvitsyn/tune-into-her/pull/8)
remain review inputs. No store submission, production billing, Stripe checkout, paid
service upgrade or purchase has been performed.

Implementation/evidence commit **`7f9b5836e39071298574ffe31383208bc7f31e88`** is pushed on
the [prepared feature branch](https://github.com/Pryshvitsyn/tune-into-her/tree/codex/release-preparation-20261121).
[Draft PR#9](https://github.com/Pryshvitsyn/tune-into-her/pull/9) targets preserved
`codex/monetization-20261113` at9b6e031 and references#7/#8; neither PR was merged/closed.
Existing CI branch filters do not trigger on this feature/base pair; reported checks are
the actual local source/native/provider evidence, not an invented GitHub CI pass.

## Preserved source

The editorial catalog, cue IDs and all localized daily content are frozen. The twelve
rejected Russian actions are not approved. The saved 39-input freeze ledger covers the
original editorial files and protected photo/icon/font/intro/V4/timeline sources. Final
hash verification and test results below are separate from the Founder's content approval.

All eleven in-app languages, existing QA scenarios, six depth layers, original V4,
approved photo, rings-only icons, one-second settled ending, Home replay, routing,
cycle calculations and saved-data/purchase policies are preserved. No personal iPhone
application was uninstalled, replaced or reset in this preparation pass.

Preserved IDs:

| Platform | Identifier |
| --- | --- |
| iOS | `com.eliogenesis.tuneintoher` |
| Android | `com.pryshvitsyn.tuneintoher` |
| Existing EAS project | `dc8938e7-7163-413a-9003-479d0afc8a17`, owner `eliogenesis` |

## Implemented preparation

- Reconciled PR #8's exact immutable listing source (`b01e6cf6…`); retained all review
  statuses. Removed no content and merged no PR. The export maps ten actual Apple/Play
  storefront locales. Baba Malay remains in the app and is withheld as a separate store
  localization; it is not relabelled as reviewed standard Malay.
- `scripts/prepare-store-drafts.mjs` exports bounded metadata to `build/store-drafts`.
  Apple name/subtitle, UTF-8 keyword bytes and descriptions, plus Play short/full text
  limits, are validated. French/Malay Apple-only subtitle alternatives remain drafts.
  Native subscription disclosures reuse existing localized billing copy; no guessed
  product IDs, live prices, contacts, ratings or legal URLs are inserted.
- `release/media/google-feature-1024x500.png` uses the exact approved rings-only square
  master, centered intact with its steel background extended from edge pixels. No AI,
  new logo, added wordmark, tint or reconstructed app screen is used. Provenance/hashes
  are in `release/media/graphic-provenance.json`. Founder review remains required.
- Canonical Privacy/Terms/Support drafts and a static renderer provide `/privacy/`,
  `/terms/`, `/support/` locally. All three returned HTTP200 and their navigation/render
  were reviewed. Public export fails closed until identity/contact/HTTPS destinations,
  unresolved placeholders and legal approval are supplied. **These legal routes are not
  yet public HTTPS policies**; the live trial endpoint does not substitute for them.
- Store-distributed builds now reject RevenueCat Test Store `test_` keys and private QA
  entry/bundle overrides. Production and billing-test explicitly disable demo/mocks.
  `.easignore` excludes private signing/env files, Pods, local databases and historical
  QA/evidence, while retaining required native/app/assets/gate inputs. Android is generated
  from the existing Expo config/plugins; tracked iOS native resources remain included.
- A separate `native-audit` profile produces real normal Android binaries without
  claiming an owner-verified Play upload key. It is internal, not store distribution.
  Guarded hooks capture source hashes, actual Gradle Billing dependency resolution,
  ELF/ZIP/zipalign and signing facts. They never change readiness. Runtime/backend and
  API-mismatch failures stay visible rather than being suppressed.
- `scripts/audit-native-artifact.py` checks actual ELF PT_LOAD alignment, APK ZIP offsets,
  AAB/APK payload hashes, optional official bundletool metadata and owner-verified
  certificate identity. Its IPA branch checks SDK, native bundle, signature/profile and
  known private QA markers. Missing inputs produce INCOMPLETE/BLOCKED, not release proof.

## Actual provider state

### Cloudflare sandbox — deployed and HTTP verified

The existing authenticated account was visibly verified as **Workers Free, $0 current
plan**, with no upgrade/payment action. Before creation it held seven D1 databases
(about 4MB total); none belonged to Tune Into Her. Only the separate sandbox D1/Worker
were created. D1 was created with `--jurisdiction eu`; production remains an undeployed
placeholder with `workers_dev:false`. Existing unrelated services were not changed.

Live endpoint: https://tune-into-her-trial-sandbox.pryshvitsyna.workers.dev

Migration `0001_billing.sql` was applied to the new sandbox. Wrangler4.151.1 deployed
version `101c026c…`, then the same source under clean config as `3122af1b…`.
Three separate HTTP clients use one private random test identity, with its credential
kept only in a mode0600 temporary file. All checks passed:

- A read does not start access. Only explicit POST starts a server-controlled interval
  of exactly1,209,600,000ms (14days).
- Repeated/concurrent requests retain known start/end dates; the live known interval
  also survived Worker redeployment and a new client process.
- Missing/wrong credentials return401; wrong environment/client time payload returns400.
  Responses disable caching. No card, subscription or store purchase is requested.
- The sandbox edge binding limits trial requests approximately per Cloudflare location
  to60requests/60seconds, keyed by a hash of connecting IP/environment. A bounded live
  probe observed61×401 and9×429. Raw IP is not stored/logged by application code;
  provider security processing remains in the privacy inventory. This is not a strict
  global quota or proof of one-person trial enforcement.
- Cycle, health, advice and history data are absent from the schema/API. Observability
  is disabled. The optional RevenueCat journal remains unconfigured, returning503;
  mobile access does not depend on it.

Controlled-clock expiry, offline TTL, rollback and server-storage failure tests pass
separately. HTTP smoke does not imply a real14-day wait, native offline delivery,
purchase/restore, production readiness or all provider retention controls. See safe
machine evidence under `release/evidence/release-prep-20261121/`.

EAS **preview** now contains the public sandbox URL. Production env/services are untouched.
Legal retention, deletion contact/procedure, processing terms and production abuse controls
remain owner/legal decisions in the canonical [external checklist](../STORE_SETUP.md).

### RevenueCat — Apple catalog connected, native purchase proof pending

The authenticated account initially had no projects. Reuse the one existing project
**Tune Into Her**, React Native, Lifestyle, `5921ebba`, and approved entitlement
`full_access` (`entl23b5999e8c`). No second project, access tier or Test Store substitute.

Existing Play app `app445ba93d10` retains its exact package and public SDK key in EAS
preview. Google service-account/notifications/catalog remain unconfigured; no Play
transaction, upload signing or lifecycle result is inferred from this Apple pass.

On November22 the Founder explicitly authorized the Apple product/entitlement/offering
connection, then separately approved one **Tune Into Her RevenueCat IAP** key and transfer
of its p8/Key ID/Issuer ID only to this RevenueCat project. That resolved the initial
credential-creation auto-review rejection. Created exactly one In-App Purchase key,
retained the one-time download in owner-only storage outside Git, and uploaded it through
the native file picker. No browser file-URL permission was broadened. The secret was never
printed; no password, extra App Store Connect API key, shared secret or signing credential
was created. A separate private owner inventory explains purpose, files and revocation.

Saved Apple app **app3e066d34c5**, bundle `com.eliogenesis.tuneintoher`; RevenueCat reports
**Valid credentials**. Manually registered the exact existing Apple IDs and attached both
to the existing entitlement. Created current offering **default** (`ofrng36616cccd9`),
display name **Tune Into Her Full Access**, with only these Apple packages:

| Standard package | Apple product | RevenueCat product | Access |
| --- | --- | --- | --- |
| `$rc_monthly` | `monthly_access` | `prodb61c7ca0c5` | `full_access` |
| `$rc_annual` | `annual_access` | `prod90bb80af69` | `full_access` |

Fresh entitlement navigation and an offering reload confirm both mappings and default
status. Both products are subscriptions with upfront billing; no monthly/12month-commitment
flag or introductory offer was added. Apple remains the authoritative period/price source.
Without the optional separate App Store Connect API key, automatic import/status/price
synchronization is unavailable and RC shows **Could not check** store status. That key was
not generated. Native StoreKit product retrieval/period/price verification remains open.

The actual public iOS SDK identifier was stored in EAS **preview** as **sensitive**, with
`EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default`. The existing Android key and trial URL were
preserved. Pulled the actual four remote values into a `0600` temporary file, matched the iOS
value to the protected owner copy and ran the existing iOS `billing-test` preflight:
**PASS**, sandbox, demo=false, mocks=false. No fake/Test Store key, native build, production
variable, distribution/signing mutation, upload or personal-device installation occurred.

After owner password reauthentication in RevenueCat, configured its exact opaque callback
only in App Store Connect's **Sandbox server URL**. A full reload confirms equality and
that the production URL remains unset. Callback values are excluded from Git/chat and
kept in the private owner inventory. No actual notification delivery is claimed.

The existing native SDK already uses standard monthly/annual packages, checks `full_access`,
preserves its anonymous identity and validates periods/no introductory offer. Reused it
without runtime changes. [Concrete sandbox execution runbook](../BILLING_QA.md#apple-sandbox-preparation--22-november-2026)
defines the real mapping, preview/build flags, owner-entered sandbox account, data-preserving
device setup and separate paid-versus-app-trial assertions. **49 existing tests /4 files
pass**. The Apple sandbox tester list was empty in the live audit; the dated Apple agreement/
availability/signing prerequisites and actual native purchase/lifecycle/delivery proof are
still open. Nothing changed on the personal iPhone, in trial/cycle/history storage or in
production services. All nine readiness flags remain false.

[Current provider configuration/evidence](evidence/revenuecat-20261122/configuration.json) ·
[full_access mapping](evidence/revenuecat-20261122/full-access-connected.jpg) ·
[current default offering](evidence/revenuecat-20261122/offering-default.jpg) ·
[actual sandbox configuration gate](evidence/revenuecat-20261122/sandbox-preflight.json).
The Apple draft catalog was created earlier on November22 as recorded below. Approved
commercial terms and independent14-day card-free access are unchanged. Stripe/web checkout
and production purchases remain out of scope.

### Existing store consoles — November21 read-only audit

- Apple app **6832290282** exists with bundle`com.eliogenesis.tuneintoher`,
  SKU`tuneintoher-ios-001`, primary language **English (Australia), en-AU**, version1.0
  in Prepare for Submission. Draft metadata mapping now follows that actual locale.
  Subscription groups and IAP tables are empty; TestFlight explicitly shows **No builds**.
- Free Applications Agreement is Active. **Paid Applications Agreement is New, not active**;
  Business requires the owner to update legal-entity information before signing it.
  No agreement, tax/bank information or legal identity was entered/accepted by the agent.
- Standard Apple EULA is already selected. Category/age/privacy and EU DSA trader
  declarations still need truthful owner input. The Mainland China compliance notice is
  not treated as authorization to sell there merely because zh-Hans is supported.
- The existing version form has login-required and automatic-release defaults. They were
  not saved as reviewer instructions or release authorization. The draft below describes
  the real no-account card-free flow; final owner review must set correct access/manual
  release behavior before any submission.
- The initial Apple group/product proposal was left unsaved after automatic approval
  review rejected persistent creation without specific group-name/product-ID approval.
  **Resolved November22:** the Founder explicitly approved that exact group and both IDs;
  the authorized persistent creation and readback are recorded below. No alternate API
  bypass was attempted while approval was absent.
- Google Play under the initial existing owner profile still reaches developer-account signup.
  A second existing profile named for the project owner also reaches signup and requires
  two-step authentication for creation. Authentication settings were not changed; unrelated
  visible profiles were not assumed to own this app.
  No account, fee, organization type or legal terms were created/accepted. Correct existing
  developer-profile access/invitation remains required.

The historical audit is in`provider-console-audit.json`; current catalog facts are in
the dated evidence below. Private addresses/account details, keys and financial-account
screenshots are excluded from committed evidence.

### Apple subscription drafts — November 22 authorized creation

The Founder explicitly approved **Tune Into Her Full Access**, `monthly_access` and
`annual_access`, 1 month/1 year, eurozone targets €3.99/€24.99, equal full access and no Apple
introductory trial, without review submission/publication. After the owner restored the
expired login, a fresh visible audit still showed zero groups; no duplicate was created.

Created group **22605485**, with English (Australia) display name **Tune Into Her Full Access**
and the existing **Tune Into Her** application name. Both subscriptions are **Prepare for
Submission** and **level 1**, verified again after reloading the group from the server:

| Product | Apple ID | Period | Saved/read-back Italy price | en-AU draft description |
| --- | --- | --- | --- | --- |
| `monthly_access` / Tune Into Her Monthly | 6837968807 | 1 month/P1M | €3.99 | Full app access, billed monthly. |
| `annual_access` / Tune Into Her Annual | 6837969104 | 1 year/P1Y | €24.99 | Full app access, billed annually. |

Apple initially assigned the second product level 2; its editor was used to move it into
level 1, then saved and reloaded. This follows [Apple's subscription-level guidance](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions)
for equal access across different durations. The reloaded table with both products at
level 1 is the acceptance evidence.

The pricing wizard defaulted to **Italy (EUR)**; the approved prices were saved and read
back in the separate initial-price view. Apple calculated 175-territory price schedules;
**sales availability remains unset**, so this is not a territory rollout. Both introductory
offer pages remain empty. The annual product is yearly upfront; its separate monthly
payment/12-month-commitment availability was not configured. Family Sharing stays off,
tax category inherits the application without a new tax/legal attestation. No review
screenshot, introductory/promotion offer, review submission or agreement acceptance occurred.

[Machine-readable catalog/readback](evidence/apple-catalog-20261122/catalog.json) ·
[reloaded equal-level table](evidence/apple-catalog-20261122/group.jpg) ·
[monthly saved price](evidence/apple-catalog-20261122/monthly-price.jpg) ·
[annual saved price](evidence/apple-catalog-20261122/annual-price.jpg).
The dated November21 Paid Applications Agreement/legal-entity blocker remains unresolved;
Apple RevenueCat credentials/mappings are now connected as recorded above; distribution
signing and real store sandbox purchase/lifecycle proof remain missing. Catalog creation does not set any
readiness flag or prove a transaction. App/source/phone data were not changed.
The focused existing release-preparation suite passed **8 tests**, including **7 Python
native-artifact fixtures**. All 39 frozen inputs and 173 AAB source inputs remain
byte-identical; JSON, screenshot hashes and the nine false readiness flags were checked.
The preceding 531-test/typecheck/lint run remains dated November 21; this console/docs-only
change does not claim a new native build or store transaction.

## Native build and runtime evidence

This section records actual artifacts, not JavaScript export equivalence.

### Apple

Xcode26.6 (17F113), iOS SDK26.5 meet the currently checked upload SDK minimum.
Keychain audit found one development identity and zero distribution identities. EAS has
no iOS credential record. Development/ad-hoc Simulator signing does not create a
TestFlight-capable IPA. App Store Connect authentication is now successful; distribution
credential/profile setup remains blocked. No distribution key/profile was created from
that login without action-time approval, and no IPA/TestFlight upload is claimed.

Normal arm64 Simulator Release native compilation passed (804s). A stale explicit module
cache initially failed; retry used the compiler's non-explicit-module strategy, with no
source/check removal. The initial `CODE_SIGNING_ALLOWED=NO` compile artifact displayed
recoverable startup error; the native log identified missing Keychain entitlement. An
ad-hoc signature alone was insufficient. This is excluded from accepted screenshots.

A subsequent Xcode-signed normal Release with real sandbox URL, demo/mocks disabled,
built successfully after recovering task-owned Simulator/index space. One intervening
bundle attempt failed with ENOSPC and is not a pass. No app access/storage/runtime code
was changed to hide these build-fixture errors. Ordinary native UI verification is
recorded in the final evidence below; private/distribution signing facts are kept distinct.

Accepted ordinary native flow on a newly created, empty **iPhone17Pro/iOS26.5 Simulator**:
`testReleaseFreshOnboardingAndRealSandboxTrial` **PASS104.453s**. It runs the embedded
normal Release bundle (`4303bebd…`), demo/mock billing disabled, with the actual sandbox
HTTPS endpoint. It explicitly acknowledges context, verifies empty date/disabled Continue,
Cancel/no-write and explicit Done, synthetic28/5 data, preview and reminders OFF; then
chooses **Start14days free** on the existing paywall. Actual authored Today text loads and
remains accessible after terminate/cold relaunch. No hidden QA entitlement, store purchase,
clock change or personal-device data is used. Actual onboarding and Today images are
committed as dated QA evidence, **not submitted production store screenshots**.

Native harness diagnosis is kept separate from app changes. Fixed-control/tab fallback
taps now anchor to their real elements, and an optional edge drag avoids a native date
wheel consuming the surrounding scroll gesture. All original device guards remain intact.
Language selection asserts its visible✓ rather than assuming the tap persisted.
One long locale attempt encountered the app's real localized **save failed** alert while
the host had critically low disk space; the previous Hindi selection was retained.
The result is rejected, not relabelled as a missed tap or successful switch. Only task
downloads, duplicate failed results and rebuildable project Simulator compilation outputs
were cleaned; accepted signed.app, source, successful proof and personal iPhone remained
intact. A dedicated ordinary retry then **PASS8.036s**, saving Chinese with visible✓ and
no alert, without reset/new trial. Subsequent language/theme acceptance is recorded below.

All **11 ordinary native interface locales** subsequently passed in three consecutive
XCTest groups, **3tests/0failures,598.957s**: Chinese/Malay/Baba Malay172.515s,
Russian/Ukrainian/Hindi169.904s, English/French/Italian/Spanish/German256.538s.
Each verifies actual saved selection✓, Settings, Cycle fixed Edit, full Home entry,
authored Today text and localized Learn; English is restored after each group.
`ios-normal-runtime.json` records exact scope/case durations and accepted-log hash.
Original full-size images include [onboarding](evidence/release-prep-20261121/ios-normal-onboarding.png),
[Today](evidence/release-prep-20261121/ios-normal-real-trial-Today.png),
[Cycle](evidence/release-prep-20261121/ios-normal-Cycle.png) and
[Learn](evidence/release-prep-20261121/ios-normal-Learn.png). Remaining full locale captures
are retained locally with the accepted xcresult; they are not native-speaker approval.

Normal themes/documents/motion case **PASS165.641s**: real screenshot luminance confirms
Dark after Home and a cold restart; Light is restored. Privacy, Subscription terms and
Subscription open through normal settings; Restore is enabled but no store transaction is
attempted. Existing History deep link shows real persisted guidance. UIKit reports Reduced
Motion ON, a cold launch reaches actual Today within the asserted<9s bound, and UIKit OFF
is restored afterward. [Dark Today](evidence/release-prep-20261121/ios-normal-Dark-Today.png),
[Reduced Motion Today](evidence/release-prep-20261121/ios-normal-Reduced-Motion-Today.png),
[History](evidence/release-prep-20261121/ios-normal-History.png) and
[Subscription](evidence/release-prep-20261121/ios-normal-Subscription.png) are original
native QA captures with synthetic local data and real sandbox access, not fabricated offers.

Full no-Metro cold recordings on the **same ordinary Release** are retained:
[normal launch](evidence/release-prep-20261121/ios-normal-full-launch.mp4) and
[bounded host CPU pressure](evidence/release-prep-20261121/ios-normal-full-launch-pressure.mp4).
Each starts before the launch command and runs40s through the complete opening to authored
Today. Normal: **2073frames/0black**,40.046667s; pressure: **2048frames/0black**,40.051667s,
four CPU workers bounded to4s. Every source frame's central80% ROI is checked, with the
explicit≥98%-samples/luma≤18 criterion. Native cover/frame/factory/Expo/handoff order,
installed binary/JS hashes and surviving process all pass; common Metro ports are closed.

Both H.264 source timelines are monotonic. The untrimmed720px previews retain **every
source frame and exactly the same PTS**; hashes and the method are in`ios-cold-starts.json`.
The first HEVC attempt had one source-clock reset1.901667→0.17s and is excluded from
continuous playback/timing proof, despite its0black frames. The reusable capture helper
now defaults to H.264 and rejects non-monotonic PTS, with the actual reset as a regression
fixture. No movie is silently retimed, no app animation is changed, and these host/video
observations are not native GPU-clock measurements or new physical iPhone proof.
Photo, depth travel, assembled sphere and final Today frames were visually reviewed.
Only the newly created temporary Simulator was deleted after evidence export; accepted
results, original movies and the signed.app remain, and pre-existing simulators/phone
data are untouched. The native/runtime and broader store-readiness gates stay distinct.

Earlier fresh-flow harness failures and one helper compile error remain excluded. Private
logs and targeted failure hierarchy are retained; only duplicate/failed temporary result
containers were compacted to recover disk. This does not erase a failed test from the
history or claim every attempt passed.

### Android

Local host initially had no JDK, Android SDK/adb/emulator or upload signing record. EAS
Free quota/cost was checked before starting any build; no paid plan or overage activated.
The `native-audit` artifact is deliberately not a Play upload-signing claim.

| EAS build | Actual result |
| --- | --- |
| `e0aaf6f5-7840-4c58-add1-f58182e50aba` | Failed before Gradle: native fingerprint mismatch (generated Android presence and Gradle-generated dependency files). No AAB. |
| `27235881-f91d-4ad4-a37d-4e19e6cd17f4` | Failed in post-install: duplicate JS declaration introduced during hook relocation. Fixed; syntax/no-op hook regression and lint now pass. No AAB. |
| [`10288699-3f1e-48c9-8aac-34e5a74fb502`](https://expo.dev/accounts/eliogenesis/projects/tune-into-her/builds/10288699-3f1e-48c9-8aac-34e5a74fb502) | **FINISHED**; actual Gradle/CMake AAB and companion APK, all four ABIs.19:33:45→20:00:25UTC. Internal audit, not store upload signing. |

The fixes preserve fingerprint validation: CNG Android is explicitly excluded from upload,
and Gradle dependency inspection runs after fingerprint verification. Native config/shaders,
textures and the six-layer renderer have not been replaced. Actual downloaded AAB is
90,031,846bytes, SHA256`ff71db6e5378603569be3e462a0fe85d775630b647fc2995aa2e6b0f5a40f3c5`.
Official bundletool1.18.3 and vendor-verified temporary Temurin21.0.13.1+2 decoded the
manifest and generated a universal APK from **this exact AAB**, using an isolated test key.
The system Java installation and owner signing credentials were not modified.

Actual checks:

- Package preserved; versionCode1, minSDK24, **targetSDK36**, not debuggable, Billing
  permission and actual resolved **Google Play Billing8.3.0**. Dependency output is retained.
-100valid ELF libraries across four ABIs. All **50 applicable64-bit arm64/x86_64** libraries
  pass16KB PT_LOAD congruence/alignment and RELRO checks. All ABIs remain recorded.
- BundleConfig requests`PAGE_ALIGNMENT_16K`. Native and JS payload hashes in the generated
  APK match this AAB; its relevant ELF/ZIP offsets pass16KB checks. Official cloud zipalign
  passed on the matching companion APK. Local SDK zipalign was unavailable and is recorded
  separately as null, rather than inferred from the cloud result.
- AAB JAR signature verifies but uses **Android Debug**, not an owner-verified Play upload
  certificate. Play App Signing is unverified. The binary was built before the Android
  public RevenueCat key was added to preview; real SDK offerings/purchases are not tested.
- The original cloud audit incorrectly treated32-bit4KB libraries as a64-bit failure.
  That FAIL is retained in history. The corrected verifier follows Google's current
  [64-bit page-size policy](https://developer.android.com/guide/practices/page-sizes),
  still rejects4KB64-bit and malformed32-bit libraries, and adds RELRO regression coverage.
  Hard binary failures now fail the audit hook; missing signing/tool inputs remain explicit
  INCOMPLETE. No integrity test was removed or readiness flag changed.

`android-binary-audit.json`, `android-build-summary.json`, tool provenance, actual Gradle
dependency output and source hashes contain the reproducible proof. **No16KB runtime,
Android visual/navigation/notification or store purchase acceptance is claimed.** This host
has no Android SDK/adb/emulator. It fell below1GB free during native QA; task-only cleanup
later recovered7,889,625,088bytes. Read-only official SDK metadata/ZIP directory checks
show the API36 ARM64 16KB image alone expands to4,560,761,440bytes, before emulator/JDK/tools/AVD.
Google's [startup disk check](https://developer.android.com/studio/run/emulator-troubleshooting)
requires at least5GB **still free**. Image+reserve already exceed this host's recovered
space, even before tools. `android-runtime-host.json` records exact inputs; no multi-GB
download, unsafe low-space install or SDK licence acceptance was attempted. More host
headroom or an equipped16KB device/host and Play-signed distribution remain required.

## Store drafts, screenshots and review access

`node scripts/prepare-store-drafts.mjs`, `node scripts/build-legal-site.mjs` and the feature
graphic generator reproduce draft outputs. Existing iOS1024, Play512 and adaptive icon
assets remain byte-identical to the approved rings-only source and their native catalogs.
No Metro reload is claimed to update a native icon.

Current [Apple screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)
accept required medium Dynamic Island iPhone1206×2622 (or1179×2556); large-screen captures
are optional. The app is phone-only. Capture normal installed UI, with explicit real
sandbox trial, synthetic cycle data and no QA/mock banners. Initial candidates: Today
with authored KEEP/SUPPORT/DO, Cycle overview/editor, four-phase Learn, Privacy/Settings
and the full native subscription disclosure after store offers actually load. Do not
submit old private QA footage, startup-error images, fabricated prices or development
server UI as store media. Android screenshots require actual installed Android UI.

Google listing exports keep separate512×512 PNG and1024×500 feature graphic inputs per
[Play asset requirements](https://support.google.com/googleplay/android-developer/answer/9866151).
No age rating is invented. `release/store-config.json` recommends Lifestyle with accurate
health-feature disclosure; owner must complete Apple questionnaire/IARC. Native-speaker,
Baba Malay community and editorial approval remain pending.

**Reviewer instructions draft:** install the submitted normal store binary; choose a
language, read Context/consent, explicitly select a synthetic last period date/lengths,
and complete onboarding. Choose “Start14days free”; no login/card/subscription is needed.
A working live backend is required. Open Settings→Subscription to inspect optional monthly/
annual plans and Restore/Manage; an early store purchase can charge immediately under the
store's sandbox/review system. Expiry preserves saved data and returns to the existing
locked/payment flow. Do not provide a hidden premium bypass. Supply any provider test
account/limited-access instructions only in protected store review fields after account
eligibility is known. The internal QA panel is not reviewer access.

## Privacy and legal declaration drafts

These are evidence-based proposed answers, **not submitted provider certifications**.
Canonical text is [Privacy](../PRIVACY.md), [Terms](../TERMS.md), [Support](../SUPPORT.md).

| Actual flow | Apple draft | Google draft / unresolved point |
| --- | --- | --- |
| Cycle dates/lengths, feedback and guidance history stay on-device | Do not equate local processing with remote Health collection. Confirm backups/final binary. | Local-only data is distinct from off-device collection; still disclose cycle-related health features. |
| Trial pseudonym, authentication verifier, fixed server dates | Assess Identifiers→User ID for the custom trial identity; functionality/fraud prevention. Never claim no backend/identifiers. | Assess Device/other identifiers for the guest installation identifier; collection is persistent, functionality/fraud prevention. Raw IP-derived edge counter and provider logs need review. |
| Native RevenueCat purchase history | Purchases→Purchase History; functionality and provider dashboard analytics. Anonymous RC identity linkage depends on actual integrations. | Financial info→Purchase history, collected/non-ephemeral, functionality+analytics; service-provider sharing exception requires actual contracts/integrations review. |
| RC SDK uses automatic anonymous ID; no app customer attributes/advertising integration configured | Do not add IDFA/tracking or name/email declarations without actual collection. The independent custom trial identity still needs its own assessment. | No advertising ID collection is inferred. Trial identifier and any added integration must be assessed independently. |
| Local-data deletion | Does not cancel subscriptions, erase provider receipts or restart known trial. | Do not answer “deletion requests supported” until monitored contact, secure ownership verification and provider/backend procedure exist. |
| Notifications | Generic local reminders, no advice/phase payload to a push server. | Native delivery/permissions across calendar boundaries remain device QA; not an advertising/push service. |

The RevenueCat recommendations for
[Apple](https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy)
and [Google](https://www.revenuecat.com/docs/platform-resources/google-platform-resources/google-plays-data-safety)
were checked against actual SDK configuration. No blanket “No data collected” answer is
prepared. HTTPS is configured for provider/trial traffic; verify final binary/providers
before attesting that all collected data is encrypted in transit. No diagnostic, fertility,
contraceptive or treatment claim is added.

Google's [Health Apps declaration](https://support.google.com/googleplay/android-developer/answer/14738291)
includes health-data use supporting non-health functionality. Period Tracking applicability
must be assessed for entered cycle dates/phases. Its
[account-type rules](https://support.google.com/googleplay/android-developer/answer/10788890)
may require an Organization account for the actual health classification. Do not create
another account, invent D-U-N-S data or infer Personal eligibility from the partner audience.
Apple EU [DSA trader verification](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/)
requires the owner's truthful trader status/verified contact details; no form was attested.

Seller/legal entity, monitored support/privacy address, effective date, rights/deletion
procedure, retention, data processing/international-transfer terms, public HTTPS domain,
minimum-age positioning and provider declarations remain genuine owner/legal inputs.
Do not publish placeholder policies or claim current drafts are legal approval.

## Final evidence and approval gates

Machine evidence is committed in`release/evidence/release-prep-20261121/`.
Accepted source checks:

| Check | Actual result |
| --- | --- |
| Full application Vitest | **531tests /55files PASS**,10.89s, bounded to2workers |
| Final affected-source regression | **36tests /5files PASS**, plus7Python native-artifact fixtures |
| TypeScript | PASS |
| ESLint |0errors; one existing generated`.expo/types/router.d.ts` warning |
| Content generation/integrity |610bundles /11locales /318authored+90reserve per locale PASS; approval unchanged |
| Expo Doctor | **19/21**. Native-folder/config sync advisory and8package version advisories remain visible |
| Release gate | **FAIL as expected**: nine evidence flags, publisher/contact/public legal URLs and production/provider configuration remain incomplete |
| Preservation |39frozen inputs byte-identical; no app/intro/cycle/purchase/storage/editorial runtime source changed |

The two initial complete-test attempts timed out in the original per-pixel native-splash
test under host load. Exact RGB identity now uses24-bit integers instead of allocating a
Buffer/hex string per pixel; native/source bytes use exact Buffer equality. Pixel counts,
alpha, hashes and material thresholds were retained; no timeout was raised or test disabled.
The accepted full run and final affected-source run passed after that allocation-only fix.

Doctor's RNSVG15.16.0 is intentional for RN0.86 and is not downgraded to Expo's15.15.4
recommendation. Seven Expo patch recommendations are listed in the private diagnostic;
no blind SDK/dependency update or warning suppression was performed during a frozen native
candidate audit. Native iOS assets remain tracked and Android uses the existing CNG plugins;
their actual compiled artifacts are evidence, not a blanket config-sync assertion.
These diagnostics prevent calling the project fully release-ready.

Release-check output here uses the local shell, which has no provider environment values.
Actual public sandbox/Android key presence in EAS preview is separately verified; that
does not configure the untouched production environment or prove native transactions.

The canonical owner action matrix is [STORE_SETUP](../STORE_SETUP.md); it supersedes old
“not configured” statements for sandbox/RC only where the observed facts above prove it.

Smallest owner handoff:

1. **Apple:** complete the legal-entity/Paid Applications Agreement and truthful DSA
   requirements; confirm sales regions/tax and review metadata for the now-created drafts. Provide the authorized
   distribution signing/profile and a separate sandbox tester directly in the provider
   consoles. Apple RC integration/mapping and Sandbox URL are configured; real purchases/
   delivery remain open. No passwords, keys or financial details belong in chat/Git.
2. **Google:** identify/open the existing developer account or obtain its invitation.
   Confirm health-feature/account-type eligibility, Play App Signing/upload identity and
   the authorized service-account/notification connection. No new account fee was accepted.
3. **Legal/public policy:** approve the actual publisher, monitored contact, HTTPS domain,
   retention/deletion/processor terms and final texts. The local renderer is ready; placeholder
   routes are deliberately not publicly deployed.
4. **Content:** complete frozen editorial, all native-language and Baba Malay community
   reviews. The twelve rejected Russian actions remain rejected.

After those prerequisites, engineering still must produce store-signed IPA/AABs, process
them through TestFlight/Play test tracks, run real purchase/restore/lifecycle matrices and
complete equipped Android16KB/device/08:00-notification acceptance. Those are open technical
proof requirements, not already-passed owner checkboxes. Production activation and store
submission each require separate later authorization. The existing personal iPhone QA
installation and historical no-Metro visual proof remain preserved; they do not prove
this pass's real store transactions.

Before Founder authorizes release:

- [ ] Approve frozen editorial/native-language/community and legal copy with real evidence.
- [ ] Complete existing Apple/Google account, legal/trader/tax/payment-agreement steps.
- [ ] Verify actual catalog IDs, prices/regions, platform credentials/notifications and offering mappings.
- [ ] Produce owner-verified distribution IPA/AAB; process/install through native store test tracks.
- [ ] Pass actual Apple/Google sandbox purchase, restore, renew/cancel/expiry and plan-change matrix.
- [ ] Accept normal/reduced-motion, both themes, all locales and notification/calendar-boundary device evidence.
- [ ] Approve real store screenshot/media candidates and final data/health/access declarations.
- [ ] Separately authorize production trial service/configuration; no silent production activation.
- [ ] Only then update supported readiness flags and rerun `npm run release:check`.
- [ ] Separately authorize store submission; this preparation does not submit or merge to main.
