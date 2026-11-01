# Validation — 1 November 2026

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
