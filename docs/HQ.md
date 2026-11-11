# Tune Into Her — Product HQ

Область: только Tune Into Her. Общий вход: [ORIGENESIS HQ](</Users/eliogenesis/Documents/ChatGPT/ORIGINESIS/README.md>); явно прочитай [правила исполнения](</Users/eliogenesis/Documents/ChatGPT/ORIGINESIS/principles/EXECUTION.md>) и связанный полный документ.

## Основные источники

- [README](../README.md) — продукт, архитектура и команды.
- [PRIVACY](../PRIVACY.md), [STORE_SETUP](../STORE_SETUP.md) — приватность и выпуск.
- PRODUCT_SNAPSHOT.md в рабочем корне — существующий незакоммиченный паспорт; читай его при наличии, не включай чужие изменения в свой коммит.
- [brand configuration](../src/config/brand.json) — реализация бренда; [app config](../app.config.ts) — реализация native identifiers. Это доказательства реализации, а не источник новых стратегических решений.

Tune Into Her — локальный уважительный цикл-контекст, без медицинских/фертильных прогнозов, аккаунтов, рекламы, аналитики и передачи дат цикла. Не смешивать с ImpulseOff или TruthBack. Attune/HerCue — исторические имена, не отдельные активные приложения.

## Подтверждение и доказательства

Источник пользователя: задача «Locate TuneIntoHer work», 01a0782f-3f58-7093-82de-9e6d4743df2b: «/Users/eliogenesis/Documents/ChatGPT/TuneIntoHer work here». Пользователь предоставил Build Succeeded / установка в Simulator; отдельно зафиксирован timeout открытия deep link. Это не отменяет успешную сборку и не доказывает успешный запуск после timeout.
Существующий PRODUCT_SNAPSHOT заявляет V4 CLEAN SPHERE: COMPLETE; старый migration snapshot «asset missing» не заменяет это утверждение. Ассистент в той задаче сообщил typecheck, 31 тест и lint; в текущем аудите они не повторялись. Проверка на физическом устройстве/готовность магазина отсюда не следует.
Рабочие файлы содержат расширение языков сверх прежних пяти; утверждение и полнота каждого нового языка требуют отдельной проверки. Не понижать/повышать статус только по наличию файлов.

## Проверки

npm run content:validate; npm run lint; npm run typecheck; npm test. Expo/native/store проверки — по STORE_SETUP и затронутому изменению. Данные пользователя и покупок не помещать в HQ.

Изменения требований сохраняй в перечисленных канонических источниках. Реальную передачу состояния оформляй по [процессу](</Users/eliogenesis/Documents/ChatGPT/ORIGINESIS/workflow/CONTEXT.md>); отчёты не становятся постоянными инструкциями.
