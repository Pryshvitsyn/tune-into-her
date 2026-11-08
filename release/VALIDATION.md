# Validation — 5 November 2026

## Component-level content reserve (PR #4)
- Source expanded from 88 to 318 texts in each of eleven locales: 90 general actions, 90 support prompts, 90 context principles, 12 actions per phase. 610 visible bundles including all 484 unchanged v3 entries.
- Measured original default 28/5 scenario over 90 days starting 2026-02-13: 33 DO, 24 SUPPORT, 24 KEEP IN MIND texts. New fresh-history tests yield 90/90/90 in all eleven locales.
- `npm ci --ignore-scripts --no-audit --no-fund`, `npm run content:check`, `npm run content:validate`, ESLint and TypeScript pass. **50 tests across 10 files pass.**
- New tests cover 180 onboarding plus six accepted edge cycle settings, held phases, daily phase changes, multiple starting dates, leap day, local-date DST boundaries, exactly one gratitude reminder, legacy digest identity and persisted version-3 selections.
- Offline iOS and Android Hermes exports of PR #4 content passed (1,419 / 1,565 modules); exports of the combined preview also passed before the SDK patch update.
- Six Expo SDK 57 patch dependencies were aligned after CI requested newer compatibility versions.
- Native-language and Baba Malay community reviews remain pending in release/content-review.json and readiness.json. Scope and exhaustion/legacy-history limits are in docs/CONTENT.md.

## Updated content in accelerated preview (PR #5)
- Integrated the PR #4 component reserve without changing the selector/store API or real/demo history separation. Resolved three documentation conflicts; preview code merged without source conflicts.
- **73 tests across 14 files pass**, plus content validation, source/output checks, ESLint and TypeScript, after the six Expo SDK patch updates. Expo Doctor reports **21/21 checks passed**.
- Added a direct `buildDemoDays` integration regression: all 30 displayed DO/SUPPORT/KEEP IN MIND texts are distinct in each of eleven locales, cue IDs match across locales and every day retains one gratitude reminder. Existing notification and real-history isolation tests remain passing.
- Offline Hermes exports after the patch updates pass: iOS 1,401 modules, Android 1,574 modules.
- This verifies source behavior and buildability; signed installation, locked-phone notification delivery and device visuals remain unverified.

## Historical validation — 2 November 2026


## Three-month content reserve
- 484 distinct visible three-part bundles per locale across eleven locales; phase capacities 100/104/100/180. All former 400 IDs preserved; content version 3.
- Editorial source: 88 sentences per locale. Combinations are distinct; individual sentences/principles recur. Scope and language-review limitations: [CONTENT](../docs/CONTENT.md).
- Content validator passes, including direct source/output correspondence and visible-bundle uniqueness.
- TypeScript and ESLint pass. Vitest: 43 tests across 9 files pass, including 90-day reserve simulations and existing regression checks.
- Both native Hermes exports pass (iOS 1419 modules; Android 1565 modules) with EXPO_OFFLINE=1. Initial online export hit an HTTP proxy timeout; offline bundling succeeded.
- No native-device, visual, store-purchase or native-speaker QA performed. Language/community readiness flags remain false. No signed build, OTA update or store submission.

## Historical validation — 1 November 2026


## OTA preparation
- Installed expo-updates ~57.0.26; configured fingerprint runtime matching and preview/production channels.
- TypeScript, ESLint and 39 tests pass; Expo Doctor passes 21/21 checks.
- iOS and Android Hermes exports succeed after OTA configuration. Resolved Expo config contains the existing update URL and fingerprint policy.
- Initial EAS CLI authentication check returned Not logged in; subsequent device authorization succeeded as eliogenesis. project:info confirms @eliogenesis/tune-into-her and project ID dc8938e7-7163-413a-9003-479d0afc8a17. No native cloud build, installation or OTA delivery has been verified. Apple Developer membership/signing and device registration remain outstanding.

## CI repair
- Failed run 41295193181: installation, content, lint, type-check and all tests passed; Expo Doctor failed on eight outdated SDK 57 packages.
- Applied SDK-compatible patch updates via expo install --fix and regenerated package-lock.json.
- Clean npm ci followed by Expo Doctor: 21/21 checks pass. Lint, type-check, 39 tests and content validation pass again.
- GitHub Actions run [41296523081](https://github.com/Pryshvitsyn/tune-into-her/actions/runs/41296523081) passes every step on commit 345d741. Both iOS and Android Hermes exports pass locally after the dependency updates.

## Interface checks

- ESLint and TypeScript pass.
- Vitest: 39 tests pass across 8 files.
- Content validator: existing 400 unique cues across 11 locales.
- Final Hermes exports succeed on iOS (1417 modules) and Android (1562 modules).
- Preference tests cover migration, dark-theme persistence and malformed saved data.
- Reminder tests verify exactly one gratitude line and stable cross-locale identities for 366 dates, plus position rotation.
- These are code/bundling checks, NOT manual device or visual interaction QA. No signed IPA/AAB or store submission.
- New support/context copy is an editorial starter bank. No claim of three-month nonrepeating full-format coverage or native-language approval.
- THEA external website action remains absent until a real HTTPS URL is supplied.

## Historical baseline checks (19 October 2026)


- TypeScript check passed.
- Vitest: 33 tests passed across 6 files.
- Content validator: 400 IDs across all 11 source locale files.
- ESLint: no errors; final import formatting cleanup applied.
- Expo Metro export succeeded for both iOS and Android: 1294 and 1439 modules respectively. This verifies bundling, not signing, device behavior, or store approval.
- Release check intentionally fails until publisher/support/legal URLs, SDK keys, language review, device QA and store purchase checks are completed.
- Carousel PNGs rendered at 1080×1350; sampled visual inspection found missing Hindi/Chinese glyphs in the English language-list slide. Replaced those labels with their English names and regenerated.
- Browser-based preview QA could not run: Chromium download returned invalid/truncated archives. The HTML preview is supplied for owner review; no claim of browser layout validation is made.
- No native simulator/device tests, signed IPA/AAB, App Store Connect submission, Google Play submission, or paid advertising performed.

See DEVICE_QA.md for the remaining native checks. New translations, especially Baba Malay, require native-language editorial review before release.
# Accelerated preview — 2026-11-03

Source implementation adds a preview-only 30-day/5-minute trial, isolated local state, native scheduling and validated notification navigation.

- GitHub Actions [run 41676014811](https://github.com/Pryshvitsyn/tune-into-her/actions/runs/41676014811) passes on source commit `6efcd50a9fb1b007c5f072051a63634f6a42bc1e`.
- Clean dependency installation, content validation (484 bundles, eleven locales), ESLint and TypeScript pass.
- Vitest: **65 tests across 13 files pass**, including demo timing, catalog isolation, scheduler rollback/cleanup and notification navigation.
- Expo Doctor: **21/21 checks pass**. This is project health verification, not a signed native build.
- Read-only review confirmed the two notification-flow fixes: revisiting demo screens refreshes persisted state, and transient storage failures preserve a validated notification target for retry.
- Local offline dependency installation was unavailable because the npm cache was incomplete; the full-suite evidence above comes from GitHub Actions.
- Signed IPA, actual iPhone notification delivery/tap behavior, visual/device QA and the full 150-minute device run remain unverified. No native build, installation link, store submission or paid operation is claimed.

# Release preparation — 8 November 2026

- Base: PR #5 source `c4cfb79f77e64145929fa9c97efa6194af4554d5`; working branch `release/prepare-20261108`.
- Re-ran baseline before edits: 73 tests, lint, TypeScript, generated-content consistency and catalog validation pass.
- After the morning-rollover change: lint, TypeScript and **81 tests in 15 files** pass with `TZ=Europe/Rome`. Regressions cover 07:59/08:00, year/leap-day boundaries, calendar dates around Rome DST changes, first-day entry before 08:00 and preservation of existing reminder preferences.
- `content:check` and `content:validate` pass: 610 bundles in each of 11 locales, 318 source texts per locale and 90-day fresh-history component reserve.
- All **3,498** phrase texts match the 11 source tabs of the 7 November Google Sheet in order. Per-file hashes and scope are recorded in [content-source-check.json](content-source-check.json). The rules sheet and editorial review status are not runtime proof or native-language approval.
- Offline Expo exports for iOS and Android pass. Existing installed dependencies were reused from the same PR #5 source; this was not a fresh dependency installation or a signed native build.
- `release:check` intentionally fails for missing verified publisher/support/legal URLs, RevenueCat keys and nine readiness-evidence items. These items were not marked complete.
- No Apple/Google account registration, payment, signed IPA/AAB, device QA, store submission or advertising purchase was performed. Google account-type eligibility remains an external prerequisite because of health/cycle-data functionality.

