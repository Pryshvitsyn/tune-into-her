# Isolated native iOS launch/onboarding UI harness

This standalone XCUITest runner drives the separately installed **Release** app `com.eliogenesis.tuneintoher`; it does not add targets to the application, inject JS, run Metro, change macOS Accessibility permissions, or use billing mocks. Source originated in `/tmp/tih-launch-uiqa` on 2026-11-14.

**Use only the synthetic QA simulator** `32C5B1E9-BE95-4BC1-8B76-4CE7D2A9979B` (name: `Tune Into Her Launch QA`, iOS 26.5, 375×667pt). Never substitute the Founder's original simulator or a physical device. The Swift harness also skips unless the native runner reports that exact simulator UUID; it skips physical devices. Do not delete/reset app data to satisfy a precondition. The application must already be installed with a signed simulator Release build.

Generate and run one explicitly selected test (not the entire suite):

```sh
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.17.0/libexec \
  ruby tests/native-launch/create.rb /tmp/tih-launch-native-uiqa
cd /tmp/tih-launch-native-uiqa
xcodebuild test \
  -project LaunchUIQA.xcodeproj -scheme LaunchUIQA -configuration Debug \
  -destination 'platform=iOS Simulator,id=32C5B1E9-BE95-4BC1-8B76-4CE7D2A9979B' \
  -derivedDataPath /tmp/tih-launch-native-uiqa/DerivedData \
  -resultBundlePath /tmp/tih-launch-native-uiqa/result-unique-name.xcresult \
  -parallel-testing-enabled NO \
  '-only-testing:LaunchUIQA/LaunchUIQA/testLanguageCancelDoneAndOnboarding'
```

Run the generator from the repository root. It rejects destinations outside `/tmp`; it copies only the Swift test/helper sources and creates an independent test project there. The repository stores no generated Xcode target.

The CocoaPods `xcodeproj` gem was already installed. No dependency installation was needed. Generated Xcode files/build products/result bundles stay outside the app repository. Use a unique result path on each run.

Every app capture now includes a public CoreGraphics pixel check for dark status-bar readability. `StatusBarPixels.swift` draws the native CGImage into an explicit RGBA buffer; a graphite corner sample (all RGB below 64) activates a clock-region check (x40–65% of image width; y1–19pt for this 375pt-wide QA device). More than 80 pixels must have all RGB channels above 210. Light screenshots skip this Dark-only check, and OS Settings/SpringBoard captures explicitly opt out. Actual calibration with preserved screenshots: readable Dark welcome RGB [18,29,38], 375 white clock pixels; previously failing Dark paywall same background, 0 white pixels. This catches the observed black-clock bug independently of AX text/style props. No private APIs or image modification are used.

The harness contains 12 named XCTest scenarios. They were run individually with state-specific preconditions; this is not a claim that a single 12-case suite ran against one final build. Select the appropriate scenario deliberately:

- `testDiscoverOnboarding`: cold-launches the installed app, waits for Continue, records the real native hierarchy and screenshot. Requires incomplete onboarding.
- `testOpenLanguageDiscovery`: activates step 1, opens Language, records its adjustable control/value and Cancel/Done bounds, Cancels. If currently on another onboarding step, uses existing Back controls to return. Requires incomplete onboarding.
- `testLanguageCancelDoneAndOnboarding`: cold-launches, changes wheel draft with a real swipe, Cancels and proves English unchanged/reset on reopen, confirms the same English, checks exact two-line Context label and 76pt bounds at default font scale, verifies the existing acknowledgement alert, then enters no real personal information: date is the synthetic QA default today, cycle 28 days/period 5 days. Checks preview order KEEP IN MIND→SUPPORT→DO, turns reminders OFF, finishes to the existing paywall. **This intentionally persists only that synthetic onboarding data.** Never taps Start Trial / Buy / Restore. Contains 29 assertions. Requires incomplete onboarding and default system text size.
- `testConfirmReducedMotionAtCurrentSettingsScreen`: activates QA Settings and navigates Accessibility→Motion if its last view was reset. Records before state, taps the native inner UISwitch only if needed, waits for native value 1, captures enabled state. **Leaves QA Reduced Motion ON** for independent launch-video capture. No macOS settings changes. Original enabling used a precise right-hand hit after a generic row-centered tap failed. The packaged helper now targets the native inner control, which was verified during restoration.
- `testRestoreReducedMotionOffAtCurrentSettingsScreen`: after independent Reduced Motion launch recording, activates Settings and navigates Accessibility→Motion if necessary, taps the native inner UISwitch only if ON, waits for native value 0, captures restored OFF state. A bounded thumb-drag fallback is available if a native tap does not settle; the successful observed run used the inner tap and did not need the fallback. The QA setting was actually restored OFF on 2026-11-14.

- `testWarmSettingsAdviceStaysLockedWithoutIntro`: requires the installed application already running on locked Today. Clears an actual existing Open confirmation from SpringBoard/the app if present; it does not open a URL itself. Activates the existing process, navigates Settings→Advice using native controls (or the approved bottom-tab coordinates if tab accessibility types are ambiguous), asserts the locked screen within 3 seconds, no protected KEEP IN MIND content, and the same native PID before/after. Never taps subscription actions. Actual run PASS 12.864s, 0 failures; PID 14964 unchanged. Native recording waited for simctl's first-frame acknowledgement before XCTest started: `/tmp/tih-launch-uiqa/final-warm-navigation.mp4`. Result/log: `/tmp/tih-launch-native-uiqa/warm-navigation.{xcresult,log}`.

- `testAllElevenPickerValuesCancelPreservesEnglish`: at default system text size and incomplete English onboarding, uses ten native one-row slow drags with a settling hold. Every existing locale value must be observed exactly in order (English, Français, Italiano, Español, Deutsch, Русский, Українська, हिन्दी, 简体中文, Bahasa Melayu, Baba Melayu · Peranakan). Captures each native value and Cancels; English stays saved. Actual PASS 31.274s, 0 failures on the final installation before the live-font-scale fix. Evidence `/tmp/tih-launch-native-uiqa/all-eleven-picker.xcresult`; Hindi/Chinese screenshots exported under `all-eleven-attachments`.
- `testLargestTypeWelcomePickerActionsReachable`: expects the QA simulator's system text size already set to accessibility-extra-extra-extra-large and a settled cold app at onboarding step 1. Scrolls to the language row, opens the picker, and requires both action controls fully within the visible app frame before Cancel. An earlier weaker run returned PASS 15.149s using only isHittable, but visual/AX review revealed Done at y=649, height=110 on a 667pt screen (18pt visible), so that run is explicitly **not** evidence of correct largest-type action reachability. The strengthened assertions were actually rerun on the final glyph-fixed Release build: PASS 7.078s, 0 failures, Cancel y416.5→526.5 and Done y538.5→648.5 within 667pt. Evidence `/tmp/tih-launch-native-uiqa/final-max-glyphs.xcresult`. Raw evidence `/tmp/tih-launch-native-uiqa/largest-type-picker.xcresult` is preserved for diagnosis.

- `testLargestTypeContextAndTypicalInspectionNoSave`: at the largest system text size, enters Context, scrolls until the checkbox row's actual center is visible, checks it if needed, records the centered checked glyph, advances only through the date and Typical step 4, and captures the complete 48pt stepper controls. Returns via Back three times to step 1. Never taps preview Continue (the cycle-persistence boundary), Finish, or billing. Final native run PASS 41.088s, 0 failures. The ✓ and −/+ were then visually inspected and are fully visible inside their controls while worded labels and values remain large. Both final MAX tests passed together in 48.166s on the same PID 23190; screenshots are under `/tmp/tih-launch-native-uiqa/final-max-glyphs-attachments`.

- `testSelectDarkThemeWelcomeContextNoSave`: requires the QA app's existing appearance route already opened (a pending native Open confirmation is handled). Selects the existing Dark radio and waits for enabled ●Dark, which follows the screen's awaited preference save. Uses Header Back to return to onboarding, captures Dark welcome and the exact default-size two-line Context/76pt bounds, then returns to welcome. Does not touch acknowledgement, date, cycle save, Finish, or billing. Actual PASS 12.231s, 0 failures on the final Release build. It intentionally leaves the QA-only stored theme Dark for cold-start recording; default system text size is preserved. Result `/tmp/tih-launch-native-uiqa/final-dark-theme.xcresult`; screenshots under `final-dark-theme-attachments`.

- `testSelectLightThemeForFinalRevisit`: requires the existing Appearance route already open. Handles a pending native Open confirmation, activates the app, selects the existing Light radio, waits for enabled ●Light after save, and captures it. Actual final PASS 3.190s, 0 failures.
- `testFinalLightRevisitFullOnboardingNoReset`: requires the existing onboarding URL already opened; handles its native Open confirmation, then reuses `completeOnboardingAssertions` (the same 29 flow assertions as the cold-entry test). Actual final PASS 25.466s, 0 failures, ending on the existing paywall with only synthetic 28/5 and reminders OFF. This is explicitly a **Light revisit**, not a first-install claim; app data was not reset, and subscriptions were not bypassed.

For the final no-reset Light revisit, open Appearance with `xcrun simctl openurl` on the guarded QA UUID, run `testSelectLightThemeForFinalRevisit`, then open `com.eliogenesis.tuneintoher://onboarding` with the same CLI and run `testFinalLightRevisitFullOnboardingNoReset`. A direct public `XCUIApplication.open(URL)` attempt delivered the route but timed out waiting for accessibility before any UI action/assertion; that failed entry is recorded rather than counted as a pass. The final scenarios use the already-proven CLI URL→native Open-confirmation path. They inject no JS and alter no routing or billing fixtures.

Restore after recording (Settings may be at its root or Accessibility→Motion):

```sh
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.17.0/libexec \
  ruby tests/native-launch/create.rb /tmp/tih-launch-native-uiqa
xcodebuild test \
  -project /tmp/tih-launch-native-uiqa/LaunchUIQA.xcodeproj -scheme LaunchUIQA \
  -configuration Debug \
  -destination 'platform=iOS Simulator,id=32C5B1E9-BE95-4BC1-8B76-4CE7D2A9979B' \
  -derivedDataPath /tmp/tih-launch-native-uiqa/DerivedData \
  -resultBundlePath /tmp/tih-launch-native-uiqa/restore-reduced-motion.xcresult \
  -parallel-testing-enabled NO \
  '-only-testing:LaunchUIQA/LaunchUIQA/testRestoreReducedMotionOffAtCurrentSettingsScreen'
```

Attachments:

```sh
xcrun xcresulttool export attachments \
  --path /tmp/tih-launch-uiqa/onboarding-flow-final.xcresult \
  --output-path /tmp/tih-launch-uiqa/onboarding-attachments
```

Recorded native runs (selected scenarios; earlier checkpoints are distinguished from final build evidence):

| Scenario | Result | Native duration | Evidence |
| --- | --- | --- | --- |
| Cold-start onboarding discovery | PASS, 0 failures |23.538s including launch/intro/automation |`discovery.xcresult` |
| Language modal discovery/Cancel | PASS, 0 failures |4.649s |`language-discovery.xcresult` |
| Initial synthetic onboarding, 29 assertions | PASS, 0 failures |47.005s including cold launch |`onboarding-flow-final.xcresult` |
| Glyph-build Dark full onboarding, before status-bar fix | Functional PASS; visual status-bar defect found |43.410s |`/tmp/tih-launch-native-uiqa/final-dark-full-onboarding.xcresult` |
| Final status-bar build, Dark full 29 +9 clock checks | PASS, 0 failures |43.065s including cold launch |`/tmp/tih-launch-native-uiqa/statusbar-final-dark-full.xcresult` |
| Final Light selection, no reset | PASS, 0 failures |3.190s |`/tmp/tih-launch-native-uiqa/statusbar-final-light-selection.xcresult` |
| Final Light revisit, shared 29 flow assertions | PASS, 0 failures |25.466s |`/tmp/tih-launch-native-uiqa/statusbar-final-light-full.xcresult` |
| QA Reduce Motion confirmed native ON | PASS, 0 failures |4.837s |`reduced-motion-setting-confirmed.xcresult` |
| QA Reduce Motion restored native OFF | PASS, 0 failures |15.649s |`/tmp/tih-launch-native-uiqa/restore-reduced-motion-navigated.xcresult` |
| Warm Settings→Advice, same PID, locked route | PASS, 0 failures |12.864s |`/tmp/tih-launch-native-uiqa/warm-navigation.xcresult` |
| All eleven native picker values, Cancel preserves English | PASS, 0 failures |31.274s |`/tmp/tih-launch-native-uiqa/all-eleven-picker.xcresult` |
| Final MAX picker, complete action bounds | PASS, 0 failures |7.078s |`/tmp/tih-launch-native-uiqa/final-max-glyphs.xcresult` |
| Final MAX centered checkbox/steppers, no save | PASS, 0 failures |41.088s |same final MAX result bundle |
| Final saved Dark theme, welcome and Context, no save | PASS, 0 failures |12.231s |`/tmp/tih-launch-native-uiqa/final-dark-theme.xcresult` |

Intermediate harness runs failed on incorrect test assumptions (`28` instead of existing `28 days`; retaining the acknowledged local state on warm reuse; Settings row-centered switch tap). The final onboarding run starts cold and uses corrected selectors. Two later restoration attempts also failed: a right-edge hit on the full-row accessibility wrapper did not toggle it, then a fresh Settings process opened its root instead of the assumed Motion screen. The successful restoration navigated when necessary and tapped the actual nested UISwitch, proving both outer and inner native values 0. These five early intermediate failures were harness corrections. A later centered-checkbox attempt also failed because it queried an offscreen AX element before checking existence; the corrected inspection handles absent elements while scrolling. Another queued diagnostic retry was interrupted at root’s source-freeze handoff and is not a pass. Visual review additionally found real application defects in live Dynamic Type measurement, wrapped picker-header sizing, and decorative glyph scaling; these were fixed in application source and retested natively. The later direct URL-launch entry also timed out before its first UI action; its tested native CLI fallback is documented above. In total: seven intermediate harness failures, one intentionally interrupted diagnostic, and one weak isHittable-only pass excluded from accessibility acceptance. Keep that history separate from real app defects and accepted final results.

Final Dark full-flow attachments were exported under `/tmp/tih-launch-native-uiqa/final-dark-full-named` with names `dark-{welcome,context,date,typical,preview,preview-scrolled,reminders-off,paywall,picker-draft}.png`. Date wheels, preview and paywall body were visually inspected. That earlier run exposed black system status-bar text after a Dark cold launch. The final native-stack controller-policy fix was then retested: Dark selection PASS 11.897s; cold full 29 flow plus 9 clock-pixel assertions PASS 43.065s, 0 failures. All 9 Dark flow captures measured 390–422 white clock pixels (threshold >80), including the modal, date wheel and paywall; selection measured 422–427. Final corrected named screenshots live at `/tmp/tih-launch-native-uiqa/statusbar-final-dark-named`; results/logs are `statusbar-final-dark-{selection,full}.{xcresult,log}`. Earlier failing images remain diagnostic evidence, not accepted final visuals.

Final Light screenshots were manually inspected: clock text is black and readable on Silver, date wheels/preview/paywall are readable, and all 9 capture logs report dark=false as expected. Named files are `/tmp/tih-launch-native-uiqa/statusbar-final-light-named/light-{picker,welcome,context,date,typical,preview,preview-scrolled,reminders-off,paywall}.png`. The final QA app remains Theme Light, no-access paywall, synthetic 28/5, reminders OFF; no purchase/restore/trial activation occurred.

This proves native UI semantics and screen rendering, not VoiceOver spoken navigation. It does not prove Android, physical-device behavior, paid-access routing, offline entitlement behavior, or final rebuild regression by itself. Independent simulator video must establish actual Reduced Motion launch timing because XCUITest launch synchronization includes automation startup time.

## Final typography regression — 2026-11-14

The new `testTypographySettingsHistoryAndScriptHeadersNoWrites` uses the same guarded
QA simulator, existing English/no-access fixture and default system text size. It
navigates locked Today → Settings → Appearance → Language → Settings → Today → empty
History → Today, without selecting a preference or invoking billing. Complete native
bounds and the same PID are required. Native role=tab nodes are `Other`, radio labels
are queried by their actual accessibility type, and small measured scroll drags avoid
overshooting a row near the viewport boundary.

Actual run on fresh standalone Release implementation `f5a8628`: **PASS32.195s**, zero
failures. Result `/tmp/tih-brand-qa/main-typography-measured-scroll.xcresult`; named
screenshots are committed under `release/evidence/brand-20261114/native/`.
Three earlier new-case attempts failed on harness assumptions: a Button/coordinate tab
fallback did not activate the tab; a StaticText-only radio query missed the existing
radio; full-screen scroll gestures oscillated an English row past the viewport edge.
The measured/exact-node run retained the full-bounds assertions and passed. These are
not passes and do not establish a production touch bug. One earlier cold-launch CLI
attempt for the phone also misplaced options after the variadic app argument; the
corrected public devicectl launch passed and its exact installed process survived.

The diagnostic source maps and private xcresult/device metadata stay in `/tmp`.
Physical launch/process proof does not establish screen pixels or VoiceOver speech.

Final MAX regression: Context/checkbox/steppers PASS42.360s and complete picker action
bounds PASS6.500s on `f5a8628`. The separate calendar case PASS26.034s: current month was
unchanged, the native “28” text box measured64.5×75pt and fit the intersection of both
scroll viewports after six horizontal drags. No editing/save/month control was tapped.
One earlier combined attempt could not navigate native Settings at MAX size, then the
calendar setup queried the background app before activation and hit
`kAXErrorServerNotFound`; neither was counted as a pass. The calendar rerun activates
the app before querying its window. Reduced Motion is tested separately at default
system text size, and the QA text-size setting is restored to `large` afterward.

Final accessibility follow-up `55bbd9b`: the original MAX date-only screenshot revealed
character-broken BottomNav labels, so it is diagnostic evidence only. The responsive
full-width-row fix was rebuilt and verified by the strengthened calendar/tab case:
PASS23.003s, three375×87.5pt fully visible non-overlapping rows.

Final Reduce Motion on the exact55bbd9b Release with8081 absent: enable/actualUIKitON
PASS5.992s; true-guarded cold locked entry PASS7.830s; nativeOFF/actualUIKitOFF restore
PASS6.016s. These are XCTest durations, not boot benchmarks. Evidence is
`/tmp/tih-brand-qa/motion-final-source.{xcresult,log,mp4}`. Earlier helper attempts at
retained Settings pages failed and are excluded: iOS26 root now uses CollectionView,
row labels/icons are not interchangeable with their actual native Buttons, and a
background app must be activated before querying its window. The final helper reads
the actual hierarchy and preserves the simulator-only guard.
