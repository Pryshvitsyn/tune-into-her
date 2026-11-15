# Exact opening and one-second assembled-sphere ending — 2026-11-15

The exact Founder photograph and all earlier rendering/handoff corrections are preserved.
Global and Home now finish the full original depth travel, show the settled original V4
for one active-visible second, then use the existing360ms readiness fade. No new JS hold
timer, second sphere, elapsed9000 jump or subscription exception is introduced.

## Implementation

- `sphereHtml.ts`: final shell/logo/layers and target geometry must settle;1e-6px/ULP
  tolerance handles fractional screen radii. Completed GPU work followed by a foreground
  RAF starts one1000ms active material-clock hold. This provides a presentation opportunity,
  not a native compositor acknowledgement. Pause excludes hidden time; late readiness
  keeps the same original V4 motion running without restarting a cycle or hold.
- `SphereIntroSurface.tsx`: once-only assembly callback; launch completion preserves the
  real scene clock. Standalone Today still owns its original9000ms staged text reveals.
- `GlobalLaunch.tsx`/`launchState.ts`: hidden destination prepares at assembly and existing
  access/init/paint gates independently control fade after hold-end.
- `HomeTransition.tsx`/`homeTransitionState.ts`: route/unpause under the cover at assembly;
  ready and hold-end can arrive in either order. Stale ids, scope/access changes, foreign
  routes and backgrounding cannot expose an unready destination. Fade completion unmounts
  the temporary overlay and restores native interaction/accessibility.
- Reduced Motion, screen readers, manual finish and fallback skip the full hold safely.
  No content, language, saved preferences, cycle or billing policy change.

The unchanged timeline reaches final geometry at4500ms; the old4500–9000 interval is
Today's reveal horizon. Removing that covered waiting interval preserves every original
layer, camera movement and speed. D-011 records the latest Founder decision.

## Completed source/GPU proof

-431/431 tests in47files; TypeScript PASS; lint0errors/one pre-existing generated warning.
  All assertions remain enabled. One concurrent full run hit the existing5s PNG-check
  timeout under packaging load; the complete bounded15s-timeout rerun passed20.49s.
- Brand/source/native-raster reproducibility PASS. Protected V4, texture, shader, font,
  photograph, timeline, six-layer scene and pure GPU composer retain their bytes.
- [Actual running-clock GPU probe](../release/evidence/intro-ending-20261115/gpu/README.md):
  continuous400×800 assembly4533.2ms→complete5633.2ms (1100active ms under capture scheduling);
  fractional393×852 assembly4533.2→5533.2ms (1000active ms). Deliberate≥400ms background pause
  preserves clock/phase; no GL/JS errors, duplicate events, loop reset or9000ms jump.
- Prior104checkpoint/six-layer and both8frame exact V4 GPU comparison sets remain valid
  for unchanged geometry/composition; current released-clock probe verifies new ending logic.

## Exact photograph: actual physical checkpoint

The [c441ad3 physical photo/handoff checkpoint](../release/evidence/approved-opening-20261114/physical-framed-final/README.md)
contains the approved original, actual native/RN closeups and a reviewed cold-opening
video without Metro.2415frames,0black/nearblack/white flashes; native/RN full-photo RGB
MAE0.955/255;58handoff frames maxdelta0.432;42gradual dissolve frames maxdelta1.622.
It verifies the photograph and crop correction, **not the new ending timing**.

## Final standalone artifacts

Current JS-only changes are packaged by the unchanged official RN Xcode bundle script
with Expo `export:embed`, Hermes and official Expo update-resource generation, then signed
using the original existing identity/profile. This is not a new native compilation.
Unsigned native executable bytes, native plist/profile and protected resources remain;
strict/deep signatures verify. Native Updates is disabled, so cached OTA cannot replace
these embedded bundles. Source hashes identify actual delivered JS. No Metro is running.

- iPhone signed nativeSHA `732e9976e628438b92b3b52c61d34cf351801b9ec4dd1f03eb20fde8b75de105`;
  embeddedJS `e9ff17d2a14f6870237d24c5adc6792612853f671d8f2be8df152a28aed8bad3`.
  Update-installed preserving data. A180s bounded capture attempt could not start because
  only Wi-Fi transport was available; independent USB hardware inventory contains0iPhone
  entries. No camera/permission/pairing fallback or fabricated timing proof is used.
- Simulator signed nativeSHA `f21941f95032db939cbba80309a146c19c84e8fd7a81c6fd1660a3900926a083`;
  embeddedJS `641211a73b6c5d8e28000ce1e44ce8183afe1c1f42693fcf6d82259c249eb91e`.
  Pressure cold recording:470frames,0black, native bridge ordering PASS and same process alive.
  Reviewed geometric/PTS ending analysis and the final native screenshots are linked below.

## Recorded final native ending: actual Simulator frames

The source-matched normal Release cold movie ran under six bounded host CPU workers for
6s. All470decoded frames have0black/nearblack/white flashes; native bridge ordering and
same-process survival pass. Source PTS differ from host wall capture duration, so these
are recorded-frame times, not wall-clock startup benchmarks.

| Observation | Source movie PTS | Meaning/limit |
| --- | --- | --- |
| Settled original V4 edge pair | ~17.0367s | Visual scanline stabilization, about±33ms/1pixel tolerance |
| End of hold / first visible fade and text | ~18.136–18.170s | Observed hold about1.1s; no old4.5s final wait |
| Existing locked body fully visible | ~18.436–18.452s | Short fade about0.3s |
| Screen interaction | Separate native3case PASS | Exact interaction movie PTS was not recorded |

The phone/fixture has no entitlement; the correct locked body appears. Protected Today
text is not substituted or exposed. The native UI cases independently navigate after
Home and cover removal; visual pixels alone are not called proof of touch readiness.
[Actual ending clip, phase contact and frame measurements](../release/evidence/intro-ending-20261115/simulator/README.md)
are distinct from the previous physical photograph checkpoint.

## Final native regression cases

The existing isolated SE3 native harness ran against the source-matched standalone app:
Dark/Home/cold57.892s; single+doubleHome34.074s; Reduced Motion case45.510s with actual Home
1.5742s. All3PASS; same-process replay, entitlement lock, restored Light and native/UIKit
Reduce Motion OFF are verified. Native navigation after overlay removal confirms restored
interaction; this is not a physical paid-Today tap claim. Gesture totals9.876/9.318s include
GPU initialization and AX/screenshot overhead, so they are not the final-hold measurement.

[Reviewed native screenshots/results](../release/evidence/intro-ending-20261115/ui/README.md).

Final Android production Hermes/assets export PASS offline, exact approved PNG included;
see [artifact hashes](../release/evidence/intro-ending-20261115/artifacts/android-export.json).
No Android native build/runtime claim is made.

## Remaining acceptance boundaries

The real phone has no valid entitlement. Correct behavior ends at existing locked Today;
paid daily text must not be shown by bypassing access. Actual unlocked physical Today text
and tap interaction require legitimate access and are not claimed. New physical ending
recording awaits a data-capable wired/unlocked iPhone; the previous successful photograph
video cannot substitute for it. Android native SDK/JDK/emulator and actual spoken reader
checks remain unavailable. No store/production deployment or Cloudflare/RevenueCat/Stripe
configuration is performed; Founder visual acceptance remains separate.
