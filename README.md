# Tune Into Her
## What it is
Local-first iOS/Android app for practical daily partner support informed by estimated cycle timing. Not medical or mood prediction.
## Current status
Development. Native dual-theme interface, THEA branding, calendar, appearance and three-part advice layout implemented. Full-format content expansion and device QA remain. Not store-ready.
## Stack
Expo SDK 57, React Native, TypeScript, Expo Router, Vitest, i18next, SecureStore, AsyncStorage, local notifications, RevenueCat.
## Run
`npm ci`; copy `.env.example` to untracked `.env`; `npm start`. Native development client required for purchases/complete notification QA.
## Test
`npm run content:validate`, `npm run lint`, `npm run typecheck`, `npm test`, `npx expo-doctor`.
Release gate: `npm run release:check`.
## Deploy
Existing profiles: [eas.json](eas.json). See [STORE_SETUP.md](STORE_SETUP.md) and [release guide](release/RELEASE_GUIDE_RU.md). Signed builds/submission unverified. No verified production/staging URL.
## Structure
app/ routes; src/ implementation; content/ catalog; tests/; release/ evidence.
## Project brain
[GOAL](GOAL.md) · [SNAPSHOT](PRODUCT_SNAPSHOT.md) · [TASKS](TASKS.md) · [DECISIONS](DECISIONS.md) · [ARCHITECTURE](ARCHITECTURE.md) · [PRODUCT](docs/PRODUCT.md) · [UX](docs/UX.md).
## Agent rules
Read [AGENTS.md](AGENTS.md). Historical validation is not current proof.
