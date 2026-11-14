# Exact approved-photo opening — native UI

Two explicitly selected native cases passed on the final installed photo-based Simulator
Release, using the existing compiled runner with `xcodebuild test-without-building`.
No runner/app rebuild, production edit, purchase or data reset was performed by this slice.
[Sanitized results](results.json) · [Exact app artifact/source hashes](artifact.json).
The preceding SVG/alpha UI checkpoint remains separate.

| Case | Actual duration | Result |
| --- | ---: | --- |
| Dark → Home → cold → restore Light |68.368s | PASS: saved Dark survives Home/cold; dark clock on early opening, white clock on saved Dark; Light/locked Today restored; Home keeps the process. |
| Reduced Motion Home from Privacy |32.237s | PASS: Home1.62370s, same process/locked access; native OFF and UIKit false cleanup passed; app reactivated. |

Durations include UI automation and are not startup benchmarks. Structured xcresult
summaries each report1 passed,0 failed,0 skipped. Final state: **Light, locked Today,
Reduce Motion OFF**. These are Simulator UI results, not physical/Android or speech proof.

Selected original native pixels:

- [Timing-unknown Home opening / metal-takeover sample, dark clock](57-v5-steel-home-cover-dark-clock.png).
  XCTest records cover discovery and clock readability, not this image's exact elapsed
  time or rendering actor. It is **not** a0ms/full-opening identity proof, and its visible
  fragment is not classified as photograph or SVG artwork here. Use the independent
  cold-start sequence for the complete first-frame comparison.
- [Transition to V4 on Dark / white clock](57a-v5-home-faded-dark-white-clock.png).
- [Saved Dark before Home](56-dark-theme-saved-before-home.png),
  [Dark after Home](58-dark-theme-preserved-after-home.png),
  [Dark after cold](59-dark-theme-persisted-after-cold-launch.png).
- [Light restored](60-light-theme-restored-after-dark-cold-test.png),
  [locked Today restored](61-light-locked-today-restored-no-billing.png).
- [Reduced Motion Home result](91-reduced-motion-home-quick-locked-today.png),
  [native ON before cleanup](14a-motion-settings-before-restore.png),
  [native OFF after cleanup](14-qa-reduce-motion-restored-off.png).

PNG textual/EXIF/time metadata and generated attachment identifiers are removed; original
IDAT pixel bytes and color metadata are retained. No raw logs, app hierarchies, device IDs,
private result manifests or recordings are published here. Each PNG hash is in`results.json`.
No Founder visual approval is inferred from these automated passes.
