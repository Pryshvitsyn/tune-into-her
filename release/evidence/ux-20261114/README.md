# UX native checkpoints — 14 November 2026

Папка содержит только отобранные app-only PNG из **индивидуально успешных** native
XCTest cases проекта на компактном iOS Simulator. Это не снимки физического iPhone,
не store sandbox и не подтверждение всех сценариев последнего bundle.

## Provenance and case boundaries

| Локальный result bundle | Что действительно прошло | Граница |
| --- | --- | --- |
| `ux-native.xcresult` | Calendar: fixed update opens saved editor without saving; Home: single/double tap returns to locked Today in the same process | Весь запуск **FAILED**: первоначальный Docs case выявил проблему Back у корневого маршрута. Исправление внесено позднее. Здесь используются только passing Calendar/Home attachments. |
| `final-ux-native.xcresult` | Dark theme survives Home and a cold launch, then Light is restored — **59.246 s** | Весь запуск **FAILED**: Fresh/Docs cases остановились на селекторах harness. Их результаты здесь не засчитываются. |
| `fresh-docs-verified-native.xcresult` | Explicit fresh-cycle onboarding — **66.039 s**; long-document Back/Settings — **37.734 s** | Оба case **PASS** после уточнения harness selectors; это отдельный последующий запуск. |
| `qa-store-owned-scroll-native.xcresult` | Existing-card Retry offline → online; explicit mock Restore → protected Today; End QA restores exact base fixture — **316.847 s** | **PASS** на последнем focus/readiness fix. Это Debug Simulator с изолированным mock, не store transaction. |
| `qa-0800-traced-native.xcresult` | 07:59 → 08:00 меняет authored guidance и создаёт History 9/10 ноября при неизменном DAY 8; End QA возвращает base — **146.912 s** | **PASS** в traced native flow. Временные touch-console сообщения затем удалены; forward callback сохранён. Этот результат не устанавливает причину более раннего пропуска нажатия. |
| `qa-access-cycle-native.xcresult` | App trial — **251.354 s**; paid active/cancelled/expired — **416.237 s** | Только эти два cases **PASS**. Весь запуск **FAILED**: cycle case остановился после пропущенного footer tap. Частичные day 1/7 не считаются полной cycle-проверкой. Paid duration включает около 25 s read-only LLDB pause с последующим detach; это не нормальная performance-метрика. |
| `qa-cycle-final-native.xcresult` | Fresh Not set/no DAY; authored guidance на cycle days 1/7/14/21/28; explicit protected Home на day 14 сохраняет тот же cue/current Today; exact End QA — **309.700 s** | Полный case **PASS** на clean host с текущими canonical Settings + `box-only` handlers. Предыдущие failed cycle attempts остаются failed checkpoints; SDK root cause не заявляется. |
| `final-rm-home-native.xcresult` | Настоящий UIKit Reduce Motion ON; Privacy → emblem → locked Today за **1.523814 s**, тот же процесс; OFF восстановлен в defer — **28.273 s** case | **PASS** на финальной standalone Release без Metro. Это accessibility skip полной сцены, не ускоренный макет анимации. |

В Home case измерены **13.043 s** для одного нажатия и **14.147 s** для двойного.
Проверены единственный cover, тот же PID и сохранённая блокировка Today; само значение
PID не публикуется. Начальный PNG показывает logo-stage существующей entrance. Полное движение и
выход в locked Today теперь отдельно подтверждены extended no-Metro видео финального
standalone Release; ранний PNG сам по себе этим доказательством не является.

Снимки 01–12 предшествуют поздним `dataScope`, focus/Today readiness guards.
Снимки 13–17 относятся к отдельному Debug QA checkpoint **после** этих исправлений;
18–22 — к последующему успешному traced 08:00 flow; 23–27 — к отдельно passing
trial/paid cases. Последняя семантическая touch-правка (`pointerEvents=box-only`
на Pressables) сделана после них без изменения оформления. Снимки 28–33 относятся
к полному passing cycle/protected-Home case уже с текущими handlers.
Финальные current-source Release и Android JS export после nav/touch правок прошли.
Подпись Release и официальные EXUpdates manifest/fingerprint проверены точно; Metro
8081/8082 отсутствовал во время standalone проверок. Финальный Reduced Motion case на этой Release
также PASS. Полное завершение обычного cold capture проверяется отдельно ниже.

Fresh case явно очистил только собственный синтетический набор отдельного QA
Simulator, затем проверил пустую дату и disabled Continue до явного выбора. Дальше
подтверждена синтетическая дата, пройден существующий onboarding и открыт locked
paywall. Start Trial, Buy и Restore в этом case не запускались. Даты в других PNG
принадлежат ранее подтверждённому синтетическому набору, не являются стартовыми
значениями продукта или данными реального человека. Установка Debug на физический
телефон выполнялась отдельно, без удаления приложения/данных.

В последнем Store/Restore case Retry восстанавливает предложения на той же карточке.
Restore нажимается явно и открывает mock paid access, после чего показан защищённый
Today. End QA возвращает тот же процесс и точный исходный synthetic record:
14 ноября 2026, 28/5, English, Light, reminders disabled, no access. Trial и paid state cases прошли отдельно. Полная fresh/cycle days 1/7/14/21/28
последовательность и protected Home затем прошли в `qa-cycle-final-native.xcresult`;
ранние незавершённые/failed cycle attempts не используются как положительное доказательство.

AppTrial case проверил beginning/middle/expiry fixtures и явный card-free Start
через существующую карточку. На точной границе private app trial истёк, paid store
entitlement остался inactive; End QA вернул исходный base. Paid case сохранил доступ
для active и cancelled-until-expiry, закрыл expired и показал существующий status/Manage;
End QA снова восстановил exact base. Это виртуальные in-memory сценарии без покупки
или настройки реального магазина.

## Selected screenshots

| PNG | Проверяемое состояние | Case / checkpoint |
| --- | --- | --- |
| [01 — entrance cover](screenshots/01-home-entrance-cover.png) | Начало исходного in-app cover после эмблемы | Home / `ux-native` |
| [02 — single tap result](screenshots/02-home-locked-today.png) | Locked Today после одного нажатия | Home / `ux-native` |
| [03 — double tap result](screenshots/03-home-double-locked-today.png) | Locked Today после двойного нажатия | Home / `ux-native` |
| [04 — calendar action](screenshots/04-calendar-fixed-update.png) | Edit cycle details закреплён над вкладками | Calendar / `ux-native` |
| [05 — saved editor](screenshots/05-calendar-saved-editor.png) | Редактор читает подтверждённый synthetic record; Save не нажат | Calendar / `ux-native` |
| [06 — Dark after Home](screenshots/06-dark-after-home.png) | Тема сохранена после эмблемы → Today | Dark / `final-ux-native` |
| [07 — Dark after cold launch](screenshots/07-dark-after-cold-launch.png) | Тема сохранена после перезапуска | Dark / `final-ux-native` |
| [08 — Light restored](screenshots/08-light-restored.png) | Исходная Light восстановлена после теста | Dark / `final-ux-native` |
| [09 — no preset date](screenshots/09-fresh-no-date.png) | Not set; Continue disabled | Fresh / `fresh-docs-verified-native` |
| [10 — locked paywall](screenshots/10-fresh-paywall-no-trial.png) | Onboarding не оформляет trial или подписку автоматически | Fresh / `fresh-docs-verified-native` |
| [11 — Privacy end](screenshots/11-privacy-fixed-controls-end.png) | Back/Settings видимы после прокрутки | Docs / `fresh-docs-verified-native` |
| [12 — Terms/licence end](screenshots/12-terms-fixed-controls-end.png) | Back/Settings видимы в конце длинного приложения лицензии | Docs / `fresh-docs-verified-native` |
| [13 — store unavailable](screenshots/13-qa-store-unavailable.png) | Mock store недоступен, существующий Retry видим | Store/Restore / `qa-store-owned-scroll-native` |
| [14 — same-card recovery](screenshots/14-qa-store-recovered.png) | После Retry на той же карточке доступны mock offerings | Store/Restore / `qa-store-owned-scroll-native` |
| [15 — explicit mock restore](screenshots/15-qa-mock-restored.png) | Явное восстановление возвращает configured mock entitlement | Store/Restore / `qa-store-owned-scroll-native` |
| [16 — End QA locked Today](screenshots/16-qa-exit-locked-today.png) | После End QA снова действует исходная блокировка | Store/Restore / `qa-store-owned-scroll-native` |
| [17 — End QA saved details](screenshots/17-qa-exit-saved-details.png) | Восстановлен исходный synthetic record 14 ноября, 28/5 | Store/Restore / `qa-store-owned-scroll-native` |
| [18 — virtual 07:59](screenshots/18-qa-before-0800.png) | DAY 8; prior-day guidance; чистый protected-Today header | 08:00 / `qa-0800-traced-native` |
| [19 — virtual 08:00](screenshots/19-qa-after-0800.png) | DAY 8 сохранён; KEEP IN MIND и его authored note обновлены | 08:00 / `qa-0800-traced-native` |
| [20 — History assertion Nov 9](screenshots/20-qa-history-nov09.png) | Список содержит guidance keys 9 и 10 ноября | 08:00 / `qa-0800-traced-native` |
| [21 — History assertion Nov 10](screenshots/21-qa-history-nov10.png) | Второй attachment того же списка с обеими датами | 08:00 / `qa-0800-traced-native` |
| [22 — 08:00 End QA baseline](screenshots/22-qa-0800-exit-baseline.png) | Исходный synthetic record снова 14 ноября, 28/5 | 08:00 / `qa-0800-traced-native` |
| [23 — explicit card-free Start](screenshots/23-qa-trial-explicit-start.png) | После явного private Start открыт Today; mock disclosure сохранён | AppTrial / `qa-access-cycle-native` — passing case only |
| [24 — exact app-trial expiry](screenshots/24-qa-trial-exact-expiry.png) | На точной границе доступ закрыт без автоматической подписки | AppTrial / `qa-access-cycle-native` — passing case only |
| [25 — paid active](screenshots/25-qa-paid-active.png) | Existing status и Manage для активного mock entitlement | Paid / `qa-access-cycle-native` — passing case only |
| [26 — cancelled, still active](screenshots/26-qa-paid-cancelled-until.png) | Отмена продления сохраняет доступ до указанной даты | Paid / `qa-access-cycle-native` — passing case only |
| [27 — paid expired](screenshots/27-qa-paid-expired.png) | Истёкший mock paid access возвращает выбор продолжения | Paid / `qa-access-cycle-native` — passing case only |
| [28 — Fresh, no cycle day](screenshots/28-qa-fresh-no-cycle-day.png) | Not set; Today не выдумывает дату, DAY или phase | Final cycle / `qa-cycle-final-native` |
| [29 — confirmed day 1](screenshots/29-qa-cycle-day01.png) | Явный synthetic start 3 ноября даёт DAY 1 | Final cycle / `qa-cycle-final-native` |
| [30 — confirmed day 14](screenshots/30-qa-cycle-day14.png) | DAY 14 и существующий authored cue | Final cycle / `qa-cycle-final-native` |
| [31 — confirmed day 28](screenshots/31-qa-cycle-day28.png) | DAY 28 и authored guidance | Final cycle / `qa-cycle-final-native` |
| [32 — protected Home keeps cue](screenshots/32-qa-protected-home-same-guidance.png) | После эмблемы → entrance → Today на DAY 14 сохранён тот же cue | Final cycle / `qa-cycle-final-native` |
| [33 — final cycle End QA](screenshots/33-qa-cycle-exit-baseline.png) | Исходные synthetic 14 ноября, 28/5 восстановлены | Final cycle / `qa-cycle-final-native` |
| [34 — Reduced Motion Home](screenshots/34-reduced-motion-home-locked.png) | Privacy → emblem → locked Today с настоящим UIKit Reduce Motion ON | Final RM / `final-rm-home-native` |

На Debug PNG 13–17 видна плавающая кнопка development SDK. Она не является
элементом продукта или его эмблемой; эти кадры подтверждают состояния/действия,
а не финальную чистоту header. Capture 84 с перекрытым header защищённого Today
исключён. Чистые protected-Today кадры 18/19 получены в следующем case с временным
launch argument NoFab, скрывающим только floating development SDK control; продукт
для этого не менялся.

PNG проверены визуально. Сохранены исходные IDAT bytes и цветовые chunks; удалены только
EXIF/XMP/text metadata. Изображения не обрезались и не перерисовывались. Raw xcresults,
attachment manifests, системные/discovery кадры, открытый ExpoDevMenu, private LAN URL, device IDs
и локальные машинные пути в эту папку не включены.

## Final standalone Release media — PASS

- [Public release proof](release-proof.json): strict signature, exact official
  EXUpdates/app.manifest + fingerprint match и HBC SHA-256; Metro 8081/8082 отсутствовал
  во время записи. Actual Reduce Motion предварительно восстановлен OFF.
- [Полная cold → locked запись](cold-final-no-metro.mp4): H.264, 376×668, 30 fps,
  CRF 27, faststart, без metadata/audio; 22.4 s в media timeline. Финальные кадры
  проверены и действительно показывают locked Today.
- [Первые ~14 секунд, 4×2](cold-final-no-metro-contact.png) и
  [settled locked screenshot](cold-final-no-metro.png). PNG сохраняет исходные pixels
  и цветовые chunks; убраны только EXIF/XMP/text metadata.

Приблизительные стадии по sampled video PTS: app-window entry ~0–2 s, logo/splash
~2–13 s, GPU globe/travel/hold ~13–22 s, locked Today ~22.2 s. Это не stopwatch
старта: actual recording wall time **42.086 s**, отражённый отдельно в proof JSON.
Исходные 9 s сцены + 1 s hold не менялись; первая инициализация/GPU добавляет latency.
Не заявляется общий cold startup за 10 секунд. Кадры launcher относятся только
к собственному QA Simulator, не личному телефону.

Reduced Motion проверен отдельно: `final-rm-home-native` PASS 28.273 s,
Privacy → emblem → locked Today 1.523814 s при actual UIKit ON; OFF восстановлен.
После этих no-Metro проверок Metro затем перезапущен только для финального Debug
launch на физическом телефоне. Его успешная команда запуска/JS fetch не является
physical pixels или speech proof; raw phone JSON с идентификаторами не публикуется.

Все требуемые изолированные fresh/cycle, trial, paid, Store Retry/Restore,
08:00/history и exact End QA имеют passing native cases с указанными версиями;
failed suites не переименовываются в общий PASS. Неизменённые Calendar/Docs
компоненты опираются на свои уже выполненные проверки: повтор только из-за
финальной JS rebundle не требовался.

## Remaining evidence boundaries

- Physical-device pixels/speech и фактическое native QA прохождение на телефоне.
  Final-source standalone Simulator cold→locked и Reduced Motion уже PASS.
- Отдельный повтор 08:00 flow после удаления временного tracing остаётся
  ограничением версии evidence; traced case и чистые protected-Today PNG PASS.
  Виртуальные 07:59/08:00 не являются временем устройства в status bar и не меняют
  device clock; удаление диагностических console сообщений не меняет callback.
- Android native runtime, hardware Back и safe areas: tools unavailable. Финальный
  current-source JS export PASS; APK/AAB и runtime этим не подтверждаются.
- Реальные store/trial/web операции: конфигурация и sandbox остаются внешними gates.

[Общий отчёт](../../../docs/UX_TEST_READINESS.md) ·
[Изолированный QA](../../../docs/INTERNAL_QA.md) ·
[Конфигурация магазинов](../../../STORE_SETUP.md)
