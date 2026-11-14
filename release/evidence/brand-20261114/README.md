# Final brand/type implementation evidence

Typography: `f5a8628`; final MAX navigation/builds: `55bbd9b` on `codex/monetization-20261113`. Application screenshots and native videos use fresh signed Release builds. The
onboarding/main-page reviews are the f5a8628 checkpoint; final cold/Motion/build/phone
and stacked-navigation evidence uses55bbd9b. The later change is limited to large
BottomNav layout; the intro, font and other screen sources are unchanged.
The separate Debug XCUITest runner drives that installed Release app; it is not an app
Debug build. No Metro service is required. The isolated SE3/iOS26.5 QA simulator contains
only this task's existing synthetic28/5 fixture, English/Light, remindersOFF, no access.
Original simulator and physical-device data were not reset.

- `source-baseline.json` and `source-integrity.json`: original V4/texture/poster/shaders,
  timeline/runtime, logo/vector/PNG and OTF before/after. Nine immutable files are equal.
  Only the shared HTML's post-intro display scissor intersection changes.
- `webgl/frames.json`:44 real shared-renderer captures at exact scene checkpoints and
  six actual-GPU offscreen scissor probes. PNGs are full viewports; the four contact
  sheets reduce them for inspection. These are Chromium/ANGLE captures at phone ratios,
  not native Android/iPhone proof. Captured source hashes match the implementation.
- `frame-comparison.json`:38 baseline/final PNG hashes are identical; six differ by
  at most1 of255 per color channel. This is not a claim of44 byte-identical screenshots.
- `cold-final-no-metro.mp4` and `native/cold-final-no-metro-contact-sheet.png`: real native cold launch across
  static native/RN bridge, depth pass, single animated sphere hold and destination fade.
  Recorder acknowledged its first frame before force-close/launch;8081 was absent. A short preceding
  Settings interval is outside the launch. The final recording and
  `native/locked-after-cold-final-no-metro.png` show the correct locked destination with no sphere.
- `native/33*`–`39*`: Settings/Appearance/native script options/empty History and return;
  no preference selection, onboarding bypass or billing action. Same process retained.
- Native onboarding/preview/paywall and Hindi/Chinese picker PNGs are a no-reset Light
  revisit; they are not a claim of a new first installation on this implementation.
- `native/21*`, `24*`, `26*`, `40*`, `41*`: maximum system text, fully reachable picker
  actions/checkbox/steppers and unsqueezed calendar digits. Calendar and form data are
  unchanged; no month/edit/save action occurred in the calendar inspection.
- Build JSONs verify actual signatures, original embedded OTF, production Hermes bundle,
  and exact official Expo Updates manifest/fingerprint freshness for each iOS target.
- `physical-runtime.json`: data-preserving update/cold launch, same process+155.500s,
  exact executable path matches the new installation receipt. No device identifier,
  provisioning material, private log or real cycle data is published here.
- `reduced-motion.json`, `reduced-motion-no-metro.mp4` and native42 screenshot:
  exact-final Release cold entry with actual UIKitON; nativeOFF restored afterward.
- `metro-runtime-boundary.json`: stale project Debug server stopped; final dedicated
  normal and Reduced Motion cold runs pass with8081 absent.
- `diagnostics/navigation-before.png`: rejected intermediate MAX footer, kept only
  to show the issue; accepted words/rows are in native41a-final.
- `android-build-boundary.json`: production Hermes export and original font asset;
  native APK/emulator unavailable without JDK/Android tooling.
- `runtime-log-check.json`: targeted unified-log query found zero matching native SVG,
  font-load or fatal-JS messages; it is not exhaustive instrumentation.

See [complete matrix, font provenance and remaining limits](../../../docs/BRAND_TYPOGRAPHY_QA.md).
Physical screen pixels, VoiceOver/TalkBack spoken navigation, real protected Today and
native Android remain unverified. The reported transient physical arc clipping is not
reproduced by current captures; the approved brand pixels were preserved.
