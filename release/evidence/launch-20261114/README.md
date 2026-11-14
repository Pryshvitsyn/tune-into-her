# Actual iOS launch and onboarding evidence

2026-11-14, branch `codex/monetization-20261113`. Real standalone Release on the task-created
compact iPhone SE3/iOS26.5 Simulator; screenshots are750×1334px. Only synthetic default
cycle data is used. No trial, purchase or restore was activated. No mock paid access.
Original simulator and physical-user data were preserved.

Final iOS embedded JS SHA256:
`2c1fd0a85861a6ae1be2750f0c991426323557bccb3a6618f73a5bf980f4abc8`.
Final source checks:254 tests/33 files, typecheck PASS, lint0 errors/3 existing warnings,
content and font-notice checks PASS. Full details/build limitations:
[LAUNCH_QA](../../../docs/LAUNCH_QA.md) and [native harness](../../../tests/native-launch/README.md).

## Recordings

| File | Actual proof |
| --- | --- |
| [First installation](first-install.mp4) | Exact final binary, genuinely clean disposable device, native logo→approved scene→animated hold→Light onboarding |
| [Existing user cold entry](cold-launch.mp4) | Exact final binary, synthetic completed onboarding without access→locked Today |
| [Warm navigation](warm-navigation.mp4) | Earlier unchanged-launch-controller checkpoint: Settings→Advice, same PID14964, no global replay, locked screen within3s |
| [Background during intro](background-during-intro.mp4) | Earlier unchanged-controller checkpoint: actual texture-motion phase detected,4s background, same PID18201 resumes rather than restarting |
| [Reduced Motion](reduced-motion.mp4) | Earlier unchanged-controller checkpoint: native setting ON, no full choreography, locked entry; OFF restored through native Settings |

The last three recordings precede late text/icon/status-bar presentation corrections;
those changes did not alter scene shaders, timeline, clock, routing gates or lifecycle.
Videos are genuine simctl captures transcoded to376px/30fps for size, without speeding up
or cutting the choreography. They may include OS launcher/Settings lead-in. Bright foil
inside the approved motion is part of the scene, not a blank handoff frame.

## Main native screenshots

| Light | Dark |
| --- | --- |
| [Welcome](onboarding-welcome.png) | [Welcome](dark-welcome.png) |
| [Single language picker](language-wheel.png) | [Picker](dark-picker.png) |
| [Context — two lines](context-two-lines.png) | [Context](dark-context.png) |
| [Date](date.png) | [Date](dark-date.png) |
| [Typical values](typical.png) | [Typical values](dark-typical.png) |
| [Preview](preview.png), [scrolled DO](preview-scrolled.png) | [Preview](dark-preview.png), [scrolled DO](dark-preview-scrolled.png) |
| [Reminders off](reminders.png) | [Reminders off](dark-reminders-off.png) |
| [Existing paywall](paywall.png) | [Existing paywall](dark-paywall.png) |

Final Light/Dark six-step flows pass the same29 assertions. Final Dark additionally
requires white clock pixels on graphite at every captured stage, including modal/date/
paywall; all nine counts390–422 exceed the calibrated80-pixel threshold. Light captures
were visually checked for black clock contrast. [Locked final entry](locked-today.png).

## Accessibility / original font

- [Largest-text picker](largest-picker.png), [checked box](largest-checkbox.png),
  [steppers](largest-steppers.png): actual native full action bounds and visible symbols.
  These font/icon checkpoints precede only the final status-bar policy correction.
- [Hindi](picker-hindi.png) and [Chinese](picker-chinese.png): actual native script fallback
  in the all11-value traversal checkpoint. The packaged original font/fallback policy is
  unchanged in the final binary. Cancel retained English.
- [Before background](before-background.png) and [after resume](after-background.png)
  capture the actual moving texture phase and continuation, not an assumed timer delay.
- Original Linux Libertine O binary/glyph/license proof:
  [font README](../../../assets/fonts/README.md), [font tests](../../../tests/fontCoverage.test.ts).

Full spoken VoiceOver/TalkBack, configured native valid-access/slow/offline scenarios,
Android native runtime and physical-phone visual/route/speech proof remain unverified.
The exact final phone Release update, cold launch and+54.18s process check PASS after
owner unlock; [sanitized physical proof](physical-runtime.json). No uninstall/reset or
financial action was performed.
Raw build/device/signing logs, xcresults and app binaries stay outside Git.

## Changed files

Media in this folder are listed above. All other changed paths for this local change:

- [ARCHITECTURE.md](../../../ARCHITECTURE.md)
- [DECISIONS.md](../../../DECISIONS.md)
- [PRODUCT_SNAPSHOT.md](../../../PRODUCT_SNAPSHOT.md)
- [TASKS.md](../../../TASKS.md)
- [app.config.ts](../../../app.config.ts)
- [app/_layout.tsx](../../../app/_layout.tsx)
- [app/cycle.tsx](../../../app/cycle.tsx)
- [app/onboarding.tsx](../../../app/onboarding.tsx)
- [app/privacy.tsx](../../../app/privacy.tsx)
- [app/settings/reminder.tsx](../../../app/settings/reminder.tsx)
- [app/terms.tsx](../../../app/terms.tsx)
- [app/today.tsx](../../../app/today.tsx)
- [assets/fonts/LICENCE.txt](../../../assets/fonts/LICENCE.txt)
- [assets/fonts/LinuxLibertineO-Regular.otf](../../../assets/fonts/LinuxLibertineO-Regular.otf)
- [assets/fonts/OFL.txt](../../../assets/fonts/OFL.txt)
- [assets/fonts/README.md](../../../assets/fonts/README.md)
- [assets/fonts/license.generated.json](../../../assets/fonts/license.generated.json)
- [assets/launch/SplashScreen.storyboard](../../../assets/launch/SplashScreen.storyboard)
- [assets/launch/generate.cjs](../../../assets/launch/generate.cjs)
- [assets/launch/official-launch-mark.png](../../../assets/launch/official-launch-mark.png)
- [assets/launch/silver-gradient.png](../../../assets/launch/silver-gradient.png)
- [docs/LAUNCH_QA.md](../../../docs/LAUNCH_QA.md)
- [docs/NATIVE_LAUNCH_SPLASH.md](../../../docs/NATIVE_LAUNCH_SPLASH.md)
- [ios/Podfile.lock](../../../ios/Podfile.lock)
- [ios/TuneIntoHer/Images.xcassets/LaunchLogo.imageset/Contents.json](../../../ios/TuneIntoHer/Images.xcassets/LaunchLogo.imageset/Contents.json)
- [ios/TuneIntoHer/Images.xcassets/LaunchLogo.imageset/official-launch-mark.png](../../../ios/TuneIntoHer/Images.xcassets/LaunchLogo.imageset/official-launch-mark.png)
- [ios/TuneIntoHer/Images.xcassets/LaunchSilverGradient.imageset/Contents.json](../../../ios/TuneIntoHer/Images.xcassets/LaunchSilverGradient.imageset/Contents.json)
- [ios/TuneIntoHer/Images.xcassets/LaunchSilverGradient.imageset/silver-gradient.png](../../../ios/TuneIntoHer/Images.xcassets/LaunchSilverGradient.imageset/silver-gradient.png)
- [ios/TuneIntoHer/Info.plist](../../../ios/TuneIntoHer/Info.plist)
- [ios/TuneIntoHer/SplashScreen.storyboard](../../../ios/TuneIntoHer/SplashScreen.storyboard)
- [package-lock.json](../../../package-lock.json)
- [package.json](../../../package.json)
- [plugins/with-approved-launch-splash.cjs](../../../plugins/with-approved-launch-splash.cjs)
- [release/evidence/launch-20261114/README.md](../../../release/evidence/launch-20261114/README.md)
- [scripts/generate-font-license.mjs](../../../scripts/generate-font-license.mjs)
- [src/components/AdviceBlocks.tsx](../../../src/components/AdviceBlocks.tsx)
- [src/components/AppText.tsx](../../../src/components/AppText.tsx)
- [src/components/Button.tsx](../../../src/components/Button.tsx)
- [src/components/Header.tsx](../../../src/components/Header.tsx)
- [src/components/LanguagePicker.tsx](../../../src/components/LanguagePicker.tsx)
- [src/components/Mist.tsx](../../../src/components/Mist.tsx)
- [src/components/NumberStepper.tsx](../../../src/components/NumberStepper.tsx)
- [src/components/PaywallCard.tsx](../../../src/components/PaywallCard.tsx)
- [src/components/languageSelection.ts](../../../src/components/languageSelection.ts)
- [src/context/AppContext.tsx](../../../src/context/AppContext.tsx)
- [src/intro/AnimatedToday.tsx](../../../src/intro/AnimatedToday.tsx)
- [src/intro/GlobalLaunch.tsx](../../../src/intro/GlobalLaunch.tsx)
- [src/intro/LaunchPresentation.tsx](../../../src/intro/LaunchPresentation.tsx)
- [src/intro/SphereIntroSurface.tsx](../../../src/intro/SphereIntroSurface.tsx)
- [src/intro/introSession.ts](../../../src/intro/introSession.ts)
- [src/intro/launchCopy.ts](../../../src/intro/launchCopy.ts)
- [src/intro/launchRouting.ts](../../../src/intro/launchRouting.ts)
- [src/intro/launchState.ts](../../../src/intro/launchState.ts)
- [src/intro/premiumFont.ts](../../../src/intro/premiumFont.ts)
- [src/intro/sphereHtml.ts](../../../src/intro/sphereHtml.ts)
- [src/theme/index.ts](../../../src/theme/index.ts)
- [src/theme/typography.ts](../../../src/theme/typography.ts)
- [tests/dailyGuidance.test.ts](../../../tests/dailyGuidance.test.ts)
- [tests/fontCoverage.test.ts](../../../tests/fontCoverage.test.ts)
- [tests/fontLicenseEmbedding.test.ts](../../../tests/fontLicenseEmbedding.test.ts)
- [tests/introRuntime.test.ts](../../../tests/introRuntime.test.ts)
- [tests/introSession.test.ts](../../../tests/introSession.test.ts)
- [tests/launchReadiness.test.ts](../../../tests/launchReadiness.test.ts)
- [tests/launchRouting.test.ts](../../../tests/launchRouting.test.ts)
- [tests/launchState.test.ts](../../../tests/launchState.test.ts)
- [tests/native-launch/LaunchUIQA.swift](../../../tests/native-launch/LaunchUIQA.swift)
- [tests/native-launch/README.md](../../../tests/native-launch/README.md)
- [tests/native-launch/StatusBarPixels.swift](../../../tests/native-launch/StatusBarPixels.swift)
- [tests/native-launch/create.rb](../../../tests/native-launch/create.rb)
- [tests/nativeLaunchSplash.test.ts](../../../tests/nativeLaunchSplash.test.ts)
- [tests/onboardingLanguageSelection.test.ts](../../../tests/onboardingLanguageSelection.test.ts)
