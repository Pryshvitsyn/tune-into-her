# Premium Intro V5 — evidence

Baseline:`71504ac`; final V5 working-tree resource hashes are recorded in the JSONs.
Current native builds/captures are verified below; the delivery records the final commit.
This folder does not certify store readiness. [Complete report](../../../docs/PREMIUM_INTRO_V5_QA.md).

## Reference and static implementation

[Founder reference beside the ACTUAL physical native pressure opening](reference-vs-actual-iphone.png).


- [Immutable Founder reference](../../../assets/brand/reference/README.md): original
  image bytes and SHA-256; excluded from regeneration.
- [Reference beside final authored SVG preview](reference-vs-static-final.png) and
  [final static preview](static-final.png). These are labelled static artwork comparisons,
  not native/GPU screenshots. Material is a faithful SVG approximation, not a photorealistic
  or pixel-identical replica; exact font glyphs and kerning remain audited.
- [Pipeline proof](pipeline-proof.json), [padding/layout proof](asset-geometry-proof.json),
  [CoreText font audit](font-audit.json): exact264-command wordmark, native kerning,
  unchanged font/ring geometry, full-RGB native/shared PNG identity and byte-reproduction.

## Actual shared renderer

[Complete19-sample contact sheet](gpu/iphone-tall-sequence.png) comes from the real
shared WebGL renderer. [frames.json](gpu/frames.json) records76 PNGs across4 viewports
and19 timestamps, source/PNG hashes, six-layer visibility, GL checks and8 exact raw-RGBA
V4 baseline comparisons. Original manifest SHA-256:
`8280dfd5c90178c204a6a8a37d2f89805364790acca8ec6f73ea7cf07f958fca`.

| Selected actual frame | Checkpoint |
| --- | --- |
| [Opening](gpu/iphone-tall-00000.png) |0ms, full metallic RGBA foreground and matching atmosphere |
| [Early light](gpu/iphone-tall-00500.png) |500ms, restrained presentation lighting |
| [Camera travel](gpu/iphone-tall-01800.png) |1800ms |
| [Depth layers](gpu/iphone-tall-02850.png) |2850ms; all six layer indices are verified across the full sequence |
| [Emblem transition](gpu/iphone-tall-04300.png) |4300ms |
| [Sphere reveal](gpu/iphone-tall-04500.png) |4500ms |
| [Original V4](gpu/iphone-tall-09000.png) |9000ms, final raw RGBA exact baseline match |
| [Continuing V4](gpu/iphone-tall-09360.png) |9360ms, original material clock continues |
| [Compact iPhone opening](gpu/iphone-se-00000.png) |375×667 at2×DPR |
| [Compact Android ratio](gpu/android-compact-00000.png) |360×800 at2×DPR |
| [Tall Android ratio](gpu/android-tall-00000.png) |412×915 at2×DPR |

This is **Chromium/ANGLE SwiftShader evidence**, not iOS/Android native runtime.
0 GL errors and0 JS exceptions were observed. The manifest's ReadPixels performance
warnings describe the capture probes; no native performance claim follows. The scene
remains9 seconds and the protected V4 material loop8 seconds. All8 nonempty final
raw-RGBA samples match baseline exactly; external background pixels are excluded.
Only selected full-size PNGs are committed here; the manifest retains all76 capture
records and the contact sheet shows all19 tall-iPhone checkpoints. Regenerate with the
existing `tests/intro-frames/capture.cjs` harness rather than reconstructing an image.

## Android resource boundary

[Resource proof](android/resource-proof.json), [density contact sheet](android/resource-contact.png)
and [tool boundary](android/tool-boundary.json) record offline prebuild PASS, all5 day/night
densities exactly matching the final full-RGB foreground, both base colors`#7E8BA1`,
and alpha support inside the96dp safe circle (worst90.67dp). Original density PNGs are
retained in`android/`. Generated projects, caches and debug signing material are excluded.
The OS288dp icon canvas differs from the full RN presentation; native size/position and
handoff remain unverified. Java is absent; Gradle prerequisite exits1 and SDK/adb are missing.

## Native results to complete

| Current V5 check | Status |
| --- | --- |
| Swift/native Release build and exact artifact hashes | **See final native results** |
| Cold launch, reinstall, normal/stress all-frame black checks | **See final native results** |
| Native splash / first GPU / completed Today video | **See final native results** |
| Home replay, Light/Dark, Reduced Motion | **See final native results** |
| Full source suite and content checks | **See final native results** — root will add exact final outcomes |
| Physical screen / reader speech | PASS: actual USB screen normal+pressure capture; normal Release restored. Real VoiceOver speech remains unverified. |
| Android native runtime/TalkBack | **BLOCKED** — JDK/SDK/adb unavailable |

No raw phone/account/provisioning metadata is included. Public artifact hashes are in
[evidence-sha256.json](evidence-sha256.json). Pending native results must identify the
actual final binary and distinguish OS/pre-app frames from app-owned startup content.

## Verified native evidence

- [Physical pressure intro](native/physical-pressure-intro-reviewed.mp4), [native cover](native/physical-pressure-native-cover.png), [V4](native/physical-pressure-animated-v4.png), [proof](native/physical-pressure-proof.json):1361originalframes,0black/nearblack/blankwhite, noaccessorypopup. Publicclip2.5–15.0sexcludesallprivateUI; laterrawexternalUIisnotclaimedstable.
- [Physical normal intro](native/physical-normal-intro-reviewed.mp4), [proof](native/physical-normal-proof.json):1265originalframes,0black; initialOSaccessorypopupboundaryexplicitlyretained.
- [Normal Release restored](native/physical-restored-normal.json): exactsignednormal9fe01c… /JS7caa32… reinstated, testpressureabsent, noreset, relaunchedandobservedalive+285s.
- [Simulator pressure proof](native/simulator-pressure-proof.json), [all-frame summary](native/simulator-pressure-frames.json): sixboundedhostworkers,765sourceframes,0black, cover→factory→Expo→handoffstageorder.
- Native savedDark/Home/cold/Lightrestore, single/doubleHome, ReducedMotioncoldand1.493sHomepassed. Completechecks/boundariesinthe[QA report](../../../docs/PREMIUM_INTRO_V5_QA.md).

Rawphysicalfilm/Home/notifications/cyclecontent/deviceIDs/signingmaterialareexcludedfromGit. Allpublicphysicalmediawasvisuallyreviewedandhadmetadata/audiostripped.

Final-source Simulator pressure repeat: [proof](native/simulator-final-pressure-proof.json), [687-frame summary](native/simulator-final-pressure-frames.json). No black captured; VFR/PTS container warnings limit native stopwatch interpretation.
