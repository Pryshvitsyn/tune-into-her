# ARCHITECTURE
Updated: 2026-11-15 (Europe/Rome); final UX/education/private-QA work preserves the approved launch and monetization architecture.

## Frontend

Expo SDK 57 / React Native / TypeScript / Expo Router under `app/`. AppContext composes
services and state. `src/theme` holds the shared light/dark Silver Chrome palettes;
`useTheme` reads persisted appearance. Existing screen styles remain palette factories.
Shared Screen provides header, mist and tabs. Today and onboarding retain the approved
`TuneIntoHerSphereV4` renderer; resource loading does not alter its renderer/shader/clock
contract.

## Explicit Home and secondary navigation

`HomeTransition` wraps the existing route stack inside GlobalLaunch. BrandHomeButton reuses
one SphereIntroSurface/approved WebView scene. Its independent reducer accepts one replay,
clears its paint latch per gesture, waits for current focused Today paint, then fades without restarting native startup or altering
access. Surface readiness is reported only after focus, foreground and two committed frames.
It pauses hidden destination rendering, protects route/scope changes and respects
foreground/motion/reader state. The genuine cold-launch latch remains separate.

Screen classifies its own stable Expo route through screenNavigation: Today/Cycle/Settings
retain BottomNav; secondary routes share fixed SecondaryNav below scroll content. Header
hides the redundant top Back only on those secondary routes. Back reads the owning
navigation stack at gesture time; Expo's generated root wrapper is not that stack. Calendar's existing editor
is reached by the one Screen footer action. CycleDateField holds only a transient picker
candidate until explicit confirmation; null drafts cannot produce a saved date or estimate.

## Isolated QA

The ordinary `__DEV__` plus explicit mock flag enables `/dev-qa`; it grants no access by
itself and remains false in normal Release. A separate reviewed Founder testing artifact
uses the same controller through explicit build-only aliases, not a production exception.
InternalQASession supplies explicit private scenarios, a managed clock and memory stores.
scopeAppContext selects the existing MockPurchaseService and real AppTrialService evaluator
with injected no-network trial transport. Ordinary sessions use RevenueCat and original
storage. No global Date patch or alternate billing evaluator is introduced.

AppContext pauses real access polling/foreground notification work while QA owns the facade,
and rechecks real access on exit. Today/History/feedback consume scope-specific stores;
forms/paywall remount on dataScope change. Session generations reject stale callbacks;
demo notifications and real web redemption cannot consume private scenario data. Details
and evidence limits: [INTERNAL_QA](docs/INTERNAL_QA.md).

## Startup presentation

`GlobalLaunch` in the root layout owns presentation, independently of access policy.
It starts font/resource work alongside AppContext initialization and uses the existing
local onboarding state and entitlement readiness to choose when a destination can be
revealed. Existing routes and Today access checks remain authoritative; initialization
or presentation readiness cannot grant trial or paid access.

`launchState` is a pure readiness/lifecycle model. Global/Home use the renderer's visible
assembly milestone (original geometry settles at4500ms), then one1000ms active GPU-clock
hold. A finished GPU draw and subsequent foreground RAF provide a presentation opportunity;
this is not claimed as a native compositor acknowledgement. Final geometry comparisons
allow1e-6px floating-point error without changing scene math. Completion permits the existing
360ms fade as soon as destination readiness is satisfied. There is no JS hold timer. The shared
`SphereIntroSurface` and WebView runtime render the same approved timeline, scene,
shaders, logo and V4 material; there is no second WebGL implementation. The material
keeps moving while initialization is slow. Fade requires current-attempt initialization
and destination paint readiness. Destination sphere preparation starts at assembly, under
the cover; Home routes/unpauses Today then and latches readiness independently of hold-end.
Late readiness never restarts the hold. The scene clock continues unchanged through any
readiness wait, retaining the V4 material loop. Standalone Today keeps its original9000ms
text-reveal timeline; Global/Home do not wait out that text-only horizon. Initialization
failures expose Retry; completed
choreography is retained and stale attempt callbacks cannot release the new gate.

`LaunchPresentation` coordinates destination visibility and accessibility and suppresses
its duplicate sphere while the global sphere is present. `GlobalLaunch` retains its
completion latch only in process memory. `introSession` marks the timeline consumed before
mounting the destination, preventing Today from starting another full intro behind it.
Navigation/foreground does not replay the intro; a genuine new process does. Background time does not advance visible choreography. Reduced
Motion or an enabled screen reader skips the full sequence. Android Back is
consumed while the launch presentation blocks navigation. These are presentation rules,
not changes to onboarding persistence or billing policy.

The module-scope Expo splash lock bridges native startup. The native storyboard/system
splash is static, using the exact approved photograph and centered aspect-fill framing;
WebGL begins only when the React Native/WebView surface runs. Hiding waits for a loaded
compatible image or ready GPU frame and paint callbacks. `app.config.ts`, the canonical
launch assets and `with-approved-launch-splash.cjs` retain this setup across native
generation. Android12+ OS icon/background constraints are documented separately in
[NATIVE_LAUNCH_SPLASH](docs/NATIVE_LAUNCH_SPLASH.md). Runtime evidence and unverified
scenarios are maintained in [LAUNCH_QA](docs/LAUNCH_QA.md).

The root native Stack is the sole status-bar style owner: dark icons while the silver
cold launch blocks; explicit Home uses the saved theme, with light icons on graphite and
dark icons on silver. Destinations retain their corresponding style.
The native `UIViewControllerBasedStatusBarAppearance` flag is true in both Info.plist
and app.config.ts. A separate Expo StatusBar JSX owner is not mounted. This resolves the
observed dark-destination status-bar ownership conflict without changing signing.

## Native pre-runtime bridge and V5 presentation

Release creates TIHEarlyLaunchWindow from the canonical storyboard before constructing
ExpoReactNativeFactory. After native display callbacks, expensive initialization starts;
the window-level opaque cover stays above root replacements. The existing Expo splash
subscriber installs its loading view on the real root; attachment, size and two native
callbacks permit handoff, including Expo's intentional fast hide after compatible paint.
The cover/link are released. Debug launcher behavior is retained. A compile-only native
QA flag permits bounded explicit pressure work; normal Release contains no such work.
The existing config plugin emits the canonical helper idempotently into AppDelegate.

The immutable Founder PNG now owns the opening: one native aspect-fill image and the
shared ApprovedOpening RN component use the same bytes. RN explicitly sets100% width
and height to override static Image's intrinsic851×1847 point defaults. After preparation,
Global queues the native splash hide, then the existing four active UI-frame ownership
barrier precedes GPU release. The promise acknowledges queueing, not a native paint API.
A deduplicated controller bounds/retries hide failures without replaying the intro.

The photo yields650–1350ms into the existing metal/depth scene. Its SVG emblem uniform
is zero during this presentation, preventing two mismatched logos from crossfading.
IntroAtmosphere still fades2000–6500ms; all six ribbons, protected V4 calculations,
texture, camera/timeline and eight-second material loop remain unchanged. The root native
Stack consumes a threshold-only intro contrast signal for dark/light clock readability
while preserving saved destination themes and all routing/access handlers.

The shared GPU presentation uses an explicitly associated-alpha context and a final
output adapter; protected V4/scene functions remain straight-color calculations. Native
ownership is two-phase: prepare draws a frozen configured frame, UI-thread covered
paints/reveal commit its visibility, then release starts the unchanged scene/material clocks.
An opaque cover prevents independently blended fallback and GPU logos. No clock advances
on a hidden/prepared surface; inactive transfers are re-presented on foreground.

## Shared emblem source

`assets/brand/official-mark.svg` owns the open-arc geometry and exact OTF wordmark
outlines. `scripts/generate-intro-brand.cjs` derives the shared vector, padded PNG alpha
texture and canonical native launch image; BrandMark imports the generated arc path.
The iOS splash resource and Expo Android density images derive from that canonical PNG.
The glyph-contour mask supplies local clearance under the lettering, which paints last;
there is no broad rectangular break through the rings. Exact font shapes/Regular weight
are retained, with native-default kerning and a centered advance. Source/raster integrity,
font provenance, native alpha and protected V4/timeline tests remain independent guards.
See [source and regeneration](assets/brand/README.md) and [actual QA](docs/BRAND_GEOMETRY_QA.md).

## Shared app typography and presentation

The shared Silver Chrome UI palette is independent of the approved Deep Intro V2
horizontal launch palette. Original V4 colors/material are unchanged. Root startup loads
the local original Linux Libertine O Regular OTF through Expo Font before application
text mounts. AppText applies the locale-aware regular family after caller styles across
onboarding, Today, History, paywall, Settings, shared controls and navigation; undefined
caller family values cannot erase the policy. Language options carry their own locale. `typographyForLanguage` uses that family for the nine Latin/Cyrillic locales
and the system script font for Hindi and Simplified Chinese. No remote font is fetched.

Native QA observed stale text boxes after a live large→largest-accessibility-size change,
while a cold launch at that same size measured correctly. `AppText` forwards the normal
Text props/ref and keys only the native Text host by `useWindowDimensions().fontScale`
on iOS. It retains parent controls, onboarding and language-draft state and keeps normal
automatic font scaling; Android receives no key override. No font binary or scale cap is
introduced. The [upstream React Native iOS/Fabric report](https://github.com/react/react-native/issues/57512)
describes a matching live-versus-cold pattern and remount workaround. It corroborates the
observation, but does not prove this app's diagnosis or that this workaround passes its
runtime checks. Final refreshed native verification remains in LAUNCH_QA.

Only decorative icon glyphs (stepper minus/plus, back chevron, checkbox tick and picker
arrow) retain fixed icon sizes, as an SVG icon would. Their accessible parent controls
keep the existing labels/states. Body text, values, options and action labels retain full
system font scaling; no body-text size cap or font-binary change is introduced.

`LanguagePicker` presents one closed row and a horizontal, paging modal with one
language choice per page. Swipes or accessible previous/next/adjustable actions edit a
local draft; only Done calls the existing preference save. Cancel, backdrop and system
Back discard it. All eleven original locale IDs remain. Measured label height and page
width/font-scale generations must settle before gestures/confirmation; programmatic
recentering never changes the draft. Failed saves retain the choice. Large text uses a
scrollable outer sheet and stacked actions without capping readable font size.

This supersedes the earlier iOS wheel/Android all-at-once list implementation. Its dated
measurement/native evidence remains historical; it is not evidence for current paging
reachability. Current native layout and largest-size verification are reported separately.

Onboarding preview and fallback Today share AdviceBlocks typography. AnimatedToday
retains all original text with natural wrapping and Dynamic Type in a scrollable content
viewport. Its measured sphere slot accounts for scroll offset; the same full-root
WebView projection is clipped above the measured fixed footer after the intro. The
post-intro scissor intersects both framebuffer edges, including completely offscreen
slots. Large calendar typography expands the seven-column grid horizontally for
scrolling rather than squeezing digits. BottomNav keeps its normal three-column
layout, switching above fontScale1.35 to three full-width icon/label rows with a
separate absolute selection underline, so large words remain complete. No route
handler or cycle/date logic changes. Pre-purchase Header, PaywallCard and legal surfaces use
the same shared presentation primitives. No purchase/restore/plan-change handler,
onboarding acknowledgment, cycle range/date validation, completion persistence or
reminder default is changed by these styles.

The exact bundled font and canonical notices live in `assets/fonts/`. The delivered
Variant #8 reference and direct-file CoreText outline audit are recorded in
[font provenance](tests/font-provenance/README.md); current evidence is in
[brand/type QA](docs/BRAND_TYPOGRAPHY_QA.md).
`scripts/generate-font-license.mjs` transports OFL.txt and LICENCE.txt verbatim into
`license.generated.json`, imported by Terms as a selectable appendix so notices are in
the application bundle. This packaging adds no consent or payment action and establishes
no merchant legal/store-readiness approval.

## Backend / database / auth

Isolated TypeScript Cloudflare Worker/D1 service in `backend/` for server-timestamped app
trial and optional durable RevenueCat webhook journal; local Node/SQLite runner uses
the same handler. No mandatory user account, runtime AI or remote content fetch. Sandbox
and production have separate databases/routes/secrets. The backend receives no cycle,
advice or relationship content.

## Storage

SecureStore cycle settings; AsyncStorage preferences, selected-cue history, and separate
date/cue feedback records. SecureStore also holds independent per-environment trial
identity/credential/cache and a bounded signed RevenueCat entitlement cache. Local
content deletion retains billing/trial identity; it does not cancel a subscription or
reset trial dates. Cycle engine uses date-only calculations. No migration deletes
historical selections merely to refresh content.

## Services

Local Expo Notifications. RevenueCat purchase abstraction; ordinary mock access requires
the development gate. The explicit private Founder artifact uses the same memory mock
through its isolated build wrapper; normal production has no fixture access.
Stores process native purchases; RevenueCat resolves signed CustomerInfo/full_access.
AppTrialService independently resolves an explicit server-started 14×24h grant.
AppContext exposes paid state and app-trial state separately; Today uses their OR, with
foreground/deadline/clock checks and a maximum24h offline grant bounded by known expiry.
Monthly/annual offerings use exact periods and base plans; no automatic store introductory
trial is selected. RevenueCat Billing with Stripe is the prepared web engine; official
redemption links pass through +native-intent into an in-memory inbox without token Router
params. Only SDK-verified entitlement unlocks paid access. Management routes to its actual
Apple/Google/web source. Never embed secret keys.

## Data flow

Onboarding → local settings → date-only estimate → history-aware daily cue → localized
lookup → Today. `content/editorial/<locale>.json` is the authored source.
`content:generate` produces catalog metadata and three-part localized entries. AdviceBlocks
renders the same selected entry in the order KEEP IN MIND → sphere → SUPPORT → DO.
Selection preserves an existing same-date choice, prefers fresh components against the
latest 89 historical selections, then uses deterministic least-recent fallback.
`CONTENT_VERSION` is 4 and prior versioned IDs remain resolvable. If the estimate reaches
the 40-day unconfirmed boundary, Today requests an update and selects all-phase content
rather than extrapolating a new phase.

## Deployment

`eas.json` development/preview/production; release checker and build guard. Native
signing/device testing/store products remain separately verified external gates. A local
Release build or source export is not a store release. The current launch request does
not authorize publication/submission.

An app-target-only incremental build may reuse unchanged Release Pods products after a
verified full workspace build. When native configuration changes, regenerate Expo
Updates resources with the installed official `create-updates-resources-ios.sh` Pod
script before that build; skipping the Pods graph must not retain an old embedded
manifest/fingerprint. Verify the copied app resources against the fresh product bundle.
No SDK source or fingerprint override is used. Exact current proof is recorded in
[NATIVE_LAUNCH_SPLASH](docs/NATIVE_LAUNCH_SPLASH.md).

## Boundaries

No analytics/ads or transmission of cycle details. Launch/typography changes do not alter
billing/trial policy, translations, daily selection or historical persistence.

## Accelerated preview

The preview/development build profile enables `extra.acceleratedDemo`; the production
profile forces it off. `/demo` reuses AdviceBlocks and the existing editorial catalog,
with a separate in-memory content history and synthetic 30/5 scenario. Session metadata
lives in a dedicated AsyncStorage key; it contains no personal cycle dates. Elapsed wall
time restores the displayed day after backgrounding. AcceleratedDemoScheduler schedules
29 native one-off notifications and filters cleanup by its own kind/run. Root notification
routing validates the current run and day before opening `/demo`. A first launch or active
session can open the preview without purchase/onboarding; ordinary access checks are
unchanged.


## Bundled cycle education

`src/education/cycleEducation.ts` selects the bundled `src/i18n/education.json` copy for
all eleven supported locales. `/learn/[phase]` presents general menstrual, follicular,
ovulation and luteal explanations, variable physical/energy patterns, thoughtful support
and diagnosis/contraception caveats. It is independent of cycle calculations, access
eligibility and daily authored-content selection. Phase tabs replace the current Learn
route, preserving the original Back destination; the shared secondary footer stays fixed.

Static NIH/NICHD and NHS source URLs carry no cycle/preferences or other user fields.
Only a user tap opens the external browser; the localized source-language caption says
the institutional pages are English. Copy is available offline; source-link failures use
the current locale's error message. Primary-source checking and native acceptance are
separate evidence, not inferred from the presence of URLs or translation keys.

## Rings-only photographic icon pipeline

The immutable approved opening portrait remains the source of the launch photograph and
keeps its wordmark. Platform icons use a distinct **rings-only** derivative. The selected
built-in imagegen edit and full prompt/provenance are in `assets/icons/source/`. The
canonical generator composites only a bounded lettering/shadow band over the original
square crop; all original pixels outside that band, including the open lower endpoints
and top glint, are retained exactly. The previously covered segments are reconstructed,
not claimed as recovered original pixels. No SVG emblem or new logo replaces the photo.

`scripts/generate-official-icons.cjs` owns the opaque 1024px master, actual native AppIcon
copy, 512px Play export, adaptive foreground/background and deterministic previews/hashes.
The rings-only adaptive image uses 768px within 1024px (128px inset), tested against the
Android 108/72/66dp layer/viewport/safe-circle geometry. The legacy generator delegates only
icon writes. Expo generates density resources; installed iOS icons require native catalog
compilation. The OS applies masks to unrounded production inputs. The earlier wordmarked
icon/native proof remains historical and does not establish current rings-only installation.

## Founder private Release testing artifact

`tests/native-launch/standalone-qa.cjs` is explicit build tooling outside the normal graph.
Ignored private entry/config aliases start existing InternalQASession memory services
synchronously before AppProvider mounts and native main registration; access readiness
still gates the global handoff. Development JavaScript remains false. The generated Index
defaults to localized `/dev-qa`; `--entry today` is the optional capture entry. Existing
Settings provides the localized Internal testing route while the private wrapper is active.

The wrapper overrides only the session exports/Index under the exact private Release
entry, marker and Expo override. The normal `standaloneQAEnabled` descriptor is false and
grants no access; production entry/guards are unchanged. The emitted provider/hook/session/
Index graph must pass verification before an artifact is accepted. Reset creates fresh
private state while retaining the isolated scope, rather than resuming real stores.

Current Founder delivery retains the private testing artifact installed/reachable after
verification. The normal signed artifact remains separately available for an explicitly
requested return to personal app use or recovery; automatic normal restoration from the
previous capture-only workflow is superseded. Separate artifact hashes identify the two.
Test language/theme choices persist within the private process and scenario changes, then
reset on a cold private launch. Normal preference persistence is unchanged and must be verified
separately. Source/schema tests and old capture proof are not current native acceptance.
See [INTERNAL_QA](docs/INTERNAL_QA.md) and [standalone packaging](tests/native-launch/STANDALONE_QA.md).
