# Current Today footer width — 51 source inputs

Root changed only `AnimatedToday` footer horizontal padding from 18 to 9 points. Typeface, 14 pt labels, 20 pt line height, 17 pt icons, 6 pt icon/text margin, handlers, translations, V4 renderer and timeline remain unchanged.

- [Actual Ukrainian before/after](uk-before-after-native-contact.png): original native pixels; “налаштування” is intact on the second line. [Full current native frame](uk-after-full-native.png).
- [All eleven actual footer crops](all11-native-footer-contact.png): localized hit labels; every target is at least 44 points, inside the app and horizontally separate. Individual original-pixel crops are included.
- [Artifact, results and crop metadata](verification.json): the current source-input map has 51 entries and explicitly includes `AnimatedToday.tsx`; all 51 match current files.

The focused aggregate completed 10 locale checkpoints and then FAILED after 249.661 s on an overstrict test constraint requiring MBF to fit two lines. Its action “Tukar maklumat kitaran” naturally uses three WHOLE-word lines. Root accepted that layout without changing text, font or app code. The MBF-only follow-up PASSED in 24.111 s, verified all targets and labels, visually confirmed those three intact words, and restored English in the same process. The aggregate failure remains a failure. One preparatory empty selection ran zero tests and is not a pass.

Current direct-Today cold recording passed with 1,741 decoded frames, zero black frames under the documented scan, installed native/JS identity, native stage ordering and same-process survival. Its raw movie and OS prelude remain private; no new animation-duration or all-PTS-monotonic claim is made.

The broader route, eleven-language and normal-Russian-persistence tests in the parent folder remain bound to their earlier artifacts. This follow-up verifies the single visual change; it does not rerun 77 routes or imply that the current phone package was installed. QA was left in English Today. No data reset/deletion, cycle Save, trial, purchase or Restore action occurred.
