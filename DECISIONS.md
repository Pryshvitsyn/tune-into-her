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

## 2026-11-13 — voluntary purchase after server app access
Status: APPROVED by the owner's attached monetization request; IMPLEMENTED in `codex/monetization-20261113`; external store/web verification remains BLOCKED as recorded in BILLING_QA.md.
Decision: free download; explicit14×24h full access after onboarding without card/account/store subscription, no automatic charge at expiry. Then voluntary monthly €3.99 or annual €24.99 eurozone base targets, equal `full_access`, with actual localized provider prices. This supersedes previous undecided/monthly-only and other trial-duration product drafts for new configuration. Existing live products/contracts are preserved pending external catalog/migration audit.
Decision: keep existing platform IDs and RC anonymous identity; separate random SecureStore guest credential for the isolated Worker/D1 trial backend. Access is paid OR app trial; cache is bounded and known expiry never extended. Guest mode cannot guarantee one trial across erased identities/devices.
Decision: prepare RevenueCat Billing + Stripe processor + hosted Web Purchase Links + RC Customer Portal. If an existing Stripe Billing catalog is discovered, preserve it and review the official integration before creating another engine. Native global purchases stay in platform stores; no external payment CTA enabled without verified program/storefront eligibility.
Proof: see [BILLING_QA](BILLING_QA.md), [product policy](MONETIZATION.md), [external setup](STORE_SETUP.md). No live catalog, charge, deployment or store submission was performed.


## D-009 — Global cold-launch Deep Intro V2
Date recorded: 2026-11-14 (Europe/Rome)
Status: APPROVED by the Founder's global app launch request; IMPLEMENTED in source;
final independent platform/runtime verification remains open in [LAUNCH_QA](docs/LAUNCH_QA.md).

Decision: Use the already approved Deep Intro V2 as the global genuine cold-launch
experience on iOS and Android. Preserve its six layers, original motion speed, nine-second
timeline, official logo geometry and V4 material. After the scene, show only the original
animated sphere for a further second, then fade to the correct existing onboarding,
normal-entry or locked destination when ready. Initialize in parallel and keep the sphere
moving if readiness takes longer. Do not reveal daily content or bypass access checks.

Decision: Bridge native startup with the existing Expo splash mechanism and a compatible
static first frame; do not claim WebGL before React Native starts. Play one global intro
per process, avoid a second Today intro and skip full motion for Reduced Motion users.
Respect screen-reader access, backgrounding and Android Back, with recoverable init errors.

Reason: Explicit Founder request to implement the approved launch experience for the
complete application, without redesign, submission or publication.

## D-010 — Silver Chrome onboarding and original typeface
Date recorded: 2026-11-14 (Europe/Rome)
Status: APPROVED by the attached onboarding V2 brief and explicit confirmation that both
onboarding and global-launch scopes apply; IMPLEMENTED in source; native accessibility,
locale/layout and final runtime checks remain open.

Decision: Apply the approved Silver Chrome onboarding/pre-purchase presentation and use
the actual original Linux Libertine O Regular font where its script coverage permits,
with system script fonts for Hindi and Simplified Chinese. Retain the existing eleven
locale IDs, original V4 renderer, daily content/translations, cycle calculations,
onboarding information and persistence, and RevenueCat/trial/subscription logic.

Decision: Present the language selector as one compact control with a confirmable local
draft and platform-appropriate modal selection. Typography/layout must accommodate text
scaling and accessible controls rather than clipping content.

Reason: The Founder requested the attached onboarding redesign alongside global startup;
this supersedes earlier visual drafts only within the approved presentation scope.
