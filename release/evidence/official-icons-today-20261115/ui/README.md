# Standalone private Today — actual Simulator interaction

`testStandaloneQAActualTodayTextsScrollModalSettingsAndHomeReplay` passed in **52.479s**
on the accepted isolated Release artifact (`__DEV__` false, private `paid-active` memory
scenario). Structured xcresult: **1 passed, 0 failed, 0 skipped**. The accepted JS SHA is
`83412b77e9b10fd7876dbb9b7e102a95eccf987a4666b6b12820661942967c75`.
[Sanitized case/image results](results.json) · [Same accepted Simulator artifact](../simulator/artifact.json).

The case requires DEVELOPMENT MOCK BILLING before interaction, verifies actual authored
KEEP IN MIND/SUPPORT/DO cards and notes while scrolling, opens the existing reading modal,
uses the existing Settings footer, replays Home, and requires the same process and all
three unchanged authored labels afterward. It opens/closes the modal again after Home,
proving that the transition released interaction. No footer coordinate retry was needed.
No app restart, purchase, trial start, cycle/preference save, deletion or End QA is performed.

Selected original native pixels, visually reviewed:

- [Actual Today / KEEP IN MIND / mock disclosure](101-standalone-qa-today-authored-mind.png).
- [Scrolled SUPPORT and DO with their complete text and notes](103-standalone-qa-scrolled-authored-do.png).
- [Existing Settings in the private scope](105-standalone-qa-existing-settings-no-writes.png).
- [Photographic Home opening](106-standalone-qa-home-opening.png).
- [Restored actual Today after Home](107-standalone-qa-home-restored-authored-mind.png).
- [Post-Home native reading modal](109-standalone-qa-post-home-interactive-modal.png),
  subsequently closed by the passing test.

Observed Home total: **8.69834s**, including GPU/native initialization and XCTest/AX work.
It does not measure the one-second assembled-sphere hold. The opening screenshot's exact
elapsed time is unknown; this is not a frame-zero or continuous smoothness measurement.
The independent cold video remains separate evidence.

These are **Simulator-only** results using synthetic cycle, history and access services.
They do not grant ordinary Release access or establish physical touch delivery, real store
transactions, Android runtime or Founder visual acceptance. Normal Release restoration
is a separate root-owned action; the standalone controller stays in its memory scope.

PNG text/EXIF/time metadata and generated attachment identifiers are removed. Original
IDAT pixel bytes and color chunks are retained. Raw logs, AX hierarchies, private export
manifests and device identifiers are not published here. Source hashes match the artifact.
