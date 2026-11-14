# Deterministic shared-intro frame capture

On macOS with Node 26+, installed project dependencies, and Google Chrome:

```sh
node tests/intro-frames/capture.cjs /tmp/tih-intro-frames
```

This loads `makeSphereHtml` from the actual TypeScript module graph, original V4
texture and approved scene runtime. The renderer's existing test-only `seek` hook
selects 0, 500, 1000, 2000, 2500, 3500, 4300, 4500, 9000, 9500 and 10000ms.
No replacement shader, scene, logo or motion is drawn. The two post-9000ms samples
retain the final scene geometry while advancing the original material clock.

Four 2x-DPR viewports cover compact/tall iPhone and compact/tall Android aspect
ratios. Each PNG is a full viewport. `frames.json` records actual scene values,
framebuffer/viewport dimensions, SHA-256, WebGL errors and JavaScript exceptions.
A silver CSS gradient supplies the same backdrop as the native launch cover.
The renderer HTML and temporary Chrome profile stay outside the repository.
Chrome is launched with a fresh task profile and terminated after capture.

These are Chromium/ANGLE SwiftShader WebGL captures, **not** iOS/Android native
runtime proof. They verify exact scene checkpoints independently of startup and
recording timing. They cannot prove the native splash bridge, app routing,
accessibility behavior or the React Native fade. Use the guarded native UI harness
and an independent cold-launch recording for those boundaries.

`tests/brandGeometry.test.ts` separately derives circular arc extrema including
rounded stroke, reads actual texture alpha bounds and GLSL distortion sampling,
and checks complete logo support every 10ms over nine phone viewport shapes.
