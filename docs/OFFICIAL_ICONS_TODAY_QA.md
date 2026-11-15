# Official photo icon and isolated Today startup — 2026-11-15

Historical wordmark-icon / normal-restoration checkpoint. The latest Founder correction
uses rings-only icons and keeps private QA installed: [current final UX proof](FINAL_UX_QA.md).

The official icon now comes from the exact Founder-approved photograph. The separate
standalone diagnostic bundle reaches the real Today screen with actual authored guidance
through the existing full intro, without changing normal subscription or trial logic.
The signed standalone test has now also run on the physical iPhone without Metro; the
normal Release with the new icon is restored. Personal AsyncStorage was verified unchanged
before QA, after QA and after normal installation. Physical proof is separate from Simulator proof.

## One photographic icon source

The immutable851×1847 source remains SHA256
`dfce7d014d6107bdad02a54886dba3bbb8e5f216065774dc7b7c34e7e3da1c58`.
`scripts/generate-official-icons.cjs` takes literal source rectangle x35/y450/780×780 and
uniformly resamples it. No glyph, ring, lighting or reflection is redrawn. This framing
makes the full original wordmark about9.1% larger than a full-width851px crop and keeps
roughly5–6% side clearance. Source corners stay square; system masks appear only in previews.

| Target | Actual source/export |
| --- | --- |
| iOS, App Store, TestFlight | `assets/icon.png`,1024×1024 opaque RGB; byte-identical native AppIcon input |
| Google Play listing | `assets/icons/play-store-512.png`,512×5128-bit RGBA, opaque,470865bytes |
| Android adaptive foreground/background | `assets/adaptive-icon.png`, `assets/icons/adaptive-background.png` |
| Source/crop/mask/output hashes | `assets/icons/manifest.generated.json` |
| Full/small/round previews | `assets/icons/previews/platform-preview-sheet.png` |
| Clearly generated listing cards | `assets/icons/previews/store-listing-cards.png` |

The legacy brand generator now delegates only its icon writes to this canonical pipeline;
its separate sphere-generation literals remain unchanged and were not run. Both official
application identifiers are unchanged. The photograph/splash, complete six-layer timeline,
V4 texture/shader/renderer/8s loop, one-second hold, Home replay,11languages, persistence,
cycle, trial and subscription sources are preserved.

The Android foreground places the same full photo inside the108dp layer and its66dp safe
circle. An alpha-only24px feather affects outer steel margins, preserving the rings,
lettering, endpoints and shadows. The background samples ring/letter-free steel from the
same master, so there is no second logo. [Detailed source/native/Android proof](../release/evidence/official-icons-today-20261115/icons/README.md).

The sizes/masking follow [Apple asset-catalog guidance](https://developer.apple.com/documentation/xcode/configuring-your-app-icon),
[Apple icon HIG](https://developer.apple.com/design/human-interface-guidelines/app-icons),
[Google Play specification](https://developer.android.com/distribute/google-play/resources/icon-design-specifications)
and [Android adaptive-icon guidance](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive).
Listing cards are previews; no store or TestFlight upload occurred.

## Actual native asset compilation

Xcode `actool` compiled the complete checked-in asset catalog for iphoneos and
iphonesimulator. Signed candidate apps contain the new `Assets.car` and all generated
AppIcon PNGs; icon-only partial-plist fields were merged, and other plist values, bundle ID,
profile, unsigned native executable and frameworks remain unchanged. This is real native
**asset** compilation followed by official Expo/Hermes embedded-resource bundling/signing;
unchanged Swift/Objective-C code was not recompiled. A Metro reload is not presented as
an installed-icon update.

CoreUI verifies the AppIcon content digest changed while all four launch rendition
content digests/dimensions stayed exact. Normal and diagnostic artifacts are separately
identified in [artifact JSON](../release/evidence/official-icons-today-20261115/artifacts/).
The normal bundle retains its original Index and disabled production QA gate, with no
private bootstrap marker. Native Updates is disabled; no cached OTA replaces embedded JS.

Actual Expo Android resource generation independently produced/checked20WEBP density
resources and2adaptive XML resources. There is no checked-in Android project. JDK/SDK/adb
are absent, so Android native compilation/emulator/device behavior is not claimed.

## Isolated standalone Today access

`tests/native-launch/standalone-qa.cjs --standalone-qa` explicitly prepares ignored private
entry/session/Index/Metro configuration files. Development JavaScript stays false. The
wrapper starts the existing memory-only paid-active scenario synchronously before router
registration; AppProvider skips real storage/cache/billing/notification effects from its
first mount. Actual Today/cycle/content/navigation/intro code remains the subject under test.
The fixture date/day is synthetic and visibly labelled DEVELOPMENT MOCK BILLING.

The private controller cannot exit into the personal-data scope; End QA resets its memory
fixture. Restoring the separately retained normal Release ends this diagnostic artifact.
This introduces no real account, payment, trial grant or production entitlement exception.
Normal source guards (`__DEV__ && explicit flag`), AppContext and ordinary routes are unchanged.

The first diagnostic bundle was rejected before any phone install: installed Expo57 parsed
but dropped `--config`, leaving AppProvider bound to the normal disabled singleton. The
supported explicit `EXPO_OVERRIDE_METRO_CONFIG` fixes it. A new emitted-bundle verifier
checks the actual provider/hook/session/Index module graph and fails packaging before an
artifact may be accepted. The rejected recording/app clones are not successful evidence.
Normal packaging explicitly clears every private override; source and tests retain default
production behavior. [Reproduction and fail-closed checks](../tests/native-launch/STANDALONE_QA.md).

## Accepted runtime and interaction proof

- [Corrected Simulator cold video and original frames](../release/evidence/official-icons-today-20261115/simulator/README.md):
 one full exact-photo/depth/V4 intro opens actual Today DAY7, authored KEEP IN MIND and
 DEVELOPMENT MOCK BILLING. The selected589frames have monotonic original intervals and
 0black/nearblack/white flashes. A late raw-source timestamp reset outside the accepted
 window is disclosed; no app segment is accelerated or interpolated.
- [Actual Simulator SpringBoard icon crop](../release/evidence/official-icons-today-20261115/simulator/09-actual-simulator-springboard-icon-name.png)
 shows the new photo icon at stable Home size with the OS label. This is not a physical
 iPhone screenshot or generated Home Screen mockup.
- [Native scrolling/interaction case](../release/evidence/official-icons-today-20261115/ui/README.md):
 PASS52.479s. Full authored KEEP IN MIND/SUPPORT/DO and notes are inspected; card modal,
 Settings, Home replay and post-Home modal work in the same process. Home gesture8.698s
 includes GPU initialization/AX work; it is not the one-second hold measurement.
-442tests in49files PASS, TypeScript PASS, lint0errors/one prior generated-router warning.
 Icon/native/raster/hash checks remain enabled. Exact Buffer.equals avoids a costly deep
 comparison without weakening a pixel assertion or extending default test timeouts.
- Independent preservation:216protected tracked files retain exact bytes from4c079d3,
 including original V4/font/launch and all11locales. No source generation reference overwritten.

## Physical verification and data preservation

Normal and corrected isolated iphoneos artifacts were update-installed on the existing
phone with its official identifier/profile, without uninstall/reset or changing ordinary
subscription logic. After a portrait preflight, a new genuine cold launch was recorded
without Metro:25.09675s,1498decoded frames, portrait1126×2436,error0 and strictly increasing
source PTS. The reviewed app-only sequence preserves1226/1226selected frames with their original
intervals,0black/nearblack/white flashes, and contains one exact photo/depth/original-V4 intro,
then actual Today DAY7 with the red mock disclosure and KEEP IN MIND. Later recorded scroll
positions also expose SUPPORT and DO. These are observed UI/content states; no unrecorded
physical tap actor or exact touch-ready timestamp is invented.

A separate15.307933s portrait Home source,error0, shows the actual newly installed silver
icon and full OS label at source frame116/2.005133s. The private wallpaper contains personal
photos; only the actual icon pixels are published in a labelled privacy-masked cutout.
The OS-label/wallpaper/neighbors and original full Home recording remain private. This
redacted icon evidence is distinguished from an unmodified full Home screenshot and from
the generated store/mask previews. QA and restored normal use byte-identical Assets.car.

The first attempted video stopped at0.95235s with AVFoundation MediaChanged(-11809) when
the source changed from landscape during launch. It is **rejected**, even though the SDK
reported finishedSuccessfully. The host recorder procedure was corrected: portrait preflight,
errorCode0, portrait dimensions and a≥15s media-duration gate; Home is recorded separately
after the app movie is closed. No app, shader, subscription, geometry or timeline edit was
needed. Earlier failed attempts remain private diagnostics, not accepted startup proof.

[Actual physical video, frames and icon](../release/evidence/official-icons-today-20261115/physical/README.md)
and [independent data-preservation proof](../release/evidence/official-icons-today-20261115/physical/preservation.json)
record the successful test. One actual AsyncStorage file/two entries was compared three
ways, using both file hashes and manifest-object equality. No keys, values or personal
hashes are published. The final comparison is after normal **installation**, before its
subsequent successful normal launch; a post-launch snapshot is not claimed. Keychain was
not read or hashed. Existing official identity/profile stayed unchanged and no deletion
or real subscription/cycle/preference write was part of QA.

The normal signed Release was restored automatically, contains no standalone marker,
and its launch returned0. The synthetic session is gone with its process; ordinary access
checks and saved data are authoritative again. The actual phone is no longer needed for
this completed recording. Android native SDK/emulator, real store transactions and spoken
screen-reader acceptance remain separate unverified boundaries; no store upload occurred.
