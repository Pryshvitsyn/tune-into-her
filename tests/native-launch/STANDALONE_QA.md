# Standalone private QA bundle

This is explicit build tooling for a signed private Release testing artifact on
an already authorized device. It keeps the official bundle ID and existing native binary;
it introduces no native module, account, subscription or production entitlement change.
The ordinary `__DEV__ && EXPO_PUBLIC_USE_MOCK_BILLING` gate, AppContext, routes and package
entry remain unchanged. A false-by-default `standaloneQAEnabled` descriptor only labels
Reset accurately; it never enables access. The private wrapper overrides it to true. Normal Release cannot activate this fixture through an environment
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
the fixture language. By default the private Index opens `/dev-qa`, so the Founder can select every existing
scenario on each cold launch and return through Settings → Internal testing. Use explicit
`--standalone-qa --entry today` only for a direct-to-Today capture. Both entries use normal
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
packaging, Simulator proof and any physical update/capture. Per the November15 final-pass
request, leave the labelled private QA artifact installed and reachable after verification;
retain the normal artifact for an explicitly requested return to personal app use.


## Physical recording acceptance and restoration

Preflight the temporary QA app into its declared portrait orientation before starting the
recorder, then start a genuinely new process after recording readiness. Do not accept the
AVFoundation finishedSuccessfully flag alone: MediaChanged(-11809) can finish a valid short
fragment when orientation/source format changes. Require errorCode 0, expected portrait
geometry, and at least 15 seconds of actual decoded-media duration for a full startup run.
Record Home separately after the app movie closes to avoid mid-movie media-format changes.
These are host recording safeguards; do not retime or modify the app to fix a recorder.

`PhysicalScreenCapture.swift` is a macOS host tool, outside every native app target.
It verifies the already known wired/unlocked phone and selects only the privately pinned
`iOS Device` muxed screen source, excluding camera/Continuity fallbacks. Its video-data
output sends real pixel buffers to a video-only `AVAssetWriter`; no audio/caption track
is recorded. It never requests authorization or changes privacy settings. An owner must
handle any actual system prompt. Graph/stage diagnostics and device receipts stay private.

**Timing boundary:** presentation timestamps use the monotonic Mac host time at each
video callback, not the original device transport PTS. It does not synthesize, interpolate
or replay frames, and does not change the app animation. Host arrival timing includes
transport, decoding and callback scheduling; it cannot measure exact native GPU timing.
Source timestamp gaps, host gaps and reported drops remain in the private result. Ready
means the first real pixel buffer was appended. The requested 15–40-second host timer
starts after that readiness event; writer setup can precede ready and extend total movie
duration. Any writer/session error or changing pixel dimensions rejects the recording.

Compile from the repository root (no device access occurs during compilation):

```sh
mkdir -p /tmp/tih-screen-recorder
cat > /tmp/tih-screen-recorder/Info.plist <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>iPhone Screen Capture QA</string>
  <key>NSCameraUsageDescription</key>
  <string>Capture only the connected iPhone display for authorized QA; camera sources are excluded.</string>
</dict></plist>
PLIST
xcrun swiftc tests/native-launch/PhysicalScreenCapture.swift \
  -framework AVFoundation -framework CoreMediaIO -framework CoreVideo \
  -Xlinker -sectcreate -Xlinker __TEXT -Xlinker __info_plist \
  -Xlinker /tmp/tih-screen-recorder/Info.plist \
  -o /tmp/tih-screen-recorder/record
```

Supply an owner-reviewed private JSON pin outside Git with nonempty string keys
`sourceUniqueID`, `knownPhoneUDID`, `knownCoreDeviceID` and `expectedName`. These must
describe the same already authorized wired phone/source; never choose a source by list
position or substitute a camera. Keep actual identifiers, device name and raw receipts
private. For an explicitly authorized recording, use a fresh output directory:

```sh
mkdir /tmp/tih-screen-recorder/run-01
/tmp/tih-screen-recorder/record --record-pinned-screen \
  /tmp/PRIVATE_SCREEN_PIN.json /tmp/tih-screen-recorder/run-01/screen.private.mov \
  25 /tmp/tih-screen-recorder/run-01/ready.private.json \
  /tmp/tih-screen-recorder/run-01/result.private.json
```

Optional `--wait-for-unlock` permits a bounded 120-second owner-unlock wait; it never
unlocks the phone. The tool does not launch/install/navigate the app. The coordinating
operator starts the authorized cold process only after the fresh ready file exists.
Output/ready/result paths must be distinct, new and resolve under `/tmp`. SIGINT requests
a normal stop; an early/manual stop still requires independent full-duration acceptance.
Inspect error status, decoded frames, duration, geometry and actual content before publishing.
Preserve raw failed fragments separately; strip/redact public media explicitly.

The accepted November 15 panel run appended 1381 frames and decoded 1380 with increasing
PTS. Its initial 1.842183-second gap was confined to the first pair before readiness/cold
launch; the next largest gap was 0.090284 seconds. The appended/decoded count difference
is retained without assigning a cause. Earlier `AVCaptureMovieFileOutput` recordings
repeatedly ended early, including error -11813, even after disabling non-video connections;
a successful individual movie-output run did not establish a reliable fix. The exact
underlying driver/transport cause remains unproven. The host writer is the accepted default;
its timing boundary above still applies. Retain failed movie-output diagnostics privately.

Before testing, privately snapshot existing app storage. Compare actual beforeQA/afterQA/
afterNormalINSTALL files and manifest objects without publishing any key/value/hash of
personal data. Restore a retained signed artifact if installation fails. For the current Founder-testing
workflow, finish with the reviewed private QA artifact installed, not an automatic normal
restore that hides the testing controls. Snapshot and compare storage again after the final
update. A later return to normal must use a normal artifact without private QA markers.
Retain ordinary app identity/profile and never uninstall/reset. Keychain is preserved by
the existing identity and untouched app logic; do not claim a Keychain hash without reading
one. A successful normal launch after the final installation is separate from that storage
snapshot. Crop/redact personal Home wallpaper and labels explicitly before publishing icon
proof; preserve the unedited original privately and label any redaction honestly.
