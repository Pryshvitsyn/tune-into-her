# Final full-bounds photo opening — native UI

Two selected native cases passed on the corrected photographic-opening Simulator Release,
using the existing compiled runner with `xcodebuild test-without-building`. Installed
native and embedded JavaScript hashes matched [the framed-final artifact](artifact.json)
before execution. This slice performed no build, production edit, data reset or purchase.
The earlier cropped-photo UI checkpoint is preserved separately.
[Sanitized case results and image hashes](results.json).

| Case | Actual duration | Result |
| --- | ---: | --- |
| Dark → Home → cold → restore Light | 64.995s | PASS: saved Dark survives Home/cold; dark clock on photographic opening, white clock on saved Dark; same process for Home; Light/locked Today restored. |
| Reduce Motion Home from Privacy | 37.122s | PASS: Home 2.12356s, same process/locked access; native OFF and UIKit false cleanup passed; app reactivated. |

Structured results each report 1 passed, 0 failed, 0 skipped. Neither case needed the
bounded center-tap retry. Final state: **Light, locked Today, Reduce Motion OFF**.
Durations include UI automation and are not startup benchmarks.

The [Home opening capture](57-v5-steel-home-cover-dark-clock.png) now visibly contains the
complete centered photographic emblem and wordmark, rather than the preceding intrinsic-size
crop. Its exact elapsed time is unknown; this is **not a frame-zero or continuous-handoff
proof**. The independent cold recordings supply sequence evidence.
[Saved-Dark V4 and readable white clock](57a-v5-home-faded-dark-white-clock.png).

Other original native captures:

- [Saved Dark before Home](56-dark-theme-saved-before-home.png),
  [Dark after Home](58-dark-theme-preserved-after-home.png),
  [Dark after cold](59-dark-theme-persisted-after-cold-launch.png).
- [Light restored](60-light-theme-restored-after-dark-cold-test.png),
  [locked Today restored](61-light-locked-today-restored-no-billing.png).
- [Reduce Motion Home result](91-reduced-motion-home-quick-locked-today.png),
  [native ON before cleanup](14a-motion-settings-before-restore.png),
  [native OFF after cleanup](14-qa-reduce-motion-restored-off.png).

PNG textual/EXIF/time metadata and generated attachment identifiers are removed. Original
IDAT pixel bytes and color chunks are retained. Raw logs, hierarchies, device identifiers
and result manifests remain private. These Simulator cases do not establish physical-device
smoothness, Android runtime, speech accessibility or Founder visual acceptance.
