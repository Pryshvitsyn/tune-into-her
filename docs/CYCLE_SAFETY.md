# Cycle estimate safety boundary

Updated: 2026-11-11
Product position: relationship guidance based on user-entered timing, not a medical,
fertility, contraception, pregnancy-planning, diagnostic, or mood-prediction tool.

## Implemented contract

The cycle engine works with date-only local calendar calculations. It distinguishes the
shown presentation stage from the physiological estimate: a menstrual presentation
stage maps to `follicular` for the latter. It does **not** claim that a particular day
proves ovulation or a person's feelings.

`MAX_UNCONFIRMED_CYCLE_DAYS` is 40. When the elapsed time from the known start reaches
that boundary, the engine:

- does not modulo-wrap into a fabricated new day 1;
- keeps the known start visible to the calculation instead of inventing a replacement;
- exposes `requiresPeriodConfirmation`;
- prevents a projected new-cycle boundary;
- uses only all-phase advice rather than phase-specific guidance; and
- asks the user to update the cycle instead of continuing a confident phase label.

`CycleCalendar` also suppresses phase/period highlighting while confirmation is due.
The tests cover this boundary and local-time notification behavior across both spring
and fall daylight-saving transitions.

## What this does not establish

- The default 28-day cycle / 5-day bleed settings are not a verified individual record.
- The data model does not yet retain explicit provenance that a user confirmed a new
  bleeding event, distinct from entering or retaining a date.
- There is not yet a dedicated confirmation flow that asks the user to distinguish a
  real period start from a projected date.
- Cycle labels and supportive wording remain estimate language and need clinical/editorial
  review; no result is a prediction of comfort, energy, consent, or emotional state.
- The safety cutoff is a product guardrail, not a clinical recommendation or diagnosis.

## Notification/privacy boundary

Notifications are local, scheduled in local time, and their content is neutral. The
app has no application server, analytics, ads, or account system for cycle data. Store
and RevenueCat transaction handling is separate from local cycle settings, but store
privacy declarations still require owner/legal verification.

## Review sources

The following public-health sources inform the language and review boundary; they are
not copied into the app and should be rechecked by a qualified reviewer before any
clinical claim:

- [NHS — Fertility in the menstrual cycle](https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/)
- [ACOG — Your First Period](https://www.acog.org/womens-health/faqs/your-first-period)
- [ACOG — Trying to Get Pregnant? Here's When to Have Sex](https://www.acog.org/womens-health/experts-and-stories/the-latest/trying-to-get-pregnant-heres-when-to-have-sex)
- [Worcestershire Acute Hospitals NHS Trust — You and your fertility journey](https://www.worcsacute.nhs.uk/leaflets/you-and-your-fertility-journey/)
- [Ashford and St Peter's Hospitals NHS Foundation Trust — Follicle tracking scans](https://ashfordstpeters.nhs.uk/leaflets/3694-gynaecology-leaflet-follicle-tracking-scans)

## Required follow-up before a safety/readiness claim

1. Define and implement an explicit user-confirmed event/provenance model.
2. Obtain clinical/editorial review of phase wording and every localized health-adjacent
   statement.
3. Test date changes, travel/time-zone changes, skipped periods, and both DST directions
   on physical devices.
4. Recheck the product disclaimer and store health-data declarations with legal/privacy
   owners.
