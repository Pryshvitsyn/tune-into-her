# Tune Into Her

**Don't guess. Tune in.**

Tune Into Her is a quiet, local-first mobile relationship utility. It turns an approximate point in a partner's cycle into one respectful context sentence and one practical daily cue.

The product is designed for empathy, restraint, and privacy. It is not a medical, fertility, contraception, pregnancy-planning, mood-prediction, or surveillance product.

## Platforms and languages

- iOS and Android through Expo and React Native.
- Eleven in-app locales: English, French, Italian, Spanish, German, Russian, Ukrainian, Hindi, Simplified Chinese, Malay, and Baba Malay (Peranakan).
- New translations are editorial drafts. Baba Malay is separately labeled as a preview pending community review.
- Offline-first daily content with 400 localized cues bundled in the app.

## Technology

- Expo SDK 57 and Expo Router.
- React Native with strict TypeScript.
- Vitest for domain and service tests.
- ESLint with the Expo configuration.
- SecureStore for cycle settings and AsyncStorage for non-sensitive preferences and cue history.
- Local notifications through Expo Notifications.
- RevenueCat behind a purchase-service abstraction.

## Privacy and product architecture

The core experience is local-first:

- no application backend;
- no user accounts;
- no analytics or advertising;
- no transmission of cycle dates or cycle settings;
- no runtime AI or remote content fetch;
- anonymous store purchase identity;
- cycle settings stored in device secure storage where supported.

Apple or Google processes store transactions, and RevenueCat receives only the information needed to resolve purchase and entitlement state. See [PRIVACY.md](PRIVACY.md) for the privacy-notice draft and its required owner/legal review.

## Project structure

```text
app/                    Expo Router screens and navigation
content/                Localized offline cue catalog
scripts/                Content generation and validation
src/components/         Shared interface components
src/config/             Product, content, and source configuration
src/context/            Application state and service composition
src/domain/cycle/       Date-only cycle estimation engine
src/domain/content/     Daily cue selection and localization
src/services/           Notifications and purchase integrations
src/storage/            Secure and non-sensitive local persistence
tests/                  Domain and service tests
```

The cycle engine uses calendar dates rather than elapsed hours, avoiding daylight-saving-time drift. Daily cue selection is deterministic and history-aware. Changing the content version invalidates future selections without deleting past history.

## Prerequisites

- Node.js 24 LTS is recommended and is the version used by CI. Expo SDK 57's React Native version also supports its other declared compatible Node ranges.
- npm, using the committed `package-lock.json`.
- Xcode for local iOS builds.
- Android Studio and an Android SDK for local Android builds.
- EAS CLI and authenticated Expo access only when creating EAS development or release builds.

Expo Go cannot exercise RevenueCat, native in-app purchases, or the complete notification behavior. Use a development build for those paths.

## Installation

```bash
git clone https://github.com/Pryshvitsyn/tune-into-her.git
cd tune-into-her
npm ci
cp .env.example .env
```

The configured identifier is `com.pryshvitsyn.tuneintoher`; store registration has not been verified. The EAS project ID is retained from the existing source. Follow [release/RELEASE_GUIDE_RU.md](release/RELEASE_GUIDE_RU.md) for the current handoff and outstanding release requirements.

## Environment configuration

The app consumes exactly these client-visible variables:

```env
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
EXPO_PUBLIC_USE_MOCK_BILLING=false
```

Copy `.env.example` to the untracked `.env` file for local work. `EXPO_PUBLIC_*` values are embedded in the client and must never contain RevenueCat secret keys, Apple or Google credentials, EAS tokens, GitHub tokens, passwords, or other private material.

## Local development

Start the Expo development server for a development client:

```bash
npm run start
```

Other available workflows:

```bash
npm run ios
npm run android
npm run web
```

For local UI work without store configuration, enable the visible development-only purchase mock in `.env`:

```env
EXPO_PUBLIC_USE_MOCK_BILLING=true
```

Mock billing is accepted only when both `__DEV__` and this variable are true. Preview and production builds always use RevenueCat.

## Validation and testing

Run the complete local checks:

```bash
npm run content:validate
npm run lint
npm run typecheck
npm test
npx expo-doctor
npx expo config --type public
```

Validate production bundling without signing or store access:

```bash
npx expo export --platform ios
npx expo export --platform android
```

The content validator checks localization completeness, unique identifiers, Learn More references, and the minimum catalog size. The test suite covers cycle estimation, daily cue behavior, localized content, notification scheduling, and purchase-state behavior.

## Expo development builds

After the placeholder identifiers and EAS project ID have been explicitly approved and configured:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform ios
eas build --profile development --platform android
```

Install the development build on an authorized device or emulator, then run:

```bash
npx expo start --dev-client
```

Apple signing, Android signing, device registration, and store credentials belong in the platform/EAS services, never in this repository.

## Purchases and subscriptions

The UI depends on a `PurchaseService` interface. `RevenueCatPurchaseService` handles anonymous configuration, offerings, purchase, restore, entitlement state, trial eligibility, and store subscription management. `MockPurchaseService` is isolated to development mode.

The application expects the neutral entitlement `full_access`, the monthly product concept `monthly_access`, and a RevenueCat default offering with a monthly package. Prices, billing periods, and trial eligibility come from the stores and RevenueCat; the app does not invent or hard-code them.

External Apple, Google Play, RevenueCat, EAS, and sandbox-testing work is documented in [STORE_SETUP.md](STORE_SETUP.md).

## Notifications

Notifications are scheduled locally. The scheduler maintains a rolling 14-day horizon, removes stale app-owned reminders, deduplicates scheduled dates, and rebuilds the schedule when relevant settings change. There is no push server.

## Git workflow

- `main` is the stable baseline and should receive reviewed changes through pull requests.
- Active MVP development continues on `feat/tune-into-her-mvp` or narrower feature branches based on it.
- Do not commit `.env`, generated exports, native signing material, credentials, or local caches.
- CI validates content, linting, types, tests, and Expo project health on pull requests and maintained branches.

## Security principles

- Keep only public RevenueCat platform SDK keys in client-visible environment configuration.
- Never commit RevenueCat secret keys, store credentials, service-account files, signing certificates, provisioning profiles, private keys, or access tokens.
- Inspect `npx expo config --type public` before release so client-visible configuration remains intentional.
- Keep real credentials in the appropriate store, RevenueCat, GitHub, or EAS secret-management surface.
- Review all tracked files before publishing because this repository is initially public.

## Release readiness

Before store submission, complete [release/RELEASE_GUIDE_RU.md](release/RELEASE_GUIDE_RU.md), configure support and legal URLs, verify purchases on devices, and obtain editorial review. `npm run release:check` reports outstanding work and also runs before production EAS builds. No signed IPA/AAB or store submission is included. No open-source license is granted by this repository.

