# Official photographic icon assets

The icon is a literal square excerpt of the exact Founder-approved opening photograph,
not an illustrated or regenerated logo. Its complete raised **Tune Into Her** wordmark,
two open rings, endpoints, light, reflections and steel background remain in the crop.
The portrait, splash, V4 and animation sources are not changed by this pipeline.

The crop is source pixels **x35, y450, 780×780**, centred on the emblem. Compared
with an 851px full-width square, this makes the original lettering approximately 9.1%
larger while keeping about 5–6% side clearance. The 1024px master uses one uniform
Lanczos3 scale; it has opaque square corners, without an added corner mask or shadow.

| Use | Canonical generated file |
| --- | --- |
| iOS / App Store / TestFlight / common legacy launcher | [`../icon.png`](../icon.png), 1024×1024 RGB PNG |
| Actual iOS asset-catalog input | [`App-Icon-1024x1024@1x.png`](../../ios/TuneIntoHer/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png), byte-identical to the master |
| Google Play listing upload asset | [`play-store-512.png`](play-store-512.png), 512×512, 32-bit RGBA PNG, fully opaque, below 1024KB |
| Android adaptive foreground | [`../adaptive-icon.png`](../adaptive-icon.png), 1024×1024 RGBA |
| Android adaptive background | [`adaptive-background.png`](adaptive-background.png), 1024×1024 opaque RGB |
| Reproducible provenance / hashes | [`manifest.generated.json`](manifest.generated.json) |

`app.config.ts` points the common icon at the master and Android foreground/background
at these two adaptive assets. The checked-in native iOS catalog is also updated because
changing Expo config alone does not replace assets in an existing native project.
The current Xcode universal 1024px catalog lets the asset compiler produce native sizes.
Expo prebuild generates Android densities from the configured source images; there is
no checked-in Android project. Store upload/submission is **not** performed, and an
upload asset on disk does not prove that any store listing has changed.

## Adaptive masking

Expo 57 emits 108dp foreground/background layers. Android displays a central 72dp masked
viewport; its central 66dp circle is the guaranteed safe area. The foreground contains
the same complete square photo, uniformly scaled to 672px within a 1024px transparent
canvas (176px inset). Conservative wordmark/ring landmarks remain within the safe
circle; the manifest records the coordinates and radius calculation.

Only the outer 24px **steel margins** of this inset tile have alpha easing. The actual
wordmark, rings, endpoints and their shadows remain opaque. No foreground RGB/art is
repainted. The opaque background is a uniform enlargement of a letter/ring-free steel
excerpt from the same 1024px master, avoiding a duplicate logo behind the foreground.
The background is visible during system masking/motion and bridges the outer margins.

The round preview applies the actual 108→72dp centre viewport before a circular mask.
The diagnostic adds guides only in a preview file. OEM mask/parallax/themed-icon
behavior and a native Android build remain unverified on this host. No monochrome
reinterpretation of the approved photographic mark is supplied.

[Android adaptive-icon guidance](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive),
[Expo icon configuration](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/),
[Google Play 512px/32-bit/1024KB specifications](https://developer.android.com/distribute/google-play/resources/icon-design-specifications).

## Generated previews

- [Platform sheet](previews/platform-preview-sheet.png): master, Play icon, iPhone 60pt,
  Settings 29pt, small nominal-pixel views and the Android round mask.
- [Store listing cards](previews/store-listing-cards.png): icon and app name only;
  labelled generated/unpublished, with no invented ratings, prices or store approval.
- [Android round mask](previews/android-round-system-mask.png).
- [Adaptive safe-area diagnostic](previews/android-safe-area-DIAGNOSTIC.png): guide
  strokes are **not** part of any production asset.
- Individual iPhone 2×/3× previews use a clearly simulated OS-style corner mask.
  Production inputs remain unrounded. These are generated previews, not screenshots
  or evidence of installation. Actual SpringBoard/Settings/build proof is separate.

## Reproduction and checks

Use the existing Sharp tools dependency; no package installation is necessary in the
prepared environment:

```sh
TIH_BRAND_TOOLS_NODE_MODULES=/path/to/existing/node_modules node scripts/generate-official-icons.cjs
node scripts/generate-official-icons.cjs --check
TIH_BRAND_TOOLS_NODE_MODULES=/path/to/existing/node_modules node scripts/generate-official-icons.cjs --check --raster-check
npx vitest run tests/officialIcons.test.ts
```

`--check` verifies the immutable source, crop, generated file hashes/dimensions,
native copy, safe-circle geometry and protected launch/V4 assets. `--raster-check`
regenerates every output in memory and compares exact encoded bytes. The tests also
independently probe the source-to-master uniform geometry, opacity, Play PNG format,
configured/native copies, adaptive landmark clearance and preview separation.

The historical `create-brand-assets.cjs` retains its old sphere SVG/PNG literals and
outputs but delegates icon generation here; it cannot restore the obsolete green
sphere icons. That historical sphere generator is not run for this change.
