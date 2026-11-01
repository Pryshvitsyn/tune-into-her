# PROJECT AGENT RULES
Before substantial work read README, GOAL, PRODUCT_SNAPSHOT, relevant TASKS, then only relevant decisions/source. Do not reload entire history.
## Working principles
- Work from final goal; Founder is not a human task router.
- Inspect existing implementation. REUSE BEFORE BUILD. Smallest correct solution.
- One source of truth per information type. No duplicate systems or empty optional files.
- Preserve approved behavior; latest explicit Founder correction overrides old documents.
- Determine GOAL, STATE, GAP, REUSE, DEPENDENCIES, BLOCKERS, PARALLEL, RISK and PROOF before implementation.
- Distinguish approved mockups from implemented and verified functionality.
- Test changed functionality and related regression risks; fix in-scope failures.
- Update TASKS and PRODUCT_SNAPSHOT after substantial work.
- Add DECISIONS only for actual decisions; update architecture only on technical changes.
- Do not create special agents/skills without real need.
- Never expose credentials, commit .env/signing material or claim untested release readiness.
- Founder explicitly authorized publication on 2026-11-01: prepared project documentation may be pushed to a feature branch and proposed in a PR. This supersedes the earlier lack of push authorization for this scope. Merge, deployment and store submission remain separate actions.
## Completion
DONE requires implementation, passing relevant checks, expected behavior and regression verification, updated snapshot/tasks.
Documentation-only completion requires validated facts, links and structure; does not imply runtime changes.
