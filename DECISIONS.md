# DECISIONS
## D-006 — Release owner and start
Date: 2026-11-08 (Sunday, Europe/Rome)
Status: APPROVED
Decision: The founder is the publisher and account holder. Enroll Apple as Individual. Google account ownership remains with the founder; resolve Personal versus Organization eligibility before registration/payment because the app uses menstrual-cycle data and Google's current account rules require Organization for health apps. Do not equate a personally owned account with the Personal account type. Use the exact legal Latin name from the identity document/account verification; speech transcription is not a verified legal spelling. THEA remains the product's parent brand, not a separate legal seller.
Reason: Explicit Founder instruction to start release preparation using the existing content and register both stores in his own name.
Open external requirements: verified legal spelling, account activation/status, support contact, legal URLs, store payment configuration and device QA. Today's instruction authorizes preparation; it does not prove any of these completed.

## D-001 — Parent identity
Date: 2026-10-28
Status: APPROVED
Decision: THEA — Thoughtful Hearts Empower All. Secret Bronze is an error, not a brand. THIA/TAKKA not current names. Brand does not establish legal corporate ownership.
Reason: Explicit Founder correction and acronym selection 4.
Reopen only if: Founder changes identity.
## D-002 — Visual identity
Date: 2026-10-28
Status: APPROVED
Decision: Small discreet THEA emblem top left; app open arcs top right; no header wordmark/settings gear. White/neutral-gray and black/graphite themes, no green background cast. Geometry/interactions in docs/UX.md.
Reason: Approved visual corrections.
Reopen only if: Founder approves or accessibility verification requires scale adjustment.
## D-003 — Daily content
Date: 2026-10-26
Status: APPROVED
Decision: Three concrete actions, three rotating reminder lines with exactly one gratitude; minimum three-month reserve; concepts may recur with varied wording. No deterministic mood claims.
Reason: Repeated explicit corrections.
Reopen only if: Founder changes format.
## D-004 — Language scope
Date: 2026-10-28
Status: APPROVED
Decision: Eleven locales, English reference mockups; native review required.
Reason: Approved release scope.
Reopen only if: Founder changes scope.
## D-005 — Installed accelerated preview
Date: 2026-11-03
Status: APPROVED
Decision: Install one preview app and start a clearly labelled accelerated trial inside it. A sample 30-day sequence advances every five minutes; day 30 starts at 145 minutes and the trial completes at 150 minutes. The preview may open this route before onboarding and billing. Production entitlement and personal cycle/history stay separate.
Reason: Founder requested a simple installed app with an accelerated-mode label instead of manual daily steps.
Reopen only if: Founder changes the trial timing or installation experience.

## 2026-11-05 — Component-level ninety-day reserve
Append aligned editorial texts and new reserve IDs rather than rewrite persisted v3 advice. Reserve slots couple support/context identities across phases so fresh histories can select 90 distinct blocks per section; use the previous 89 selections instead of a seven-selection preference. Keep deterministic fallback for legacy/depleted histories. Gratitude is intentionally separate from uniqueness. Native approval remains pending per locale. See docs/CONTENT.md.

## D-007 — Approved V4 visual artifact integration
Date: 2026-11-11 (Europe/Rome)
Status: APPROVED

Decision: Use the preserved `TuneIntoHerSphereV4.tsx`, its clean texture, and its
phase-zero poster as immutable approved visual artifacts. Today and onboarding import
the renderer directly; resource preloading may occur outside it, but no shader, texture,
loop duration, phase algorithm, deformation, wrapper-driven opacity, or alternative
renderer may reinterpret the V4 motion.

Reason: The founder repeatedly required restoration and preservation of the canonical
V4 behavior. Hash assertions protect the exact supplied assets.

Reopen only if: the founder explicitly supplies a replacement renderer/artifact or an
actual platform defect requires a narrowly documented implementation fix.

## D-008 — Unconfirmed-cycle guard
Date: 2026-11-11 (Europe/Rome)
Status: APPROVED

Decision: After 40 elapsed days from the known cycle start, do not use modulo arithmetic
to present a projected new cycle as a factual day one. Require a cycle update and select
only all-phase content while confirmation is due. Presentation-stage menstruation maps
to the follicular physiological estimate rather than creating two competing systems.

Reason: The prior indefinite projection could create an unsupported apparent new-cycle
boundary. The guard is a product safety constraint, not medical validation.

Reopen only if: a reviewed, explicit user-confirmed event/provenance model replaces this
temporary boundary with a safer documented rule.
