# Standalone private QA bundle

This is explicit build tooling for a temporary, signed Release diagnostic artifact on
an already authorized device. It keeps the official bundle ID and existing native binary;
it introduces no native module, account, subscription or production entitlement change.
The ordinary `__DEV__ && EXPO_PUBLIC_USE_MOCK_BILLING` gate, AppContext, routes and package
entry remain unchanged. Normal Release cannot activate this fixture through an environment
flag or URL. Do not submit or distribute this diagnostic artifact.

Prepare the ignored private entry/config explicitly from the repository root:

```sh
node tests/native-launch/standalone-qa.cjs --standalone-qa > /tmp/tih-standalone-qa-manifest.json
```

The manifest describes `.expo/private-qa/{entry.cjs,session.cjs,index.tsx,metro.config.cjs}`
and hashes the untouched normal guard/provider/index/layout inputs. The QA config refuses
to load unless all `requiredEnvironment` values select this exact private Release entry,
including `TIH_STANDALONE_QA_BUNDLE=1` and `EXPO_OVERRIDE_METRO_CONFIG`. Pass its complete
`requiredEnvironment` (including `ENTRY_FILE` and `BUNDLE_CONFIG`) to the
unchanged official React Native/Expo Release bundle scripts, with development JavaScript
**false**. Use existing signing and native assets; refresh/verify official Updates resources.
These are packaging instructions, not a request to build, install or start Metro.

The installed Expo SDK57 `export:embed` parses `--config` but does not forward it to
`loadMetroConfigAsync`. Its existing internal `EXPO_OVERRIDE_METRO_CONFIG` option is
therefore required for this explicitly selected private graph. No SDK/config source is
patched. Unset both this variable and all other QA-only environment values for normal
packaging. Validate the actual emitted unminified graph **before signing/proof/install**:

```sh
node tests/native-launch/standalone-qa.cjs --verify-bundle /tmp/QA_PACKAGE/main.jsbundle
```

The verifier requires StandaloneQAIndex and checks numeric Metro dependency maps:
AppProvider and useInternalQASession must both import the same private controller;
only its wrapper may consume the original disabled session. An entry marker alone
does not prove isolation. Unsupported/minified formats fail closed. Preserve rejected
packages separately; they are not accepted standalone QA evidence.

The resolver changes only the session module and startup Index for this explicitly selected
bundle. The session wrapper reuses the original `InternalQASession`, existing MockPurchaseService,
AppTrialService evaluator, scenario clock and private stores. Its own import of the original
session bypasses the alias, preventing an import cycle. The original factory/helper exports
retain their normal production gates.

The entry synchronously starts the existing `paid-active` scenario **before** synchronously
loading `expo-router/entry`; native main registration is never delayed by a promise. The
session publishes active ownership immediately. The real AppProvider therefore skips its
personal storage/billing/cache/notification effects from the first mount; `accessReady=false`
keeps GlobalLaunch waiting until the private grant finishes. Existing AppContext applies
the fixture language. The private Index redirects to the actual `/today`, using all normal
cycle/content/access/readiness/intro logic. Existing mock disclosures remain visible.

Service construction is lazy: RevenueCat construction reads only clocks, AppTrialService
stores options, and the storage/notification adapters do not invoke their methods on
construction. Read-only notification response access and the process-local notification
handler remain the normal implementations. No schedule/permission/storage/store call is
needed for this scenario. The VM regression executes actual AppProvider effects with
real-service tripwires and verifies they remain untouched while private access initializes.

The standalone controller cannot stop into the real-data scope: its private `stop()` resets
the synthetic scenario while keeping it active. To end this diagnostic session, reinstall
the retained **normal Release** artifact as an update, without uninstalling or resetting data.
Memory QA preferences/history disappear with the process; personal data was never the QA store.
Preserve separate normal/QA artifact hashes and source provenance. Verify normal entry/config,
production gate tests, restored normal runtime and absence of private QA markers afterward.

```sh
npx vitest run tests/standaloneQA.test.ts tests/internalQA.test.ts tests/internalQAScope.test.ts
npx eslint tests/native-launch/standalone-qa.cjs tests/standaloneQA.test.ts
npm run typecheck
```

These source tests are not standalone/device or visual acceptance. Root owns native
packaging, first Simulator proof, any physical update/capture and final normal restoration.
