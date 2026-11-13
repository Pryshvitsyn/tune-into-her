# PRODUCT SNAPSHOT

Updated: 2026-11-13

## GOAL

Prepare a controlled Tune Into Her release candidate: a local-first practical partner
guidance app with respectful estimated-cycle context, preserved daily history, approved
V4 sphere presentation, and explicit safety/release boundaries. It is not a medical,
fertility, or mood-prediction product.

## STATE

- Current work branch: `codex/monetization-20261113`, based on clean local candidate `eb5b0f0`; original release-candidate branch and `main` remain untouched. Original consolidation was based on PR #6 `25c8505`.
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
  updated to exact 15.16.0 and Pods synchronized. Source checks and Android JS export
  pass, but the sole post-update iOS Debug build stalled after RNSVG compilation with
  no fresh app artifact, so the Simulator runtime repair is deliberately unverified.

## MONETIZATION — 2026-11-13

- Separate server-controlled14×24h guest app access, explicit start after completed onboarding; no store subscription or automatic charge. Trial identity/credential survives local content reset.
- Monthly/annual plans, exact store periods/base plans, actual localized total prices, immediate-charge/renewal disclosure, pending/cancel/restore and source-aware management.
- Signed RevenueCat paid access and separate app-trial access, bounded24h caches, server anchors, rollback/monotonic/deadline checks, foreground/listener refresh and serialized purchase actions. Existing anonymous RC identity retained.
- Isolated Worker/D1 backend with permanent local SQLite runner and optional authenticated/HMAC durable RC event journal. Cycle/relationship data remains local.
- Official web redemption routing is prepared; the actual dashboard scheme, hosted RC Billing checkout, Stripe sandbox connection and portal remain external configuration. No external payment CTA is enabled in the native global release.
- Billing/privacy strings cover all11 existing locale IDs structurally; native-language/community and device layout review remain pending.
- Final monetization verification: typecheck,161 tests/24 files, lint0errors/13existingwarnings, content checks and Android JS export pass. The normal arm64 iOS Release Simulator build/install passes; the real unconfigured paywall was observed in Light/Dark with no mock/prices invented. Real store/web transactions and Android AAB remain BLOCKED.
- Exact proof and remaining platform boundaries are in [BILLING_QA](BILLING_QA.md); one canonical owner action table is in [STORE_SETUP](STORE_SETUP.md). Expo Doctor currently reports19/21 (existing native-config sync and package-version warnings); no stack-wide upgrade was performed.

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
| Native build and visual QA | Debug + normal Release Simulator builds and onboarding launch pass predate the RNSVG update. The former Debug preview showed `Unimplemented` SVG placeholders. The RNSVG 15.16.0 update lacks post-update runtime proof because the one target build stalled without a fresh `.app`. Compact, large-text, all-locale, physical-device, and store QA remain open; no Simulator run is store evidence. |
| Android | Android JS export passes, but no `android/` native project, Gradle build, emulator/device, SVG/WebView/splash/navigation runtime proof, or standalone APK/AAB exists. |
| Apple / Google | No verified signing, physical device, store account, listing, or store approval. Current audit observes one Apple Development identity; distribution signing/provisioning and physical/store proof remain unverified. |
| Billing | Owner approved14-day app access + voluntary €3.99 monthly / €24.99 annual base targets on2026-11-13. Native service/UI, trial Worker/D1 and web redemption source implemented; external catalogs/keys/deployment and real sandbox transactions remain BLOCKED. See BILLING_QA.md and STORE_SETUP.md. |
| Legal/support | Real seller spelling, support contact, terms/privacy URLs/text, and privacy declarations remain open. |
| Product identifiers | iOS is `com.eliogenesis.tuneintoher`; Android is `com.pryshvitsyn.tuneintoher`; explicit owner decision required. |
| Content | All 30 current Founder column-G comments are mapped as unapproved editorial drafts; no translation update is authorized or claimed native-reviewed. |
| Safety | No explicit user-confirmed bleeding-event provenance or clinical/localized copy review. The product also has no explicit unknown-cycle-length state: onboarding supplies defaults (28/5), which needs an owner decision if uncertainty must be preserved. |
| Visual assets | Current vector brand marks have no verified supplied-original provenance. |

## NEXT BEST MOVE

Complete the canonical [owner billing checklist](STORE_SETUP.md): first provision the isolated sandbox trial endpoint and verify native products/RevenueCat public keys, then install the billing-test builds for real Apple/Google sandbox and RC web redemption/portal QA. Android AAB is locally blocked by missing JDK/SDK. Preserve the remaining visual/content/legal/device gates; source tests and Simulator builds are not store readiness.

## REFERENCES

[Master audit](docs/MASTER_AUDIT.md) · [Version map](docs/VERSION_MAP.md) ·
[Content audit](docs/CONTENT_AUDIT.md) · [Cycle safety](docs/CYCLE_SAFETY.md) ·
[UX final](docs/UX_FINAL.md) · [Build proof](release/BUILD_PROOF.md) ·
[Daily QA](release/DAILY_QA_20261112.md) · [Roadmap](release/ROADMAP.md) ·
[Store checklist](release/STORE_CHECKLIST.md)
