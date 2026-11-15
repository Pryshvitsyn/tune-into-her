# Final UI, language, education and Founder QA pass

Date: 2026-11-15. Branch: `codex/monetization-20261113`.
Checkpoint: `codex/checkpoint-ui-final-pass-20261115` → `3eff34d`.
The latest Founder brief supersedes the earlier wordmark-in-icon and automatic-normal-restore requirements.
No uninstall, reset, backend/billing setup, store publication or merge is part of this pass.

## Implemented

- The shared secondary footer uses only a left arrow and the existing system gear. Both
  retain localized accessibility labels,48-point targets, safe areas and original routing.
  Main Advice/Cycle/Settings tabs are unchanged.
- Initial language choice is a horizontal11-page draft carousel with swipe, previous/next,
  adjustable accessibility, visible current choice and explicit Done/Cancel. It retains the
  existing preference persistence and has an accessible large-text scroll fallback.
- All11 locale resource trees include the new picker, QA and legal copy. Today no longer
  uses hardcoded Russian/English chrome. iOS date/time spinners receive the selected locale;
  formatter identifiers map Baba Malay to `ms` and Simplified Chinese to `zh-CN`.
- Cycle removes duplicate heading and excess spacing, keeps the full42-date/six-week grid,
  clear month heading,44-point month buttons and the fixed Edit cycle details action.
  Dynamic Type can still scroll rather than clipping or shrinking text.
- Today Learn more opens real bundled education, including when cycle confirmation is due.
  Four selectable phases each explain timing, physical patterns, energy/emotions and partner
  support. Every page states individual variation; the general introduction excludes mood
  prediction, diagnosis, fertility and contraception use. No engine or daily advice changes.
- The private standalone bundle now defaults to the existing localized internal QA panel.
  Settings reopens it, every existing scenario is reused, and Reset remains synthetic.
  `--entry today` exists only as an explicit capture variant. Normal production eligibility,
  AppProvider, routing and real purchase/trial implementations remain unchanged.
  First-entry QA language/theme seeds are copied into memory without reading personal stores.
- The icon now contains only the original silver open rings. A bounded imagegen edit removes
  lettering and reconstructs the occluded arcs; all pixels outside the edit band are exact
  original pixels. Original portrait/wordmark/splash remain untouched.1024iOS,512Play and
  separate safe adaptive layers/native AppIcon come from the same deterministic pipeline.

## Medical source provenance

These actual pages were opened and checked on November15. They are institutional general
information, not a claim of clinical review of this product or translations:

- [NIH / NICHD — About menstruation](https://www.nichd.nih.gov/health/topics/menstruation/conditioninfo):
  the cycle, follicles, uterine lining and ovulation.
- [NHS — Periods](https://www.nhs.uk/conditions/periods/): bleeding duration and variable
  ovulation timing before the next period.
- [NHS — Premenstrual syndrome](https://www.nhs.uk/conditions/pre-menstrual-syndrome/):
  possible physical/emotional symptoms, variation and when to seek medical advice.

Support suggestions are relationship guidance, not medical treatment attributed to these
sources. The app labels external sources as English; source-link failure is recoverable.
All educational prose is bundled and works offline. The original font licence remains
verbatim English with a localized explanation and explicit English accessibility language.
Endonyms in language selection and institutional/product names are intentional.

## Verification

-517 tests across54files PASS with one worker after packaging finished; TypeScript PASS;
  lint0errors/one pre-existing generated Expo warning. Earlier runs while several Metro
  exports/captures competed for host resources hit the unchanged5s PNG integrity timeout;
  no assertion, hash guard or timeout was disabled to obtain the final pass.
- Own-locale resolution with English fallback disabled and actual preference save/load are
  tested for all11languages. Android draft chooser has19 actual-component cases, including
  every locale, leap/maxdate clamping, explicit confirmation/cancel and iOS regression.
- Canonical icon hash/raster regeneration and protected launch/V4 checks PASS.610 distinct
  three-part bundles across11locales remain generated from318 authored texts per locale.
- Actual actool catalogs compiled for iphoneos and Simulator; all4 launch rendition metadata/
  digests match the earlier verified catalog exactly. Only AppIcon changes. Android official
  Expo resource generation verifies20density files/2XML; production Android Hermes export PASS.
- Current normal/private iOS Release bundles are source-identified, graph-verified and signed.
  Native executable excluding signature, frameworks, profile and non-icon Info values remain
  exact. Native assets were compiled; this does not claim a full Swift rebuild or store upload.
- Physical final current-source Today25.845s and panel25.72s plus separate Home recording PASS
  without Metro. All before/after personal AsyncStorage snapshots equal; final panel update
  and launch succeed, and the Founder private test artifact remains installed.
- Native SE375×667 test passes all4 phase pages/16 paragraphs/sources, fixed accessible arrow/
  gear/Back behavior,42 visible dates, reachable Edit/prefill/cancel and the same process.
  Native horizontal swipe/draft/cancel/confirm/English cleanup PASS. All11 tour/cold-persistence
  proof is being completed separately.

Accepted media distinguishes native screenshots/video from generated icon/store-mask previews.
Failed or short physical recordings are never accepted as a complete startup. Public evidence
excludes personal storage, identifiers, unrelated OS labels and wallpaper. Host recorder uses
actual frame-arrival times; clips preserve those recorded intervals and do not synthesize
frames or refit native GPU/hold timing. Repeated MovieFileOutput error-11813 fragments are
retained privately and rejected; removing captions alone was not a reliable fix.

## Limits

Android resource generation is verifiable here; native Android build/emulator execution
requires a working Android SDK/JDK, unavailable on this host. The installed Android system picker follows OS language; the final pass therefore
replaces all three Android date/time entry points with one app-owned, localized draft
modal. Its component behavior is tested separately; no Android native runtime acceptance
is claimed without that toolchain. Native-speaker review (especially Baba Malay),
clinical content review and real reader speech remain separate from schema/device proof.
The internal build's test preferences/history are memory-only and reset on cold launch;
normal saved-language persistence is a separate check. Personal Keychain is not read/hashed.
