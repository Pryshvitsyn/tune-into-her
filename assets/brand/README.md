# Shared Premium V5 emblem

The exact [Founder photograph](reference/README.md) owns the native/RN/Home opening.
It is copied byte-for-byte, never reconstructed, recolored or stretched. Centered cover
framing preserves the central emblem across supported portrait sizes. The shared native
image overrides intrinsic dimensions with100% width/height so it matches the storyboard.

[official-mark.svg](official-mark.svg) remains the authoritative existing vector geometry
and metallic appearance for the header/legacy scene. [steel-background.svg](steel-background.svg)
remains the separate scene atmosphere. These protected sources are not redrawn to imitate
the photograph. The GPU omits the SVG emblem during photographic opening; the photograph
quietly yields to the original six-layer metal travel650–1350ms into the same9s clock.

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
- `assets/launch/approved-opening.png`: byte-identical original photograph, copied into
  the single full-bounds iOS LaunchApprovedOpening image.
- `assets/launch/official-launch-mark.png` and `steel-background.png`: preserved byte-identical
  copies of the shared foreground and background PNGs, with no native recoloring.

The preserved vector scene's logical width is `min(viewportWidth*1.05,560)`, with its
original padded geometry/center. These are legacy vector/diagnostic coordinates, not the
photographic opening's layout. The opening uses one uniformly scaled full-frame image;
V4 shaders, sphere source/texture, timeline and application state are unchanged.

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
The existing iOS splash plugin copies the exact photograph and preserved animation
resources into its native catalog. Android's Expo generator uses the same original photo
within the Android12+ OS icon mask; full-screen photographic framing begins in RN. The
OS-managed icon cannot become a full-bleed native photo through this configuration.
A source/resource check does not prove Android native runtime.

Ordinary `--check` verifies immutable reference bytes, authoritative source metadata,
exact generated SVG, decoded dimensions, full-RGB foreground/background identity and
existing iOS foreground/background copies plus exact original/native photograph equality. `--raster-check` also independently re-renders both SVGs
and requires byte-identical PNGs. Protected renderer/shader/timeline tests remain enabled.
