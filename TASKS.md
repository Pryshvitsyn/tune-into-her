# TASKS
## NOW
- [x] Implement installed accelerated preview: 30 sample days, five minutes each, isolated history, one-tap Start/Stop and 29 native reminders.
- [x] Add preview-only first launch and eleven-language demo controls, without requiring a purchase entitlement.
- [ ] Complete full lint/type/test/Expo CI for the accelerated-preview delta.
- [ ] Install the signed preview and verify background notification/tap delivery and the full 150-minute trial on iPhone.
- [x] Authenticate as eliogenesis and verify the existing EAS project identity/access.
- [x] Prepare expo-updates, fingerprint runtime compatibility and separate preview/production channels.
- [ ] Verify update delivery on an installed preview build.
- [x] Diagnose failed CI and align Expo SDK 57 patch dependencies; verify clean installation and 21/21 health checks.
- [x] Publish CI fix to PR #3 and verify GitHub Actions run 41296523081 (all steps pass).
- [x] Publish prepared documentation branch and open PR #2 (2026-11-01).
- [x] Implement shared dual themes and two-logo header on Today.
- [x] Create shared vector THEA/app emblems.
- [ ] Visually verify emblem geometry and small-size rendering on devices.
- [x] Implement centered DO/SUPPORT/KEEP IN MIND and daily gratitude rotation.
- [x] Expand all three daily sections across 11 locales; verify 90-day visible-bundle coverage and constituent rotation. See docs/CONTENT.md.
## NEXT
- [x] Apply visual system to existing routes; implement Appearance and About THEA.
- [ ] Verify cycle editing, onboarding, language/theme persistence, deletion and notification denial.
- [ ] Verify same-day stability, next-day changes, timezone and locale switching.
- [x] Run lint/types/tests and native iOS/Android exports after changes.
- [ ] Complete native device and purchase/restore/cancel QA.
## PARALLEL
- [ ] Native-language editorial review including Baba Malay community review.
- [ ] Prepare actual publisher/support/legal pages and store configuration.
## BLOCKED
- [ ] Build and install iPhone preview, then test native flows.
  Blocked by: usable Apple signing/device registration and access to produce/install the native preview. The accelerated-demo route has separate preview access; ordinary billing still needs configuration.
- [ ] Activate Explore THEA.
  Blocked by: confirmed website URL.
- [ ] Submit signed store builds.
  Blocked by: implementation, readiness evidence, signing/store access and publication authorization.
## DONE
- [x] Recover remote baseline and inspect source/configuration.
- [x] Reconcile latest decisions against older artifacts.
- [x] Create project brain and validate document links.
- [x] Run content validator (pass) and release checker (expected failure recorded).
