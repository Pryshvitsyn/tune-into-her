import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const phases = [
  ['menstrual', 72, [1, 5], 'menstrual'],
  ['follicular', 104, [6, 12], 'follicular'],
  ['mid_cycle', 44, [13, 15], 'mid_cycle'],
  ['luteal', 180, [16, 40], 'luteal'],
];

const copy = {
  en: {
    contexts: [
      'Comfort and energy can vary around this point.',
      'The pace that feels comfortable may be different today.',
      'Some people notice subtle shifts in energy around now.',
      'Rest, focus, or sociability may feel a little different.',
      'This part of a cycle can feel different from month to month.',
      'Preferences for company or quiet may shift around this time.',
      'Plans may feel easier with a little breathing room today.',
      'Physical comfort can be less predictable around this point.',
      'Energy may arrive in a different rhythm today.',
      'Small changes in comfort or focus are possible around now.',
      'What feels supportive can vary at this point in a cycle.',
      'Some people appreciate a gentler pace around this time.',
      'Needs and preferences can be especially individual today.',
      'There may be value in keeping expectations light today.',
      'Every cycle is different, including days around this point.',
      'A little extra flexibility may feel welcome around now.',
      'Energy and attention may not follow their usual pattern.',
      'Comfort can change without saying anything about mood.',
      'Today may simply call for a more open-ended pace.',
      'This estimate is context, while their experience is personal.'
    ],
    cues: [
      'Ask what would feel helpful instead of assuming.',
      'Leave a little room for plans to change if useful.',
      'A simple check-in can be enough today.',
      'Keep invitations easy to accept or decline.',
      'Make space for either company or quiet.',
      'Offer practical help without making it a big event.',
      'Let their own words guide the day.',
      'Keep unnecessary pressure low where you can.',
      'Choose curiosity over interpretation.',
      'A flexible evening may be a thoughtful option.',
      'Listen first if they choose to share.',
      'Treat the estimate as a reminder to pay attention.',
      'Make one ordinary task a little easier if welcome.',
      'Check the plan still works for both of you.',
      'Give preferences room to be different today.',
      'Offer, rather than decide, what support looks like.',
      'Keep the day collaborative and low-pressure.',
      'Notice what they say, not what the app suggests.',
      'A kind question is more useful than a prediction.',
      'Stay open to an answer you did not expect.'
    ]
  },
  it: {
    contexts: [
      'Comfort ed energia possono variare in questo momento.', 'Il ritmo più confortevole oggi potrebbe essere diverso.', 'Alcune persone notano lievi cambiamenti di energia in questo periodo.', 'Riposo, concentrazione o socialità possono sembrare un po’ diversi.', 'Questa parte del ciclo può cambiare di mese in mese.', 'La preferenza per compagnia o tranquillità può cambiare in questo periodo.', 'Oggi i programmi possono risultare più facili con un po’ di respiro.', 'Il comfort fisico può essere meno prevedibile in questo momento.', 'Oggi l’energia può seguire un ritmo diverso.', 'In questo periodo sono possibili piccoli cambiamenti di comfort o concentrazione.', 'Ciò che è di supporto può variare in questo punto del ciclo.', 'Alcune persone apprezzano un ritmo più dolce in questo periodo.', 'Oggi bisogni e preferenze possono essere particolarmente individuali.', 'Oggi può essere utile mantenere leggere le aspettative.', 'Ogni ciclo è diverso, anche nei giorni intorno a questo momento.', 'In questo periodo un po’ di flessibilità in più può essere gradita.', 'Energia e attenzione potrebbero non seguire il solito schema.', 'Il comfort può cambiare senza dire nulla sull’umore.', 'Oggi potrebbe semplicemente servire un ritmo più aperto.', 'Questa stima offre un contesto, mentre l’esperienza è personale.'
    ],
    cues: [
      'Chiedi cosa sarebbe utile invece di presumere.', 'Lascia un po’ di spazio per cambiare i programmi, se serve.', 'Oggi può bastare un semplice confronto.', 'Fai inviti facili da accettare o rifiutare.', 'Lascia spazio sia alla compagnia sia alla tranquillità.', 'Offri un aiuto pratico senza farne un grande evento.', 'Lascia che siano le sue parole a guidare la giornata.', 'Riduci la pressione non necessaria dove puoi.', 'Scegli la curiosità invece dell’interpretazione.', 'Una serata flessibile può essere un’opzione premurosa.', 'Ascolta prima, se decide di condividere.', 'Usa la stima come promemoria per prestare attenzione.', 'Rendi un’attività quotidiana un po’ più semplice, se è gradito.', 'Verifica che il programma vada ancora bene a entrambi.', 'Lascia che oggi le preferenze possano essere diverse.', 'Offri supporto senza decidere tu che forma debba avere.', 'Mantieni la giornata collaborativa e senza pressioni.', 'Nota ciò che dice, non ciò che suggerisce l’app.', 'Una domanda gentile è più utile di una previsione.', 'Resta aperto a una risposta che non ti aspettavi.'
    ]
  },
  ru: {
    contexts: [
      'Самочувствие и энергия в это время могут меняться.', 'Комфортный темп сегодня может быть другим.', 'Некоторые люди в это время замечают небольшие изменения энергии.', 'Потребность в отдыхе, общении или сосредоточенности может немного измениться.', 'Эта часть цикла может ощущаться по-разному от месяца к месяцу.', 'Предпочтение общения или тишины в это время может меняться.', 'Сегодня планы могут даваться легче, если оставить немного пространства.', 'Физический комфорт в это время может быть менее предсказуемым.', 'Сегодня энергия может идти в другом ритме.', 'В это время возможны небольшие изменения комфорта или внимания.', 'То, что ощущается как поддержка, в этот момент цикла может различаться.', 'Некоторым людям в это время подходит более мягкий темп.', 'Сегодня потребности и предпочтения могут быть особенно индивидуальны.', 'Сегодня может быть полезно снизить ожидания.', 'Каждый цикл отличается, в том числе в эти дни.', 'Немного дополнительной гибкости сейчас может оказаться кстати.', 'Энергия и внимание могут не следовать обычному ритму.', 'Изменение комфорта ничего не говорит о настроении.', 'Возможно, сегодня просто нужен более свободный темп.', 'Эта оценка даёт контекст, но личный опыт всегда индивидуален.'
    ],
    cues: [
      'Спросите, что было бы полезно, вместо того чтобы предполагать.', 'Если удобно, оставьте возможность изменить планы.', 'Сегодня может быть достаточно простого вопроса.', 'Предлагайте так, чтобы было легко согласиться или отказаться.', 'Оставьте место и для общения, и для тишины.', 'Предложите практическую помощь без лишнего внимания.', 'Пусть ориентиром будут слова партнёра.', 'По возможности уменьшите лишнее давление.', 'Выбирайте любопытство, а не интерпретации.', 'Гибкий план на вечер может быть хорошим вариантом.', 'Сначала выслушайте, если партнёр захочет поделиться.', 'Используйте оценку как напоминание быть внимательнее.', 'Если это уместно, немного упростите одну обычную задачу.', 'Уточните, подходят ли планы вам обоим.', 'Оставьте место для других предпочтений сегодня.', 'Предложите поддержку, не решая заранее, какой она должна быть.', 'Пусть день будет совместным и без лишнего давления.', 'Обращайте внимание на слова партнёра, а не на подсказку приложения.', 'Добрый вопрос полезнее любого прогноза.', 'Будьте открыты к неожиданному ответу.'
    ]
  },
  uk: {
    contexts: [
      'Самопочуття й енергія в цей час можуть змінюватися.', 'Комфортний темп сьогодні може бути іншим.', 'Деякі люди в цей час помічають невеликі зміни енергії.', 'Потреба у відпочинку, спілкуванні чи зосередженості може трохи змінитися.', 'Ця частина циклу може відчуватися по-різному щомісяця.', 'Бажання побути в компанії чи тиші в цей час може змінюватися.', 'Сьогодні плани можуть даватися легше, якщо залишити трохи простору.', 'Фізичний комфорт у цей час може бути менш передбачуваним.', 'Сьогодні енергія може мати інший ритм.', 'У цей час можливі невеликі зміни комфорту чи уваги.', 'Те, що відчувається як підтримка, у цей момент циклу може різнитися.', 'Деяким людям у цей час підходить м’якший темп.', 'Сьогодні потреби й уподобання можуть бути особливо індивідуальними.', 'Сьогодні може бути корисно знизити очікування.', 'Кожен цикл відрізняється, зокрема й у ці дні.', 'Трохи додаткової гнучкості зараз може бути доречно.', 'Енергія й увага можуть не мати звичного ритму.', 'Зміна комфорту нічого не говорить про настрій.', 'Можливо, сьогодні просто потрібен вільніший темп.', 'Ця оцінка дає контекст, але особистий досвід завжди індивідуальний.'
    ],
    cues: [
      'Запитайте, що було б корисно, замість того щоб припускати.', 'Якщо зручно, залиште можливість змінити плани.', 'Сьогодні може бути достатньо простого запитання.', 'Пропонуйте так, щоб було легко погодитися чи відмовитися.', 'Залиште місце і для спілкування, і для тиші.', 'Запропонуйте практичну допомогу без зайвої уваги.', 'Нехай орієнтиром будуть слова партнера.', 'За можливості зменште зайвий тиск.', 'Обирайте цікавість, а не тлумачення.', 'Гнучкий план на вечір може бути турботливим варіантом.', 'Спочатку вислухайте, якщо партнер захоче поділитися.', 'Використовуйте оцінку як нагадування бути уважнішими.', 'Якщо це доречно, трохи спростіть одну звичайну справу.', 'Уточніть, чи підходять плани вам обом.', 'Залиште місце для інших уподобань сьогодні.', 'Запропонуйте підтримку, не вирішуючи наперед, якою вона має бути.', 'Нехай день буде спільним і без зайвого тиску.', 'Зважайте на слова партнера, а не на підказку застосунку.', 'Добре запитання корисніше за будь-який прогноз.', 'Будьте відкриті до неочікуваної відповіді.'
    ]
  },
  es: {
    contexts: [
      'La comodidad y la energía pueden variar en este momento.', 'El ritmo que resulte cómodo podría ser diferente hoy.', 'Algunas personas notan cambios sutiles de energía en estos días.', 'El descanso, la concentración o las ganas de socializar pueden sentirse distintos.', 'Esta parte del ciclo puede sentirse diferente cada mes.', 'La preferencia por compañía o tranquilidad puede cambiar en estos días.', 'Hoy los planes pueden resultar más fáciles con un poco de margen.', 'La comodidad física puede ser menos predecible en este momento.', 'Hoy la energía puede llegar con otro ritmo.', 'En estos días puede haber pequeños cambios de comodidad o concentración.', 'Lo que se siente como apoyo puede variar en este punto del ciclo.', 'Algunas personas agradecen un ritmo más suave en estos días.', 'Hoy las necesidades y preferencias pueden ser especialmente personales.', 'Puede ser útil mantener las expectativas ligeras hoy.', 'Cada ciclo es diferente, también en los días cercanos a este punto.', 'Un poco más de flexibilidad puede venir bien ahora.', 'La energía y la atención quizá no sigan su patrón habitual.', 'La comodidad puede cambiar sin decir nada sobre el estado de ánimo.', 'Hoy quizá simplemente convenga un ritmo más abierto.', 'Esta estimación ofrece contexto; su experiencia es personal.'
    ],
    cues: [
      'Pregunta qué sería útil en vez de darlo por hecho.', 'Deja algo de margen para cambiar los planes si hace falta.', 'Hoy puede bastar con preguntar de forma sencilla.', 'Haz invitaciones fáciles de aceptar o rechazar.', 'Deja espacio tanto para la compañía como para la tranquilidad.', 'Ofrece ayuda práctica sin convertirla en un gran acontecimiento.', 'Deja que sus propias palabras guíen el día.', 'Reduce la presión innecesaria cuando puedas.', 'Elige la curiosidad en lugar de interpretar.', 'Una tarde flexible puede ser una opción considerada.', 'Escucha primero si decide compartir algo.', 'Usa la estimación como recordatorio para prestar atención.', 'Haz un poco más fácil una tarea cotidiana, si le viene bien.', 'Comprueba que el plan aún funciona para ambos.', 'Deja espacio para que hoy las preferencias sean distintas.', 'Ofrece apoyo sin decidir de antemano cómo debe ser.', 'Mantén el día colaborativo y sin presión.', 'Fíjate en lo que dice, no en lo que sugiere la aplicación.', 'Una pregunta amable es más útil que una predicción.', 'Mantente abierto a una respuesta que no esperabas.'
    ]
  }
};

Object.assign(copy, JSON.parse(await readFile(path.join(root, 'localization/content-new.json'), 'utf8')));

const catalog = [];
const locales = Object.fromEntries(Object.keys(copy).map((language) => [language, {}]));
let globalIndex = 0;
for (const [phase, count, dayRange, learnMoreId] of phases) {
  for (let phaseIndex = 0; phaseIndex < count; phaseIndex += 1) {
    const id = `${phase}_${String(phaseIndex + 1).padStart(3, '0')}`;
    catalog.push({ id, phases: [phase], dayRange, tags: ['attention', phaseIndex % 2 ? 'flexibility' : 'communication'], learnMoreId });
    for (const [language, values] of Object.entries(copy)) {
      const contextIndex = globalIndex % values.contexts.length;
      const cueIndex = Math.floor(globalIndex / values.contexts.length) % values.cues.length;
      locales[language][id] = { context: values.contexts[contextIndex], cue: values.cues[cueIndex] };
    }
    globalIndex += 1;
  }
}

await mkdir(path.join(root, 'content', 'locales'), { recursive: true });
await writeFile(path.join(root, 'content', 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
for (const [language, entries] of Object.entries(locales)) {
  await writeFile(path.join(root, 'content', 'locales', `${language}.json`), `${JSON.stringify(entries, null, 2)}\n`);
}
console.log(`Generated ${catalog.length} cues in ${Object.keys(locales).length} languages.`);

