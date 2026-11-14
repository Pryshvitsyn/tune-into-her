# Shared Premium V5 emblem

[official-mark.svg](official-mark.svg) is the authoritative foreground geometry and
metallic appearance. [steel-background.svg](steel-background.svg) supplies the separate,
independently authored steel-blue atmosphere. The supplied [Founder reference](reference/README.md)
is immutable and is never used as a stretched runtime screenshot.

The two existing open ring paths and the exact Linux Libertine O Regular outlines,
native-default kerning, uniform scale and centering are preserved. The main glyph path
has no added stroke. Reused geometry supplies thin polished edges, silver surface
reflections and restrained ambient shadows; surface glints are clipped to the rings, with small connected warm-white blooms.
The existing OTF remains unmodified. The independent
[CoreText audit](../../tests/font-provenance/README.md) verifies actual glyph geometry.

## Deterministic outputs

`scripts/generate-intro-brand.cjs` renders the SVGs with existing Sharp0.35.5/libvips8.18.7:

- `brand.generated.ts`: exact SVG geometry/appearance and shared header arc path.
- `brandTexture.generated.ts`: full RGB metallic foreground,1600×1120, transparent
  padded design viewBox `-80 -80 800 560`. Never replace this material with a flat tint.
- `brandBackground.generated.ts`:900×1950 background PNG URI, `cover` fit, palette and
  the shared first-frame placement constants. The atmosphere is separate from the mark.
- `assets/launch/official-launch-mark.png` and `steel-background.png`: byte-identical
  copies of the shared foreground and background PNGs, with no native recoloring.

The logical first-frame design width is `min(viewportWidth*1.05,560)`, with padded width
scaled by1.25 and padded height by0.875. Its center is `(0.5*width,0.46*height)`. The
reference foreground, native splash, loading fallback and first GPU frame share these
constants. Intro wrappers/compositor own subsequent movement; these assets do not
modify V4 shaders, sphere source/texture, timeline or application state.

## Regenerate and check

Use the existing external build-time renderer; it is not an application dependency:

```sh
TIH_BRAND_TOOLS_NODE_MODULES=/path/to/existing/node_modules node scripts/generate-intro-brand.cjs
cp assets/launch/official-launch-mark.png ios/TuneIntoHer/Images.xcassets/LaunchLogo.imageset/official-launch-mark.png
TIH_BRAND_TOOLS_NODE_MODULES=/path/to/existing/node_modules node scripts/generate-intro-brand.cjs --check --raster-check
xcrun swift tests/font-provenance/audit.swift . > /tmp/tih-font-provenance.json
```

On the current build host the existing renderer parent is
`~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`.
The existing iOS splash plugin/root native integration additionally copies the background
into its native asset catalog. Android's existing Expo splash generator consumes the
foreground within OS icon constraints; a resource check does not prove native runtime.

Ordinary `--check` verifies immutable reference bytes, authoritative source metadata,
exact generated SVG, decoded dimensions, full-RGB foreground/background identity and
existing iOS foreground/background copies. `--raster-check` also independently re-renders both SVGs
and requires byte-identical PNGs. Protected renderer/shader/timeline tests remain enabled.
