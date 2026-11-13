# Tune Into Her
## What it is
Local-first iOS/Android guidance for a partner of any gender or another close person supporting a woman, informed by estimated cycle timing. Not medical or mood prediction.
## Current status
Development. Native dual-theme interface, THEA branding, calendar, appearance and three-part advice layout implemented. A 90-day three-part reserve is implemented across eleven locales; native-language review and device QA remain. Not store-ready.
## Stack
Expo SDK 57, React Native, TypeScript, Expo Router, Vitest, i18next, SecureStore, AsyncStorage, local notifications, RevenueCat.
## Run
`npm ci`; copy `.env.example` to untracked `.env`; `npm start`. Native development client required for purchases/complete notification QA.
## Test
`npm run content:validate`, `npm run lint`, `npm run typecheck`, `npm test`, `npx expo-doctor`.
Release gate: `npm run release:check`.
## Deploy
Existing profiles: [eas.json](eas.json). See [STORE_SETUP.md](STORE_SETUP.md) and [release guide](release/RELEASE_GUIDE_RU.md). Signed builds/submission unverified. No verified production/staging URL.
## Monetization
Explicit **14-day full app access without card, account or subscription**, followed by a voluntary monthly or annual purchase. Eurozone base targets are €3.99/month and €24.99/year; the UI uses actual store prices. Trial expiry never charges the user. Native RevenueCat purchases and official web redemption share `full_access`; RevenueCat Billing with Stripe is the prepared web engine.
The isolated trial backend is source-complete and locally tested; external products, keys, hosting and native sandbox transactions remain unconfigured/unverified. See [MONETIZATION](MONETIZATION.md), [owner setup](STORE_SETUP.md), [billing QA](BILLING_QA.md), and [local backend](backend/README.md). Cycle/relationship content remains on-device; billing services receive only their separate identity/transaction data.
## Accelerated iPhone preview
Preview builds open a labelled 30-day demonstration before setup/purchase. Tap Start once: the next demo day appears every five minutes, with native reminders while the app is closed. Stop cancels only this demonstration. It is separate from the14-day free app access. Personal cycle data is not used or changed. See [preview installation and checks](docs/ACCELERATED_PREVIEW.md). A signed native build is still required for installation.
## Structure
app/ routes; src/ implementation; content/ catalog; tests/; release/ evidence.
## Project brain
[GOAL](GOAL.md) · [SNAPSHOT](PRODUCT_SNAPSHOT.md) · [TASKS](TASKS.md) · [DECISIONS](DECISIONS.md) · [ARCHITECTURE](ARCHITECTURE.md) · [PRODUCT](docs/PRODUCT.md) · [UX](docs/UX.md) · [Content reserve](docs/CONTENT.md).
## Agent rules
Read [AGENTS.md](AGENTS.md). Historical validation is not current proof.
