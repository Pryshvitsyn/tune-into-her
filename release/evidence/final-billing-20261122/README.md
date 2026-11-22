# Final billing audit — 22 November 2026

This extends preserved `b8f68f0` on `codex/release-preparation-20261121`, with recovery branch
`codex/checkpoint-apple-billing-20261122`. No push, PR edit, store upload/submission, new
credential, production deployment or personal-device write was performed.

- `provider-audit.json`: fresh authenticated Apple/RevenueCat/Google facts, genuine owner gates.
- `apple-test-notification-{request,status}.json`: actual Apple Sandbox TEST200/SUCCESS.
  This is delivery-path proof, not a subscription transaction or CustomerInfo update.
- `eas-{credentials-summary,env-summary}.json`: metadata-only Free/$0/no signing records,
  four preview variables, key match and actual iOS billing-test preflight. Values excluded.
- `local-profiles-summary.json`: matching Development profile only; no device IDs/certificates.
- `trial-http.json`: repeat exact14days/auth/error checks with the existing separate HTTP test identity.
- `android-audit.json`: same actual AAB SHA, API36/Billing8.3, ELF/RELRO/ZIP16KB/signature.
  INCOMPLETE for owner upload certificate and local official zipalign; actual cert is Debug.
- `ios-runtime-artifact.json`: exact version/build/SDK/hashes and the limited re-embed method.
- `checks.json`, `preservation.json`, `security-review.json`: actual source validation,
  all39protected/173Android inputs unchanged, known credential values absent from saved files.

## Actual native observations

`native/runtime-results.json` records every accepted result and failed attempt separately.
The temporary runner is bound only to its newly created SE3; physical devices/old simulators
are excluded. The exact accepted offering/retry method is in
[`tests/native-release/ReleaseSandboxQA.swift`](../../../tests/native-release/ReleaseSandboxQA.swift).
The original fresh-onboarding case stopped on a reminder Switch wait; a later AX snapshot
included the Switch. Continuing that prepared ordinary screen passed explicit real trial →
authored Today → cold restart. No original assertion was disabled or existing trial reset.

Native store offer loading is **unavailable**. Retry and return to the independent trial
Today pass; Restore remains enabled but was not tapped. No actual price, payment sheet,
Sandbox subscription, paid entitlement, restore/cancellation/renewal/expiry, native offline
or notification-delivery acceptance is claimed. `store-unavailable.png` shows the upper
card; `store-retry.png` shows the actual visible failure/Retry below the fold.

The normal minified Hermes bundle contains the actual iOS public SDK key, demo/mocks false
and no private QA. It was embedded in a copy of the prior verified native Simulator Release,
then ad-hoc re-signed. Unsigned Mach-O payload matches the old artifact exactly; original
app/bundle hashes are preserved. This is not a fresh native compile, device IPA, App Store
signature or TestFlight. The stopped full recompile and missing-file runner attempt are
retained as failures rather than substituted for build success.

`native/startup-real-key-simulator.mp4` contains the complete40.036667second no-Metro cold
launch:1757source frames, monotonic timestamps,0black frames and the same process alive.
`video-provenance.json` records container-only H.264 remux hashes, without transcoding.
Timestamped PNGs are exact raw samples; the early Home/OS transition is included and is not
labelled app content. `all-frame-black-analysis.json` contains every source frame's result;
`proof-metadata.json` binds recording, installed binary/JS hashes and native cover handoff.
The first capture was refused below512MiB. After cleaning only generated intermediates and
task tools/cache, the accepted attempt used a strengthened900MiB start guard plus abort
below512MiB, completed without abort and left972.4MiB free. Original products were retained.
The task-owned Simulator is shut down with its synthetic data preserved for safe follow-up.

These750×1334SE runtime captures are QA evidence, not approved store-listing screenshots.
A later fresh iPhone17Pro attempt began after disk recovered to4.5GB, but again exhausted
host space; its result save returned ENOSPC. It was interrupted; only that failed empty
Simulator/generated cache were cleaned, keeping SE synthetic data and accepted artifacts.
`native/pro-host-blocker.json` records this rejected attempt. No new Pro/fresh-case or newly captured required-size
store-media success is claimed. Large-format iOS/store/Android capture and actual16KB Android
runtime require adequate equipped-host resources; no resizing/fabrication or false readiness
flag is substituted. `android-host-current.json` also records absent adb/no detected USB Android
target and the4.56GBimage plus5GBfree requirement, beyond actual available space.

## Boundaries and security

Apple Paid Agreement remains New; bank/tax unverified, availability unset, testers/TestFlight
empty at audit. Owner legal/tester/Google/signing handoffs are prepared. Automatic review
blocked advancing a new Distribution credential without separate consent. Production is
untouched; all9readiness flags remain false. The Founder must enter any tester password
or legal/bank/tax details directly in the appropriate provider; none is requested in chat.

One opaque sandbox callback appeared in an accidental technical snapshot and was disclosed
to the Founder. Private key/password contents were not printed. The callback, SDK key values,
Apple key material, token and full private logs are excluded from this directory/Git.
Private credentials remain outside Git in owner-only storage; the task temporary directory
is0700 and private logs/env/state files0600. No new certificate/key/password was created.

Repository `docs/HQ.md` was absent; available project instructions and canonical product/
execution documents were used without substituting another project's HQ. This evidence
supplements the [canonical report](../../RELEASE_PREPARATION.md), not production approval.

## Existing correctly sized iOS drafts

`ios-store-media-drafts.json` selects two **dated November21** actual normal Release
1206×2622 Cycle/Learn captures, with unchanged173core UI inputs and original byte hashes.
Copies are generated only under ignored`build/store-drafts/apple/en-AU/screenshots/`.
No image was resized/reconstructed/newly captured or approved. The old Today screenshot
contains pending`DO_043 / action_42` and is excluded, as is the subscription error/config view.
These are owner-review candidates, not current configured-store/purchase acceptance.
Approved export list/preview video and all readiness flags remain unchanged.
