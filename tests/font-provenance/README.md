# Existing wordmark and font provenance

Recorded: 2026-11-14. This diagnostic reads the existing font and vector files; it changes
no app code, font, texture, shader, native setting or installed font.

The delivered Variant #8 wordmark uses outlines equivalent to the bundled, trusted
Linux Libertine O Regular face. All 264 SVG commands and corresponding CoreText glyph
coordinates match within the explicit numeric tolerance. There is no detected outline
or style mismatch between these two resources. This does not settle the Founder's
reported appearance difference on the iPhone.

## Reproduce on macOS

From the repository root with Xcode Command Line Tools available:

```sh
xcrun swift tests/font-provenance/audit.swift . > /tmp/tih-font-provenance.json
```

Exit 0 means the actual OTF checksum, command topology, glyph coordinates, spacing and
absence of added wordmark stroke meet the recorded checks. The script loads CoreText
font descriptors directly from the OTF URL, without a family-name lookup, installation,
font download or external package. It normalizes SVG H/V commands to L and reverses the
font Y axis. Numeric tolerance is 0.0001 font units (1e-7em for this 1000-UPEM face).

[report.json](report.json) is the sanitized output of that command on the inspected
source. Regenerate it after an intentional source change; minor CoreText floating-point
report values can vary by OS, so the explicit pass/tolerance is the meaningful test.
This macOS diagnostic supplements the normal unit suite and native visual checks.

## Actual identity and composition

| Property | Observed value |
| --- | --- |
| Existing font | `assets/fonts/LinuxLibertineO-Regular.otf` |
| SHA-256 | `6332761e4fc08e30bce6f47e4a08e7d5332abe000ab6ca06c8e86bd88f456114` |
| CoreText family | `Linux Libertine O` |
| CoreText PostScript name | `LinLibertineO` |
| Style / version | `Regular` / `Version 5.3.0` |
| Units per em | 1000 |
| Wordmark | `src/intro/brand.generated.ts`, literal `Tune Into Her` |
| Compared geometry | 11 letters, 14 contours, 264 commands |
| Maximum coordinate difference | 0.000030517578125 font units; CoreText float conversion noise |
| Per-glyph origins | Exactly cumulative unkerned advances; no net tracking/pair adjustment |
| Total advance | 5825 font units |
| SVG composition | `translate(70 224) scale(0.08583691)`; uniform scale |
| Advance after composition | 500.00000075 design units |
| Additional thickness | No SVG stroke; outlines match the Regular face |

The runtime registration alias `LinuxLibertineO` is separate from the font's actual
family/PostScript names. The audit establishes glyph geometry using the file itself.
UI coverage and script fallback remain covered by the existing font tests and
[font source record](../../assets/fonts/README.md).

## Delivered Variant #8 reference

The original local delivery explicitly records the selection:

- Source: `~/Downloads/TuneIntoHer_Intro_Code/README_RU.md`, lines 9–11.
- Short excerpt: “Linux Libertine O Regular, вариант №8. Надпись превращена в векторные контуры”.
- README SHA-256: `8f78e1b4de62450bf9a4ef87327cb98b801b3793596dfcd2ea49acb73a7c81c8`.
- That delivery's `PROVENANCE.md` says only the specific wordmark paths are included;
  it includes no font software or general glyph set. Its SHA-256 is
  `cd9ecd55b5a49e53c701cead033fffe94736bd069a630a0aee53b061acd9b0ba`.
- `TuneIntoHer_Intro_Code/payload/src/intro/brand.generated.ts`, the subsequent
  `TuneIntoHer_Deep_Intro_V2` payload and its original fixture match the inspected
  repository vector byte-for-byte, SHA-256
  `00d2bb375b62d235cd915bda3c0797884e28bb7f6393bcec062b6d1c5d4a0fee`.
- Git introduces that vector at `0951c14` (2026-11-12). The independently verified
  bundled UI font enters at `8c529f7`; that later font file did not generate or
  replace the existing wordmark at runtime.

This is a concrete delivered reference bearing the Variant #8 label. The original
numbered comparison/approval image, conversion program and generating font binary were
not recovered. The delivery deliberately omitted font binaries. Equivalent glyphs
cannot prove the exact historical generating file/version byte-for-byte, because
multiple font files can contain the same outlines for this text.

The existing delivered vector is therefore the strongest available visual reference;
the trusted unmodified OTF is the strongest available compatible UI font. No arbitrary
replacement or fabricated claim of reproducing an unavailable approval image is warranted.
The reported perceptual difference must still be judged in actual rendered frames and
across the UI; this mathematical result does not overrule that feedback.

## Bounded lookup and confidence

The investigation checked project sources, all refs/36 reachable Git commits, the
project migration and backup sources, project-named local intro packages/previews,
matching attachment text and connected Tune Into Her conversation summaries. The
history lookup inspected 450 active listing entries, found the 12 visible project
chats plus a same-name chat, and found no archived chats. Relevant returned turns and
attachment names provided no original numbered font-comparison sample. The history
provider returned limited recent turns with no further cursor; this is not a claim
that every old turn or every historical image was accessible.

Confidence is high for existing vector ↔ trusted font glyph equivalence and the
delivered Variant #8 label. Exact original comparison-image styling and generating-font
file identity remain unverified. The production font and wordmark are preserved.

## License scope

The existing font is the unmodified CTAN Libertine 5.3.0 OTF. Its supplied distribution
notice offers the Open Font License option. Original `LICENCE.txt` and canonical OFL
text remain in `assets/fonts/`; their hashes are included in the generated report.
The existing Terms transport/bundle notice tests preserve these notices in the app.
This audit introduces no font download or replacement and does not certify merchant
legal or store readiness.

## Delivered WebGL/native PNG trace

A final read-only comparison also verified the image that users actually see:

- Current `brandTexture.generated.ts` matches the delivered Deep Intro V2 payload
  byte-for-byte, SHA-256
  `b081f98ca837efde52545822bfeb5c617e6cdede1c5345a1608ea67e100b2910`.
- Its decoded PNG matches both that payload and the co-delivered `proof/brand_padded.png`,
  SHA-256 `347cb7e26f2f9006b1655fbbb5768e2129e4cfb3975a31a83e8adef4eb57517b`.
- The first Intro Code delivery used the same Variant #8 SVG directly; Deep Intro V2
  added the documented transparent padding (`-80 -80 800 560`, rendered at2x).
  The co-delivered vector is the same byte-verified source audited above.

This establishes delivered-byte provenance for the padded raster as well as the
outlined reference. The original rasterization program is unavailable; no independent
SVG-to-PNG rerender/pixel-equivalence claim is made. No current graphic was regenerated.
