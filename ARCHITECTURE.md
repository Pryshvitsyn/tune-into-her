# ARCHITECTURE
Inspected baseline: 6367bd8 on 2026-10-31.
## Frontend
Expo SDK 57 / React Native / TypeScript / Expo Router under app/. AppContext composes services and state. src/theme is static; dual themes pending.
## Backend / database / auth
No application backend, remote database or user accounts. No runtime AI or remote content fetch.
## Storage
SecureStore cycle settings; AsyncStorage preferences and cue history. Cycle engine uses date-only calculations.
## Services
Local Expo Notifications. RevenueCat purchase abstraction; mock only in development. Stores process purchases; RevenueCat resolves entitlement. Never embed secret keys.
## Data flow
Onboarding → local settings → estimated phase/date → history-aware daily cue → localized lookup → Today. Three-part target is not yet implemented here.
## Deployment
eas.json development/preview/production; release checker and build guard. Native signing/device testing/store products externally configured.
## Boundaries
No analytics/ads or transmission of cycle details. Unsigned exports are not store releases.
