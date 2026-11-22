# Ordinary Release + real sandbox trial UI verification

This reuses the existing native-launch XCTest helpers with the original device guard intact. The shared scroll helper adds only an optional
edge-gesture position; all existing callers retain the original center default. `create.rb` makes a **new empty iPhone 17 Pro Simulator**, records
its UUID in `/tmp`, and embeds exactly that UUID into a separate generated runner's
simulator-only guard. Physical devices and previously existing simulators are excluded.
No application target, billing bypass, injected JS, clock manipulation or data reset is
added. Only newly entered synthetic 28/5 cycle data and the real sandbox guest trial are
persisted in the newly created Simulator.

Use a normal signed Simulator Release with demo/mocks disabled and the sandbox HTTPS
trial URL bundled. A signature created by Xcode with simulated entitlements is necessary
for SecureStore; `CODE_SIGNING_ALLOWED=NO` is a compile check, not a usable Keychain UI
fixture. The iOS App Store distribution signing gate remains separate.

```sh
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.17.0/libexec \
  ruby tests/native-release/create.rb /tmp/tih-release-native-uiqa-unique
```

Boot/install only the newly recorded UUID. Run the fresh case first, then the three
language groups and themes/documents case, using the generated `LaunchUIQA.xcodeproj`/scheme, `-parallel-testing-enabled NO`,
`-destination platform=iOS\ Simulator,id=THE_NEW_UUID` and a unique xcresult path:

1. `LaunchUIQA/LaunchUIQA/testReleaseFreshOnboardingAndRealSandboxTrial`
2. `LaunchUIQA/LaunchUIQA/testReleaseNormalLocalesChineseMalay`
3. `LaunchUIQA/LaunchUIQA/testReleaseNormalLocalesCyrillicHindi`
4. `LaunchUIQA/LaunchUIQA/testReleaseNormalLocalesLatin`
5. `LaunchUIQA/LaunchUIQA/testReleaseRealTrialThemesDocumentsAndReducedMotion`

The first explicitly starts the card-free sandbox trial; it never buys/restores a store
product. The language groups require that real trial and check Settings/language, Cycle,
authored Today and Learn in all eleven locales, restoring English after each group.
The same full-loop case remains available, but the groups bound XCTest result/recording
size on this storage-constrained host without dropping any locale or assertion. Selection
requires the actual visible ✓, rather than assuming a gesture was saved. Themes verify
actual screenshot luminance, Home/cold Dark persistence, normal documents/History, accessible
Restore and UIKit-observed Reduced Motion, then restore Light/motion OFF. No purchase is
made. These cases do not imply native
speaker, clinical, store-purchase or notification-delivery approval. The original 375pt
status-bar pixel calibration is not reused as a 402pt acceptance threshold.

Do not run the inherited entire test suite. Do not substitute a personal device UUID or
reset an existing app. Review screenshots and the actual XCTest result before claiming a
pass. Keep private device/credential logs out of Git. Clean up only the generated runner
and its explicitly owned Simulator when no longer needed. Current results are recorded in
[release preparation](../../release/RELEASE_PREPARATION.md).

Require adequate host disk headroom before running. A recorded low-disk language-save
error is rejected evidence, not a successful locale switch. The optional
`testReleaseRecoverPriorDiskSaveError` is only for that exact observed Hindi error after
disk space has been recovered; it verifies a real successful retry without resetting data.
It never dismisses an error during a language acceptance loop. Shared fixed-control and
tab retries anchor their center to the actual element, avoiding root-window coordinate
offsets on Dynamic Island devices; simulator/physical-device guards remain intact.

## Real-key native offering / retry observation — 22 November 2026

After onboarding and explicit real sandbox trial have reached English Today, run:
`LaunchUIQA/LaunchUIQA/testFinalBillingNativeStoreAvailabilityAndRetry`.
The method is copied verbatim from the native case actually compiled/executed in the
November22 isolated runner. It reuses the guarded generator and existing navigation/
scroll helpers. It opens normal Settings → Subscription, waits for native store offers or
recoverable failure, exercises Retry, checks Restore remains enabled **without tapping it**,
and returns through Home to the independent real-trial Today. It never buys, restores,
resets data, changes the clock or injects an entitlement.

The accepted November22 result is **store unavailable + retry + trial remains usable**.
No real product/price/purchase acceptance is inferred from this pass. The optional
products-rendered branch is not a substitute for verifying both actual store packages,
periods/prices/entitlements and sandbox transactions after owner prerequisites are ready.
A separately prepared/continued onboarding case proved real trial → Today → cold restart;
the original fresh case's reminder wait failure is retained, not marked passed.
The prior native Release was copied and re-embedded with the current normal Hermes
bundle/public SDK key, with unchanged unsigned Mach-O payload and verified ad-hoc signature;
this is **not a new native compile, IPA or TestFlight build**.

[Actual current results, screenshots and full standalone video](../../release/evidence/final-billing-20261122/native/runtime-results.json).
The tested temporary runner is restricted to its newly created SE3; the canonical generator
continues to create a new isolated iPhone17Pro and must not target an existing personal
Simulator. Larger-device rerun and required store screenshot sizes remain unverified in
this low-space pass. Keep the existing guard and all original assertions.
