# Installed accelerated preview

## User flow
Install the standalone preview build, open Tune Into Her and tap **Start trial**. Allow notifications when iOS asks. The first launch opens the trial directly, without personal cycle setup or purchase. The label stays visible throughout. Day 1 appears immediately, day 2 at +5 minutes and day 30 at +145 minutes. The trial finishes at +150 minutes and leaves day 30 visible. Stop cancels the remaining demo notifications. Close returns to ordinary onboarding/advice; Settings and onboarding also expose the trial in enabled builds.

## What is implemented
- Existing three-part advice and eleven-language copy, including the existing exactly-one-gratitude reminder rule.
- A synthetic 30-day/5-day sample scenario and isolated selection history. It is not a personal phase forecast.
- Persistent run identifier/start time and 29 native one-off reminders, separate from daily reminders and real cycle settings.
- Catch-up on foreground/relaunch, validated notification navigation, stop/restart and partial-failure cleanup.
- Permission/storage/scheduling failures remain visible; a failed start is not presented as a running trial.
- Preview/development profile flag. Production forces the flag off. Ordinary purchase entitlements are not bypassed.

## Build and installation
Use the existing EAS project and the `preview` profile after checking Apple signing and registering the target iPhone. The profile creates an internal standalone build with its JavaScript bundled; a running Metro server is not required. The build operation may use a paid EAS/Apple plan and is not started by this source change. Do not commit signing files, account credentials or personal cycle data.

On an authorized machine with dependencies installed:

```sh
npx eas-cli build --platform ios --profile preview
```

For a local development build, enable `EXPO_PUBLIC_ACCELERATED_DEMO=true` in an untracked local environment, then build with Xcode/Expo using the intended signing team. This is a source configuration step, not a task for an end user installing an already prepared preview.

## Required device proof
Install the actual signed preview; verify first launch and one-tap Start, permission denial/retry, a locked-phone reminder at +5 minutes and its day-2 destination, background catch-up, Stop preventing later reminders, Restart without duplicates and no change to real cycle/history/daily reminders. Verify the full 150-minute run and that normal production builds hide the preview. Unit/CI results cannot replace these iPhone checks.

## Current limitation
Source changes do not create an IPA or installation link. Apple signing/device access, a native build and real-device verification remain necessary. Language/community review gates remain open.
