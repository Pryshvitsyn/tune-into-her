# Validation — 5 November 2026

## Component-level content reserve (PR #4)
- Source expanded from 88 to 318 texts in each of eleven locales: 90 general actions, 90 support prompts, 90 context principles, 12 actions per phase. 610 visible bundles including all 484 unchanged v3 entries.
- Measured original default 28/5 scenario over 90 days starting 2026-02-13: 33 DO, 24 SUPPORT, 24 KEEP IN MIND texts. New fresh-history tests yield 90/90/90 in all eleven locales.
- `npm ci --ignore-scripts --no-audit --no-fund`, `npm run content:check`, `npm run content:validate`, ESLint and TypeScript pass. **50 tests across 10 files pass.**
- New tests cover 180 onboarding plus six accepted edge cycle settings, held phases, daily phase changes, multiple starting dates, leap day, local-date DST boundaries, exactly one gratitude reminder, legacy digest identity and persisted version-3 selections.
- Offline iOS and Android Hermes exports pass (1,419 / 1,565 modules). This verifies bundling only; no signed native build or device test.
- Native-language and Baba Malay community reviews remain pending in release/content-review.json and readiness.json. Scope and exhaustion/legacy-history limits are in docs/CONTENT.md.

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
