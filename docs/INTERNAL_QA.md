# Isolated internal QA

The hidden `/dev-qa` route requires both `__DEV__` and the existing
`EXPO_PUBLIC_USE_MOCK_BILLING=true` gate. Production and ordinary development sessions
cannot activate fixtures. There is no public QA tab. The normal app remains the test
subject: the controller supplies synthetic data/services through AppContext rather than
adding replacement cycle, subscription, navigation or animation screens.

## Run on the existing development client

No new dependency or native module is introduced by QA. The older Debug client lacked
already-required ExpoCrypto and had an older SVG module. Compatible Debug clients have
now been rebuilt for the existing iPhone and isolated Simulator; the iPhone update
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
A standalone Release cannot enable fixtures through a URL or an environment flag.

On the first Expo developer-menu tutorial, use its Continue and Close controls. The
SDK's floating Tools button can cover the product's upper-right Home emblem; turn off
**Tools button** in the Expo developer menu while testing Home. This is a development
host control. Automated Simulator runs use the temporary launch argument
`-EXDevMenuShowFloatingActionButton NO`, without changing product preferences.

The environment flag enables only the panel. Outside an explicitly active scenario,
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

Controller actions are `startScenario`, `stop`, `refreshAccess`, `advanceBy`,
`advanceToNextGuidanceBoundary`, `setStoreAvailable`, `setCycleSettings`,
`updatePreferences`, `completeOnboarding` and `startAppTrial`. Start waits for access
readiness. Session generations reject stale asynchronous results/listeners after reset
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
is part of a synthetic scenario. Restore the real language and ordinary effects on exit.

## Source proof and remaining runtime work

```sh
npx vitest run tests/internalQA.test.ts tests/internalQAScope.test.ts
npx eslint src/devQA app/dev-qa.tsx tests/internalQA.test.ts tests/internalQAScope.test.ts
npm run typecheck
```

The focused suites pass 27 source tests for production gates, real cycle/guidance/trial
service reuse, exact clock boundaries, restore/store recovery, private history and
stale-session cleanup. Base callback/service/storage spies remain uncalled during every
facade mutation, and ending QA restores the exact base object.
It does not establish that AppContext has selected every correct store, nor native
layout/navigation/animation success. Run the integrated bundle through all rows above
and record its actual device/build evidence. Normal production access, persistence and
notification behavior require separate regression checks; QA is not real paid access or
store readiness.
