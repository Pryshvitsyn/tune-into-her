# Release roadmap

Updated: 2026-11-13

This is the single current execution view for release work. It records evidence, not
an authorization to merge, deploy, configure production billing, or publish.

## VERIFIED

- [VERIFIED] The Deep Intro V2 checkpoint is local commit `0951c14`; the original
  V4 renderer, clean texture, eight-second phase loop, official vector brand source,
  and oval-mask fix are retained.
- [VERIFIED] The preintegration source snapshot is preserved in local archive commit
  `7a417a1` on `archive/deep-intro-v2-preintegration-20261112`. Existing archive
  branches remain unchanged.
- [VERIFIED] The deterministic selector was exercised for 7, 30, and 90 synthetic
  days across eleven locales. Evidence is in `release/DAILY_QA_20261112.md`.
- [VERIFIED] A labelled dev-only next-test-day control is isolated from wall-clock
  time, cycle data, purchases, notifications, and persisted histories.
- [VERIFIED] Current source checks pass: typecheck, lint with 0 errors, 91 tests,
  content checks, and the 32 Deep Intro V2 safeguards. Android JavaScript export
  completes, but is not native-platform proof.

## IN_PROGRESS

- [IN_PROGRESS] Rebuild with captured output and visually verify the narrow
  `react-native-svg` 15.16.0 compatibility repair on the iOS Simulator; verify the
  official header/footer emblems and icons rather than replacing them.

## TODO

- [TODO] Produce Android build evidence separately: SVG, WebView, splash,
  navigation, notification routing, and a standalone build cannot be inferred from
  iOS.
- [TODO] Record compact-size and large-text QA on both appearance modes and all
  locales; use real device checks for notifications and purchase flows.
- [TODO] Obtain native-language and editorial approval for the founder-commented
  phrases before changing their source or translations.

## BLOCKED — owner or external evidence required

- [APPROVED 2026-11-13] Standalone 14-day app access; monthly/annual subscriptions
  with EUR 3.99/24.99 base targets. [Billing setup](../STORE_SETUP.md) lists actual
  catalog/configuration and sandbox-test blockers; source IDs are not console evidence.
- [BLOCKED] Provide Apple/Google/RevenueCat account access, configured app records,
  products, entitlement, offering, and sandbox/license-tester identities. No store
  purchase, restore, cancellation, or trial result is claimed without these.
- [BLOCKED] Provide Apple signing/provisioning and an authorized physical iPhone;
  one local development identity is now observed (2026-11-13), but distribution
  provisioning and physical-device authorization remain unverified.
- [BLOCKED] Confirm the intended platform identifiers, seller/support/legal details,
  privacy declarations, and the required unknown-cycle-length product behavior.
- [BLOCKED] Remote push is not performed until explicit confirmation permits
  external publication of the newly created local commits.
- [BLOCKED] The one permitted post-update Debug build ran about 14.5 minutes,
  completed RNSVG source compilation, then stopped making artifact progress. It was
  terminated without a fresh `.app` or persistent build log; SVG runtime proof and
  visual QA remain blocked until a controlled logged rebuild can be run.
