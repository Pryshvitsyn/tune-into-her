# Content audit and founder-feedback register

Updated: 2026-11-11
Status: structural validation can be automated; editorial approval cannot.

## Audited source of truth

The editorial source is `content/editorial/<locale>.json`; the generated catalog is the
runtime output. The audited Google Sheet is [Tune Into Her — Полный аудит контента — 11
языков — 2026-11-07](https://docs.google.com/spreadsheets/d/1Zae_XP5SqWRa8Eq2IOgU_Gb5O66ERBe5hqCGy5MZJKA/edit?gid=100).
It was read for this audit only; no spreadsheet cell was changed.

| Measure | Observed source state |
| --- | --- |
| Locales | 11: `en`, `fr`, `it`, `es`, `de`, `ru`, `uk`, `hi`, `zh-Hans`, `ms`, `mbf` |
| Authored texts per locale | 318 (90 DO, 90 SUPPORT, 90 KEEP/context, 48 phase additions) |
| Authored texts total | 3,498 |
| Generated daily bundles | 610 |
| Reserve guarantee tested by source validation | 90-day component reserve / literal selection behavior |
| Editorial/native review | Pending for all 11 locales; `mbf` additionally needs community review |

Literal component diversity and a generated catalog are not evidence that every item is
semantically distinct, culturally natural, safe in all contexts, or approved in its
language. Current review flags therefore remain intact.

## Founder-comment ledger

The following are the **30 nonempty Russian-sheet comments** discovered during the
read-only audit. `1` is recorded exactly as the sheet's review marker but is not treated
as an approval by itself. A proposed revision is a non-runtime editorial draft only:
none of these drafts was written to `content/editorial` or propagated to translations.
All translation states are `PENDING — preserve ID alignment; revise only after the
Russian source is approved`.

| Phrase ID | Original Russian source | Founder comment | Proposed revision / action (draft only) | Review status | Translations |
| --- | --- | --- | --- | --- | --- |
| DO_001 | Предложи приготовить ужин; сначала уточни, что ей хочется. | and buy products for it | Confirm the meal first, then buy agreed ingredients. | NEEDS_FOUNDER_OR_EDITOR_APPROVAL (`1` is not approval) | PENDING |
| DO_003 | Выполни свою часть стирки, включая складывание и уборку вещей. | all laundry, first ask about coloring things | Before handling the laundry, agree what can be washed and how colours should be separated; then take responsibility for the agreed load. | NEEDS_FOUNDER_OR_EDITOR_APPROVAL (`1` is not approval) | PENDING |
| DO_007 | Вынеси мусор и замени пакет. | always ... | Decide whether this becomes a standing shared-home habit; avoid an unscoped imperative in a daily cue. | NEEDS_FOUNDER_OR_EDITOR_APPROVAL (`1` is not approval) | PENDING |
| DO_010 | Спроси, помочь ли донести тяжёлые сумки; прими её ответ. | ??? | Clarify whether the intended action is a direct offer, an agreed recurring responsibility, or removal/replacement. | NEEDS_EDITORIAL_DECISION (`???`) | PENDING |
| DO_013 | Выполни свою часть домашних дел, чтобы она могла отдохнуть, если хочет. | yours part? so her part will be? | Take responsibility for an agreed household task without implying that rest or household work is her duty. | NEEDS_FOUNDER_OR_EDITOR_APPROVAL (`1` is not approval) | PENDING |
| DO_017 | Предложи сменить постельное бельё; сначала согласуй время. | for all things must be - first get agreement | Apply the consent/coordination rule consistently: agree before changing shared routines or possessions. | NEEDS_FOUNDER_OR_EDITOR_APPROVAL (`1` is not approval) | PENDING |
| DO_026 | При необходимости очисти чайник от накипи. | and oter things with calcare using citric acid | Consider an agreed, safe shared-home descaling task (for example a kettle or another suitable item) rather than prescribing a single appliance. | NEEDS_FOUNDER_OR_EDITOR_APPROVAL (`1` is not approval) | PENDING |
| DO_027 | Разбери просроченные продукты в общем холодильнике вместе с их владельцем. | no | Remove; do not replace until an approved alternative exists. | REJECTED — source replacement missing | PENDING |
| DO_042 | Поставь чистую посуду на согласованное доступное место. | ??? | Clarify the intended useful action or replace; the current wording is too abstract. | NEEDS_EDITORIAL_DECISION (`???`) | PENDING |
| DO_043 | Убери крошки в обеденной зоне после еды. | clean all after food and wash plates | Clean shared eating areas after food, including agreed dishes and surfaces. | NEEDS_FOUNDER_OR_EDITOR_APPROVAL (`1` is not approval) | PENDING |
| DO_046 | Проверь срок возврата общей покупки. | no | Remove; do not replace until an approved alternative exists. | REJECTED — source replacement missing | PENDING |
| DO_047 | Сохрани чек по общей трате. | no | Remove; do not replace until an approved alternative exists. | REJECTED — source replacement missing | PENDING |
| DO_049 | Предложи проверить транспорт для совместного визита. | no | Remove; do not replace until an approved alternative exists. | REJECTED — source replacement missing | PENDING |
| DO_053 | Очисти инструменты после своего ремонта. | no | Remove; do not replace until an approved alternative exists. | REJECTED — source replacement missing | PENDING |
| DO_055 | Предложи измерить место перед общей покупкой мебели. | no | Remove; do not replace until an approved alternative exists. | REJECTED — source replacement missing | PENDING |
| DO_057 | Наполни пустой общий дозатор мыла. | check anything with liquid | Check agreed shared liquid supplies (such as soap) and refill them when appropriate. | NEEDS_FOUNDER_OR_EDITOR_APPROVAL (`1` is not approval) | PENDING |
| DO_063 | Предложи отвезти согласованные пожертвования в пункт сбора. | no | Remove; do not replace until an approved alternative exists. | REJECTED — source replacement missing | PENDING |
| DO_064 | Проверь, высохли ли общие зонты, прежде чем убрать их. | no | Remove; do not replace until an approved alternative exists. | REJECTED — source replacement missing | PENDING |
| DO_068 | Убери свои волосы из слива после душа. | just cean all drains | Safely clean agreed shared drains as part of a shared-home routine. | NEEDS_FOUNDER_OR_EDITOR_APPROVAL (`1` is not approval) | PENDING |
| DO_070 | Проверь ингредиенты перед приготовлением согласованного блюда. | if you have it | Check whether the ingredients are available before preparing an agreed meal. | NEEDS_FOUNDER_OR_EDITOR_APPROVAL (`1` is not approval) | PENDING |
| DO_071 | Предложи распечатать или упорядочить согласованные общие документы для поездки. | no | Remove; do not replace until an approved alternative exists. | REJECTED — source replacement missing | PENDING |
| DO_073 | Предложи сравнить две согласованные сметы услуг. | no | Remove; do not replace until an approved alternative exists. | REJECTED — source replacement missing | PENDING |
| DO_077 | Поставь свои использованные чашки в посудомойку или вымой их. | all cups and glasses around the house and clean them | Collect and wash agreed shared cups and glasses around the home. | NEEDS_FOUNDER_OR_EDITOR_APPROVAL (`1` is not approval) | PENDING |
| DO_080 | Предложи проверить погоду перед утверждением общих планов на улице. | not propose - just check always before she think even | Check the weather before shared outdoor plans and share relevant changes; do not turn this into an assumption about her decisions. | NEEDS_FOUNDER_OR_EDITOR_APPROVAL (`1` is not approval) | PENDING |
| DO_083 | Проверь свои ключи перед совместным выходом. | no | Remove; do not replace until an approved alternative exists. | REJECTED — source replacement missing | PENDING |
| DO_084 | Предложи выполнить свою согласованную часть уборки после гостей. | not only yours psrt - it is usual thing to do YOUR part. it must be for all such things - her part | Take ownership of an agreed share of cleanup after guests; apply the same non-favour framing consistently across shared-task cues. | NEEDS_FOUNDER_OR_EDITOR_APPROVAL (`1` is not approval) | PENDING |
| DO_085 | Предложи проверить видеосвязь перед согласованным семейным звонком. | remember about it and prepear all | Remember the agreed call and prepare the connection/equipment before it begins. | NEEDS_FOUNDER_OR_EDITOR_APPROVAL (`1` is not approval) | PENDING |
| DO_086 | Очисти фильтр сушилки от своего ворса после использования. | no | Remove; do not replace until an approved alternative exists. | REJECTED — source replacement missing | PENDING |
| DO_087 | Предложи найти место посидеть на время ожидаемого долгого ожидания. | what to do | Clarify the concrete situation and useful action, or replace. | NEEDS_EDITORIAL_DECISION (`???`) | PENDING |
| DO_088 | Подпиши дату приготовления на согласованных общих остатках еды. | propose this habbit | Suggest and agree a shared habit of dating leftovers before using it as a recurring cue. | NEEDS_FOUNDER_OR_EDITOR_APPROVAL (`1` is not approval) | PENDING |

## Migration rules for approved future edits

1. Approve or replace the Russian source first; an exact ID may be retained only when
   its semantic intent remains valid.
2. Make an editorial, safety, and natural-language review of every affected locale.
3. Regenerate the catalog and run `npm run content:validate`, lint, typecheck, and
   tests.
4. Preserve prior selected IDs and `DailySelection.contentVersion`; existing same-date
   selections must remain readable rather than being rewritten.
5. Record the reviewer and approval decision per locale. `mbf` must retain the
   community/native-review requirement.

## Explicit non-decisions

This audit does not use a spreadsheet comment to approve a tone, replace a source item,
or modify translations. It also does not label any of the 11 locales as native reviewed.
