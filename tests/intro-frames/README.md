# Deterministic shared-intro frame capture

On macOS with Node 26+, installed project dependencies, and Google Chrome:

```sh
node tests/intro-frames/capture.cjs /tmp/tih-intro-frames 71504ac77a33f888fe65a49c60069a27153f1bea
```

This loads `makeSphereHtml` from the actual TypeScript module graph, original V4
texture and approved scene runtime. The renderer's existing test-only `seek` hook
selects 19 checkpoints from 0 through 9360ms, including the camera/depth joins,
all six ribbons, the 6500ms background fade completion and the 9000ms scene end.
No replacement shader, scene, logo or motion is drawn. The 9360ms sample retains
the final scene geometry while advancing the original material clock.

Four 2x-DPR viewports cover compact/tall iPhone and compact/tall Android aspect
ratios. Each PNG is a full viewport. `frames.json` records actual scene values,
framebuffer/viewport dimensions, SHA-256, WebGL errors and JavaScript exceptions.
The generated steel-blue background covers the original silver CSS gradient and
uses the same `introBackgroundOpacity` function as the app: opaque through 2000ms,
then smoothly removed by 6500ms. The native WebView itself stays transparent. Six
additional actual-GPU probes verify completed-sphere scissor bounds outside and across
the viewport edges; any GL error or JavaScript exception fails the capture.
The renderer HTML and temporary Chrome profile stay outside the repository.
Chrome is launched with a fresh task profile and terminated after capture.

The optional second argument selects a local historical production commit (default
`71504ac77a33f888fe65a49c60069a27153f1bea`, before V5). The tool loads that exact
TypeScript module graph and rejects a changed V4 source texture. At 9000/9360ms,
for all four viewports, it draws both production renderers at the same original
material-clock value and compares SHA-256 of their raw, nonempty RGBA framebuffers.
All eight comparisons must match exactly; the CSS backgrounds are excluded. The
comparison, actual framebuffer dimensions and GL errors are recorded in
`frames.json`. This verifies final V4 equality for this GPU implementation, not
cross-platform rendering equality.

These are Chromium/ANGLE SwiftShader WebGL captures, **not** iOS/Android native
runtime proof. They verify exact scene checkpoints independently of startup and
recording timing. They cannot prove the native splash bridge, app routing,
accessibility behavior or the React Native fade. Use the guarded native UI harness
and an independent cold-launch recording for those boundaries.

`tests/brandGeometry.test.ts` separately derives circular arc extrema including
rounded stroke, reads actual texture alpha bounds and GLSL distortion sampling,
and checks complete logo support every 10ms over nine phone viewport shapes.
