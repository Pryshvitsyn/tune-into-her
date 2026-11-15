# Original sphere: actual GPU launch ending — 2026-11-15

The production shared WebGL/control runtime ran with real `requestAnimationFrame` in
headless Chromium/ANGLE SwiftShader. It was prepared with `launch:true`, the exact
Founder photograph and the shared atmosphere/photograph curves, then released.
No test `seek`, shader replacement or nine-second scene-time jump was used.

| Actual viewport | First presented assembly event (scene ms) | Hold completion (scene ms) | Active hold | Host interval |
| --- | ---: | ---: | ---: | ---: |
| 400×800, continuous | 4533.2 | 5633.2 | 1100ms | 1111.6ms |
| 393×852, fractional radius149.34, paused | 4533.2 | 5533.2 | 1000ms | 1532.8ms |

The continuous case includes frame/capture scheduling under host load; eligibility
is checked on the next real rendered frame after at least1000 active milliseconds.
The fractional case deliberately stopped activity for at least400 host milliseconds:
its scene clock and material phase were exactly unchanged during that pause, and the
hidden interval did not satisfy the hold. Assembly requires final geometry, completed
GPU work and another active/visible RAF, rather than a fixed5500ms timeout.

Both cases produced exactly one assembly event and one completion event, no GL or
JavaScript errors, and a normally moving original V4 after completion while a slow
destination would still be loading. The scene clock continued through5500–6000ms;
it was never forced to9000. The pure scene/V4 composition hash remains unchanged.
Eight reviewed PNGs retain initial/assembled/hold-end/continued-motion samples.

`proof.json` contains actual runtime messages, shader uniforms, source hashes and
screenshot hashes. All listed source hashes matched the current files on copy.
The prior104-checkpoint/six-layer and both8-frame V4 equality guards are preserved
separately; this small running-clock check does not duplicate that evidence.

This is **not native iPhone/Android, native paint acknowledgement, React Native
navigation, entitlement, Today-content, or final fade evidence**. External artwork
uses CSS in this renderer probe. Native release recordings and actual app UI checks
must establish the final fade, interactive destination and approximately one second
of visible assembled sphere. No Founder approval is inferred.
