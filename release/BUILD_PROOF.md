# Build proof — release candidate

Updated: 2026-11-13
Candidate branch: `codex/tune-into-her-release-candidate-20261111`
Selected base: `25c8505` (open PR #6)

## Environment recorded for this audit

| Tooling | Observed version / state |
| --- | --- |
| Node | 26.5.1 |
| npm | 11.17 |
| Expo | 57.0.32 |
| React Native | 0.86.3 |
| Xcode | 26.6 (iOS SDK 26.5) |
| iOS workspace / scheme | `ios/TuneIntoHer.xcworkspace` / `TuneIntoHer` |

## Required evidence matrix

This matrix is deliberately conservative. A row stays pending until the command or
observation ends successfully in the current candidate environment.

| Check | Command / method | Result at document creation |
| --- | --- | --- |
| Lockfile coherence | `npm install --package-lock-only --ignore-scripts --offline` | PASS after adding the exact `expo-system-ui` lock entry; no package download was used. |
| TypeScript | `npm run typecheck` | PASS |
| Lint | `npm run lint` | PASS — 0 errors; 1 warning in generated `.expo/types/router.d.ts` |
| Unit/integration tests | `npm test` | PASS — 17 files, 89 tests |
| Content source/output check | `npm run content:check` | PASS — 610 distinct three-part bundles, 11 locales, 318 editorial texts per locale |
| Content validation | `npm run content:validate` | PASS — 610 bundles, 11 locales, 90-day reserve, unique full bundles; native review remains PENDING |
| iOS Simulator build | Debug and standard Release `xcodebuild -workspace ios/TuneIntoHer.xcworkspace -scheme TuneIntoHer -configuration <Debug/Release> -sdk iphonesimulator -destination 'platform=iOS Simulator,id=DF6B6E06-E5EE-437B-9827-D50E58D0AAE0' build` | PASS — Debug repeated after the QA-access guard |
| App install/launch | Installed and launched `com.eliogenesis.tuneintoher` on iPhone 17 (iOS 26.5) | PASS — standard Release bundle contains `main.jsbundle` (5,209,765 bytes) and opened onboarding |
| Runtime V4 observation | QA-only Debug mock flow on iPhone 17 Simulator | PASS — unlocked Today showed the approved V4 renderer continuously moving for 12+ seconds; light/dark appearance, all three content blocks, gratitude, feedback selection, and scroll were observed |

## Native dependency note

The restored iOS Pod lock references `expo-system-ui`, which was absent from the
selected JavaScript package baseline. The package was declared with the exact archived
version `57.0.3` and a matching lockfile entry. `expo-linear-gradient` `57.0.1` was
also declared and restored locally because the native lock requires it. A clean offline
lockfile-only install succeeded.

The original restored Pods did not match the current JavaScript lockfile. CocoaPods
was synchronized with `pod update … --no-repo-update`: it completed with 120
dependencies and 122 installed pods, including current Expo modules, `EXUpdates`, and
`RNSVG`. Both Debug and normal Release Simulator builds then passed. This is build
evidence only; it is not signing or store evidence.

## 2026-11-13 checkpoint

| Check | Current result |
| --- | --- |
| TypeScript | PASS — `npm run typecheck` |
| Lint | PASS — 0 errors, 13 existing import/generated warnings |
| Unit/integration tests | PASS — 17 files, 91 tests |
| Content checks | PASS — 610 bundles, 11 locales, 90-day reserve; native review remains PENDING |
| Deep Intro V2 package checks | PASS — 32 checks, including actual V4 GLSL/loop and oval-mask safeguards |
| Android JavaScript export | PASS — Hermes Android bundle with 29 assets exported; this is not a Gradle/emulator/device result |
| SVG dependency diagnosis | `react-native-svg` only changed from 15.15.4 to exact 15.16.0, then `pod install --no-repo-update` succeeded. A single Debug rebuild stalled after compiling RNSVG sources and produced no fresh app; no post-update Simulator claim is made. |
| Expo Doctor | 19/21 checks passed. It flags the pre-existing managed-config/native-folder synchronization condition and Expo's expected 15.15.4 versus targeted 15.16.0 RNSVG version, plus existing Expo patch-version drift. No broad dependency upgrade was made. |

## Runtime observation boundary

The normal Release bundle was installed and launched on the configured iPhone 17
Simulator. The first onboarding screen rendered its V4 sphere and all eleven language
choices. Completing the local onboarding reached the real paywall, where the app
honestly reported that a store offer was unavailable rather than inventing a price or
trial.

The existing mock-billing implementation is deliberately `__DEV__`-only. In the Debug
Simulator it required `EXPO_PUBLIC_USE_MOCK_BILLING=true` and displayed the explicit
localized `DEVELOPMENT MOCK BILLING` label. That existing QA path reached unlocked
Today; V4 motion was visually observed for more than twelve seconds, followed by a
phase-shifted frame, and feedback, scrolling, light appearance, and dark appearance
were exercised. The unit guard asserts that the same flag is false when `__DEV__` is
false, while `release-check` rejects mock billing for distribution.

This is development-QA evidence only. It does not prove a RevenueCat offering, a store
purchase or restore, a physical-device install, compact/large-text layout, every locale,
or store readiness. The host macOS locked after the completed core observations, so no
additional Simulator interaction was claimed from that point.

## Integrity checks that must accompany a passing run

```text
TuneIntoHerSphereV4.tsx
7c46b5ab8fbd587fb70b1e557365f6d505dc2a1a82f8ed5a536220a2dea6ef39

assets/tune_into_her_sphere_source_clean.png
50e988dde8cdd04b945883a1404fd95881b55ad86087274a5a5b594063f0509c

assets/tune_into_her_sphere_phase0_poster.png
70fc3712d6d1048f46833d038c96f8c3502632b81e523b98bcc8ff94b9dccb87
```

## Non-evidence

- A partial DerivedData application without a completed `Info.plist` is not a build
  proof and must not be installed as one.
- A simulator build does not prove signing, provisioning, App Store submission, RevenueCat
  purchase flow, device notifications, or legal/store readiness.
- Historical CI runs and a prior source-only passing suite do not substitute for this
  final candidate rerun.
