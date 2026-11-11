# Store and RevenueCat setup checklist

These are external owner actions and are not completed by this repository. This file
distinguishes a **current source expectation** from an **externally confirmed store
record**. A value in code or this checklist is never proof that Apple, Google Play, or
RevenueCat has accepted, registered, or configured it.

## Identifiers to keep aligned

- Current source entitlement expectation: `full_access` (externally unconfirmed)
- Current source product route: monthly package / `monthly_access` / P1M (externally
  unconfirmed; it is not a founder-approved business term or a live store product)
- Current source offering expectation: default offering with a monthly package pointing
  to the confirmed product (externally unconfirmed)
- Configured iOS bundle ID: `com.eliogenesis.tuneintoher` (verify/create the intended
  Apple identifier; do not rely on an older document)
- Configured Android package: `com.pryshvitsyn.tuneintoher` (verify/create the intended
  Play identifier)
- Existing EAS project ID: `dc8938e7-7163-413a-9003-479d0afc8a17`
- Current release handoff: [release/RELEASE_GUIDE_RU.md](release/RELEASE_GUIDE_RU.md)

## Apple

- Enroll the founder in Apple Developer Program as Individual (owner decision: 8 November 2026).
- Verify whether `com.eliogenesis.tuneintoher` is the intended and available Apple
  identifier before creating or changing any App Store Connect record. The source value
  is not registration evidence.
- Before creating a subscription, obtain the founder's written decision on billing term
  and eligible trial duration. If the current monthly source route is retained, create
  the product as `monthly_access`; if a different term or ID is approved, make a reviewed
  source change first rather than silently using an alternate external product.
- Select the nearest supported regional price point to the business target; the app never hardcodes a price.
- Add an introductory offer only after its exact eligibility and duration are approved;
  no 14-day, 30-day, monthly, or annual offer is assumed by this checklist.
- Add localized product name, description, subscription terms, privacy URL, and review notes in all supported store locales.
- Create a sandbox tester and test new, returning/ineligible, cancellation, renewal, billing-retry, and restore paths.
- In RevenueCat, add the iOS app and complete the current App Store Connect API/in-app purchase integration steps shown by RevenueCat.

## Google Play

- Resolve whether Google's health-app/business rules require an Organization account before payment. The founder remains the account owner; use verified business details if that route is required. Then verify the intended `com.pryshvitsyn.tuneintoher` package before the first upload; the source value is not Play Console evidence.
- Complete payments profile and required policy/data-safety declarations.
- Only after the owner confirms the current source route, create the matching
  `monthly_access` auto-renewing monthly base plan. Otherwise, first approve and review
  the necessary source/configuration change. Configure regional pricing and any trial
  from actual approved store terms.
- Add localized subscription metadata and terms in all supported locales.
- Add license testers/internal-testing users and test eligible, ineligible, cancellation, grace/billing issue, expiration, and restore paths.
- In RevenueCat, add the Android app and complete its current Google Play service-account/subscription integration steps.

## RevenueCat

- Create the project, then iOS and Android apps.
- After both platform records are externally confirmed, import the matching store
  products into RevenueCat.
- Create/confirm entitlement `full_access` and attach only the verified products.
- Create/set the default offering and add the package that matches the approved source
  billing term. Do not label an alternate product as monthly merely to fit this document.
- Copy only the public platform SDK keys into EAS environment variables:
  - `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
  - `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- Keep `EXPO_PUBLIC_USE_MOCK_BILLING=false` outside local development.
- Verify CustomerInfo entitlement activation, actual localized price, trial eligibility/duration, renewal status, expiration, billing issues, purchases, and restoration in both sandboxes.

## EAS and device testing

- Preserve the existing verified EAS project ID and account; verify current access and register test devices when prompted. Do not create a replacement project as part of ordinary release setup.
- Build an iOS development client with `eas build --profile development --platform ios`, install from the EAS link, then run `npx expo start --dev-client`.
- Build an Android development client with `eas build --profile development --platform android` and distribute through the authorized testing path.
- Create preview builds for stakeholder QA, then production builds. Do not submit until product assets, legal copy, owner identity, privacy URL, store screenshots, review notes, and subscription review screenshots are complete.


## Preview updates (1 November 2026)
- `expo-updates` is configured for the existing EAS project; verify account access before building.
- `preview` builds receive only the `preview` channel; `production` uses `production`. Fingerprint runtime policy prevents delivery to incompatible native runtimes.
- First install requires a signed native build containing expo-updates. No cloud build or OTA update has been published. EAS device login subsequently succeeded as eliogenesis; project:info confirms the existing Tune Into Her project. Apple signing and device registration remain required.
- After EAS authentication and Apple device/signing setup: `npx eas-cli build --platform ios --profile preview`. This standalone build does not require a running Metro server.
- After checks, publish compatible changes with `npx eas-cli update --channel preview --environment preview --message "Describe the change"`. A Git push alone does not publish an OTA update.
- Default startup checks download compatible updates; the downloaded update normally takes effect on a subsequent cold launch. No promise of an instant visible change while the app is open.
- Native dependency/configuration changes require a new compatible signed build and installation. Verify actual notification, billing and OTA behavior on the device. Missing RevenueCat keys currently prevent real entitlement access.
