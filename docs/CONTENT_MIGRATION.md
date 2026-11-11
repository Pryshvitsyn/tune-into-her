# Content migration and compatibility contract

Updated: 2026-11-11

## Purpose

The release candidate consolidates the selected PR #6 base with the approved V4 visual
artifacts. It is not a bulk replacement of the previously persisted advice catalog.

## Authoring and generation path

```text
content/editorial/<locale>.json
        ↓  npm run content:generate
generated catalog / localized runtime entries
        ↓
history-aware daily selector
        ↓
Today + onboarding advice blocks
```

`content/editorial/<locale>.json` remains the authored source. The generated catalog
must not be hand-edited to absorb a reviewer comment. See [CONTENT_AUDIT](CONTENT_AUDIT.md)
for the pending feedback ledger.

## Persisted selection compatibility

- `DailySelection` persists the date, cue identity, history, and `contentVersion`.
- The selection service returns an existing same-date selection rather than replacing it
  merely because a content version or generator changes.
- Future selections may use new reserve entries, but prior selected IDs must remain
  resolvable.
- History is not deleted to force new text. When a pool is depleted, selection uses a
  deterministic least-recent fallback.

This design separates a content migration from rewriting a user's previously shown
guidance. Any future source change requires a compatibility test against prior stored
selection records.

## What was and was not transplanted

| Item | Candidate treatment |
| --- | --- |
| Approved V4 renderer, texture, phase-zero poster | Imported as immutable visual artifacts; hashes are recorded in [MASTER_AUDIT](MASTER_AUDIT.md). |
| Legacy active `PhaseSphere` path | Removed from the release-candidate render path; recoverable in the local V4 archive. |
| Current PR #6 editorial source and generated catalog | Retained as the content baseline. |
| Founder sheet comments | Recorded as editorial drafts only; not copied into the catalog or translations. |
| Billing / trial term | Not migrated or rewritten. Current source remains monthly; owner decision is required before store configuration. |

## Safe future editorial update sequence

1. Approve a source-language change and assign an editor/reviewer.
2. Update only the authored source and its reviewed translations.
3. Generate the catalog through the existing script.
4. Run content validation and the full test suite.
5. Verify old records still render and an existing same-date choice remains stable.
6. Record new `contentVersion` semantics only if the runtime actually changes them.

No migration in this candidate is authority to erase advice history, cycle data,
purchase data, or local feedback.
