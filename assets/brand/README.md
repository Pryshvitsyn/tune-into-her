# Shared emblem source

The authoritative file is [official-mark.svg](official-mark.svg). Do not edit generated
TypeScript or native PNGs independently.

The two open circular arcs retain the original outer bounds, radii19/15,1.5 stroke,
round caps and composition. The former detached upper-right fragment used a different
circle center. The left trajectory now follows its original main circle continuously;
the lower openings remain open. A mask follows the actual letter contours with a narrow
clearance, replacing the full-width rectangular cut. The lettering is painted last.

The wordmark uses the existing Linux Libertine O Regular OTF, weight400, uniform scale
0.08583691 and baseline224. Native-default “Tu” kerning is−39 font units. Translation
71.673819745 preserves the centered advance. Font bytes and glyph shapes are unchanged.
The independent [CoreText audit](../../tests/font-provenance/README.md) verifies this.

## Regenerate

PNG rendering uses Sharp0.35.5/libvips8.18.7, also supplied through the same external
tool-module convention as the existing repository image generators. Keep this build-time
renderer outside application dependencies:

~~~sh
npm install --prefix /tmp/tih-brand-tools --no-save --package-lock=false sharp@0.35.5
TIH_BRAND_TOOLS_NODE_MODULES=/tmp/tih-brand-tools/node_modules node scripts/generate-intro-brand.cjs
cp assets/launch/official-launch-mark.png ios/TuneIntoHer/Images.xcassets/LaunchLogo.imageset/official-launch-mark.png
TIH_BRAND_TOOLS_NODE_MODULES=/tmp/tih-brand-tools/node_modules node scripts/generate-intro-brand.cjs --check --raster-check
xcrun swift tests/font-provenance/audit.swift . > /tmp/tih-font-provenance.json
~~~

The ordinary --check validates source metadata, exact generated SVG, PNG decoding,
dimensions, native alpha/tint and the existing iOS copy without an external renderer.
--raster-check additionally re-renders the authoritative SVG and requires byte-identical
texture output. Both fail on drift; protected-asset regression hashes remain enabled.

The generator writes brand.generated.ts, brandTexture.generated.ts and the canonical
native PNG through assets/launch/generate.cjs. BrandMark imports that generated arc path.
The existing iOS config plugin copies the canonical PNG on prebuild; Expo's existing
Android splash plugin produces its density resources from the same PNG. Android's
system splash retains its platform icon constraints. No shader or timeline is generated
or modified by this command.
