# Brand and typography correction — 2026-11-14

## Diagnosis and preserved reference

The existing delivered intro package explicitly identifies its outlined wordmark as
“Linux Libertine O Regular, вариант №8”. Its vector source is byte-identical to the
current source. The WebGL/native PNG also matches the delivered V2 payload and its
`proof/brand_padded.png` byte-for-byte (decoded PNG SHA256
`347cb7e26f2f9006b1655fbbb5768e2129e4cfb3975a31a83e8adef4eb57517b`).
A direct-file CoreText audit matches all264 SVG commands,14 contours
and11 letters to the existing unmodified OTF, with maximum deviation
0.000030517578125 font units (tolerance0.0001). Glyph origins equal the unkerned
advance sums: no extra tracking/pair adjustments or outline stroke is applied.
See [reproducible provenance](../tests/font-provenance/README.md) and its JSON report.
The original numbered comparison/Founder approval image and exact generator font
binary were not recovered. This is verified delivered-source equivalence, not a new
visual approval or proof of the exact historic generator bytes.

The real UI inconsistency was incomplete font adoption: Today, History, Settings,
navigation and several shared components still used native Text/system sans and
600–800 weights, while onboarding and paywall used the registered OTF. Caller styles
with an undefined fontFamily could also erase a shared default. AppText now owns the
locale-aware regular face after caller styles; all app text uses that component.
The existing font-loading gate remains authoritative. A font-loading failure uses
readable system-font Retry/error text until the real font can load.

The reported transient top/bottom emblem clipping was **not reproduced** in the
current baseline's full-resolution WebGL checkpoints or prior native recording.
Rounded stroke extrema fit the original viewBoxes; the1600×1120 texture has transparent
margins on every edge, wider than all GLSL distortion/filter sampling. Native fallback
and WebGL use matching design scale. The central wordmark opening is intentional;
partial silver-stream occlusion is approved choreography. No evidence justified
changing arc geometry, clipPath, filtering, logo pixels or wordmark outlines.
Do not describe this investigation as a confirmed physical clipping fix.

A distinct display bug was found when enabling readable scrolling in Today:
scrolling the sphere completely out of view could produce a negative WebGL scissor
extent. The post-intro scissor now intersects both edges with the framebuffer.
This changes display bounds only; original V4 GLSL and scene movement are unchanged.
Today clips its sphere to the content viewport, keeping fixed navigation readable.
Final visual review also found that three125pt navigation columns broke large words
at MAX text size. Follow-up `55bbd9b` uses three full-width icon/label rows above
fontScale1.35, preserving normal columns. Native final rows measure375×87.5pt each;
all three labels are complete, hittable and non-overlapping.

## Typeface and accessibility policy

- Original bundled Linux Libertine O Regular5.3.0; PostScript `LinLibertineO`, Expo
  alias `LinuxLibertineO`. OTF SHA256:
  `6332761e4fc08e30bce6f47e4a08e7d5332abe000ab6ca06c8e86bd88f456114`.
- Nine Latin/Cyrillic locales use this regular face. Hindi and Simplified Chinese use
  native script fonts because the bundled OTF does not contain their scripts.
  Language options select their own script policy even in an English interface.
- Decorative platform emoji/symbols and native date-picker controls retain platform
  rendering deliberately. Readable labels retain Dynamic Type and natural wrapping.
  Large calendar text can scroll horizontally rather than squeezing day numbers.
- Font bytes and existing OFL/distribution notices are unchanged. No new font download,
  registration under a misleading family, synthetic bold or license grant was added.

## Reproducible visual evidence

[WebGL frames](../release/evidence/brand-20261114/webgl/frames.json) record44 actual
full-viewport captures from the shared runtime:375×667,393×852,360×800 and412×915 at2x.
They are Chromium/ANGLE SwiftShader WebGL evidence, **not** iOS/Android native proof.
Each image has a SHA256, actual scene state and framebuffer/viewport dimensions.
The shared renderer, approved assets and existing test-only clock are used directly.

Contact sheets read left-to-right, top-to-bottom at:
0,0.5,1,2,2.5,3.5,4.3,4.5,9,9.5 and10seconds. The final cell is unused.
The post-nine-second frames retain sphere geometry and advance its material phase.
They do not simulate the native-to-RN bridge or destination fade.

- [Compact iPhone shape](../release/evidence/brand-20261114/webgl/iphone-se-contact-sheet.png)
- [Tall iPhone shape](../release/evidence/brand-20261114/webgl/iphone-tall-contact-sheet.png)
- [Compact Android shape](../release/evidence/brand-20261114/webgl/android-compact-contact-sheet.png)
- [Tall Android shape](../release/evidence/brand-20261114/webgl/android-tall-contact-sheet.png)

`tests/brandGeometry.test.ts` independently derives exact arc/stroke bounds, reads
texture alpha and the actual shader sampling reach, and checks every10ms over nine
compact/tall/landscape phone shapes. `tests/introRuntime.test.ts` executes the shared
control runtime, including completely offscreen and edge-intersecting scissor cases.
The frame harness also probes actual WebGL offscreen scissors.

Original renderer, clean texture, poster, V4 generated shaders, timeline and scene
runtime are compared before/after in the evidence checksum manifests. No original
material,8-second loop, six-layer movement, logo geometry or wordmark resource changed.

## Native/build checks and limits

The following source and native checks were actually executed. Typography is in
`f5a8628`; the final large-navigation correction and rebuilt artifacts are `55bbd9b`.
Simulator UI assertions do not establish VoiceOver speech or physical-device pixels.
Real access is required for protected Today; no subscription or onboarding bypass is
introduced to make a screenshot. Native Android remains unavailable without a JDK,
Android SDK/adb and an emulator; Android-shaped Chromium captures are not a substitute.

Final available checks:

| Check | Actual result |
| --- | --- |
| TypeScript | PASS |
| Unit suite |264 tests /34files PASS |
| ESLint |0errors;1existing warning in generated `.expo/types/router.d.ts` |
| Content |610bundles /11locales /318texts;90-day reserve PASS |
| CoreText provenance |264commands PASS, zero spacing adjustment |
| Shared WebGL |44frames,0JS exceptions/GL errors;6offscreen probes,0GL errors |
| Immutable resources |9original files unchanged; allowed post-intro scissor infrastructure isolated |
| Standalone signed Simulator Release | BUILD SUCCEEDED; installed and cold-launched without Metro |
| Settings/Appearance/language/History/return | PASS32.195s, samePID, no preference/billing writes |
| All11native picker values + Cancel | PASS31.084s; saved English preserved |
| Full Light onboarding revisit + paywall | PASS26.120s,29existing assertions; synthetic28/5, remindersOFF |
| Largest text Context/checkbox/steppers | PASS42.360s; no cycle save |
| Largest text picker/full action bounds | PASS6.500s |
| Final MAX calendar + complete navigation words | PASS23.003s on55bbd9b;375pt-wide tabs, no overlap |
| Final Reduced Motion / no Metro |3native tests PASS5.992s/7.830s/6.016s; UIKitON for cold launch, OFF restored |
| Final normal cold launch / no Metro | Recorded55bbd9b;8081 absent before/after; correct locked entry |
| Targeted native runtime log query |0matching Unimplemented/font-load/fatal JS messages |
| Physical iphoneos Release | BUILD SUCCEEDED; signature, OTF and official resources verified |
| Final physical update/cold launch | PASS55bbd9b; install11.546s, launch0.747s; process alive+155.500s matches exact install receipt |
| Android | Fresh production Hermes export PASS, original OTF included; no native build/emulator tools |

The first largest-type command included an outdated Reduced Motion method name;
XCTest executed exactly its two reported largest-type tests. It is not Reduced Motion
proof. Later final native cases explicitly assert UIKit's actual ON/OFF preference,
record cold entry and restore OFF. Those final cases pass with8081 absent.

An old project Metro server was present during the initial UI reviews. Its cwd/command
were verified as this project's stale Debug server before it was stopped. Dedicated
normal and Reduced Motion cold runs then passed with no listener on8081. The initial
UI assertions remain evidence for their named screens; final independence is established
by the dedicated runs and embedded signed Release resources.

The final normal cold video begins in Settings before launching the application; that
interval is outside the intro. A30-second observation produces a17.342s variable-frame-
rate recording because the settled destination stops producing new screen frames.
The separate final PNG shows the sphere removed and the correct locked entry visible.
Exact scene times come from the deterministic WebGL checkpoints, not a guessed native
recording offset. The Reduced Motion test durations include XCTest launch synchronization
and are not app startup benchmarks.

The intermediate MAX calendar date-only pass exposed broken navigation labels on
visual review. That image is retained only as `diagnostics/navigation-before.png`.
Final acceptance uses `native/41a-largest-type-calendar-readable-stacked-tabs-final.png`.
Earlier new-harness failures (AX element type, overshooting scroll gestures, retained
Settings page/collection layout and background-window queries) are documented in the
native harness record and are not counted as passes.

## Changed implementation files

- `app/_layout.tsx`
- `app/about.tsx`
- `app/cycle.tsx`
- `app/demo.tsx`
- `app/history.tsx`
- `app/intro-preview.tsx`
- `app/learn/[phase].tsx`
- `app/redeem.tsx`
- `app/settings/appearance.tsx`
- `app/settings/index.tsx`
- `app/settings/language.tsx`
- `app/settings/reminder.tsx`
- `app/thea.tsx`
- `app/today.tsx`
- `src/components/AdviceBlocks.tsx`
- `src/components/AppText.tsx`
- `src/components/BottomNav.tsx`
- `src/components/CycleCalendar.tsx`
- `src/components/FeedbackControl.tsx`
- `src/components/InfoPage.tsx`
- `src/components/LanguagePicker.tsx`
- `src/components/SettingsRow.tsx`
- `src/intro/AnimatedToday.tsx`
- `src/intro/GlobalLaunch.tsx`
- `src/intro/IntroLoading.tsx`
- `src/intro/sphereHtml.ts`
- `tests/brandGeometry.test.ts`
- `tests/font-provenance/README.md`
- `tests/font-provenance/audit.swift`
- `tests/font-provenance/report.json`
- `tests/fontCoverage.test.ts`
- `tests/intro-frames/README.md`
- `tests/intro-frames/capture.cjs`
- `tests/introRuntime.test.ts`
- `tests/native-launch/LaunchUIQA.swift`

The proof commit additionally updates ARCHITECTURE, PRODUCT_SNAPSHOT, TASKS, the native
UI harness and this QA record, plus the named evidence directory. No release binary,
private xcresult/device inventory, signing file or environment secret is committed.
