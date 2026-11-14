# V5 GPU handoff correction — 2026-11-14

This checkpoint corrects the existing V5 pipeline. It does not assert Founder visual
approval. The later Founder request to use the exact archived photograph as the opening
is a separate, narrowly scoped continuation; the reconstructed first image in this
checkpoint is not its final delivery.

## Proven cause and correction

The last static image was correct relative to its SVG source. The foreground PNG,
native resource and GPU data URI were byte-identical. Actual texture readback matched
premultiplied source texels exactly; transparent pixels had no RGB contamination.
Changing the texture upload flag was not justified.

A standalone visible UIKit/WKWebView probe on the owned iOS26.5 Simulator reproduced the
fault. A false-alpha context reported false and read back [51,77,102,64], but native
screen pixels were [145,181,223]. Canvas2D and correctly associated WebGL both produced
[107,123,147]. This is the Cocoa compositor interpreting straight output as associated.
The existing premium artwork showed the same blue halos as the actual physical recording.
See [actual causal comparison](../release/evidence/v5-handoff-20261114/wk/native-wk-causal-comparison.png)
and [pixel proof](../release/evidence/v5-handoff-20261114/wk/compositor-proof.json).

This matches the primary [WebKit bug](https://bugs.webkit.org/show_bug.cgi?id=200026)
and its [IOSurface tagging fix](https://github.com/WebKit/WebKit/commit/3e12766ced21f82a68008cfaf3114e0dd57c8e2c).
The installed OS result, rather than the reported context option or upstream fix date,
establishes this environment's behavior.

The shared renderer now requests associated alpha and adapts only the final canvas
output: clamp straight RGB, then multiply once by alpha. The pure scene composer,
original V4 calculations, texture upload choices, light effects and material are unchanged.
Current GPU0 over the same native underlay differs from native UIImage by max2/255,
RMSE0.255/255, PSNR59.993dB; no pixel exceeds2/255. Old output differed by up to107/255.

A second fault was independent: the GPU clock advanced behind an opacity-zero WebView,
then a clock message removed the fallback while exposing the GPU. Physical frames
336/337/338 show static artwork, a background-only foreground gap, then blue halos.
The new prepare→UI-frame commit→release protocol freezes both clocks while GPU0 is
exposed below an opaque native cover. Two covered UI paints and a reveal/commit frame
precede release. Backgrounding repeats an uncommitted visibility transfer; stale/duplicate
commands cannot replay the scene. Bridge wall-clock compensation was removed.

## Actual validation at this checkpoint

- Full application suite:395/395 tests in44 files, with2workers. The first unconstrained
  run under concurrent native/content load timed out in an unchanged5s PNG decoder test;
  it is retained as a failed attempt, not hidden by relaxing assertions/timeouts.
- TypeScript passed; lint0errors and the prior generated router warning only.
- Content checks:610 bundles,11 locales,318 editorial texts/locale,90-day component reserve.
- Deterministic SVG/RGBA/native source and raster reproducibility passed.
- Actual Chromium:92 frames,0GLerrors/exceptions, all six ribbons present.
 8/8 strict original straight RGBA V4 comparisons match the untouched historical
  baseline;8/8 production associated RGBA comparisons match that same baseline with
  only the identical final presentation adapter. See [frames](../release/evidence/v5-handoff-20261114/gpu/frames.json).
- Actual visible WK:12 current checkpoints from0 to9000ms, including100/300/600/1500ms.
  An earlier UI-test-runner probe was offscreen and its screenshots were rejected;
  the optional WK snapshot callback hung. Neither attempt is counted as visual proof.
- Signed, embedded-JS iPhone and Simulator Release builds passed; official Expo Updates
  resources and deep signatures were verified. Normal binaries exclude pressure work.
- No-Metro Simulator cold recording:663 decoded frames,0black, expected native bridge
  ordering, same process alive; six bounded host CPU workers ran for6s.
- Physical iPhone update-install preserved data. Actual partial recording:1004 decoded
  frames,0black/near-black;50-frame handoff window has0foreground gaps/halo signatures.
  Adjacent handoff RGB MAE6.773 before→1.752 after; new bright-blue pixels94403→3.
  [Before/after](../release/evidence/v5-handoff-20261114/physical/before-after-static-gpu-contact.png).
  The USB stream includes delayed private prelude and ends during V4, so this is
  handoff proof, not a complete9s/destination video. Private prelude/raw logs stay outside Git.
- Native Dark/Home/cold/Light restoration passed on retry. A prior harness Settings tap
  did not navigate; its failure is preserved. Remaining selected native checks continue.
- Android SDK/JDK/adb/emulator are absent. No native Android runtime pass is claimed.

No source V4, timeline, six-layer math, font, reference, brand geometry, billing, cycle,
content, navigation or persistence change is included. No store/production publication.
