# Final framed photographic opening — deterministic GPU evidence

104 actual Chromium/ANGLE SwiftShader frames cover 26 clock checkpoints across four 2× DPR viewports: 375×667, 393×852, 360×800 and 412×915. This folder retains 11 original viewport PNGs and three labelled contact sheets. Full capture metadata and hashes remain in `frames.json`; older captures are preserved separately.

The exact archived 851×1847 Founder PNG is byte-identical to the native asset, with SHA-256 `dfce7d014d6107bdad02a54886dba3bbb8e5f216065774dc7b7c34e7e3da1c58`. A centered CSS cover image models the correctly sized native/RN photo layer: fully opaque through 650ms, then a smooth fade to zero by 1350ms. All 104 actual GPU samples have preparation token 1 and `u_logoOpacity=0`, preventing a second reconstructed emblem. All six original depth ribbons appear; the scene remains 9000ms.

Eight raw straight-color V4 framebuffer comparisons against untouched historical `71504ac`, and eight associated-presentation comparisons against that baseline with only the identical output adapter, match exactly. No tolerance replaces these equality assertions. There are zero WebGL errors and zero JavaScript exceptions.

Source hashes include `ApprovedOpening.tsx` with explicit 100% Image width and height, `GlobalLaunch.tsx`, `SphereIntroSurface.tsx` and `nativeSplashGate.ts`, plus the renderer, scene, shaders, assets and opacity functions. Every source hash was checked against the working source again before this copy.

These are deterministic rendering checks using preparation plus the existing test-only seek hook. Chromium does not execute React Native Image sizing, native splash hiding, UI-frame acknowledgements, routing, accessibility or a physical-device renderer. The earlier oversized 851×1847-point RN framing failure requires separate actual-component and native verification. This evidence does not establish native handoff success or Founder visual approval.

Contact sheets resize snapshots for presentation. Equal-height thumbnail cells may show dark margins; the original viewport PNGs have no artificial framing. The previous reconstructed column is explicitly historical.

Reproduce from the repository root:

```sh
node tests/intro-frames/capture.cjs /tmp/tih-framed-capture 71504ac77a33f888fe65a49c60069a27153f1bea
```
