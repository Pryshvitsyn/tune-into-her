# Official icon source and compiled-asset audit — 15 November 2026

[Sanitized audit](proof.json) · [Canonical assets and reproduction](../../../../assets/icons/README.md) · [Generated platform previews](../../../../assets/icons/previews/platform-preview-sheet.png) · [Generated listing cards](../../../../assets/icons/previews/store-listing-cards.png)

The approved photograph is the only artwork source. Its SHA256 is
`dfce7d014d6107bdad02a54886dba3bbb8e5f216065774dc7b7c34e7e3da1c58`.
A literal **x35, y450, 780×780** square preserves the entire raised wordmark,
two rings, endpoints, light/reflections and steel background. One uniform scale
produces the opaque, unrounded **1024px RGB iOS master**. The Play upload asset is
**512px, 8-bit RGBA / 32-bit PNG**, fully opaque and 470,865 bytes, below 1024KB.
No lettering is removed or replaced, and no new logo is drawn.

The canonical master and actual checked-in native `AppIcon` input are byte-identical
(SHA256 `342ffc30da786e7fba9c079207c88d1296a23d5ad6b1c995a5004cd51d88fcd2`).
The native asset catalog and Expo icon paths both use these official outputs.
The old sphere asset generator now delegates only icon writes to this pipeline;
its sphere SVG/PNG literals and existing output bytes remain intact. It was not run.

## Adaptive Android source and actual generated resources

Both adaptive layers are 1024px. The complete photographic square is uniformly
scaled to 672px and inset 176px into the transparent foreground. Only its outer 24px
steel margins receive alpha easing; the wordmark, rings and their shadows remain
opaque. The background is a ring/letter-free steel excerpt of that same master.

The real Android layer/viewport/safe-circle measurements are 108/72/66dp. The
safe radius is 312.8889px and the maximum conservative landmark radius is 310.1838px,
leaving 2.7051px clearance. A second read-only review independently confirmed the math
and found no visible clipping in the simulated round viewport. This is geometry
and preview evidence; it does not establish OEM mask/parallax runtime behavior.

The installed official Expo 57 `setIconAsync` implementation was executed against
an isolated temporary resource directory. All **20 actual generated WEBP files**
were checked again for their hashes and dimensions: five densities, each containing
legacy square/round plus adaptive foreground/background. Legacy sizes are 48/72/96/
144/192px; adaptive sizes are 108/162/216/324/432px. Both adaptive XML resources reference
the generated foreground/background layers. No Android project was added to the
repository. There was **no Android native build, SDK/emulator/device run or store upload**.
The proof records these resources, not hypothetical required files.

## Actual Xcode compilation and signed artifact checks

Xcode `actool` rebuilt the assets. The actual compiled `Assets.car` changed to
`e3e94061005bab910a6b2444293db7a8619ac3ae606c9c299e414fded5dbf023`.
Its `AppIcon` 1024px content digest changed. All four launch renditions retain exactly
their prior assetutil-reported dimensions and content digest:

| Preserved compiled resource | Pixels |
| --- | --- |
| `LaunchApprovedOpening` |851×1847 |
| `LaunchLogo` |1600×1120 |
| `LaunchSilverGradient` |1024×1 |
| `LaunchSteelBackground` |900×1950 |

The actual generated loose native icons are also inventoried in the proof.
These checks concern compiled asset contents/metadata; they are not a claim of a
new decoded GPU comparison or a complete Swift recompilation.

Three accepted artifact definitions remain separate:

| Artifact | JavaScript / access scope |
| --- | --- |
| Normal physical Release | Ordinary app gates, no standalone QA marker |
| Corrected physical isolated QA Release | Explicit memory-only `paid-active` fixture; private alias graph verified |
| Corrected Simulator isolated QA Release | Same isolated fixture, separate platform artifact |

Every accepted app independently passes `codesign --verify --deep --strict`.
Disposable copies of native executables were stripped only for the comparison:
unsigned code matches the previous signed Release; framework files, existing phone
provisioning profile and all non-icon Info.plist values match. Actual native,
embedded-JS and asset hashes match the corresponding artifact metadata and current
source inputs. **Native assets were compiled; native Swift code was not recompiled.**
The normal and QA binaries/JS hashes are explicitly different and fully recorded.
The first failed private-alias bundles remain excluded from accepted evidence.
No QA result is presented as an ordinary purchase or production entitlement.

## Preservation and source checks

Against baseline `4c079d306da833c17e138cdfa996cf8536ddb4f2`, the audit compares all
tracked application/content source and the selected native/asset/backend/dependency
paths byte-for-byte. It includes the original root V4 renderer, clean texture/poster,
full intro/timeline/one-second ending/Home, native launch/reference, font/notices,
all 11 locale catalogs, cycle calculations, trial/subscription services and backend.
The proof gives file counts, deterministic path/hash-list digests, critical source
hashes and all 11 locale hashes. There are no added production app/src/content/backend
files. Config changes are confined to the adaptive-icon fields.

Root's frozen source run: **442 tests / 49 files pass**, typecheck passes, lint has
0 errors and one prior generated-router warning. The 12 focused icon/splash tests,
full byte-for-byte icon raster regeneration and whitespace check pass. Physical
journey, actual SpringBoard icon and data-restoration evidence are separate from
this source/compiled-asset audit and must be read in the parent report.

## Primary platform references and limits

Apple documents using a single 1024px catalog image to generate icon variations for
the App Store, Home Screen and Settings. This implementation uses the existing
asset-catalog mechanism: [Apple Xcode icon configuration](https://developer.apple.com/documentation/xcode/configuring-your-app-icon).
App Store/TestFlight icon changes require an uploaded build; no upload or publication
is claimed here: [Apple App Store Connect icon help](https://developer.apple.com/help/app-store-connect/manage-app-information/add-an-app-icon).

Google distinguishes launcher adaptive layers from the Play listing asset:
[Android adaptive-icon geometry](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive),
[Google Play 512px/32-bit PNG and 1024KB requirements](https://developer.android.com/distribute/google-play/resources/icon-design-specifications).
The configuration paths follow [Expo's icon documentation](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/).

All preview masks and store cards are explicitly **generated simulations**, not
screenshots, store approval or proof of publication. No ratings/prices were invented.
Raw device identifiers, signing identities/certificates/profiles and personal app
storage are absent. This audit reads app artifacts, not phone user data or raw movies.
Founder visual acceptance and Android native/runtime validation are not asserted.
The completed whole-set privacy/secret audit is [final-audit.json](../final-audit.json).
