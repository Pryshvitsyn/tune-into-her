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
- [ ] Finish post-update unlocked Today/intro/icon regression. The narrow RNSVG15.16.0
  update and Pod sync are complete, and the current arm64 Release build/install now
  passes with actual paywall header SVG marks visible in Light/Dark. That limited proof
  does not complete the whole native journey; preserve original assets.
- [ ] Create a real Android native build/emulator or device evidence. Android JS
  export passes only; it does not prove SVG, WebView, splash, navigation, or billing.
- [ ] Record reproducible compact-iPhone and large-text visual evidence. Do not
  substitute the Debug Simulator observation for physical-device or store proof.
- [ ] Review the final diff for generated files, credentials, signing material, and
  unintended asset changes before creating any local checkpoint.

## MONETIZATION — implemented locally, external QA pending

- [x] Extend existing PurchaseService with monthly/annual exact mapping, base-plan purchase, verified paid entitlement, source management, explicit Google base-plan change, restore, pending/cancel, serialized actions/listeners and bounded offline access.
- [x] Implement independent server UTC14-day AppTrialService with pseudonymous SecureStore credential, permanent Worker/D1/local SQLite persistence, idempotency and managed-clock tests.
- [x] Integrate explicit post-onboarding trial, paid OR trial Today access, expiry/foreground checks, eleven-locale billing/privacy copy and safe official web redemption routing.
- [x] Prepare RevenueCat Billing+Stripe hosted-channel setup, optional authenticated durable RC webhook journal, product table, privacy/disclosures and one owner action checklist.
- [x] Pin purchases10.8.0 and ExpoCrypto57.0.4; synchronize iOS Pods; configure separate billing-test EAS AAB/store profile and production config guards.
- [x] Verify source checks161/24, lint0errors, content checks, final Android JS export, and actual arm64 iOS Release build/install. Observe current unconfigured paywall in Light/Dark; store transactions remain unverified. See BILLING_QA.md.
- [ ] Deploy authorized sandbox trial service and supply actual platform SDK keys/catalog/offering; no secrets in chat/git.
- [ ] Complete actual Apple sandbox/TestFlight, Play-installed both-plan/pending/restore/lifecycle and RC hosted checkout/redemption/portal tests. **BLOCKED** exact values/actions: STORE_SETUP.md.
- [ ] Produce and verify release Android AAB/manifest/dependency graph/signing/16KB artifact after JDK/SDK and upload signing are available. Local isolated prebuild passed; no AAB exists.
- [ ] Resolve Expo Doctor's19/21 native-config-sync and version-advice checks with reviewed native regeneration/compatibility decisions; do not undo intentional RNSVG/RN compatibility or upgrade the entire stack blindly.
- [ ] Native-language/community review and device layouts for billing strings; structural locale checks do not establish translation acceptance.

## OWNER DECISIONS REQUIRED

- [x] Owner approved2026-11-13: explicit14-day app access without card/account/subscription; voluntary monthly €3.99 and annual €24.99 eurozone base targets, equal full access. See MONETIZATION.md.
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

- [ ] Configure verified RevenueCat and store products per the now-approved model;
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
