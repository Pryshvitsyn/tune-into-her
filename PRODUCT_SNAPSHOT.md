# PRODUCT SNAPSHOT

Updated: 2026-11-14 (Europe/Rome)

## GOAL

Prepare a controlled Tune Into Her release candidate: a local-first practical partner
guidance app with respectful estimated-cycle context, preserved daily history, approved
V4 sphere presentation, and explicit safety/release boundaries. It is not a medical,
fertility, or mood-prediction product.

## STATE

- Current work branch: `codex/monetization-20261113`, based on clean local candidate `eb5b0f0`; global launch and onboarding V2 extend the reviewed local monetization checkpoint. Original release-candidate branch and `main` remain untouched. Original consolidation was based on PR #6 `25c8505`.
- Recovery points: `archive/github-release-baseline-20261111` → `25c8505`; local V4
  preservation branch → `1147292`.
- V4 renderer is directly used by Today and onboarding. Its renderer, clean texture,
  and phase-zero poster hashes are guarded in a test; no shader, texture, or animation
  rewrite is part of this consolidation.
- The content source contains 318 authored texts per locale across 11 locales and
  produces 610 daily bundles. That is structural/source evidence only: native review is
  pending in all locales and `mbf` needs community review.
- Local feedback and guidance history are implemented separately from selected cue
  history. Existing same-date guidance is retained rather than rewritten.
- The cycle engine requests confirmation after 40 elapsed days rather than projecting
  a new cycle indefinitely. It falls back to all-phase guidance while confirmation is
  due.
- At the prior candidate checkpoint, typecheck, lint, 88 tests, content checks, Debug
  build, and standard Release Simulator build passed; the normal Release app launches
  to onboarding on iPhone 17. A repeat of the source checks is required before the
  integration commit.
- Debug-only QA access is explicit: it requires both `__DEV__` and
  `EXPO_PUBLIC_USE_MOCK_BILLING=true`, displays a localized development-mock label,
  and is unit-tested to be unavailable in a production bundle. It does not change the
  normal Release paywall.
- Using that QA access, unlocked Today was observed on iPhone 17 in light and dark
  appearance: the approved V4 renderer moved continuously for more than 12 seconds,
  the three content blocks, gratitude, feedback selection, and scrolling all worked.
  This is Simulator evidence, not store or physical-device proof. Compact and
  large-text completion evidence remains open.
- Deep Intro V2 was manually merged only after its strict installer stopped on a
  generated-wrapper comment difference. The actual vertex and fragment GLSL literals
  in the root V4 renderer and `src/intro/v4Shaders.generated.ts` were compared
  byte-for-byte; the root V4 renderer, clean texture, V4 wrapper, and vector brand
  source remain unchanged. The six intended V2 files match the supplied payload.
- The V2 intro has six temporary depth planes and a nine-second entry sequence; its
  V4 material phase remains absolute-time based on an eight-second loop. Package
  math checks confirm the inserted travel segment keeps the original local zoom
  speed rather than stretching it. Typecheck, lint (0 errors; 13 existing style
  warnings), 89 app tests, 610-bundle content check, and 32 V2 checks pass. A fresh
  Debug iPhone 17 build succeeded and its V4 surface was observed for 16+ seconds.
- That Debug visual run also exposed a separate existing native issue: the
  `react-native-svg` marks/icons used by `AnimatedToday` render pink
  `Unimplemented` placeholders in the final header/footer. The V2 WebView/PNG logo
  path and V4 sphere render, but this blocks calling the surrounding intro chrome
  visually accepted until the native SVG integration is diagnosed.
- The isolated accelerated-demo selector now has a labelled `__DEV__`-only
  next-test-day control. It changes only an in-memory synthetic view and has no
  cycle, history, notification, entitlement, or wall-clock write path. A real
  selector run covers 7, 30, and 90 synthetic days across all 11 locales; see
  `release/DAILY_QA_20261112.md`.
- The SVG diagnosis found React Native 0.86.3 paired with `react-native-svg` 15.15.4,
  below the library's documented 15.16.0 minimum for that RN range. Only RNSVG was
  updated to exact 15.16.0 and Pods synchronized. The earlier Debug rebuild stalled.
  The monetization arm64 Release build now passes; actual native header SVG marks render
  on the current paywall in Light/Dark. Full unlocked Today/intro/icon regression remains open.


## FINAL BRAND / TYPOGRAPHY — 2026-11-14

- Implementation `f5a8628`, followed by final MAX navigation fix `55bbd9b`, applies the existing real Linux Libertine O Regular across
  native UI through AppText, including Today/History/Settings/navigation. Hindi/Chinese
  options use their own native script policy; body text scales and wraps naturally.
- The delivered package explicitly identifies the existing outlined wordmark as Variant
  #8.264 CoreText/SVG commands match the trusted OTF; the original comparison image and
  historic generator font binary are unavailable. No font or brand asset was replaced.
- Transient top/bottom emblem clipping is not reproduced in current baseline captures;
  exact stroke/texture/sampling bounds and every10ms across nine phone shapes pass.
  Forty-four real shared-WebGL checkpoint captures are recorded across four ratios.
- Today retains complete readable text in a scroll viewport; the original shared sphere
  tracks its measured slot and clips above fixed navigation. A separately confirmed
  offscreen negative-scissor defect is fixed in display infrastructure only.
-264 tests/34files, typecheck and content checks pass; lint has0errors/1existing generated
  warning. Original V4, clean texture, poster, timeline, six-layer runtime, GLSL, logo,
  OTF, business logic, translations and content have no changes.
- Fresh signed Simulator and iphoneos Release builds pass embedded font and exact official
  Expo-resource checks. Updated physical app launches without Metro and its process
  survives155.500s, matching the update receipt (final install11.546s, launch0.747s). Physical visual/speech proof remains open.
- Final independent Release verifies MAX calendar and full-width navigation labels,
  normal cold entry, and UIKit-confirmed Reduced Motion cold entry/restoredOFF with
  Metro absent. Onboarding, all11picker values and native fallback scripts also pass.
- See [current proof and limits](docs/BRAND_TYPOGRAPHY_QA.md). Android native tools,
  physical pixels/speech and real protected-Today native review remain unavailable.

## GLOBAL LAUNCH / ONBOARDING V2 — 2026-11-14

- Implemented the approved shared Deep Intro V2 as the global cold-launch presentation:
  original nine-second/six-layer scene, one further1000ms foreground animated-sphere
  hold, parallel initialization and readiness-based fade. Existing onboarding and
  paid/app-trial gates remain authoritative. Retry, background timing, Reduced Motion,
  screen-reader skipping and one-runtime intro consumption are integrated.
- V4 renderer/texture/poster, approved timeline/shaders/logo, content, translations,
  cycle calculations, purchase/trial services and persistence sources have no diff.
- Onboarding/pre-purchase uses Silver Chrome and the real original licensed Linux
  Libertine O OTF. Nine Latin/Cyrillic locales use it; Hindi/Chinese use native script
  fonts. One draft/confirm/cancel picker preserves all11 locale IDs. Canonical notices
  are included in the installed app through the selectable Terms appendix.
- Actual native review corrected live Dynamic Type stale measurements, wrapped picker
  header/action geometry, decorative-icon clipping and Dark status-bar contrast.
  Readable text scales fully; only graphical glyphs keep icon size. Native Stack owns
  status-bar color with the corresponding native/Expo controller policy, preserving geometry.
- Final checks: typecheck PASS;254 tests/33 files PASS; lint0 errors/3 prior warnings;
  610 bundles/11 locales/318 texts per locale and90-day reserve PASS; font notices match.
  Expo Doctor remains19/21 for existing native-config-sync/version advice.
- Final signed standalone iOS Simulator Release passes on compact SE3. Exact-final-binary
  clean installation and existing locked entry are recorded. Native final Light/Dark
  six-step flows pass the same29 assertions; Dark also passes9 clock-pixel checks.
  All11 picker values, Hindi/Chinese glyphs, MAX text/picker/checkbox/stepper layout,
  foreground/no-replay, background-during-motion and Reduced Motion have actual evidence.
  The matrix distinguishes earlier unchanged-controller checkpoints from final UI proof.
- Final generic iphoneos artifact passes existing signing/profile, original font/notices,
  refreshed production JS and exact official Expo manifest/fingerprint checks. An earlier
  data-preserving phone update/cold launch survived+39.68s. After owner unlock, the exact
  final Release update passes8.58s and launch command0.69s; PID34933 survives+54.18s, with
  executable/app path matching the install receipt. No reset, financial/notification
  action or real cycle-data inspection. Physical visual/speech proof remains unavailable.
- Final Android production export and isolated native generation pass. Actual Gradle
  assembly stops before compilation because JRE/SDK/adb/emulator are unavailable; no
  APK/AAB or Android runtime success is claimed. Configured valid-access, slow/offline
  native init, successful native Retry/fault injection and spoken screen-reader proof
  remain explicit validation gates. No mock paid access was used to obtain screenshots.
- Reviewed work remains local on the existing branch. No push,
  merge, store submission or publication is performed.

[Actual QA matrix](docs/LAUNCH_QA.md) · [Videos/screens/files](release/evidence/launch-20261114/README.md) ·
[Native splash/platform limits](docs/NATIVE_LAUNCH_SPLASH.md).

## MONETIZATION — 2026-11-13

- Separate server-controlled 14×24h guest app access, explicit start after completed onboarding; no store subscription or automatic charge. Trial identity/credential survives local content reset.
- Monthly/annual plans, exact store periods/base plans, actual localized total prices, immediate-charge/renewal disclosure, pending/cancel/restore and source-aware management.
- Signed RevenueCat paid access and separate app-trial access, bounded 24h caches, server anchors, rollback/monotonic/deadline checks, foreground/listener refresh and serialized purchase actions. Existing anonymous RC identity retained.
- Isolated Worker/D1 backend with permanent local SQLite runner and optional authenticated/HMAC durable RC event journal. Cycle/relationship data remains local.
- Official web redemption routing is prepared; the actual dashboard scheme, hosted RC Billing checkout, Stripe sandbox connection and portal remain external configuration. No external payment CTA is enabled in the native global release.
- Billing/privacy strings cover all 11 existing locale IDs structurally; native-language/community and device layout review remain pending.
- Final monetization verification: typecheck, 161 tests/24 files, lint 0 errors / 13 existing warnings, content checks and Android JS export pass. The normal arm64 iOS Release Simulator build/install passes; the real unconfigured paywall was observed in Light/Dark with no mock/prices invented. Real store/web transactions and Android AAB remain BLOCKED.
- Exact proof and remaining platform boundaries are in [BILLING_QA](BILLING_QA.md); one canonical owner action table is in [STORE_SETUP](STORE_SETUP.md). Expo Doctor currently reports 19/21 (existing native-config sync and package-version warnings); no stack-wide upgrade was performed.

## PRESERVED

- The approved V4 visual artifacts:
  - renderer SHA-256 `7c46b5ab8fbd587fb70b1e557365f6d505dc2a1a82f8ed5a536220a2dea6ef39`
  - clean texture SHA-256 `50e988dde8cdd04b945883a1404fd95881b55ad86087274a5a5b594063f0509c`
  - phase-zero poster SHA-256 `70fc3712d6d1048f46833d038c96f8c3502632b81e523b98bcc8ff94b9dccb87`
- PR #6's generated editorial baseline, accelerated-preview isolation, and local-first
  storage model.
- Persisted daily choice identity and historical rendering behavior.

## GAP / DEPENDENCIES / RISK

| Area | Current boundary |
| --- | --- |
| Native build and visual QA | Final signed Simulator build passes. Compact first-install/cold launch, locked entry/navigation, background/resume and Reduced Motion have native checkpoint evidence; exact final UI/scenario statuses are in LAUNCH_QA.md. Configured valid access, delayed/offline native services, successful native Retry, spoken screen-reader and physical visual/route proof remain unverified. |
| Android | Isolated native generation and final post-font-fix production JS export pass, including exact OTF bytes and full canonical font notices. Actual Gradle attempt stops at missing Java Runtime; SDK/adb/emulator are absent. No APK/AAB or native splash/WebView/navigation/billing runtime proof exists. |
| Apple / Google | Pre-font-fix physical development-signed Release build, update-install and cold launch pass; same process survives at +39.68 seconds. Final status-bar-corrected generic iphoneos app-only build passes, including fresh official Expo Updates resources and the existing profile for this phone; final update passes8.58s after owner unlock, launch command0.69s and same PID34933 at+54.18s match the install receipt. Physical visual/accessibility capture remains unverified. Distribution signing, store account/listing/approval and real transactions remain unverified. No account, Team, identifier or profile was changed. |
| Billing | Owner approved14-day app access + voluntary €3.99 monthly / €24.99 annual base targets on2026-11-13. Native service/UI, trial Worker/D1 and web redemption source implemented; external catalogs/keys/deployment and real sandbox transactions remain BLOCKED. See BILLING_QA.md and STORE_SETUP.md. |
| Legal/support | Real seller spelling, support contact, terms/privacy URLs/text, and privacy declarations remain open. |
| Product identifiers | Existing iOS `com.eliogenesis.tuneintoher` and Android `com.pryshvitsyn.tuneintoher` are preserved as instructed. External store/RevenueCat records still need verification; no identifier alignment is part of this change. |
| Content | All 30 current Founder column-G comments are mapped as unapproved editorial drafts; no translation update is authorized or claimed native-reviewed. |
| Safety | No explicit user-confirmed bleeding-event provenance or clinical/localized copy review. The product also has no explicit unknown-cycle-length state: onboarding supplies defaults (28/5), which needs an owner decision if uncertainty must be preserved. |
| Visual assets | The Founder-approved Deep Intro V2/logo geometry, original V4 renderer/texture/poster, timeline and scene/shader data are preserved and integrity-tested. Broader archival/vector-asset provenance is not established by that approval. |

## NEXT BEST MOVE

Finish remaining cases in [LAUNCH_QA](docs/LAUNCH_QA.md); the exact final physical update/cold-launch/process gate now passes. Obtain physical visual/route/accessibility evidence when an enabled capture route is available. Use a JDK/SDK-equipped host for an independent Android release/runtime check; final Android JS packaging is verified. Preserve the separate [owner billing checklist](STORE_SETUP.md): sandbox trial endpoint, real store/RevenueCat configuration and actual Apple/Google/web transactions remain external gates. Source checks and Simulator proof do not establish store readiness.

## REFERENCES

[Master audit](docs/MASTER_AUDIT.md) · [Version map](docs/VERSION_MAP.md) ·
[Content audit](docs/CONTENT_AUDIT.md) · [Cycle safety](docs/CYCLE_SAFETY.md) ·
[UX final](docs/UX_FINAL.md) · [Build proof](release/BUILD_PROOF.md) ·
[Daily QA](release/DAILY_QA_20261112.md) · [Roadmap](release/ROADMAP.md) ·
[Store checklist](release/STORE_CHECKLIST.md) · [Launch QA](docs/LAUNCH_QA.md) ·
[Native launch bridge](docs/NATIVE_LAUNCH_SPLASH.md)
