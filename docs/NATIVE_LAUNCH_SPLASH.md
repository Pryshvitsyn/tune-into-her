# Native launch bridge and build proof

Updated: 2026-11-14 (Europe/Rome). Runtime cases and media:
[LAUNCH_QA](LAUNCH_QA.md) · [evidence index](../release/evidence/launch-20261114/README.md).

The native splash is static. WebGL starts only in the React Native/WebView runtime.
Root module-scope `SplashScreen.preventAutoHideAsync()` retains that bridge until an
actual configured GPU frame or a loaded compatible image is ready and painted. The
shared global controller then owns the approved nine-second scene, additional animated
sphere second and destination fade. No native splash is described as pre-runtime WebGL.

## Approved assets and iOS layout

`assets/launch/official-launch-mark.png` derives from the approved brand texture. Its
alpha, dimensions, padding, emblem and outlined Linux Libertine O wordmark are unchanged;
only RGB mask pixels receive the existing light ink `#294458`. Pixel tests report zero
alpha differences. Source PNG SHA256:
`347cb7e26f2f9006b1655fbbb5768e2129e4cfb3975a31a83e8adef4eb57517b`.
This vector-outline image does not itself establish an installed UI font.

`assets/launch/silver-gradient.png` deterministically samples the existing horizontal
`#DCE3E9` → `#F9FBFC` → `#DCE3E9` background. `node assets/launch/generate.cjs` uses installed
pngjs; it creates native representations, not a new illustration or logo geometry.
The approved V4 renderer, original textures, logo sources and timeline remain unchanged.

The storyboard fills the native window. Padded image width is
`min(0.95 * viewportWidth,525)` with ratio800:560, matching the React Native fallback's
existing padded sizing and centered alignment. Both OS appearances use the approved
light-silver launch; the saved app theme applies at the destination. Native storyboard
and canonical asset copies are checked in for the existing non-CNG iOS checkout.

`with-approved-launch-splash.cjs` is listed before the SDK57 official splash plugin so
its storyboard mod runs before the official provider finalizes the result. Isolated
`expo prebuild --platform all --no-install` passed and retained this layout; ibtool
compiled original/generated storyboards with zero errors/warnings. Temporary prebuild
output was removed for disk space; `/tmp/tih-global-launch-prebuild.log` remains local.
The current controller-based status-bar flag is also mirrored in native/Expo config and
covered by a parsed-plist consistency test. Native configuration changes need a binary.

## Android limits and actual attempt

Expo57 generates the original logo on the silver center color for Android system splash.
Android12+ bounds the OS icon/background; no arbitrary full-screen WebGL choreography
or pixel-identical iOS sizing/gradient is claimed for that phase. The subsequent RN
fallback/scene uses the approved full viewport. Existing Android package ID is preserved.

The installed generator contains the padded image in a288×288dp transparent canvas.
Nonzero alpha width is998/1600 (62.4%); resulting mark width is180dp. Direct generation
at all five densities reports zero nontransparent pixels outside the96dp safe radius;
worst alpha-pixel-corner radius90.796dp leaves about5.2dp clearance after sampling.
This protects geometry against known icon clipping, not OEM/runtime behavior.

Actual isolated `./gradlew :app:assembleRelease` was attempted and stopped before Gradle
compilation: this host has no Java runtime, Android SDK/adb or emulator. Log:
`/tmp/tih-global-launch-android-build.log`. No APK/AAB, TalkBack, SVG/WebView runtime or
flash-free Android handoff success is claimed. The final production JS export separately
passes with exact OTF/full notices:
`entry-9916bd412524f9dcfdd2f89606f2a1b6.hbc`,6,735,079bytes.

## Final iOS artifacts

Full workspace signed Release builds passed. Final app-target incremental builds reuse
the same retained, unchanged Pods products. Native UI testing corrected live text-layout
invalidation, picker measurements, fixed-size decorative glyphs and status-bar contrast.
All readable body/value/option/action text still scales. The root native Stack is the
single color owner, using dark icons for launch/Light and light icons for Dark. The
Info.plist/Expo controller policy is true; status-bar visibility/geometry is unchanged.

The official installed `expo-updates/scripts/create-updates-resources-ios.sh` was run
unchanged before the final incremental artifacts. It refreshes manifest and native-config
fingerprint using Release mode, existing ios/Pods/project roots, shallow bundle format
and the appropriate EXUpdates product directory. No SDK edits, skip-bundling or fingerprint
override was used. The generated bundle directory was touched for Xcode input tracking;
app copies of manifest ID/bytes and fingerprint match the fresh products exactly.

Final Simulator artifact passes signing and controller-flag checks. Embedded JS SHA256:
`2c1fd0a85861a6ae1be2750f0c991426323557bccb3a6618f73a5bf980f4abc8`.
Log: `/tmp/tih-global-launch-ios-statusbar-final.log`. Clean final installation, full
motion/hold/fade, final Light/Dark flows and native Dark clock-pixel checks are in LAUNCH_QA.
No runtime development Metro server is required.

Physical iPhone11Pro/iOS26.6: the earlier full Release build, data-preserving update,
cold launch (PID34402) and survival at+39.68s passed. That is a pre-accessibility/status-bar
checkpoint, not a visual proof of the final binary. Its original app data was retained.

Final generic iphoneos app-only artifact passes in68.38s with unchanged existing signing.
Artifact: `/tmp/tih-global-launch-physical-derived/Build/Products/Release-iphoneos/TuneIntoHer.app`.
All20 guards pass: strict signature, correct app/team/current-phone profile membership
and expiry, controller flag, refreshed JS, exact original font/full notices and fresh
manifest/fingerprint copies. No provisioning-update/device-registration flags or Team
overrides were used. Log: `/tmp/tih-global-launch-ios-statusbar-physical-final.log`.
Raw artifact guards/device/signing results remain outside Git.

The final phone update is pending unlock. A prior install service failed (CoreDevice3002,
IXRemoteErrorDomain5/device83); selected-device preparation also requested unlock. Fresh
read-only lock checks continue to report passcodeRequired=true. No unlock, locked retry,
uninstall/reset, pairing repair or permission change was attempted. Final phone route,
animation, visual and screen-reader proof is not claimed. CUA fails before app access
because this session's configured writable root is symlinked; the root was not changed.

## References

[Expo57 SplashScreen](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/),
[SDK57 iOS plugin](https://github.com/expo/expo/blob/sdk-57/packages/expo-splash-screen/plugin/src/withIosSplashScreen.ts),
[Android system splash](https://developer.android.com/develop/ui/views/launch/splash-screen),
[Native Stack status-bar options](https://reactnavigation.org/docs/native-stack-navigator/),
[reported RN iOS Dynamic Type behavior](https://github.com/react/react-native/issues/57512).
