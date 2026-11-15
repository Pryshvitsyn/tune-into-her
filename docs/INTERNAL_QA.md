# Isolated internal QA

The ordinary app's hidden `/dev-qa` route still requires both `__DEV__` and
`EXPO_PUBLIC_USE_MOCK_BILLING=true`. That gate grants no access by itself and remains
disabled in normal production Release. The current Founder workflow additionally uses
an explicitly packaged **private Release testing artifact**, with a build-only entry
and the same existing memory controller. It is not a new production entitlement path.
There is no public QA tab or URL/environment flag that unlocks ordinary Release.

The real application remains the test subject: AppContext selects synthetic
services/state rather than replacement cycle, billing, navigation or animation screens.
Current source behavior and the two testing modes are distinguished below. Build,
installation and physical verification must be reported for their actual artifact;
these instructions alone are not runtime proof.

## Current Founder private Release workflow

Explicit preparation defaults to the localized testing panel:

```sh
node tests/native-launch/standalone-qa.cjs --standalone-qa
```

The generated private Index opens `/dev-qa` on cold launch. A labelled `paid-active`
fixture starts synchronously before AppProvider mounts, so real storage, billing/cache
and notification effects never become the initial test scope. Development JavaScript
remains false. The separate build configuration requires its exact private Release entry,
marker and Expo Metro override; packaging verifies the actual emitted module graph.
[Packaging and fail-closed checks](../tests/native-launch/STANDALONE_QA.md) are the source
of truth for those mechanics. Do not submit/distribute the diagnostic artifact.

After the reviewed artifact is installed, choose a scenario, then use **Open selected
scenario** to enter its existing screen. The button waits for private access readiness.
Return through **Settings → Internal testing**, whose title and controls follow the
selected locale. `--standalone-qa --entry today` is the explicit optional capture entry;
it does not replace the default panel intended for the Founder.

In this artifact, **Reset test session** resets only synthetic memory and keeps the
private scope active. It cannot expose personal stores or switch itself into ordinary
app use. For the latest final-pass request, finish with the reviewed private testing
artifact installed and reachable. Retain the signed normal artifact separately; an
update to it is a later explicitly requested return to ordinary use or recovery action.
Do not automatically restore normal after successful testing and hide the controls again.
Never uninstall or reset data when changing between these artifacts.

Private language/theme changes survive navigation and scenario selection in the running
process. A cold process starts a new fixture, so those test preferences/history reset;
they are not a disk-persistence test. The first scenario in the ordinary Debug workflow
can seed language/theme from the currently displayed preferences without saving anything.
Normal app preferences continue to use their existing persistence and cold-start restore.
Verify normal persistence separately in the normal artifact, rather than interpreting a
private cold reset as lost personal settings.

## Ordinary development-client alternative

Historical Debug-client checkpoint: no new dependency or native module was introduced
by QA. The older Debug client lacked
already-required ExpoCrypto and had an older SVG module. Compatible Debug clients were
rebuilt for the existing iPhone and isolated Simulator; the iPhone update
preserved its application data. Build/install evidence and native case results are in
[UX_TEST_READINESS](UX_TEST_READINESS.md).

From this checkout, start the development server:

```sh
EXPO_PUBLIC_USE_MOCK_BILLING=true npm start -- --lan
```

Open the installed Tune Into Her development client on the same LAN and select this
server or scan Expo's development-client QR. The verified unique scheme is
`exp+tune-into-her`; the legacy `tuneintoher` scheme may belong to an older app.
The flag-enabled startup opens `/dev-qa`. Its Settings entry also remains available.
An ordinary Release cannot enable fixtures through a URL or an environment flag. The
separately packaged private Release above uses a reviewed build-only wrapper, not this
development-client flag.

On the first Expo developer-menu tutorial, use its Continue and Close controls. The
SDK's floating Tools button can cover the product's upper-right Home emblem; turn off
**Tools button** in the Expo developer menu while testing Home. This is a development
host control. Automated Simulator runs use the temporary launch argument
`-EXDevMenuShowFloatingActionButton NO`, without changing product preferences.

In this ordinary Debug workflow, the environment flag enables only the panel. Outside
an explicitly active scenario,
AppContext keeps the actual RevenueCat/trial services and real data; it does not select
mock billing globally. Choose a scenario and confirm its active disclosure before using
the panel's shortcuts to existing screens. The existing
translated `paywall.mock` disclosure remains visible. Shared screens must additionally
show the development disclosure while the session is active. The session survives
navigation within this JS process; explicit **End QA** restores the ordinary app view,
and reloading the process clears the session. QA changes to language/theme remain in
memory and survive navigation; they do not claim to test actual disk persistence across
a native process restart. Verify real persisted appearance separately after ending QA.

## Scenarios and actions

| Fixture | Exercise |
| --- | --- |
| Fresh / no cycle | No saved date, no invented day/phase, existing onboarding cycle setup |
| Returning / cycle 1, 7, 14, 21, 28 | Actual date-only engine from confirmed synthetic 2026-11-03 start, 28/5 lengths |
| 07:59 | Existing guidance stays on the previous date; **next local 08:00** advances the synthetic clock and guidance key |
| App access not started | Existing explicit start button; status reads must not start a grant |
| App access beginning / day 7 / expiry | Existing AppTrialService with a private fake transport and exact14×24h UTC grant |
| Paid active / cancelled / expired | Existing MockPurchaseService; cancelled access remains until its paid term ends |
| Store unavailable | Existing offering error and navigation; **make mock store available** then use the existing Retry |
| Restore | Initially inactive; use the existing Restore button to obtain only the configured mock entitlement |
| Any active fixture | Existing header emblem/globe return, light/dark Settings location, long-document Back/Settings and safe areas |

The minute/day/week/expiry controls advance only `ScenarioClock`. They never patch
Date/performance or change the device clock. Scenario reset creates fresh private
history/services; advancing time retains the current session's history. Geometry and
animation clocks remain real so the approved globe speed is not accelerated.

The November dates belong only to a labelled fixture. They are never production defaults,
confirmed user data, subscription product IDs or real store evidence. Mock offering
prices and identifiers come from the existing MockPurchaseService. Actual native store
configuration and real transactions remain separate external tests.

## AppContext integration contract

`useInternalQASession()` subscribes to `internalQASession`. An active snapshot exposes:

- `sessionId`, `scenarioId`, `revision`, `nowMs`, `accessReady`, `clock.now/monotonic`;
- synthetic `preferences`, nullable `cycleSettings`, `entitlement` and `appTrial`;
- `purchases` (the existing MockPurchaseService) and `trialService` (the existing
  AppTrialService with private Map storage and a no-network fixture transport);
- `memorySelectionStore` and `memoryFeedbackStore`, matching the existing store methods.

Controller actions are `startScenario(id, initialPreferences?)`, `stop`, `refreshAccess`, `advanceBy`,
`advanceToNextGuidanceBoundary`, `setStoreAvailable`, `setCycleSettings`,
`updatePreferences`, `completeOnboarding` and `startAppTrial`. Start publishes active
memory ownership synchronously, then its promise waits for
access readiness. Optional initial preferences contain only language/theme; subsequent
scenarios retain the existing private choice. Session generations reject stale
asynchronous results/listeners after reset
or exit. Starting app access still requires completed onboarding and a configured cycle.

`scopeAppContext(base, controller, snapshot)` is the pure provider facade. Disabled or
inactive scope returns the exact base object. Active scope selects memory data/services,
turns notification rebuilds into no-ops, and routes all mutations to the controller.
Its `dataScope` is `qa:<sessionId>` while the ordinary provider uses `real`; loaded
history/selection and editable forms retain that affinity across entry/reset/exit.
Its callbacks verify the captured session generation, so an old delete confirmation
cannot reset a newer session or reactivate one after exit. The helper imports AppContext
only as a TypeScript type and never runs the base callbacks.

The real provider state/services stay separate. While active, select QA services and
stores for every screen/action and route all mutations to the memory controller. Today,
calendar and editor use the facade's `now():Date`; guidance and history use the private
selection/feedback stores. Keep default notification scheduling inactive during QA,
including foreground effects, permission requests and cleanup actions. Real trial/cache
polling must pause too: even `AppTrialService.getCachedState()` writes its cache metadata.
No SecureStore/AsyncStorage, real billing cache/history, backend or notification request
is part of a synthetic scenario. Ending an ordinary Debug session restores real language
and ordinary effects with fresh access checks. The standalone wrapper instead resets its
private scenario and stays isolated; it needs a separately retained normal artifact to exit.

## Source checks and historical proof

```sh
npx vitest run tests/standaloneQA.test.ts tests/internalQA.test.ts tests/internalQAScope.test.ts
npx eslint src/devQA app/dev-qa.tsx tests/native-launch/standalone-qa.cjs tests/standaloneQA.test.ts tests/internalQA.test.ts tests/internalQAScope.test.ts
npm run typecheck
```

The earlier Debug/source checkpoint passed 27 source tests for production gates, real
cycle/guidance/trial
service reuse, exact clock boundaries, restore/store recovery, private history and
stale-session cleanup. Base callback/service/storage spies remain uncalled during every
facade mutation, and ending QA restores the exact base object.
That historical count and the linked older native proof are not the final-pass
private-panel evidence. The current standalone suite additionally executes actual
AppProvider effects with real-service tripwires, checks all scenarios and rejects a
miswired emitted alias graph. Unit checks still do not establish native layout,
installation or navigation/animation success. Run the integrated bundle through all rows
above
and record its actual device/build evidence. Normal production access, persistence and
notification behavior require separate regression checks; QA is not real paid access or
store readiness.
