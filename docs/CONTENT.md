# Daily content reserve
Updated: 2026-11-02

## Scope and source
Eleven locales: en, fr, it, es, de, ru, uk, hi, zh-Hans, ms, mbf (Baba/Peranakan Malay).
`content/editorial/<locale>.json` is the sole authored source: 24 practical actions, four additional actions for each of four phases, 24 support prompts and 24 context/boundary principles. That is 88 editorial sentences per locale, 968 across eleven locales. Aligned array positions are stable semantic identities; append rather than reorder them when extending the bank.

`npm run content:generate` reproducibly creates `content/catalog.json` and `content/locales/*.json`. Generated files are checked in for offline runtime use; do not edit them directly. Each entry contains DO (`cue`), SUPPORT (`support`) and KEEP IN MIND (`context`). Both onboarding and the daily screen render these fields. Fixed support/context interface placeholders were removed.

## Actual capacity

| Estimated phase | Eligible three-part bundles per locale |
| --- | ---: |
| Menstrual | 100 |
| Follicular | 104 |
| Mid-cycle | 100 |
| Luteal | 180 |
| Total | 484 |

All 484 visible three-part combinations are distinct within each locale, including across phases: 5,324 localized bundles. This is a reserve of combinations, **not 484 independent actions or expert principles**. Individual actions and ideas recur. The supported claim is at least 90 days without repeating a complete three-part bundle; it is not 90 days without ever reusing an individual sentence. The seven-day component-history preference reduces those repetitions. Gratitude reminders are an intentional recurring daily habit and remain separate from reserve uniqueness.

## Behavioral proof
`tests/contentReserve.test.ts` verifies phase eligibility, nonempty full-format localization, actual visible uniqueness, same-day persistence, old-ID compatibility, unknown historical IDs and 90-day selection sequences. Scenarios cover all 180 onboarding cycle/period configurations, six wider accepted edge configurations and holding any one phase for all 90 days. Stable selection is independent of locale and theme; translations share semantic IDs. Default-cycle and held-phase sequences also verify that each of the three individual sections changes from the previous day. Existing tests check a year of default-cycle IDs and exactly one gratitude reminder across 366 dates in all eleven locales.

A prior user with existing history continues from unused records; this does not promise another fresh 90 days after most of a phase's pool has already been consumed. After exhaustion, records can recur. No selection history or cycle data is sent to a server.

## Editorial boundaries and outstanding review
Practical help is offered, not imposed. Symptom-dependent copy includes a normal-task alternative. Estimated timing never establishes mood, energy, consent or fertility. Period supplies follow her stated preferences; appreciation names observed effort or qualities. Ordinary wellbeing is valid in every phase.

All eleven translations are authored and structurally validated. No native-speaker, community or clinical review has been completed here. In particular, Baba Malay uses a provisional colloquial register; regional word choice and appropriateness of address require community review. `release/readiness.json` keeps those approval gates false. Structural coverage and successful bundling are not language approval, device QA or a signed store build.

## Repeatable checks
- `npm run content:generate` then `npm run content:validate`.
- `npm test` (including reserve, daily reminder and existing regressions).
- `npm run lint` and `npm run typecheck`.
- `EXPO_OFFLINE=1 npx expo export --platform ios --platform android` for runtime bundling, without signing or publication.
