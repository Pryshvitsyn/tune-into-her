# Official silver rings-only icon

The final icon has **two approved silver open rings and no wordmark**. The separate
system app name remains **Tune Into Her**. This supersedes the earlier wordmarked
icon. The approved portrait and native/RN startup photograph keep their original
wordmark and remain byte-identical; the intro, V4 and Home scene are not icon assets.

## Source and narrow edit

The immutable portrait SHA256 is
`dfce7d014d6107bdad02a54886dba3bbb8e5f216065774dc7b7c34e7e3da1c58`.
The existing literal crop **x35, y450, 780×780**, uniformly scaled to 1024px, supplies
the base. The built-in **imagegen edit** removes the lettering and its shadows and
reconstructs the ring/background sections covered by them. It does not replace the
emblem with an SVG, flat drawing, green sphere or different icon style.

Only source-master rows **420–679** can receive generated pixels, with 24px smooth
alpha margins. Every original pixel outside that band is byte-exact, including the
top glint, original lower open ends and surrounding reflections. The selected
1254px imagegen output is stored locally in [source/](source/); it is not required
at a Codex-only path. Its content credentials are retained in the source file.

[Full prompt, tool, source hashes, composition and actual checks](source/rings-only.provenance.json)
record the edit. There are **0 changed pixels outside the band**. Public Apple Vision
accurate OCR recognizes `Tune Into Her` in the original control at confidence 1.0 and
recognizes no text in the new master. This supports visual inspection; it does not
replace native icon verification or claim Founder approval. The covered segments
are reconstructed, not literal recovered original pixels. Downstream regeneration
from the selected raster is deterministic; a new generative call is not involved.

## Canonical outputs

| Use | Generated file |
| --- | --- |
| iOS / App Store / TestFlight / common legacy launcher | [`../icon.png`](../icon.png), 1024×1024 RGB PNG without alpha |
| Actual iOS input | [`App-Icon-1024x1024@1x.png`](../../ios/TuneIntoHer/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png), byte-identical to master |
| Google Play listing upload | [`play-store-512.png`](play-store-512.png), 512×512 32-bit RGBA, fully opaque and below 1024KB |
| Adaptive foreground | [`../adaptive-icon.png`](../adaptive-icon.png), 1024×1024 RGBA |
| Adaptive background | [`adaptive-background.png`](adaptive-background.png), 1024×1024 opaque RGB |
| Output hashes / geometry / preservation | [`manifest.generated.json`](manifest.generated.json) |

Existing `app.config.ts` paths already target these assets. The checked-in iOS input
is replaced too; an installed icon requires native asset-catalog compilation, not
Metro reload. The legacy sphere generator delegates only its icon writes here and
was not run. No identifiers, store settings or user data are changed. Uploads and
native installation are separate root-owned tasks; no store publication is implied.

## Android masking and generated previews

The 108dp adaptive layers show a central 72dp system viewport with a guaranteed 66dp
safe circle. Removing the wordmark permits a larger **768px photo / 128px inset**
inside the 1024px foreground, with complete ring/endpoints inside that safe circle.
Only 24px of outer steel margins have alpha easing; the rings and their shadows are
opaque. Background pixels come from a ring-free steel excerpt of the same master.
The round preview applies 108→72dp framing before its circular mask. OEM motion and
native Android behavior still require an Android runtime; no monochrome redesign
is supplied.

[Android adaptive-icon guidance](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive),
[Expo icon configuration](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/),
[Google Play specification](https://developer.android.com/distribute/google-play/resources/icon-design-specifications),
[Apple asset catalogs](https://developer.apple.com/documentation/xcode/configuring-your-app-icon).

- [Full/small/platform sheet](previews/platform-preview-sheet.png).
- [Generated store listing cards](previews/store-listing-cards.png), icon and app name
  only; no invented ratings, price or publication claim.
- [Android round mask](previews/android-round-system-mask.png).
- [Safe-area diagnostic](previews/android-safe-area-DIAGNOSTIC.png), guides only in a
  preview file, never a production icon.
- Individual iPhone 60pt / Settings 29pt 2×/3× previews have simulated OS masks.
  All previews are labelled/generated, not physical screenshots. Production corners
  stay square so the real OS can apply its own treatment.

Actual official SDK generation of all 20 density files and both adaptive XML resources
is recorded in [source/android-resource-check.generated.json](source/android-resource-check.generated.json).
This is a source/resource check, not an Android SDK build or native runtime test.

## Reproduction

```sh
TIH_BRAND_TOOLS_NODE_MODULES=/path/to/existing/node_modules node scripts/generate-official-icons.cjs
node scripts/generate-official-icons.cjs --check
TIH_BRAND_TOOLS_NODE_MODULES=/path/to/existing/node_modules node scripts/generate-official-icons.cjs --check --raster-check
npx vitest run tests/officialIcons.test.ts
```

Sharp is a build-time tool supplied by the existing tools runtime, not a newly added
project dependency. Generation and `--raster-check` require the module-directory override
shown above unless Sharp is already resolvable. Plain `--check` works without Sharp.
No dependency or lockfile change is required. Checks pin the immutable
portrait and selected edit, protected pixels, actual master/source/native copies,
PNG formats, original display name, safe-circle landmarks and preview separation.
Full raster checking regenerates every output in memory and compares exact bytes.
The OCR result is bound to the master hash; its original source/positive-control
check is documented in the provenance. No Python image editing was used.
