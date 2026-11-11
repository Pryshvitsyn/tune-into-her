# ARCHITECTURE
Updated: 2026-11-11; release-candidate integration base 25c8505.
## Frontend
Expo SDK 57 / React Native / TypeScript / Expo Router under app/. AppContext composes services and state. src/theme holds light/dark palettes; useTheme reads persisted AppContext appearance. Existing screen styles are palette factories. Shared Screen provides header, gray mist and tabs. Today and onboarding directly use the approved `TuneIntoHerSphereV4` renderer; `_layout` preloads its image resources but does not alter V4's renderer/shader/clock contract.
## Backend / database / auth
No application backend, remote database or user accounts. No runtime AI or remote content fetch.
## Storage
SecureStore cycle settings; AsyncStorage preferences, selected-cue history, and separate date/cue feedback records. Cycle engine uses date-only calculations. No migration deletes historical selections merely to refresh content.
## Services
Local Expo Notifications. RevenueCat purchase abstraction; mock only in development. Stores process purchases; RevenueCat resolves entitlement. Never embed secret keys.
## Data flow
Onboarding → local settings → date-only estimate → history-aware daily cue → localized lookup → Today. `content/editorial/<locale>.json` is the authored source. `content:generate` produces catalog metadata and three-part localized entries. AdviceBlocks renders the same selected entry in the order KEEP IN MIND → sphere → SUPPORT → DO. Selection preserves an existing same-date choice, prefers fresh components against the latest 89 historical selections, then uses deterministic least-recent fallback. `CONTENT_VERSION` is 4 and prior versioned IDs remain resolvable. If the estimate reaches the 40-day unconfirmed boundary, Today requests an update and selects all-phase content rather than extrapolating a new phase.
## Deployment
eas.json development/preview/production; release checker and build guard. Native signing/device testing/store products externally configured.
## Boundaries
No analytics/ads or transmission of cycle details. Unsigned exports are not store releases.
## Accelerated preview
The preview/development build profile enables `extra.acceleratedDemo`; the production profile forces it off. `/demo` reuses AdviceBlocks and the existing editorial catalog, with a separate in-memory content history and synthetic 30/5 scenario. Session metadata lives in a dedicated AsyncStorage key; it contains no personal cycle dates. Elapsed wall time restores the displayed day after backgrounding. AcceleratedDemoScheduler schedules 29 native one-off notifications and filters cleanup by its own kind/run. Root notification routing validates the current run and day before opening `/demo`. A first launch or active session can open the preview without purchase/onboarding; ordinary access checks are unchanged.
