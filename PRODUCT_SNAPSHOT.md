# PRODUCT SNAPSHOT
Updated: 2026-11-05
## CURRENT STATE
Native Expo iOS/Android baseline a09ba11 has dual themes, THEA/app emblems, calendar, cycle editing, appearance and About THEA. No signed store build or device QA. New daily content is local and offline.
## LATEST DELTA
Accelerated preview is implemented in source: first-launch demo route, one Start action, 30 sample days at five-minute intervals, persistent elapsed-time clock and 29 native local notifications. The existing three-part catalog and gratitude rotation are reused in eleven languages. Trial state/history is separate from personal cycle data, daily reminder schedules and purchase access. Preview/development enable the route; production forces it off. GitHub Actions run 41676014811 on 6efcd50 passes content validation, lint, type-check, all 65 tests and 21/21 Expo Doctor checks. Native iPhone installation/delivery proof remains open.
Content version 4 appends a ninety-slot component reserve in all eleven locales: 90 general actions, 90 support prompts, 90 context principles and 12 actions per phase (318 authored texts per locale). The catalog has 610 distinct bundles; all 484 v3 metadata records and translations remain unchanged. Selection prefers fresh components across 89 prior selections, with deterministic fallback for depleted or legacy histories.
## WORKING
Combined content/preview checks pass: 73 tests, lint, TypeScript, source consistency and 21/21 Expo Doctor checks after six SDK patch updates. The actual 30-day demo builder now has all-locale constituent uniqueness and gratitude regression coverage.
New tests check individual DO/SUPPORT/KEEP IN MIND text in all eleven locales over 90 days for 180 onboarding and six edge settings, varied starts, held phases and daily phase switching. Gratitude remains exactly one separate daily habit. Source/output drift is checked in CI. See docs/CONTENT.md for the fresh-history scope and release/VALIDATION.md for check evidence.
## BROKEN / MISSING
Native review remains pending separately for all eleven locales in release/content-review.json; Baba Malay needs community review. Exact-text uniqueness does not certify semantic independence or native quality. Device purchase/notification/visual QA remains incomplete.
## BLOCKERS
Signed iPhone preview/device registration and native verification remain required. The dedicated accelerated preview no longer depends on a purchase entitlement; ordinary paid access still needs proper RevenueCat/store configuration. Publisher/legal/support details and release evidence remain missing. THEA URL unknown.
## NEXT BEST MOVE
Build/sign the standalone preview and verify Start, the five-minute locked-phone reminder, tap navigation, Stop and the full 150-minute run on iPhone. Native-language review continues separately.
## PARALLEL
Editorial review, legal/store preparation and device-build preparation.
## REFERENCES
Accelerated preview: feat/accelerated-preview-20261103, draft PR #5, based on content PR #4 / feat/three-month-content-20261102. Earlier native-interface PR #3 and bootstrap PR #2 remain in the stack. docs/CONTENT.md defines reserve scope and proof; docs/UX.md governs visuals; docs/ACCELERATED_PREVIEW.md defines trial behavior and device checks. No native build/update/submission was published in this task.
