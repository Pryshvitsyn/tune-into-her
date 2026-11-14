# UX correction and test readiness

Обновлено: 14 ноября 2026 года. Отчёт относится к текущему локальному этапу Tune Into Her.
Статусы исходного кода, сборки, установки и наблюдаемого поведения разделены ниже.
Публикация, реальные покупки и готовность магазинов этим отчётом не подтверждаются.

## Что реализовано

- Эмблема в существующих заголовках запускает исходную анимацию глобуса внутри
  приложения и затем открывает `/today`. Повторное нажатие во время перехода
  блокируется. Состояние доступа продолжает определять содержимое Today.
  Переключение темы остаётся в Settings.
- Новый пользователь начинает без выбранной даты менструации и выдуманного дня
  цикла. Используется существующий onboarding; сохранённые корректные данные
  подставляются в редактор. Будущие календарные интервалы обозначаются как оценки.
  Сценарий с подтверждённым началом 3 ноября 2026 года находится только в тестах/QA.
- Действие изменения цикла вынесено в неподвижную область существующего экрана
  календаря над нижней навигацией. После сохранения обновляются календарь и будущие
  выборки советов; исторические записи не стираются.
- Общий `Screen` сохраняет нижние Back и Settings на вторичных страницах независимо
  от прокрутки. Back использует допустимую предыдущую страницу либо Today;
  Android hardware Back использует тот же маршрут. Основные вкладки сохранены.
- Subscription остаётся существующим экраном в Settings с общим `PaywallCard`.
  Один Retry обновляет trial и предложения; устаревшие цены и ответы прежнего
  QA-сеанса отсекаются при смене scope. Зависший запрос предложений SDK
  завершается через 15 секунд и допускает повтор. Транзиентный сбой SecureStore
  больше не делает инициализацию trial необратимо ошибочной.
- Сохраняются отдельные 14×24 часа бесплатного доступа приложения без карты,
  явное начало, истечение без автоматической покупки, добровольные store-покупки,
  Restore и управление подпиской по её источнику. Реальные цены берутся из магазина.

Утверждённые сфера/материалы/тайминг, оформление тем, язык и его переключатель,
11 locale IDs, резерв контента, DO / SUPPORT / KEEP IN MIND, благодарность и
расписание уведомлений не заменялись.

## Почему недоступны реальные trial и предложения

В проверенных локальных входах сборки отсутствуют значения
`EXPO_PUBLIC_BILLING_ENVIRONMENT`, `EXPO_PUBLIC_TRIAL_API_URL` и публичных
RevenueCat SDK keys для iOS/Android. Локальные `.env` файлы также отсутствуют.
Поэтому trial останавливается до HTTP-запроса, а RevenueCat — до загрузки offering.
Это установленные ограничения конфигурации; существование продуктов и настройки
внешних консолей без подключения не проверены.

Код не заменяет этот сбой выдуманной подпиской, ценой или локальным бессрочным
premium-флагом. Реальное начало trial требует настроенного изолированного сервиса;
покупка требует продуктов/keys и native sandbox. Единый список действий владельца:
[STORE_SETUP](../STORE_SETUP.md). Производственный биллинг и платные услуги на этом
этапе не активировались.

## Изолированная проверка без оплаты

[INTERNAL_QA](INTERNAL_QA.md) описывает скрытый `/dev-qa`, доступный только при
`__DEV__` **и** `EXPO_PUBLIC_USE_MOCK_BILLING=true`. Сам флаг открывает панель;
симуляция включается только явным выбором сценария. Публичной QA-вкладки нет.

Сценарии используют существующие `MockPurchaseService`, `AppTrialService`, движок
цикла и выборку контента. Доступны: новый/возвращающийся пользователь; дни цикла
1/7/14/21/28; граница 08:00; начало/середина/истечение app trial; оплаченный,
отменённый до конца срока и истёкший доступ; недоступный магазин и восстановление.

Виртуальные часы, настройки, история, feedback, trial transport и credentials
принадлежат приватному сеансу в памяти. Device clock не меняется. При активном QA
реальные storage-записи, backend/store-запросы, trial polling и действия уведомлений
не выполняются. `dataScope` и поколения запросов отделяют вход, сброс и выход из QA;
после End QA возвращается обычное состояние. Тема внутри QA проверяет навигацию,
но не доказывает реальную дисковую persistence после перезапуска процесса.

## Проверенное и ожидающее проверки

| Область | Статус | Доказательство / граница |
| --- | --- | --- |
| Текущие исходники | PASS | 367 тестов / 41 файл, TypeScript, lint: 0 errors / 1 прежнее generated warning. Контент: 610 bundles, 11 locales, 90-day reserve. Текущие 367 tests/typecheck включают focus/Today readiness и семантическую touch-правку без изменения оформления. |
| iPhone Debug native build | PASS | Debug/iphoneos, arm64: BUILD SUCCEEDED, 0 compiler errors. `codesign --verify --deep --strict` завершён с 0; существующий профиль подходит телефону. Присутствуют ExpoCrypto, ExpoFont, WebView, Purchases, SVG Fabric/dev launcher; RNSVG 15.16.0. |
| Физический iPhone | PASS — install/transport/launch only | Debug установлен без удаления приложения/данных; JS bundle получен. Финальная команда Debug launch после restart Metro прошла с atomic development URL payload и временным SDK flag, без persisted preference edits. Финальный launch exit 0, процесс жив, Metro собрал/отдал current bundle (2016 modules; 34.439 s server build). Pixels/speech и фактическое прохождение сценария на телефоне не подтверждены. |
| Release Simulator | PASS — final standalone | Current-source BUILD SUCCEEDED; strict codesign и official EXUpdates/app.manifest/fingerprint совпадают точно. Extended video визуально подтверждает cold→moving globe→locked Today без Metro; RM Home также PASS. |
| Debug Simulator | PASS — versioned native QA cases | Store Retry/Restore — 316.847 s; traced 08:00/history — 146.912 s; AppTrial — 251.354 s; Paid — 416.237 s; final fresh/five-cycle-day/protected-Home — 309.700 s. Предыдущие whole-suite failures сохранены как отдельные checkpoints. |
| Native UX checkpoints | PASS — individual cases | Calendar/Home, Dark persistence, Fresh onboarding и Docs имеют отдельные успешные cases/PNG. Два ранних result bundles целиком FAILED; границы и последующие исправления явно указаны в [evidence README](../release/evidence/ux-20261114/README.md). |
| Android | PASS — final JS export; native BLOCKED | Current-source Android production JS export завершён. Java Runtime, Android SDK, adb и emulator отсутствуют; APK/AAB, native runtime и safe areas не проверены. |
| Реальные store / trial / web операции | BLOCKED | Не заполнена локальная конфигурация; внешние каталоги, сервис и sandbox-транзакции остаются отдельными проверками. |

Старый Debug-клиент потребовал обновления из-за отсутствующего ExpoCrypto и старого
RNSVG. Новый QA не добавляет отдельной native зависимости. Самостоятельная Release
сборка остаётся production-gated и не превращается в dev client по deep link.

## Native runtime matrix

| Проверка | Фактический результат и оставшаяся граница |
| --- | --- |
| Эмблема → исходная entrance → Today | Locked single/double PASS на раннем checkpoint: 13.043 s / 14.147 s, тот же процесс. Protected DAY 14 Home на current handlers также PASS в final cycle case с сохранённым cue. Current standalone cold→locked video и RM Home также PASS; версии раннего locked double-tap и protected QA case сохранены отдельно. |
| Календарь: действие над вкладками и подтверждённые данные редактора | PASS в отдельном раннем Calendar case без сохранения/изменения fixture. Компонент после этого не менялся: повтор только ради JS rebundle не требовался. Android runtime и дополнительные device sizes остаются непроверенными. |
| Новый пользователь без выбранной даты | PASS в последующем Fresh case, 66.039 s: Continue disabled до явного выбора; затем locked paywall без начала trial/покупки. Очищен только собственный synthetic QA Simulator fixture. |
| Back/Settings на Privacy и Terms/licence после прокрутки | PASS в последующем Docs case, 37.734 s. Неизменённый компонент не требовал повтора ради JS rebundle; MAX text, обе темы именно длинных документов и Android hardware Back остаются отдельными непроверенными сценариями. |
| Реальная persistence темы через Home и cold launch | PASS в Dark case, 59.246 s; Light восстановлена. Это отдельный обычный Simulator checkpoint; не in-memory QA persistence и не physical pixels. |
| Development bundle на физическом телефоне | PASS для bundle request/process survival; UI и native QA cases на телефоне — PENDING. |
| Native QA: недоступный магазин → Retry → предложения на той же карточке; явный Restore → protected Today | PASS — отдельный `qa-store-owned-scroll-native` case, 316.847 s, на последнем focus/readiness fix. Только mock; реального платежа нет. Чистый protected-Today header также виден в следующем 08:00 case; floating SDK control скрыт temporary launch argument NoFab. |
| End QA → исходный synthetic record и no access | PASS в том же case: 14 ноября 2026, 28/5, English, Light, reminder disabled, no access, тот же процесс. |
| Native QA: 07:59 → 08:00, guidance/history boundary | PASS — traced native case 146.912 s: DAY 8 не меняется, authored KEEP IN MIND обновляется, History содержит 9/10 ноября, End QA возвращает точный base. Touch tracing затем удалён; callback сохранён, причина прежнего пропуска нажатия не установлена. |
| Native QA: app-trial beginning/middle/expiry и явный card-free Start | PASS — AppTrial case 251.354 s: после Start открыт Today, точное истечение закрывает app access, store entitlement остаётся inactive; End QA восстанавливает exact base. Только private test transport. |
| Native QA: paid active/cancelled/expired | PASS — Paid case 416.237 s: active/cancelled сохраняют доступ до срока, expired блокирует; existing status/Manage и exact End QA проверены. Duration включает около 25 s read-only LLDB pause/detach и не является нормальной performance-метрикой. |
| Полный fresh + cycle days 1/7/14/21/28 и protected Home | PASS — final case 309.700 s на clean host с current canonical Settings/box-only handlers: Fresh Not set/no DAY; authored guidance всех пяти days; DAY 14 Home возвращает тот же cue/current Today; exact End QA восстановлен. Предыдущие failed cycles не засчитывались; SDK cause не заявляется. |
| Приватная история и отсутствие реальных notification/storage действий | History двух guidance dates и точный End QA подтверждены в traced 08:00 case. Source isolation PASS; отдельная native instrumentation реальных notification/storage side effects не заявляется. |
| Reduced Motion на final standalone Release без Metro | PASS — case 28.273 s: UIKit подтверждает ON; Privacy → emblem → locked Today за 1.523814 s, тот же процесс; defer возвращает actual UIKit setting OFF. |
| Итоговая normal cold video без Metro | PASS — extended final-source recording показывает app entry→logo→moving GPU globe→locked Today; last frames и settled PNG проверены. Media 22.4 s, actual recording wall 42.086 s: PTS не объявляется wall-clock startup. Source 9 s + 1 s hold не менялся; общего startup за 10 s не обещается. |
| Android navigation, hardware Back и safe areas | BLOCKED — tools unavailable. |

[Отобранные PNG и точные версии cases](../release/evidence/ux-20261114/README.md)
не содержат raw result manifests, private device IDs, LAN URL или машинных путей.
Каждая последующая отметка PASS должна назвать платформу, сборку/bundle, сценарий
и артефакт. Simulator, mock и unit test не считаются покупкой магазина или pixels
физического устройства.
