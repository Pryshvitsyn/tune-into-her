# ARCHITECTURE
Updated: 2026-11-14 (Europe/Rome); current launch/onboarding work extends the local monetization candidate.

## Frontend

Expo SDK 57 / React Native / TypeScript / Expo Router under `app/`. AppContext composes
services and state. `src/theme` holds the shared light/dark Silver Chrome palettes;
`useTheme` reads persisted appearance. Existing screen styles remain palette factories.
Shared Screen provides header, mist and tabs. Today and onboarding retain the approved
`TuneIntoHerSphereV4` renderer; resource loading does not alter its renderer/shader/clock
contract.

## Startup presentation

`GlobalLaunch` in the root layout owns presentation, independently of access policy.
It starts font/resource work alongside AppContext initialization and uses the existing
local onboarding state and entitlement readiness to choose when a destination can be
revealed. Existing routes and Today access checks remain authoritative; initialization
or presentation readiness cannot grant trial or paid access.

`launchState` is a pure managed-clock model: explicit renderer completion ends the
original 9000ms scene, then a 1000ms visible foreground sphere hold runs. The shared
`SphereIntroSurface` and WebView runtime render the same approved timeline, scene,
shaders, logo and V4 material; there is no second WebGL implementation. The material
keeps moving while initialization is slow. Fade requires current-attempt initialization
and destination paint readiness. Initialization failures expose Retry; completed
choreography/hold are retained and stale attempt callbacks cannot release the new gate.

`LaunchPresentation` coordinates destination visibility and accessibility and suppresses
its duplicate sphere while the global sphere is present. `GlobalLaunch` retains its
completion latch only in process memory. `introSession` marks the timeline consumed before
mounting the destination, preventing Today from starting another full intro behind it.
Navigation/foreground does not replay the intro; a genuine new process does. Background time does not advance visible choreography/hold. Reduced
Motion or an enabled screen reader skips the full sequence and hold. Android Back is
consumed while the launch presentation blocks navigation. These are presentation rules,
not changes to onboarding persistence or billing policy.

The module-scope Expo splash lock bridges native startup. The native storyboard/system
splash is static, using the original outlined logo and approved first-frame silver;
WebGL begins only when the React Native/WebView surface runs. Hiding waits for a loaded
compatible image or ready GPU frame and paint callbacks. `app.config.ts`, the canonical
launch assets and `with-approved-launch-splash.cjs` retain this setup across native
generation. Android12+ OS icon/background constraints are documented separately in
[NATIVE_LAUNCH_SPLASH](docs/NATIVE_LAUNCH_SPLASH.md). Runtime evidence and unverified
scenarios are maintained in [LAUNCH_QA](docs/LAUNCH_QA.md).

The root native Stack is the sole status-bar style owner: dark icons while the silver
launch blocks, then light icons for a dark destination or dark icons for a light one.
The native `UIViewControllerBasedStatusBarAppearance` flag is true in both Info.plist
and app.config.ts. A separate Expo StatusBar JSX owner is not mounted. This resolves the
observed dark-destination status-bar ownership conflict without changing signing.

## Onboarding and pre-purchase presentation

The shared Silver Chrome UI palette is independent of the approved Deep Intro V2
horizontal launch palette. Original V4 colors/material are unchanged. Root startup loads
the local original Linux Libertine O Regular OTF through Expo Font before application
text mounts. `typographyForLanguage` uses that family for the nine Latin/Cyrillic locales
and the system script font for Hindi and Simplified Chinese. No remote font is fetched.

Native QA observed stale text boxes after a live large→largest-accessibility-size change,
while a cold launch at that same size measured correctly. `AppText` forwards the normal
Text props/ref and keys only the native Text host by `useWindowDimensions().fontScale`
on iOS. It retains parent controls, onboarding and language-draft state and keeps normal
automatic font scaling; Android receives no key override. No font binary or scale cap is
introduced. The [upstream React Native iOS/Fabric report](https://github.com/react/react-native/issues/57512)
describes a matching live-versus-cold pattern and remount workaround. It corroborates the
observation, but does not prove this app's diagnosis or that this workaround passes its
runtime checks. Final refreshed native verification remains in LAUNCH_QA.

Only decorative icon glyphs (stepper minus/plus, back chevron, checkbox tick and picker
arrow) retain fixed icon sizes, as an SVG icon would. Their accessible parent controls
keep the existing labels/states. Body text, values, options and action labels retain full
system font scaling; no body-text size cap or font-binary change is introduced.

`LanguagePicker` presents one closed row and edits a local draft in its modal. iOS uses
a snapping wheel-style React Native list; Android uses a scrollable radio list. Done
persists through existing preferences, while Cancel/backdrop/Back do not commit. Measured
row heights account for all eleven original locale IDs and text scaling. Failed saves
retain the draft; oversized layouts allow scrolling to the actions.

Picker row measurements are keyed by viewport width and font scale. Header/action View
keys include that geometry generation and the selection session/current layout state,
forcing fresh layout callbacks after a geometry change without resetting the reducer's
draft. Generation refs reject old callbacks; current measured heights and settled layout
must be ready before wheel gestures can alter the draft. This avoids treating automatic
recentering or old geometry as a user selection. Live/cold and largest-size native UI
reachability remain required verification, independent of source tests.

Onboarding preview reuses AdviceBlocks with optional typography; default Today content
and typography remain unchanged. Pre-purchase Header, PaywallCard and legal surfaces use
the same shared presentation primitives. No purchase/restore/plan-change handler,
onboarding acknowledgment, cycle range/date validation, completion persistence or
reminder default is changed by these styles.

The exact bundled font, provenance and canonical notices live in `assets/fonts/`.
`scripts/generate-font-license.mjs` transports OFL.txt and LICENCE.txt verbatim into
`license.generated.json`, imported by Terms as a selectable appendix so notices are in
the application bundle. This packaging adds no consent or payment action and establishes
no merchant legal/store-readiness approval.

## Backend / database / auth

Isolated TypeScript Cloudflare Worker/D1 service in `backend/` for server-timestamped app
trial and optional durable RevenueCat webhook journal; local Node/SQLite runner uses
the same handler. No mandatory user account, runtime AI or remote content fetch. Sandbox
and production have separate databases/routes/secrets. The backend receives no cycle,
advice or relationship content.

## Storage

SecureStore cycle settings; AsyncStorage preferences, selected-cue history, and separate
date/cue feedback records. SecureStore also holds independent per-environment trial
identity/credential/cache and a bounded signed RevenueCat entitlement cache. Local
content deletion retains billing/trial identity; it does not cancel a subscription or
reset trial dates. Cycle engine uses date-only calculations. No migration deletes
historical selections merely to refresh content.

## Services

Local Expo Notifications. RevenueCat purchase abstraction; mock only in development.
Stores process native purchases; RevenueCat resolves signed CustomerInfo/full_access.
AppTrialService independently resolves an explicit server-started 14×24h grant.
AppContext exposes paid state and app-trial state separately; Today uses their OR, with
foreground/deadline/clock checks and a maximum24h offline grant bounded by known expiry.
Monthly/annual offerings use exact periods and base plans; no automatic store introductory
trial is selected. RevenueCat Billing with Stripe is the prepared web engine; official
redemption links pass through +native-intent into an in-memory inbox without token Router
params. Only SDK-verified entitlement unlocks paid access. Management routes to its actual
Apple/Google/web source. Never embed secret keys.

## Data flow

Onboarding → local settings → date-only estimate → history-aware daily cue → localized
lookup → Today. `content/editorial/<locale>.json` is the authored source.
`content:generate` produces catalog metadata and three-part localized entries. AdviceBlocks
renders the same selected entry in the order KEEP IN MIND → sphere → SUPPORT → DO.
Selection preserves an existing same-date choice, prefers fresh components against the
latest 89 historical selections, then uses deterministic least-recent fallback.
`CONTENT_VERSION` is 4 and prior versioned IDs remain resolvable. If the estimate reaches
the 40-day unconfirmed boundary, Today requests an update and selects all-phase content
rather than extrapolating a new phase.

## Deployment

`eas.json` development/preview/production; release checker and build guard. Native
signing/device testing/store products remain separately verified external gates. A local
Release build or source export is not a store release. The current launch request does
not authorize publication/submission.

An app-target-only incremental build may reuse unchanged Release Pods products after a
verified full workspace build. When native configuration changes, regenerate Expo
Updates resources with the installed official `create-updates-resources-ios.sh` Pod
script before that build; skipping the Pods graph must not retain an old embedded
manifest/fingerprint. Verify the copied app resources against the fresh product bundle.
No SDK source or fingerprint override is used. Exact current proof is recorded in
[NATIVE_LAUNCH_SPLASH](docs/NATIVE_LAUNCH_SPLASH.md).

## Boundaries

No analytics/ads or transmission of cycle details. Launch/typography changes do not alter
billing/trial policy, translations, daily selection or historical persistence.

## Accelerated preview

The preview/development build profile enables `extra.acceleratedDemo`; the production
profile forces it off. `/demo` reuses AdviceBlocks and the existing editorial catalog,
with a separate in-memory content history and synthetic 30/5 scenario. Session metadata
lives in a dedicated AsyncStorage key; it contains no personal cycle dates. Elapsed wall
time restores the displayed day after backgrounding. AcceleratedDemoScheduler schedules
29 native one-off notifications and filters cleanup by its own kind/run. Root notification
routing validates the current run and day before opening `/demo`. A first launch or active
session can open the preview without purchase/onboarding; ordinary access checks are
unchanged.
