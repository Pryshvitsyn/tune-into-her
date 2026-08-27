# Store and RevenueCat setup checklist

These are external owner actions and are not completed by this repository.

## Identifiers to keep aligned

- RevenueCat entitlement: `full_access`
- Store product concept: `monthly_access` (use the exact same neutral ID on both stores if available)
- RevenueCat offering: default offering with its monthly package pointing to the monthly product
- Placeholder iOS bundle ID to replace: `com.placeholder.partnercyclecontext`
- Placeholder Android package to replace: `com.placeholder.partnercyclecontext`
- EAS project ID to replace: `00000000-0000-0000-0000-000000000000`

## Apple

- Enroll in Apple Developer Program and choose the final brand-neutral bundle identifier.
- Replace `ios.bundleIdentifier` in `app.config.ts`, create the App Store Connect app, and complete agreements/tax/banking.
- Create one subscription group and a monthly auto-renewable subscription with product ID `monthly_access` (or record the exact alternate ID).
- Select the nearest supported regional price point to the business target; the app never hardcodes a price.
- Add a free introductory offer of the desired one-month-style duration for eligible new subscribers.
- Add localized product name, description, subscription terms, privacy URL, and review notes in all supported store locales.
- Create a sandbox tester and test new, returning/ineligible, cancellation, renewal, billing-retry, and restore paths.
- In RevenueCat, add the iOS app and complete the current App Store Connect API/in-app purchase integration steps shown by RevenueCat.

## Google Play

- Create the Play Console app and choose the final brand-neutral package identifier; replace `android.package` in `app.config.ts`.
- Complete payments profile and required policy/data-safety declarations.
- Create monthly subscription `monthly_access`, an auto-renewing monthly base plan, regional pricing, and a new-subscriber free-trial offer.
- Add localized subscription metadata and terms in all supported locales.
- Add license testers/internal-testing users and test eligible, ineligible, cancellation, grace/billing issue, expiration, and restore paths.
- In RevenueCat, add the Android app and complete its current Google Play service-account/subscription integration steps.

## RevenueCat

- Create the project, then iOS and Android apps.
- Import both monthly store products.
- Create entitlement exactly `full_access` and attach both products.
- Create/set the default offering and add the monthly package.
- Copy only the public platform SDK keys into EAS environment variables:
  - `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
  - `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- Keep `EXPO_PUBLIC_USE_MOCK_BILLING=false` outside local development.
- Verify CustomerInfo entitlement activation, actual localized price, trial eligibility/duration, renewal status, expiration, billing issues, purchases, and restoration in both sandboxes.

## EAS and device testing

- Replace the EAS project ID, run `eas build:configure`, and register test devices when prompted.
- Build an iOS development client with `eas build --profile development --platform ios`, install from the EAS link, then run `npx expo start --dev-client`.
- Build an Android development client with `eas build --profile development --platform android` and distribute through the authorized testing path.
- Create preview builds for stakeholder QA, then production builds. Do not submit until product assets, legal copy, owner identity, privacy URL, store screenshots, review notes, and subscription review screenshots are complete.
