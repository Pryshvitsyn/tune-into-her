# PRODUCT SNAPSHOT

Updated: 2026-11-22 (Europe/Rome)

## GOAL

Prepare a controlled Tune Into Her release candidate: a local-first practical partner
guidance app with respectful estimated-cycle context, preserved daily history, approved
V4 sphere presentation, and explicit safety/release boundaries. It is not a medical,
fertility, or mood-prediction product.

## STATE

- Current work branch: `codex/release-preparation-20261121`, preserving monetization/visual/QA baseline`9b6e031`. Original `codex/monetization-20261113`, release-candidate branch and `main` remain untouched. Original consolidation was based on PR #6 `25c8505`.
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


## CURRENT FINAL BILLING AUDIT — 2026-11-22

- Preserve b8f68f0 via `codex/checkpoint-apple-billing-20261122`; local-only continuation.
  Newest instruction forbids push/PR edits/merge/store submission. No personal-device writes.
- Fresh Apple readback: both approved level1 plans/periods/Italy prices/no intro intact;
  availability unset, inherited tax unconfirmed, review screenshots absent. Individual
  Developer membership renews9November2027, TeamB77TL63S9T; Account Holder role verified.
  Paid Applications Agreement remains New with legal-entity confirmation prerequisite;
  banking/tax not verified, TestFlight empty, no sandbox testers at audit. Owner forms ready.
- Fresh RC full_access/default mappings and valid existing key confirmed. EAS preview
  key matches owner copy and actual sandbox preflight passes; four preview variables only,
  production untouched, Free/$0plan, no remote iOS/Android signing credentials.
- **New real Apple Sandbox TEST notification delivery succeeds**, Apple request/status200
  and SUCCESS. No actual purchase/lifecycle entitlement is inferred. Callback values are
  excluded from saved proof; one accidental technical-snapshot inclusion was disclosed.
- Local/Apple signing still Development only. New Distribution certificate/profile needs
  separate Founder approval; automatic review blocked advancing creation before consent.
- New full native recompile was stopped safely at1.24GiB disk/13.3GiB swap on8GiB host;
  no success claimed. A separate current Hermes re-embed of prior verified Simulator Release
  has the real SDK key, no private QA, verified ad-hoc signature and identical unsigned
  Mach-O payload. It is runtime QA, not an IPA/new native compile/TestFlight artifact.
- Accepted current native runtime: continue the prepared normal onboarding screen → explicitly
  start separate real sandbox trial → authored Today/cold restart; native offers remain unavailable,
  Retry and return-to-Today work, Restore not tapped/no purchase. First reminder-wait failure retained.
  Exact accepted offer/retry test is added to existing guarded native harness; Swift parse/8release
  tests pass. Full current no-Metro cold40.036667s/1757frames/0black recorded with stronger disk guards,
  original native artifact preserved. Test Simulator shut down with its synthetic data intact.
  A later fresh Pro attempt hit ENOSPC despite4.5GBinitial free; stopped/cleaned only its empty
  owned Simulator/cache. No required-size store capture or new fresh-case pass is claimed.
- Repeated actual trial HTTP checks pass with prior separate identity, no time extension.
  Repeated same-AAB API36/Billing8.3/ELF+RELRO+ZIP16KB/signature checks pass, overall
  INCOMPLETE for owner upload certificate/local official zipalign; actual cert is Debug.
  Google owner console/catalog/service account/RTDN remain inaccessible/unverified.
- Existing November21 normal Release1206×2622 Cycle/Learn images are indexed as dated
  unchanged iOS draft candidates, with byte-identical local export and173core hashes matched.
  Today DO_043 and subscription-error images are excluded; no editorial/media approval or upload.
- Re-ran all six commands:531tests/55files, typecheck/lint/content pass; release gate fails
  as expected. All9flags stay false. International proposal and current sanitized evidence
  are in the [canonical release report](release/RELEASE_PREPARATION.md); no legal/editorial
  approval, country availability, real transaction or store readiness is claimed.

## CURRENT RELEASE PREPARATION — 2026-11-21

- Baseline9b6e031 preserved by `codex/checkpoint-release-prep-20261121`; work isolated on
  `codex/release-preparation-20261121`. Editorial/native-language approval remains frozen.
- Exact PR#8 listing source reconciled; ten supported storefront mappings, bounded draft
  exports, approved rings-only feature graphic and guarded Privacy/Terms/Support routes prepared.
- Existing Cloudflare account visibly Free$0. Only sandbox Worker/EU-jurisdiction D1 created:
  explicit14-day start, no implicit start, immutable repeat/redeploy dates,401/400 and live429 pass.
  Production remains undeployed. Preview EAS receives actual public sandbox URL.
- RevenueCat project5921ebba and approved `full_access` created; Play app445ba93d10 uses preserved
  package and public SDK key in EAS preview. Google service-account/notifications and Play
  catalog/mappings remain blocked.
- November22 explicit credential approval resolved the initial automatic-review blocker:
  one Apple IAP key stored outside Git with private owner handoff; Apple RC app `app3e066d34c5`
  reports Valid credentials. Both exact products attach to existing full_access; current
  default offering `ofrng36616cccd9` maps the two standard packages, verified after reload.
  iOS public SDK key (sensitive) and offering default saved/read back in EAS preview;
  actual iOS billing-test gate and49 purchase/configuration tests pass. No real purchase,
  new native build or phone/runtime data write. Sandbox testers were absent at audit; owner
  reauth completed and RC callback saved/matched after reload only in Apple's Sandbox URL.
  Sandbox TEST delivery is now separately verified; purchase/lifecycle events remain unverified.
  Optional auto-import has no extra ASC API key.
- Apple app6832290282 / en-AU / version1.0 is preserved. Explicit Founder approval on
  November 22 authorized group `22605485` and drafts `monthly_access` (Apple `6837968807`) /
  `annual_access` (Apple `6837969104`), created with periods 1 month/1 year and the same level 1. Italy/EUR
  prices €3.99/€24.99 were saved/read back; en-AU names/descriptions saved, no introductory
  offers or sales availability configured. [Dated console proof](release/evidence/apple-catalog-20261122/catalog.json).
  Paid Applications Agreement was not active at November21 audit and requires owner
  legal-entity update/signing. TestFlight had no builds; legal/security changes remain separate.
  Current Google profile still reaches signup; correct existing developer access remains required.
- Native Xcode26.6/iOS26.5 Release compilation and ordinary signed sandbox Simulator build pass.
  Missing-entitlement unsigned fixture and ENOSPC attempts are explicitly excluded. Distribution
  identity/profile absent; no TestFlight IPA/store purchase proof is claimed. Ordinary onboarding,
  explicit real sandbox trial, actual authored Today and cold restart pass on an owned Simulator.
- Android Free EAS build10288699… FINISHED: actual AAB/API36/Billing8.3.0,100valid native libraries,
  all50 applicable64-bit ELF/RELRO and same-AAB APK ZIP checks pass. Debug signature and absence
  of Android runtime/Play App Signing/store transactions stay explicit. No Metro/export equivalence.
- Ordinary native trial passes all11 locales, Light/Dark/Home/cold, History/documents/Subscription
  and UIKit Reduced Motion with restore. Full no-Metro H.264 launch2073frames/0black and bounded
  pressure2048/0black retain every frame/PTS. HEVC reset is rejected; capture helper now guards it.
  Only the task-created Simulator was cleaned after proof, preserving phone/source/artifacts.
- Android runtime host capacity is measured: recovered7.89GB, API36 16KB image4.56GB plus required
  5GB still free already exceed capacity before tools. No low-space SDK install/fabricated runtime pass.
- Store preflight rejects Test Store keys/private QA overrides; production demo/mock flags explicit.
  New source checks pass531tests/55files; full pixel/hash checks retained with allocation-only
  test optimization. No intro/cycle/content/purchase/storage runtime was changed.
- All nine readiness flags remain false. Public legal policy, native store transactions and
  device acceptance require real remaining evidence, not this preparation status.
- [Current source, provider state, dated proof and final approval checklist](release/RELEASE_PREPARATION.md).
- Implementation/evidence commit`7f9b583` is pushed; [draft PR#9](https://github.com/Pryshvitsyn/tune-into-her/pull/9)
  targets preserved`codex/monetization-20261113`. Main/production/store submission remain untouched.

## CURRENT FINAL UI / LANGUAGES / FOUNDER QA — 2026-11-15

- Safe pre-change checkpoint3eff34d retained. Secondary footer now has only accessible arrow/gear,
  main tabs unchanged. Compact Cycle retains42dates/6weeks and fixed Edit, actually fits375×667.
- Initial language selection uses11 horizontal draft pages, swipe/arrows/adjustable accessibility,
  explicit confirmation/cancel and large-text fallback. All11 own-locale UI/QA/legal trees and
  actual preference save/load paths tested; iOS spinners use the chosen locale.
- Known Android OS-language picker gap is closed in source with one app-owned localized date/time
  modal at Cycle and both reminder entrypoints; temporary edits/Done/Cancel/maxdate/24h guards tested.
  iOS spinner branch is retained. Android native runtime still requires absent SDK/JDK.
- Today Learn more now supplies meaningful bundled four-phase content in11languages, individual
  variation/no-diagnosis caveats and live institutional NHS/NICHD sources checkedNovember15.
  Original licence remains exact English with localized context; sources are labelled English.
- Latest Founder correction supersedes wordmark-in-icon: rings-only photographic master, bounded
  reconstructed letter area, exact original pixels elsewhere. Native iOS1024/Play512/adaptive
  resources regenerated; full original portrait/wordmark/splash/V4/6layers/ending stay byte-exact.
- Private standalone Release defaults to localized existing QA panel, Settings reopens it, Reset
  keeps synthetic ownership. Ordinary production gates/AppProvider/index and real services unchanged.
  QA language/theme seed stays in memory; cold test preferences reset separately from normal persistence.
- Current-source physical no-Metro Today/panel/Home captures pass with source-identified signed builds;
  all before/after personal AsyncStorage snapshots equal, Founder QA stays installed and launch exits0.
  MovieFileOutput -11813/short fragments rejected; successful video-only host-arrival writer is labelled
  separately from native GPU-clock measurements. Keychain not read/hashed. Native UI tour/final report
  readback is complete:517tests/54files/typecheck/lint PASS, all11 native locale assertion sequences,
  normal RU cold persistence and QA smoke verified. A measured Ukrainian footer orphan is fixed
  by one padding constant, native before/after/all11 footer checks and51-input cold1741frames/0black.
  Final51-input physical update/capture now PASS without Metro: Today1487decoded/panel1482,
  0black, continuous568-frame launch to Today text, four-way exact personal AsyncStorage equality.
  Founder QA panel remains installed/relaunched; unchanged native icon catalog reuses accepted Home proof.
  Historical50-input proof remains labelled. No store release or clinical/native-speaker approval is implied.
- [Implementation, accepted evidence and explicit limits](docs/FINAL_UX_QA.md).

## PREVIOUS WORDMARK ICON / ISOLATED TODAY QA — 2026-11-15

- Literal780px crop of the immutable approved photo supplies full silver rings/wordmark,
1024iOS/AppStore/TestFlight,512PlayRGBA and separate safe adaptive layers. Actual native
AppIcon input updated; no SVG/font/photographic repaint. Source and splash stay exact.
- Xcode actool rebuilt real iphoneos/Simulator Assets.car and icon PNGs. AppIcon digest
changes; four launch rendition digests/dimensions remain exact. Existing code/profile/IDs
preserved; signed normal and separately labelled QA artifacts verify. This is native asset
compilation, not a claim of full Swift rebuild or a Metro-only installed-icon change.
- Temporary standalone dev=false QA tooling reuses existing in-memory services before
AppProvider mounts. Normal gate/provider/routes are byte-unchanged; emitted graph verifier
rejects an SDK config-loading failure. No real paid/trial access or personal storage write.
-442tests/49files, TypeScript, lint0errors/one prior warning, raster/hash/native-resource
checks PASS. Corrected Simulator cold video reaches real authored Today with QA disclosure;
full three-part text, scrolling, modal, Settings and Home native test PASS52.479s.
- Actual Simulator SpringBoard photo icon and generated store/small/round previews supplied.
Android20density/2XML generation verified; native Android build/runtime still lacks SDK/JDK.
- Physical standalone QA now PASS without Metro:25.09675s/1498frames, one full intro to actual
Today DAY7 with mock disclosure and recorded KEEP/SUPPORT/DO positions. Separate15.308sHome
source shows the new silver icon; public cutout masks private wallpaper/label surroundings.
- Exact AsyncStorage file/manifest equality at beforeQA/afterQA/afterNormalINSTALL; normal
Release restored/launched0, same icon Assets.car, no QA marker. Keychain not read/hashed.
Initial short landscape MediaChanged capture is rejected; only the successful portrait
recording is evidence. App/subscription/intro source unchanged from315d2eb.
- [Current files, actual physical proof and preservation checks](docs/OFFICIAL_ICONS_TODAY_QA.md).

## PREVIOUS VISIBLE-ASSEMBLY ENDING — 2026-11-15

- Preserves c441ad3's physically verified exact photo, corrected RN sizing and native/GPU
  handoff. Protected V4, shader/texture, timeline, six-depth scene and8s loop stay byte-exact.
- Global/Home now count one1000ms active GPU-clock hold after settled geometry has had a
  presentation opportunity; destination prepares during it. Existing360ms fade waits for
  real readiness; late readiness never restarts a hold. Standalone Today retains9000ms reveals.
- Fixed fractional-radius comparison deadlock with sub-micropixel/ULP tolerance; actual
 320/393/412/414/430 targets regressions pass. Hidden/background time cannot consume hold.
-431tests/47files, TypeScript, lint0errors/one prior warning, brand/raster/integrity PASS.
  RealGPU1000/1100ms hold, pause and continued material motion verified. Final native
  Dark/Home/cold, single/doubleHome, interaction/access guards and1.574sRMHome PASS;
  Light and native/UIKit Reduced Motion OFF restored. Android production Hermes export PASS.
- Final Simulator pressure cold video470frames/0black-or-white: observed settled sphere
 ~17.04s→fade~18.14s→locked body~18.45s;~1.1s hold/~0.3s fade, distinct from host wall time.
- Final signed normal iPhone JS Release update-installed preserving data; original native
  executable unchanged apart from code signature, frameworks byte-identical. No Metro.
  Final physical cold video now verified after USB reconnection:2222frames/0black/nearblack/white,
 complete photo/depth/V4/Darklocked journey,~1.05–1.09s assembled hold/~0.34–0.37s fade.
 Safe body contact/clip excludes private cycle/header/prelude/tail. Paid physical Today/touch
 still requires legitimate access; no access is bypassed.
- [Current implementation, measured proof and limits](docs/INTRO_ENDING_QA.md).

## PREVIOUS EXACT PHOTOGRAPH / VERIFIED V5 CHECKPOINT — 2026-11-14

- Original approved PNG supplies native iOS, RN loading and Home. All3 source copies
  are byte-identical; the header/vector/material/font sources remain unchanged.
- Fixed real851×1847POINT RN static-Image crop using100% container dimensions. Actual
  physical wrong-crop control is quantified and retained; it is not blamed on shaders.
- Explicit associated canvas output fixes independently proven WK/Cocoa halos. Native
  hide is queued before4UI commitment frames and release; clock/preparation/retry are safe.
-408tests/46files, TypeScript and lint0errors/one prior warning pass.104GPU frames retain
 6ribbons and both sets of8exact protected-V4 comparisons. No9s/camera/8s-loop change.
- Accepted final Simulator:697frames under CPU pressure,0black/white, samephoto native/RN,
 48gradual dissolve frames and correct destination. Native Dark/Home/cold+2.124sRMHome
  pass; Light and native Reduce Motion OFF restored.
- Corrected signed normal iPhone Release physically verified November15 without Metro:
 2415frames/0black-or-white, full-photo native/RN MAE0.955/255, smooth42frame dissolve.
 Data intact, entitlement-locked route preserved. This c441ad3 photograph/handoff checkpoint
 predates the newly requested assembly+1s ending; original recorder failures remain distinct.
- Exact-photo Android resources pass isolated checks; Android12+ native icon/full-screen
  limits and absent SDK/JDK/runtime remain explicit. No billing/service configuration work.
- Report/evidence/limits: [APPROVED_OPENING_QA](docs/APPROVED_OPENING_QA.md).
  Founder implementation approval remains pending separately; new ending physical proof is linked above.

## PREVIOUS PREMIUM INTRO V5 / NATIVE STARTUP — 2026-11-14

- Founder reference archived immutable. One authored metallic SVG/steel atmosphere supplies
  native launch, fallback, GPU opening and Home; exact approved OTF/glyphs/rings retained.
  Intro-only light/material/fade preserves9000ms/sixlayers and the original V4/8s loop.
  Eight realGPU finalRGBA comparisons across4ratios exactly equal protected baseline.
- Release now presents an opaque storyboard window BEFORE Expo/Updates/JS initialization;
  native frame commitment precedes factory creation; window cover survives root replacement
  until the installed Expo splash is ready. No pre-runtime WebGL or arbitrary loading delay.
- Verified first-update/cold pressure: Simulator765frames, physical normal1265 and native-QA
  pressure1361, all0black. Physical pressure run is unobscured; raw private UI is excluded.
  The exact normal signed Release is restored on iPhone, data preserved, process alive285s.
-383tests/42files, TypeScript, lint0errors/1prior generated warning, font/raster/source/content
  checks pass. Native Light/Dark/Home/reduced-motion (Home1.493s and OFF cleanup) pass.
  Android resources verified; nativeAndroid and real reader speech remain unavailable.
- Full actual evidence, reference-approximation limits and intermediate harness boundaries:
  [PREMIUM_INTRO_V5_QA](docs/PREMIUM_INTRO_V5_QA.md). No billing/content/data/configuration
  service changes, store submission or production deployment.

## PREVIOUS BRAND GEOMETRY / TYPOGRAPHY — 2026-11-14

- Supersedes the old upper-ring fragment, rectangular wordmark gap and extra1s hold.
  Two coherent open arcs retain original proportions/stroke/caps; glyph-shaped clearance
  places the real Linux Libertine O Regular lettering above them. Native-default “Tu”
  kerning now matches app shaping; original OTF, glyphs, em, weight and baseline remain.
- One authoritative assets/brand/official-mark.svg regenerates shared vector/texture,
  native logo and Home emblem. iOS copy and all5 Android densities verified; source/raster,
  native-alpha, font provenance and approved-hash guards stay enabled.
- Full9000ms/six-layer timeline, V4/runtime/shaders/sphere assets are byte-identical.
  Fade360ms begins at actual readiness after scene completion; slow initialization keeps
  V4 moving. No navigation/content/cycle/subscription/backend/configuration changes.
-369 tests, typecheck, lint0errors/1existing generated warning, font/CoreText/full-raster
  checks pass. Simulator/physical Release and Android JS export pass. Native Light/Dark,
  Home single/double replay and Reduced Motion cold entry pass. First post-install capture
  exposed pre-silver black frames; two quiescent runs including a data-preserving reinstall
  check all690/724 frames with zero black frames. Final boundaries are recorded in
  [BRAND_GEOMETRY_QA](docs/BRAND_GEOMETRY_QA.md). Android native/real speech/physical visual
  proof remain open. No publication or production configuration change.

## FINAL UX / INTERNAL QA — 2026-11-14

- Existing header emblem now replays the shared approved scene in-app then opens Today,
  retaining paid/trial gates and saved theme. Duplicate taps cannot queue intros; a foreign
  route during handoff is recovered to Today. No native restart or shader/timeline change.
- Fresh date draft is null until explicit confirmation in the existing step/editor.
  Current cycle day uses the local date; guidance retains its08:00 boundary. Genuine saved
  dates and historical selections remain intact. Calendar Update is fixed above primary tabs.
- Shared secondary screens have a single fixed lower Back/Settings footer. Primary tabs
  remain unchanged; screen ownership keeps retained-page footers stable while navigating.
- Retry independently refreshes trial and offerings; SDK offering timeout and transient
  trial-storage initialization failures recover. Actual trial/backend/RevenueCat build
  configuration is absent locally, so real verification/transactions remain blocked.
- Development-only explicit QA sessions reuse MockPurchaseService/AppTrialService with private
  storage, simulated time and scenario data. Normal sessions retain real services. Scope-keyed
  forms/stores and stale callback guards prevent synthetic edits/prices leaking into real data;
  real billing/notification polling pauses during QA. No public QA tab or production bypass.
-367 source tests, typecheck, lint0errors/1existing generated warning pass. Physical Debug
  build/signature/modules and data-preserving installation pass; Simulator Release and Android
  production JS export pass. Current signed Release cold entry is recorded with Metro absent
  and official update resources matched. Native Home/calendar/documents/theme/fresh-cycle and
  isolated cycle/08:00/history/trial/paid/Retry/Restore/End-QA cases pass. Native Reduced Motion
  Home skips the full scene (1.524s) and restores the OS setting; complete cold video reaches
  locked Today. Final source/evidence review passes; changes follow the authorized feature-branch commit/push workflow. No app/store publication.
- [Current proof and limitations](docs/UX_TEST_READINESS.md) · [QA workflow](docs/INTERNAL_QA.md).

## PREVIOUS BRAND / TYPOGRAPHY CHECKPOINT — 2026-11-14

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
