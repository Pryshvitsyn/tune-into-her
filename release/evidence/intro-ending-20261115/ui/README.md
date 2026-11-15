# Final intro ending — native Simulator UI

All three selected cases passed on the final standalone Simulator Release, using the
existing compiled runner with `xcodebuild test-without-building`. Structured xcresult
summary: **3 passed, 0 failed, 0 skipped**. No compile action was recorded.
[Sanitized results/image hashes](results.json) · [Release artifact/source hashes](../artifacts/iphonesimulator.json).

| Case | Case duration | Actual checks |
| --- | ---: | --- |
| Dark → Home → cold → restore Light | 57.892s | Full photographic Home opening and readable dark clock; saved Dark/white clock survives Home and cold; Home keeps process; Light and locked entry restored. |
| Home single + double tap | 34.074s | Both covers finish; same process and locked access after each gesture; navigation succeeds between gestures. Total observed gestures: 9.8758s / 9.3178s. |
| Reduce Motion Home from Privacy | 45.510s | Home returns to locked Today in 1.5742s, same process; native Reduce Motion ON assertion before Home, native OFF and UIKit false cleanup; app reactivated. |

Gesture durations include GPU initialization, XCTest/AX work, navigation and fade. They
**do not measure the one-second assembled-sphere hold**. Its timing requires the separate
scene/continuous-recording evidence. The single/double test also checks the observed
5.4–10.5s bounds; it does not establish an exact animation duration.

Selected original native pixels, visually reviewed:

- [Complete photographic Home opening / dark clock](57-v5-steel-home-cover-dark-clock.png).
  Exact elapsed time is unknown; this is not a frame-zero or continuous-handoff proof.
- [Dark destination after Home / white clock](57a-v5-home-faded-dark-white-clock.png).
  By capture time the locked destination is visible; the legacy filename does not imply
  that the intro cover or its sphere remains on screen.
- [Dark retained after cold launch](59-dark-theme-persisted-after-cold-launch.png),
  [Light restored](60-light-theme-restored-after-dark-cold-test.png).
- [Single tap → locked Today](46-home-single-tap-returned-locked-today.png),
  [double tap → locked Today](48-home-double-tap-returned-locked-today.png).
- [Reduce Motion Home → locked Today](91-reduced-motion-home-quick-locked-today.png),
  [native Reduce Motion restored OFF](14-qa-reduce-motion-restored-off.png).

Final state: **Light, locked Today, Reduce Motion OFF, app foreground**. The tests use
only the owned synthetic SE3 fixture. They verify navigation and access gates, including
absence of protected guidance; they do not verify protected Today content or any purchase.

PNG textual/EXIF/time metadata and generated attachment identifiers are removed. Original
IDAT pixels and color chunks are preserved. Raw logs, AX hierarchies, device identifiers
and export manifests remain private. These Simulator cases do not establish physical-device
smoothness, Android runtime, spoken accessibility or Founder visual acceptance.
