# Privacy notice draft — owner and legal review required

Updated: 2026-11-13. **Owner/legal entity:** REPLACE_WITH_OWNER_LEGAL_NAME
**Privacy contact:** REPLACE_WITH_PRIVACY_CONTACT
**Effective date:** REPLACE_WITH_EFFECTIVE_DATE

Tune Into Her is a local-first informational support tool. Cycle dates and lengths,
guidance history and feedback remain on the device. Personal relationship details are not sent to billing services.
The app does not send these fields to its owner, the trial backend, RevenueCat or Stripe.
There is no mandatory app account, advertising SDK, behavioral analytics, location or
contact collection, or cloud cycle synchronization. It does use an isolated billing/trial
backend; the earlier claim of no backend is superseded.

## Trial service

A random pseudonymous guest identifier and a separate unpredictable authentication
credential are kept in device SecureStore. Only trial/billing identity and access-related
requests are sent to the isolated service. It stores the credential's verifier, environment,
server-controlled start/end dates and operational access records needed to prevent another
trial on the same known identity. Trial service hosting may process network/security
metadata under its hosting configuration. Do not include cycle fields in request bodies,
logs or support exports.

Clearing cycle/preferences/history in the app does not erase the billing identity or
restart the trial. SecureStore persistence after app removal varies by OS; deleting all
data or changing devices can create an unrelated guest identity. Retention duration,
privacy-request verification/deletion process, hosting region, processor agreement and
security-log policy must be finalized by the owner before deployment. Do not promise
server deletion through the current local-data action. A minimal retained trial marker
may be necessary to enforce the disclosed trial policy, subject to the final legal basis.

## Purchases and recovery

Apple/Google process native purchases under their own terms. RevenueCat receives an
anonymous app user identifier and purchase/transaction, entitlement, source, expiration
and related technical data to verify access. The trial credential is not sent to RevenueCat.
The app does not attach cycle dates, phase, symptoms, history, woman/partner name or
relationship description to purchase requests.

For optional hosted web checkout, RevenueCat Billing manages the subscription and Stripe
processes payment. They may process email, billing address, payment information, receipts,
tax and technical payment data entered in checkout. No mandatory app registration is
introduced. Official RevenueCat Redemption Links confirm purchase ownership; their tokens
are credentials and must not appear in logs or analytics. RevenueCat Customer Portal and
purchase emails support web subscription management. Unrelated anonymous device/store
identities are not automatically linked.

The isolated backend can receive authenticated RevenueCat webhook events. It stores a
minimal environment/event identifier/type/app/time record for reliable delivery and
idempotency, excluding health/cycle fields and raw payment/card data. Paid client access
is verified through RevenueCat, not trusted from an arbitrary webhook/success URL. Stripe
secrets, store credentials and webhook authorization values are server-only.

## Local storage and notifications

Cycle settings and billing/trial credentials use secure storage where supported. Device
preferences and guidance/feedback history use application storage. Verified access cache
is bounded by expiry and clock checks; no unlimited premium flag is used. Local data
removal does not cancel a paid subscription or erase store/provider purchase records.
Use Apple/Google management or the RevenueCat web portal to cancel; restore/recovery is
available through supported purchase-ownership flows.

The normal daily reminder uses generic localized text; it does not include the cycle
phase or advice content. It is scheduled on the device; no push server or cycle-data
upload is added. Disable reminders in
app/system settings. Device removal/backup behavior depends on the OS and platform rules.

## Before public use

The owner must supply seller/contact/URLs and determine retention, lawful bases, rights
and deletion handling, international transfers/processor terms, age/children positioning,
health-related disclosures and final store declarations. The draft does not certify
compliance. App Privacy/Data Safety must describe actual identifier/purchase processing,
local health-related functionality and providers accurately; a close-person audience
does not make cycle context unrelated to health. See the canonical external checklist
in [STORE_SETUP](STORE_SETUP.md).
