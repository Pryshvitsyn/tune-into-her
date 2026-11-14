# Brand geometry evidence —2026-11-14

Baseline e1058c4, current working tree on codex/monetization-20261113. The sourceCommit
field in capture JSON is that baseline; sourceSha256 identifies the actual corrected
working-tree assets. This directory contains real captures, not designed mockups.

- [Marked upper arc, before/after](upper-ring-before-after.png): same real WebGL0ms
  frame/viewport crop,3× enlargement. Before has the detached upper fragment; after has
  the continuous original-circle trajectory.
- [Complete emblem before/after](emblem-before-after.png): same frame, no new rings,
  lettering above the trajectories with local glyph clearance.
- [Typography comparison](typography-before-after.png): actual bundled OTF/CoreText
  native shaping against old and corrected SVG, equal em/baseline/center.
  [Raster measurements](font-raster-comparison.json).
- [Complete depth sequence](full-depth-sequence.png): actual shared renderer at
 0/1000/1800/2350/2850/3500/4000/4150/4500/9000ms.
  [All72 checkpoint records](webgl-frames.json) cover4 ratios and layer indices0–5;
  raw full-resolution captures remain /tmp/tih-brand-correction/webgl-after.
- [Final native after movie](native-after.mp4), [reinstall proof](native-reinstall-proof.json),
  [quiescent repeat proof](native-repeat-proof.json): all724/690 original frames checked,
  no black frames, same binary. [Native corrected closeup](native-corrected-closeup.png),
  [opening](native-opening.png), [depth](native-depth.png), [sphere](native-sphere.png),
  [locked destination](native-final.png).
- [Native before movie](native-before.mp4), [before closeup](native-before-logo-closeup-before.png),
  [after closeup](native-after-logo-closeup-after.png). These are installed Release app captures.
- [iOS Simulator artifact proof](simulator-release.json): signature, exact official
  Expo resource copies, embedded JS/source asset hashes, data-preserving install,
  closed Metro ports. [Physical proof](physical-release.json) excludes private device IDs.
- [Dark after Home](dark-after-home.png), [Dark after cold launch](dark-after-cold.png),
  [Dark Home intro](dark-home-intro.png), [Light entry restored](light-entry.png),
  [Reduced Motion cold entry](reduced-motion-entry.png): native XCTest screenshots.
- [Android density/day-night resource verification](android-resources.json) and
  [contact sheet](android-resources.png): offline official plugin, not emulator proof.
- [First post-install black sample](first-post-install-black.png) and
  [retained observation](first-post-install-boundary.json) record the initial issue
  before silver appeared. Do not omit it or infer a cause from a later passing run.

Source checks:369 tests/41files,50 focused launch/brand cases,14 font cases, TypeScript,
lint0errors/1existing generated warning, CoreText provenance and SVG→PNG reproducibility.
Original9000ms timeline/six layers/V4/shaders/clean texture/poster/OTF bytes are unchanged.
The former extra1000ms hold is removed; existing360ms readiness fade remains.

The native movie recorder's encoded timestamps differ from elapsed wall time. Movies
show sequence and visual state; they are not millisecond startup benchmarks. Physical
pixels/reader speech and Android native runtime remain unavailable. Full details and
intermediate harness failures: [BRAND_GEOMETRY_QA](../../../docs/BRAND_GEOMETRY_QA.md).
