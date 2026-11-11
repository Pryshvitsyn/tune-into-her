# Store-readiness checklist — owner actions and proof

Updated: 2026-11-11
Status: **not store-ready**. This checklist distinguishes implemented code from external
approval, signing, and store facts.

| Area | Candidate state | Required owner / verifier action | Gate |
| --- | --- | --- | --- |
| iOS identifier | `com.eliogenesis.tuneintoher` in Expo/iOS | Confirm this is the intended App Store identifier and provision it. | BLOCKED |
| Android identifier | `com.pryshvitsyn.tuneintoher` in Expo | Decide whether the intentional platform mismatch is acceptable or align it before store setup. | BLOCKED |
| Signing | Team/project files present | Use authorized Apple credentials, profile, device or TestFlight route; record successful signed build. | BLOCKED |
| Google account | No verified release account evidence | Confirm current Play policy/account-type eligibility for cycle-related product features. | BLOCKED |
| Subscription term | Runtime/docs currently select `monthly_access` / P1M | Founder must decide the canonical term and eligible trial duration before configuring stores/RevenueCat. Do not infer annual/14-day/30-day from past drafts. | BLOCKED |
| RevenueCat | Mock development mode and abstraction exist | Configure public platform SDK keys, `full_access` entitlement, verified packages/offering, then sandbox-test purchase/restore/cancel. | BLOCKED |
| Legal/support | Placeholder/blank support and legal identifiers remain | Supply monitored support address, terms URL/text, privacy URL/text, seller identity, and review localized legal copy. | BLOCKED |
| Privacy declarations | Local-first design/manifest exist | Complete Apple/Google data-safety/privacy submissions with owner/legal review; do not infer completeness from a manifest. | BLOCKED |
| Cycle safety | 40-day confirmation guard implemented | Add confirmed-event provenance and obtain clinical/editorial/localization review. | BLOCKED |
| Content | 11 locales / 610 bundles structurally generated | Obtain native editorial sign-off for all 11 locales; `mbf` needs community review. | BLOCKED |
| Visual QA | Standard Release app launched to onboarding on iPhone 17; QA-only Debug mock flow reached unlocked Today. V4 moved continuously for 12+ seconds; light/dark appearance, three blocks, gratitude, feedback, and scrolling were observed. | Record compact/large-text, all-locale, and physical-device visual checks. This Simulator result is not store evidence. | BLOCKED |
| Notifications | Local scheduling code/tests exist | Test permissions, delivery, DST/time-zone behavior, locked-device tap routing on real iOS and Android. | BLOCKED |
| Release evidence | Documentation and check scripts exist | Run and retain final check logs; update `release/readiness.json` only with real evidence. | BLOCKED |

## Minimum handoff sequence

1. Finish current candidate checks and, when authorized, commit a reviewed local checkpoint.
2. Resolve product/billing, identifier, legal, and account decisions with the owner.
3. Configure stores and RevenueCat through the authorized accounts; do not place secrets
   in the repository.
4. Build signed test binaries and perform device QA.
5. Obtain editorial/clinical/legal approvals and update evidence files with dates and
   accountable reviewers.
6. Only then run the formal release check and decide whether to propose a PR/build.

Neither this checklist nor a passing simulator build authorizes a merge, deployment,
store submission, or production purchase configuration.
