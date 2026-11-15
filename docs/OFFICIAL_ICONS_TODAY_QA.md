# Official photo icon and isolated Today startup — 2026-11-15

The official icon now comes from the exact Founder-approved photograph. The separate
standalone diagnostic bundle reaches the real Today screen with actual authored guidance
through the existing full intro, without changing normal subscription or trial logic.
Physical iPhone installation/recording awaits an available wired, unlocked phone; current
accepted runtime proof is explicitly Simulator-only.

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

Normal and corrected isolated iphoneos candidates are signed and ready with actual new
native icon resources. The bounded180s wait saw no wired unlocked phone and performed
**no installation**. A combined cable/unlock/Home-page request is pending. Therefore the
new physical Today video, installed physical Home icon and final normal restoration are
not claimed yet; earlier locked-entry iPhone videos cannot substitute for this test.

The prepared phone sequence first stops only the verified target app and privately copies
its existing AsyncStorage directory. It update-installs the separate memory-only QA app,
records the full cold intro/Today, then terminates only the receipt-verified QA process to
capture the Home icon. Before/after private file hashes must match. A finally block restores
the retained normal signed Release even if the QA install/capture fails. No uninstall/reset,
real subscription write, personal cycle edit, clock/theme/language change or notification
schedule is part of the test. Raw storage/IDs/recording prelude/Home wallpaper/tails stay
outside Git. Data-preservation success and restored runtime will be recorded only after
these actual actions succeed.
