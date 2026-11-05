# ARCHITECTURE
Updated: 2026-11-02; native interface baseline a09ba11.
## Frontend
Expo SDK 57 / React Native / TypeScript / Expo Router under app/. AppContext composes services and state. src/theme holds light/dark palettes; useTheme reads persisted AppContext appearance. Existing screen styles are palette factories. Shared Screen provides header, gray mist and tabs.
## Backend / database / auth
No application backend, remote database or user accounts. No runtime AI or remote content fetch.
## Storage
SecureStore cycle settings; AsyncStorage preferences and cue history. Cycle engine uses date-only calculations.
## Services
Local Expo Notifications. RevenueCat purchase abstraction; mock only in development. Stores process purchases; RevenueCat resolves entitlement. Never embed secret keys.
## Data flow
Onboarding → local settings → estimated phase/date → history-aware daily cue → localized lookup → Today. content/editorial/<locale>.json is the authored source. content:generate produces catalog metadata and three-part localized entries. AdviceBlocks renders cue/support/context from that same selected entry, including onboarding. Selection prefers unused IDs, then minimises component repetition against the latest seven historical selections. All previous 400 IDs remain resolvable; content version is 3. dailyGuidance selects date-stable reminder identities independent of locale/theme.
## Deployment
eas.json development/preview/production; release checker and build guard. Native signing/device testing/store products externally configured.
## Boundaries
No analytics/ads or transmission of cycle details. Unsigned exports are not store releases.
