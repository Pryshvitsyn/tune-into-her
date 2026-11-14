# Global launch and Premium Onboarding V2 — actual QA

Updated: 2026-11-14 (Europe/Rome). Branch: `codex/monetization-20261113`.
Both scopes were explicitly confirmed by the Founder. This is an implemented application
flow, with standalone iOS runtime evidence. Android native and some external-access
scenarios remain unverified; this document does not establish store-release readiness.
No submission, publication, push or merge is part of this change.

## Result and architecture

`GlobalLaunch` mounts at the root. AppContext local state/access initialization and the
bundled font load run concurrently with the approved shared scene. Existing routes and
Today entitlement checks remain authoritative. The launch layer never grants access.
The shared renderer retains the original nine-second timeline, six layers, shader math,
logo geometry, texture and V4 material; no second WebGL implementation was introduced.

Only the intro is visible or accessible while it blocks the destination. Explicit renderer
completion starts a further1000ms foreground hold; V4 material motion continues. Slow
readiness keeps that same sphere moving, with no repeated scene or further fixed delay.
A360ms fade starts when the actual destination is ready. Destination sphere layout is
reserved but its visible rendering waits for handoff, avoiding two visible spheres.

The reducer keys destination readiness/fade callbacks by attempt, route and Today access
mode. Pending daily selection invalidates readiness. Stale callbacks cannot uncover a
new attempt/screen; lost readiness restores an opaque cover. Retry preserves completed
choreography/hold. Process-memory state suppresses another global/Today sequence during
ordinary navigation or foreground return. Background time does not advance visible time.
Reduced Motion or a screen reader skips the full choreography/hold; a skip remains skipped
after a live preference reversal. Android Back is consumed while the launch gate blocks.

The native splash is static. WebGL begins in the React Native/WebView runtime. Splash
hiding waits for a loaded compatible image or configured GPU frame and native paints.
The exact native-image alpha and approved horizontal silver match are covered separately
in [NATIVE_LAUNCH_SPLASH](NATIVE_LAUNCH_SPLASH.md).

## Final source checks

| Check | Actual result |
| --- | --- |
| TypeScript | PASS |
| Vitest | PASS —254 tests /33 files |
| Full ESLint |0 errors;3 existing warnings in generated router types, intro-preview, IntroLoading |
| Content check/validation | PASS —610 bundles,11 locales,318 texts/locale,90-day reserve; native-language editorial review still pending |
| Font notice generation | PASS — canonical OFL and original distribution notice preserved verbatim |
| Native plist/config | PASS —4 native-splash/config tests; ibtool0 errors/warnings; isolated both-platform prebuild passed |
| Diff/credential review | Whitespace and protected-source checks pass; no credentials/signing files added |

Final command: `npm run typecheck && npm test && npm run lint && npm run content:check && npm run content:validate && node scripts/generate-font-license.mjs --check && git diff --check`.
The native harness was compiled and executed separately; its Swift cases are not counted
as Vitest tests. [Harness and reproduction commands](../tests/native-launch/README.md).

## Native runtime matrix

The QA simulator is a task-created disposable iPhone SE3, iOS26.5,375×667pt. It contains
only synthetic test data. The original iPhone17 Simulator and physical-device data were
preserved. A clean disposable-device reset was used for genuine first-install testing,
not to suppress an application failure or change persistence code.

| Scenario | iOS Release without Metro | Android native |
| --- | --- | --- |
| Final first installation → onboarding | PASS — clean device, exact final signed binary, recorded launch and real font | BLOCKED |
| Existing no access → locked/paywall | PASS — synthetic onboarding ends at existing paywall; cold entry shows locked Today, no daily guidance | BLOCKED |
| Existing valid access → normal entry | Unit/gate regressions PASS; native configured paid/trial identity unavailable | BLOCKED |
| Force-close / normal cold restart | PASS — full scene, animated hold and handoff recorded | BLOCKED |
| Background during choreography | PASS — actual texture-motion frame detected,4s outside app, same PID18201 resumed; continued to destination | BLOCKED |
| Foreground return / Today navigation | PASS — same PID14964, native Settings→Advice, locked screen within3s; no global replay. Paid Today renderer is source/controller-tested only | BLOCKED |
| Slow init with continuous sphere | Clock/readiness/controller tests PASS; artificially delayed native service scenario NOT VERIFIED | BLOCKED |
| Offline cached-access behavior | Existing service cache/expiry tests PASS; native offline scenario NOT VERIFIED | BLOCKED |
| Init failure / Retry | Native recoverable error observed in unsigned diagnostic; signed build fixed Keychain-34018. Retry model PASS; successful native Retry NOT VERIFIED | BLOCKED |
| Reduced Motion | Native setting ON verified; recording skips full choreography and reaches locked entry. OFF restoration verified natively | BLOCKED |
| VoiceOver / TalkBack | Native AX roles/value/actions and hidden launch destination checked; spoken screen-reader navigation NOT VERIFIED | BLOCKED |
| Android Back | Not applicable | Source handler checked; native BLOCKED |
| GPU/WebView failure | Control/fallback source checked; native fault injection NOT VERIFIED | BLOCKED |
| Native splash /9s +1s / fade | PASS — video plus unchanged-scene/clock tests; no blank or duplicate sphere observed. Not a millisecond-accurate native stopwatch | BLOCKED |
| Compact / Light / Dark | PASS — actual six-step flows and pre-purchase screenshots | BLOCKED |
| All11 picker values | PASS — all exact native values observed, including Hindi/Chinese; Cancel preserves English | BLOCKED |
| Largest Dynamic Type | PASS — full picker-action bounds, scrollability, checked checkbox and stepper glyphs visually verified | BLOCKED |
| Physical iPhone | PASS — exact final Release update8.58s, launch command0.69s, PID34933 alive at+54.18s; installed app/executable matches receipt. Visual/route/speech NOT VERIFIED | Unavailable |

Native full-flow results on the frozen final controller-policy build:

- Dark selection/welcome/Context: PASS11.897s. Cold full flow: PASS43.065s,
  29 flow assertions plus9 screenshot clock-contrast checks; all white-clock counts390–422.
- Light selection: PASS3.190s. Light revisit through the existing public onboarding route:
  PASS25.466s, same29 assertions, no data reset. First installation is a separate cold video.
- Final largest-type cases:2 tests PASS48.166s. Cancel y416.5–526.5 and Done
  y538.5–648.5 are fully inside the667pt screen. Checkbox and−/+ render inside their controls.
- All-eleven traversal checkpoint: PASS31.274s; no locale ID removed/renamed.
  Native Hindi/Chinese glyph screenshots are retained; fonts/picker selection logic remain unchanged.

These flows preserve the required acknowledgement, date/range constraints,28/5 defaults,
preview KEEP IN MIND→SUPPORT→DO order, awaited cycle/preferences saves, reminder choice
and existing paywall entry. Reminders were disabled for synthetic QA. No trial start,
purchase, restore, real personal date entry or store configuration action was performed.
The harness records failed setup/selector attempts and invalidates its earlier weak
isHittable-only large-text result; those runs are not counted as successful acceptance.

## Accessibility and status-bar corrections

Actual live Dynamic Type testing found stale paragraph boxes while glyphs scaled; cold
launch metrics were correct. This agrees with the reported [RN0.86 iOS behavior](https://github.com/react/react-native/issues/57512),
without claiming a vendor-confirmed diagnosis for this app. `AppText` forwards all native
props/ref and keys only the iOS native Text host by fontScale, retaining parent controls,
onboarding state and picker draft. Each direction of live text-size change was verified without restarting its process
 via native Settings foreground transitions. No readable text scaling cap
was introduced. Decorative−/+,‹,✓ and▾ keep their fixed icon size; labels/values/actions
continue scaling. Android retains its normal native Text identity.

Picker header/actions measurement Views are keyed by geometry generation, ensuring
fresh onLayout after width/font changes. Native tests require fully visible actions,
not merely isHittable. Native Stack is the single owner of status-bar color: dark icons
on launch/Light, light icons on Dark, without hiding/resizing it. The required controller
policy is enabled in native Info.plist and Expo config, per [Native Stack documentation](https://reactnavigation.org/docs/native-stack-navigator/).
Actual Dark screenshots are checked for white clock pixels against graphite; preserved
bad/good fixtures calibrated this check at0 versus375 pixels. All final Dark captures pass.

## Original font and protected sources

The actual unmodified Linux Libertine O Regular5.3.0 OTF is bundled and loaded by Expo
Font before route text mounts. [Provenance/licenses](../assets/fonts/README.md).
SHA256: `6332761e4fc08e30bce6f47e4a08e7d5332abe000ab6ca06c8e86bd88f456114`.
The font is528,064bytes; hmtx gives238.02pt for “never a prediction” at32pt, fitting327pt
content width. Native Context is exactly two lines/76pt at normal scaling. The nine
Latin/Cyrillic locales have tested current-UI glyph coverage. Hindi and Simplified Chinese
use native script fonts, including per-option fallback when the interface is English.
Native screenshots confirm those glyphs. No claim is made for future translations.

V4 renderer/clean texture/poster, timeline, generated scene/shaders, outlined logo,
content, cycle, purchase/trial services and storage sources have no diff. Hash guards
protect the approved files, including:

| Protected file under src/intro | SHA256 |
| --- | --- |
| timeline.ts |20de443e222558f4e1fa7ad9aab952abf05b1c2054950bfe00b642dcf8a50eaf |
| sceneRuntime.generated.ts |ac700a2e5274f5651444924e8f1be6f239f5b07256b9072739f64d79b7e6d4c2 |
| v4Shaders.generated.ts |ba777d69d0b7dc8af9fefef3328f0dc95ab86e89bc14b0b8e9403ba3b4b3823a |
| brand.generated.ts |00d2bb375b62d235cd915bda3c0797884e28bb7f6393bcec062b6d1c5d4a0fee |
| brandTexture.generated.ts |b081f98ca837efde52545822bfeb5c617e6cdede1c5345a1608ea67e100b2910 |

## Builds and artifacts

Final signed Simulator app: `Release-iphonesimulator/TuneIntoHer.app` in the existing
TuneIntoHer DerivedData. Embedded main.jsbundle SHA256:
`2c1fd0a85861a6ae1be2750f0c991426323557bccb3a6618f73a5bf980f4abc8`.
Full workspace Release builds passed; final app-only incremental builds reused unchanged
Pods products. The official Expo Updates resource script refreshed manifest/fingerprint,
and both copied resources match their products exactly. Signature verification passes.
Final log: `/tmp/tih-global-launch-ios-statusbar-final.log`.

Physical iPhone11Pro/iOS26.6: full workspace Release and initial data-preserving update/
cold launch passed. Final generic app-only Release passed68.38s, with20 artifact guards:
existing valid signing/current-phone profile, updated JS/controller flag, exact font/full
notices and fresh official manifest/fingerprint. No account/profile/Team changes or
provisioning-update flags. After the owner unlocked the phone, fresh wired/paired/DDI
readiness passed. The exact final artifact updated the existing app in8.58s without
uninstall/reset, then cold-launched (device command0.69s) (PID34933) without Metro. The same process was
alive at+54.18s; its executable is inside the updated app, whose path matches the install
receipt. Final physical embedded JS SHA256:
`dc7a7e49755397b73a44a1f17b05ebf698e92ad09cf41f4bfbab0bf757963c08`.
The0.69s measures the device launch command, not animation duration or UI readiness.
No financial/notification interaction or real cycle-data inspection occurred. This closes
the final install/process gate; it does not prove physical visual choreography, destination
routing or speech. [Sanitized physical proof](../release/evidence/launch-20261114/physical-runtime.json).
CUA cannot start with the configured symlinked root; no permissions or roots were changed.
Raw device/signing metadata stays outside Git.

Android production JS/assets export PASS:
`entry-9916bd412524f9dcfdd2f89606f2a1b6.hbc`,6,735,079bytes, containing exact OTF and complete
canonical notices. Isolated both-platform Expo prebuild passed. Actual Gradle assembly
was attempted but stopped before compilation because Java is absent; Android SDK/adb and
emulator are absent too. No APK/AAB or Android runtime success is claimed. Generated splash
assets at5 densities fit the OS safe circle; OEM/native handoff still needs verification.
Expo Doctor remains19/21 for existing native-config-sync/version advice; intentional
RNSVG/RN compatibility was preserved. Only regenerable task/project build outputs were
cleaned for disk space; source, Release artifacts and original user data were retained.

[Saved videos, main iOS screenshots and changed-file inventory](../release/evidence/launch-20261114/README.md).
Videos are real simctl captures, transcoded to376px/30fps for size without changing timing.
Lifecycle/Reduced Motion/MAX/all-language checkpoints are identified in the evidence index;
late text/status-bar changes did not alter approved scene/controller timing or font assets.

SDK references: [Expo57 SplashScreen](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/),
[Expo57 Font](https://docs.expo.dev/versions/v57.0.0/sdk/font/). Runtime tests use embedded
Release JS and require no development Metro server; the separate Swift runner does not
change the installed app configuration.
