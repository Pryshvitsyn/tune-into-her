# Daily content reserve
Updated: 2026-11-05

## Source and language coverage
Eleven locales: en, fr, it, es, de, ru, uk, hi, zh-Hans, ms and mbf (Baba/Peranakan Malay).
`content/editorial/<locale>.json` is the sole authored source. Every locale now has **90 actions, 90 support prompts, 90 context principles and 12 additional actions for each of four phases**: 318 source texts per locale, 3,498 across eleven locales. This replaces the former 88-text bank by appending 230 texts per locale; original positions and meanings remain stable translation identities.

The added copy covers concrete household work, preparing outings, travel, budgets, work/study, friends and visitors, privacy, access needs and personal time. Shared themes such as listening or household responsibility remain; these are not 318 unrelated psychological principles. Native reviewers still need to assess semantic overlap and naturalness as well as translation fidelity.

`npm run content:generate` creates `content/catalog.json` and `content/locales/*.json` for offline runtime use. `npm run content:check` fails on stale generated output and runs in CI. Never edit generated files directly. DO is `cue`, SUPPORT is `support`, and KEEP IN MIND is `context`.

## What changed after the repetition audit
At original PR #4 head `856f057476908f3f3f711ac02ea9a3ac156469cd`, a fresh 28/5 cycle starting 2026-02-13 produced the following English counts. The other locales shared its semantic selection IDs.

| Unique blocks over the first 90 days | Original | Expanded reserve, all 11 locales |
| --- | ---: | ---: |
| DO | 33 | 90 |
| SUPPORT | 24 | 90 |
| KEEP IN MIND | 24 | 90 |

The original 484 combinations remain unchanged for persisted histories. The generator appends 126 v4 entries: 78 general-purpose bundles eligible in all phases, plus 12 phase-specific bundles per phase. Each phase therefore has a **90-slot v4 reserve**. Support/context identities form the same one-to-one slot mapping across phases, preventing a phase switch from consuming a different pair of components for the same slot. Phase-specific actions ask about her actual needs; the calendar never asserts symptoms, energy, mood, consent or fertility.

| Estimated phase | v4 reserve slots | Total eligible including legacy entries |
| --- | ---: | ---: |
| Menstrual | 90 | 190 |
| Follicular | 90 | 194 |
| Mid-cycle | 90 | 190 |
| Luteal | 90 | 270 |

The complete catalog has 610 distinct visible three-part bundles per locale. Multi-phase general entries are stored once. Their `learnMoreId` retains a valid reference for schema compatibility; the daily screen uses the estimated current phase for its phase information.

## Selection contract and limits
For a fresh history, the first 90 daily selections do not repeat any individual DO, SUPPORT or KEEP IN MIND block. Selection prefers unused v4 entries and checks component identities against the previous 89 selections across phases. Locale and appearance never influence the chosen ID. Gratitude remains a separate, intentionally repeated daily reminder; tests require exactly one gratitude reminder per day, rather than exempting text merely because it mentions appreciation.

All 484 v3 metadata records and their eleven translations are preserved exactly in value. Same-day stored selections survive the version-4 upgrade, including old IDs. Unknown historical IDs remain safe. No store interface, storage key or screen contract changes. This preserves PR #5's accelerated-preview integration, which calls the same selector with a separate history.

**Bounded guarantee:** this is a fresh-history first-90-days reserve, not an unlimited nonrepetition promise. After the reserve is consumed, or with pre-existing v3 history containing different component pairings, selection uses a deterministic least-recent fallback when no fully fresh candidate exists. History is never erased to manufacture a clean result. Sparse or backdated selection histories are not a guarantee of 90 newly unseen blocks. Content remains local and offline.

## Automated proof
`tests/contentComponents.test.ts` checks actual localized text, normalizing Unicode, punctuation, case and whitespace so cosmetic edits cannot disguise a repeat. It also checks component IDs and ninety distinct eligible texts per block/phase/locale.

Ninety-day scenarios cover all 180 onboarding cycle/period settings, six wider accepted settings, multiple starting dates/phases, month boundaries, leap day and local-date DST boundaries, each phase held constant, and a phase changed every day. Existing full-bundle, same-day persistence, year-of-default-cycle-ID, cycle engine and 366-day gratitude regressions remain. A committed digest fixture from the original PR #4 head detects changes to every legacy record and translation. Generator/source consistency runs independently in CI.

## Outstanding translation review
[release/content-review.json](../release/content-review.json) lists **every locale separately** as `needs-native-review`, with no claimed reviewer or review date. English editorial review and native review of French, Italian, Spanish, German, Russian, Ukrainian, Hindi, Simplified Chinese, Malay and Baba Malay remain pending. Baba Malay additionally needs community review of its provisional colloquial register, regional vocabulary and forms of address. Automated uniqueness does not establish linguistic quality or certify ideas as semantically unrelated.

`release/readiness.json` keeps native-language and Baba Malay community approval gates false. No clinical review, real-device QA or store approval is claimed.

## Repeatable checks
- `npm run content:check` and `npm run content:validate`.
- `npm test`, `npm run lint` and `npm run typecheck`.
- `EXPO_OFFLINE=1 npx expo export --platform ios --platform android` checks runtime bundling without signing or publication.
