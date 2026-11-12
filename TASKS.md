# TASKS

Updated: 2026-11-13

## NOW — release-candidate proof

- [x] Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run content:check`, and
  `npm run content:validate`; exact outcomes are recorded in `release/BUILD_PROOF.md`.
- [x] Build Debug and normal Release iOS Simulator products from
  `ios/TuneIntoHer.xcworkspace` / `TuneIntoHer`; install and launch a completed normal
  Release product on iPhone 17.
- [x] In a Debug-only mock-billing run, observe unlocked Today on iPhone 17 for more
  than one V4 eight-second cycle. The V4 renderer visibly moved for 12+ seconds with
  no normal-use static overlay; light/dark appearance, feedback selection, gratitude,
  and scrolling also passed. The mock guard requires `__DEV__` plus
  `EXPO_PUBLIC_USE_MOCK_BILLING=true`, displays a visible QA label, and cannot enable
  a production bundle.
- [x] Safely integrate Deep Intro V2 after comparing actual root-V4 and generated
  GLSL literals rather than accepting the installer's stale generated-wrapper hash.
  The six intended V2 files match the supplied payload; the renderer, clean texture,
  vector brand source, and oval-mask fix remain unchanged. Typecheck, lint (0
  errors), 89 app tests, content check, 32 V2 checks, browser-preview export, and a
  fresh Debug iPhone 17 build passed. V4 motion was observed for 16+ seconds.
- [x] Preserve preintegration sources in a separate local archive branch and save the
  reviewed Deep Intro V2 checkpoint without changing either requested archive branch.
- [x] Exercise the existing daily selector for synthetic 7/30/90-day evidence across
  eleven locales and add the explicitly labelled dev-only in-memory next-test-day
  control. See `release/DAILY_QA_20261112.md`.
- [ ] Complete post-update iOS visual verification for the native `react-native-svg`
  `Unimplemented` placeholders. The narrow 15.16.0 update and Pod sync are complete,
  but the single fresh Debug build stalled after RNSVG compilation; do not claim the
  official marks/icons repaired or replace them with substitute assets.
- [ ] Create a real Android native build/emulator or device evidence. Android JS
  export passes only; it does not prove SVG, WebView, splash, navigation, or billing.
- [ ] Record reproducible compact-iPhone and large-text visual evidence. Do not
  substitute the Debug Simulator observation for physical-device or store proof.
- [ ] Review the final diff for generated files, credentials, signing material, and
  unintended asset changes before creating any local checkpoint.

## OWNER DECISIONS REQUIRED

- [ ] Choose and document canonical subscription term and eligible trial duration.
  Current source is monthly P1M / `monthly_access`; prior drafts with annual or
  differing trial durations are not a decision.
- [ ] Confirm the intended iOS and Android application identifiers or authorize a
  deliberate alignment.
- [ ] Provide verified seller/legal spelling, support address, Terms and Privacy
  destinations, and platform privacy declarations.
- [ ] Confirm Apple/Google account activation, signing access, and the current Google
  policy/account-type route for a cycle-context app.
- [ ] Confirm whether current procedural/vector `BrandMark` assets are approved
  originals, or provide approved source assets.

## EDITORIAL / SAFETY

- [ ] Decide the 30 founder-commented Russian entries in
  `docs/CONTENT_AUDIT.md`; do not edit source or translations from comments alone.
- [ ] Obtain native-language review for all 11 locales; `mbf` needs community review.
- [ ] Decide whether an explicit unknown-cycle-length state is required. Current
  onboarding defaults to 28/5 rather than preserving an unknown value.
- [ ] Add explicit user-confirmed bleeding-event provenance and a corresponding UI flow
  before treating phase-state safety as release-ready.
- [ ] Obtain clinical/editorial review of health-adjacent and phase-related wording.
- [ ] Test time zone, travel, skipped-period, and DST behavior on physical iOS/Android.

## STORE / DEVICE GATES

- [ ] Configure RevenueCat and store products only after the owner billing decision;
  sandbox-test purchase, restore, billing issue, cancellation, and localized offers.
- [ ] Perform physical iOS and Android notification/permission/tap-routing QA.
- [ ] Complete compact/regular visual QA in both appearance modes and all locales.
- [ ] Update `release/readiness.json` only with real final evidence; run
  `npm run release:check` after all external facts are supplied.

## DONE IN THIS CANDIDATE (source-level)

- [x] Select PR #6 `25c8505` as integration base and create local recovery pointers.
- [x] Preserve the pre-consolidation V4 working tree in local commit `1147292`.
- [x] Directly wire the approved V4 renderer into Today and onboarding and add hash/use
  integrity coverage.
- [x] Remove the retired `PhaseSphere` from the active render path while retaining the
  archival recovery path.
- [x] Add local per-cue feedback and history without rewriting persisted daily choices.
- [x] Introduce the 40-day unconfirmed-cycle safety guard and all-phase fallback.
- [x] Write the audit, version map, content ledger, UX, safety, build-proof, and store
  readiness documentation.

## NOT AUTHORIZED BY THIS LIST

The Founder authorized a checked, non-force push of this integration branch only. No
merge, deployment, store submission, or production billing configuration is implied by
these tasks. Do not erase user data, generated history, or archival recovery points to
obtain a green check.
