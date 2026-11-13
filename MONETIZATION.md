# Monetization contract

Approved by the owner's 2026-11-13 request. This replaces prior undecided source/docs
billing terms for new configuration; existing store agreements require migration review.

## Product/access policy

Free download. Explicitly start **14 × 24 hours** of full application access after
onboarding, when the first Today can be shown. No card, mandatory account, store offer or
subscription is created by starting it. No automatic charge follows expiry. Monthly and
annual purchases are voluntary and grant the same `full_access`; eurozone base targets
are €3.99/month and €24.99/year, charged annually in full. Display actual provider localized
prices/currency and disclose immediate payment before an early purchase. Paid subscriptions
renew according to their platform until cancelled. Do not promise delayed billing or
another free store trial. No fake discount or urgency is used.

The access rule is `activePaidEntitlement OR activeAppTrial`. Paid source/expiration/
verification and app-trial dates/verification are separate states. Cancelling renewal
preserves access to the confirmed paid-through date; an expired/revoked entitlement does
not. Grace/retry access follows the provider's active entitlement, not a guessed event.
User data is preserved after expiry; privacy, settings, restore and management remain available.

## Native and web boundaries

Use only `react-native-purchases`, pinned in the root lockfile; iOS StoreKit and Google Play
Billing are normalized by RevenueCat. Preserve its existing anonymous app user identity:
the trial credential is not a RevenueCat App User ID, login credential, purchase receipt
or proof of purchase. Before purchase refresh known paid access; an active subscriber
uses management/plan change rather than another purchase. This cannot detect purchases
on unrelated anonymous identities in other stores. Restore is a deliberate user action.

New web channel: **RevenueCat Billing**, Stripe as processor, hosted Web Purchase Links,
RevenueCat Customer Portal. RC owns products and subscription lifecycle in this engine
([architecture](https://www.revenuecat.com/docs/web/web-billing/configuring-overview)).
No parallel Stripe Billing subscription, customer portal or Stripe lifecycle webhook is
created. No live Stripe catalog was accessible for audit; if the owner discovers existing
Stripe Billing subscribers, preserve that engine and review the integration/migration
before creating RC Billing subscriptions.

Web Purchase Links can handle anonymous checkout, then the official Redemption Link
proves ownership through the SDK ([hosted flow](https://www.revenuecat.com/docs/web/web-billing/web-purchase-links)).
Copy the actual generated `rc-…` scheme from RevenueCat into the build configuration;
`tuneintoher` is the app's existing navigation scheme, not an invented RC redemption scheme.
Cold/warm links never grant access from a success query alone. Tokens must not be logged,
analysed or forwarded. Only confirmed `full_access` unlocks access. Recovery across unrelated
mobile identities requires the supported redemption/recovery flow; automatic portability
is not promised. For a web subscription, management opens the SDK's web management URL
or requires the original purchase email's RC portal link; it never falls back to a store.

The RC portal provides cancellation, payment information and receipts via its lifecycle
emails ([portal](https://www.revenuecat.com/docs/web/web-billing/customer-portal)).
Monthly↔annual changes use Apple subscription-group management, an explicit in-app Google Play base-plan change for a confirmed same-store subscriber, or the RC portal. Same Google subscription changes follow Play Console replacement policy; cross-product changes use deferred replacement to prevent a second independent subscription. The UI never promises immediate activation or delayed payment without the store confirmation sheet. Both directions still need real sandbox tests and Google server notifications.

## Trial identity/cache/server

An isolated trial service uses random SecureStore identity and a separate high-entropy
credential. The server timestamps the first start once in UTC, ignores client dates,
and returns the existing interval on repeats. It receives no cycle data, partner details,
notes or content history. Local data reset/onboarding does not create another trial on
that known identity. No fingerprinting or mandatory account is introduced. Removing all
credentials or using another device can create a new guest identity: absolute protection
against repeat trials is not promised.

The client stores a bounded previously confirmed grant and checks time rollback. It
cannot extend known expiry or retain an unlimited premium boolean. Network failure is
separate from confirmed expiration; existing verified paid access can remain available
within its bounded cache (maximum 24 hours, clamped to the known term). Trial cache is likewise at most 24 hours and cannot exceed trial expiry. See actual policy/constants and managed-clock tests under
`src/services/trial/`, `src/services/purchases/` and `tests/`. Revalidate on foreground,
after purchase/restore/redemption and SDK CustomerInfo updates.

The Worker/D1 backend and its [README](backend/README.md) define persistent trial and
webhook configuration. Sandbox and production use separate storage/secrets/URLs and
matching environment. Webhooks are a durable authenticated event inbox, not a second
client entitlement authority: current CustomerInfo remains the paid authority. A delayed
notification cannot blindly overwrite access. RevenueCat Authorization protocol is
separate from Stripe's signed-body/timestamp protocol; this RC Billing path adds no
custom Stripe webhook.

## Web availability/localization/tax

RevenueCat Billing currently excludes buyers based in India. Keep an appropriate native
store path; Hindi UI does not prove supported web sales territory
([current limitation](https://www.revenuecat.com/docs/web/web-billing/configuring-overview)).
Native billing strings target project locale IDs `en`, `it`, `fr`, `es`, `de`, `ru`, `uk`,
`hi`, `zh-Hans`, `ms`, `mbf`; native-language/community review remains external.

Hosted Web Purchase Links do not currently accept an explicitly selected language;
Web SDK localization is a different capability. The SDK list includes the ten other
project languages (Simplified Chinese uses `zh_Hans` there), but not Peranakan Malay
`mbf`. Product names/descriptions are not localized by RC; receipt PDFs are English.
Do not advertise hosted checkout as verified in all eleven languages
([localization](https://www.revenuecat.com/docs/web/web-billing/localization)).

The seller must verify legal identity, tax duties, regions, invoice footer, receipt,
renewal/cancellation and final amount/currency. RevenueCat/Stripe is not automatically
a merchant of record. Configure one supported tax provider in test first; enabling
Stripe Tax may add fees and has not been authorized/executed by this code change.
RC's documented behavior uses tax-inclusive prices outside US/Canada and tax-exclusive
prices there; verify actual checkout and invoice before launch
([tax configuration](https://www.revenuecat.com/docs/web/web-billing/tax)).

## Configuration and proof

Actual external IDs/keys/links remain unconfirmed. [STORE_SETUP](STORE_SETUP.md) holds
the single product table and owner action checklist. [BILLING_QA](BILLING_QA.md) separates
local checks from blocked real transactions. A passing unit test/export does not certify
store readiness. Deployment, store upload/submission and production billing remain
separate authorized actions.
