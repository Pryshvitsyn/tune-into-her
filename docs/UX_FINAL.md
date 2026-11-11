# UX final — implemented candidate, not a visual-approval substitute

Updated: 2026-11-11

## Current rendering contract

Today uses a single `AdviceBlocks` sequence:

```text
KEEP IN MIND
  ↳ rotating reminder
approved V4 sphere
SUPPORT
  ↳ rotating reminder
DO
  ↳ rotating reminder
```

The sphere is passed into `AdviceBlocks` by `app/today.tsx` and the same direct V4
component appears in the first onboarding step. `app/_layout.tsx` preloads V4 resources.
No second active sphere component or normal-use static overlay is intended in this
path. The V4 poster remains only until the first live WebGL frame or when its own error
path needs it.

## Responsive behavior implemented

- Today chooses a sphere size constrained to 216–280 points and the available screen
  width (`width - 56`), rather than fixing a device-specific diameter.
- Advice blocks use a centered layout and retain distinct hierarchy: heading 18,
  body 16, secondary/reminder 13.
- Feedback and history are local additions beneath the daily content; they do not
  change the selected cue's semantic structure.
- The existing bottom navigation and screen system remain part of the selected native
  baseline.

## Visual identity evidence boundary

The active identity uses procedural/vector `BrandMark` components. The audit found no
verified founder-supplied original raster emblems from which it can establish
provenance. Therefore the renderer and current identity must be visually reviewed on
simulator/device; this document does not certify asset originality, small-size geometry,
or platform appearance.

## Required visual QA before a release claim

1. Launch the actual native candidate (not an incomplete DerivedData product).
2. Observe the V4 sphere beyond one full 8-second phase cycle and confirm continuous
   motion, clean texture, stable outer silhouette, and no normal-use poster overlay.
3. Check Today and onboarding at compact and regular iPhone widths, including the
   centered advice sequence, bottom navigation, and feedback/history reachability.
4. Check both declared appearance modes and the 11 localized surfaces for clipping,
   raw keys, unexpected English fallback, and language-specific typography issues.
5. Record the device/simulator, OS, build revision, tester, and reproducible defects.

Until those observations exist, this is an implementation description rather than a
visual acceptance sign-off.
