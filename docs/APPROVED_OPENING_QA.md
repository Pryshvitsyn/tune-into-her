# Exact approved opening and corrected V5 — 2026-11-14

The exact original PNG now supplies native iOS launch, RN loading and Home replay.
This continues the verified GPU/alpha correction in38d3437; it is not a new animation
engine or a new design. Founder approval of the final implementation is not asserted.

## Source and implementation

The immutable851×1847 image has SHA-256
`dfce7d014d6107bdad02a54886dba3bbb8e5f216065774dc7b7c34e7e3da1c58`.
Reference, native launch copy and iOS asset are byte-identical. There is one full-bounds
storyboard image and one shared RN photograph component. The initial artwork has no
extra rings, SVG lettering, color adjustment or artificial glow.

| Files | Purpose |
| --- | --- |
| `ApprovedOpening.tsx`, `IntroLoading.tsx` | One exact photograph, centered cover, explicit100% dimensions |
| `SphereIntroSurface.tsx`, `sphereHtml.ts`, `introPresentation.ts` | Reuse the scene; omit reconstructed opening emblem; photo fades650–1350ms |
| `GlobalLaunch.tsx`, `nativeSplashGate.ts` | Queue native hide before four UI commitment frames and clock release; bounded recovery |
| launch generator/storyboard/plugin/native catalog, two Expo image paths | Persist exact-photo native resources without business/configuration changes |
| regression tests and capture tools | Verify real static-image style merging, ownership, pixels, framing and protected V4 |

## Diagnosed defects, with actual evidence

1. The reconstructed SVG artwork did not match the approved photograph. Its native/RN
   consistency could not establish photographic fidelity. The new source is the original.
2. Existing Cocoa/WK alpha compositing treated straight output as associated despite
   reporting false. The retained final-output adapter fixes this, without changing V4
   calculations or texture upload representation. [Earlier native proof](PREMIUM_V5_HANDOFF_QA.md).
3. The first photo rollout exposed an RN sizing defect: static Image prepends the asset's
   intrinsic dimensions before props.style. Absolute edges alone left an851×1847POINT
   image cropped inside the phone. Actual physical frame536 matches that3x top-left crop
   with RGB error0.965/255, versus38.972 against correct framing. Explicit100% width and
   height fix the actual component; its regression test executes the component and models
   the installed RN Image style merge. [Failed run/cause proof](../release/evidence/approved-opening-20261114/physical-before-native-hide-gate/failed-attempt-proof.json).
4. Independently, GPU release previously raced a fire-and-forget native hide. The cached
   queued-hide gate now precedes the UI-frame barrier. Expo hideAsync itself only queues
   UIKit removal; it is not described as a native paint acknowledgement.

The photograph dissolves into the existing metal scene rather than a second emblem.
The9000ms clock, camera, six depth ribbons, V4 source/texture/geometry and8000ms loop remain.
Every ribbon retains a fully uncovered interval after the photo. There is no added final
hold; the existing360ms destination fade waits for its actual screen/access readiness.

## Completed final-source checks

- TypeScript PASS; lint0errors/one prior generated-router warning.
-408/408 application tests in46files, bounded2worker run. Existing integrity tests remain.
- Brand/font/source and deterministic PNG/raster checks PASS; no reference/font/V4 bytes changed.
-104 actual Chromium GPU frames,4 ratios,0GLerrors/exceptions; all6layers visible.
 8/8 original raw V4 comparisons and8/8 associated-presentation comparisons exactly match
  historical baseline at the same original material clocks. [GPU proof](../release/evidence/approved-opening-20261114/gpu/README.md).
- Signed embedded-JS iPhone and Simulator Release builds PASS. Official Expo resources
  match the copied app resources; deep signatures verify. Actual native Updates is disabled,
  so cached OTA JS cannot replace these embedded bundles. No Metro server is used.
- Final Simulator cold/CPU pressure:697decoded frames,0black/near-black/white flashes,
  native bridge ordering and same process alive;6host workers for6s. Native→RN full-photo
  RGB MAE1.625/255;40handoff frames max per-frame change0.25/255.48fade frames progress
  gradually across~700ms, max delta3.429 versus prior36.61. Full travel/V4/locked entry observed.
  [Accepted cold video and pixels](../release/evidence/approved-opening-20261114/simulator-framed-final/README.md).
- Final native Dark/Home/cold test64.995s PASS; reduced-motion Home2.124s, native OFF/UIKit
  OFF and Light restored. Full photographic Home image captured; screenshot timing is not
  misrepresented as0ms. [Accepted UI cases](../release/evidence/approved-opening-20261114/ui-framed-final/README.md).
- Content source checks earlier in this same work:610 bundles/11locales/318texts perlocale,
 90-day reserve. Content/cycle/history/subscription source remains unchanged.
- [Preservation/privacy audit](../release/evidence/approved-opening-20261114/final-preservation-audit.json):
 15protected files and pure scene composer unchanged; no credential/signing/raw-device data.

## Physical iPhone boundary

Final corrected Release nativeSHA `f61157ecae61c1bc7b83062007d396c577d882204f6cff83701deb33114a83ca`,
embeddedJS `7ebf1900b28dc3305b18908e3c4f02bb9b369cadc67776ae6fcd42e68ef73ac7`,
was update-installed without deleting the app or user data. Final physical continuous
recording remains pending an active data-capable USB connection. A recording started
but failed with host AVFoundation DiskFull; its missing movie is not accepted proof.
Space was recovered only from reproducible compiler/Pods caches; signed app artifacts,
source, all original videos and accepted evidence remain. The current Mac subsequently
reported Wi-Fi only and no pinned USB screen. No permission/pairing change is made.

Earlier physical native-photo pixels establish the original artwork/framing, but the
pre-fix RN crop run is explicitly FAILED, not final smoothness proof. The final Simulator
results cannot substitute for the requested new physical recording.

## Android and remaining boundaries

[Offline Android resource prebuild](../release/evidence/approved-opening-20261114/android/README.md)
verified10day/night density images against the official photo-only transform. A fresh
non-development Android Hermes export also passed and includes the exact original PNG;
its final-source hashes are recorded in the adjacent JavaScript export proof. Android12+
uses a masked OS icon; full-screen exact-photo presentation starts in RN. JDK/SDK/adb/
emulator are absent, so no Android native runtime/build claim is made. Real screen-reader
speech is not newly recorded. Physical final visual review and Founder acceptance remain
separate from automated/Simulator evidence. No store submission, backend/billing or production service configuration change was
performed. The app configuration diff is only its two approved splash-image paths.

All pre-framing Simulator/physical media and intermediate UI runs remain distinctly
labelled, not counted as final framing proof. Private prelude/tails, device identifiers,
raw logs, signing material and user cycle content stay outside Git.

## Build host reproducibility

Source/scene assets and signed final apps are retained. To recover host recording space
only reproducible module/Pods build caches and obsolete exports were removed after the
verified builds. A later native rebuild must first regenerate the missing Pods products
with the normal workspace build; do not assume the old app-target-only cache is complete.
This host-cache cleanup does not affect installed app data or the delivered app.
