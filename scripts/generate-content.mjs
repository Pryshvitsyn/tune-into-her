import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const phases = [
  ["menstrual", 72, [1, 5], "menstrual"],
  ["follicular", 104, [6, 12], "follicular"],
  ["mid_cycle", 44, [13, 15], "mid_cycle"],
  ["luteal", 180, [16, 40], "luteal"],
];

const bundles = {
  en: [
    ["She may have less energy for extra demands today.", "Leave a little room for plans to change.", ["Keep tonight’s plans flexible.", "Take one small task off her plate.", "Ask what would feel easier this evening."]],
    ["She may be more sensitive to extra pressure today.", "Keep expectations lighter and decisions less urgent.", ["Do not add another plan without asking.", "Offer to handle one practical task.", "Give her room before pushing a decision."]],
    ["She may want a little more quiet or space than usual.", "Let her set the pace a little more today.", ["Choose a quieter plan if she seems tired.", "Ask whether she would prefer company or quiet.", "Keep messages and requests simple."]],
    ["She may feel more tired by the end of the day.", "Make tonight easier rather than fuller.", ["Offer to handle dinner.", "Keep the evening easy to change.", "Ask what would take pressure off."]],
    ["She may feel more open and energetic today.", "Follow her lead instead of filling the day for her.", ["Suggest one simple plan and let her choose.", "Leave room for her preferred pace.", "Check in before adding more to the day."]],
    ["She may be more receptive to closeness today.", "Keep connection gentle and led by her comfort.", ["Offer a small affectionate gesture without assuming.", "Ask what kind of evening would feel good.", "Choose time together over a crowded plan."]]
  ],
  it: [
    ["Oggi potrebbe avere meno energia per richieste extra.", "Lascia un po’ di margine perché i programmi possano cambiare.", ["Mantieni flessibili i programmi di stasera.", "Prenditi una piccola cosa dalla sua lista.", "Chiedi cosa renderebbe più facile la serata."]],
    ["Oggi potrebbe essere più sensibile alla pressione in più.", "Mantieni leggere le aspettative e meno urgenti le decisioni.", ["Non aggiungere un altro programma senza chiedere.", "Offriti di gestire una cosa pratica.", "Dalle spazio prima di insistere su una decisione."]],
    ["Oggi potrebbe desiderare più silenzio o spazio del solito.", "Lascia che sia lei a dettare un po’ di più il ritmo.", ["Scegli un piano più tranquillo se sembra stanca.", "Chiedi se preferisce compagnia o tranquillità.", "Tieni semplici messaggi e richieste."]],
    ["Potrebbe sentirsi più stanca verso la fine della giornata.", "Rendi la serata più semplice invece di riempirla.", ["Offriti di preparare la cena.", "Mantieni facile cambiare i programmi.", "Chiedi cosa toglierebbe pressione."]],
    ["Oggi potrebbe sentirsi più aperta ed energica.", "Segui il suo slancio senza riempirle la giornata.", ["Proponi un solo piano semplice e lascia scegliere a lei.", "Lascia spazio al ritmo che preferisce.", "Chiedi prima di aggiungere altro alla giornata."]],
    ["Oggi potrebbe essere più disponibile alla vicinanza.", "Mantieni il contatto gentile e guidato dal suo comfort.", ["Offri un piccolo gesto affettuoso senza presumere.", "Chiedi che tipo di serata le farebbe piacere.", "Scegli tempo insieme invece di un piano affollato."]]
  ],
  ru: [
    ["Сегодня у неё может быть меньше сил на лишние требования.", "Оставьте немного пространства для изменения планов.", ["Сохраните гибкость планов на вечер.", "Снимите с неё одну небольшую задачу.", "Спросите, что сделало бы вечер легче."]],
    ["Сегодня она может быть чувствительнее к лишнему давлению.", "Снизьте ожидания и не торопите решения.", ["Не добавляйте новый план, не спросив.", "Возьмите на себя одну практическую задачу.", "Дайте ей пространство перед обсуждением решения."]],
    ["Сегодня ей может хотеться больше тишины или личного пространства.", "Позвольте ей чуть больше задавать темп дня.", ["Выберите более тихий вариант, если она устала.", "Спросите, хочется ли ей компании или тишины.", "Пишите и просите о простом."]],
    ["К концу дня она может чувствовать себя более уставшей.", "Сделайте вечер проще, а не насыщеннее.", ["Предложите взять на себя ужин.", "Оставьте возможность легко изменить планы.", "Спросите, что снимет с неё нагрузку."]],
    ["Сегодня она может чувствовать себя более открытой и энергичной.", "Следуйте её настрою, не заполняя день за неё.", ["Предложите один простой вариант и дайте ей выбрать.", "Оставьте место для удобного ей темпа.", "Уточните, прежде чем добавлять что-то ещё."]],
    ["Сегодня она может быть более расположена к близости.", "Пусть контакт будет бережным и удобным для неё.", ["Проявите небольшую нежность, ничего не предполагая.", "Спросите, какой вечер ей был бы приятен.", "Выберите время вместе вместо шумного плана."]]
  ],
  uk: [
    ["Сьогодні в неї може бути менше сил на зайві вимоги.", "Залиште трохи простору, щоб плани могли змінитися.", ["Залиште вечірні плани гнучкими.", "Візьміть на себе одну невелику справу.", "Запитайте, що зробило б вечір легшим."]],
    ["Сьогодні вона може бути чутливішою до зайвого тиску.", "Зменште очікування й не квапте рішення.", ["Не додавайте нового плану, не запитавши.", "Запропонуйте взяти на себе практичну справу.", "Дайте їй простір перед обговоренням рішення."]],
    ["Сьогодні їй може хотітися більше тиші або особистого простору.", "Дозвольте їй трохи більше задавати темп дня.", ["Оберіть тихіший варіант, якщо вона втомлена.", "Запитайте, чи хочеться їй компанії або тиші.", "Пишіть і просіть про просте."]],
    ["Наприкінці дня вона може почуватися більш втомленою.", "Зробіть вечір простішим, а не насиченішим.", ["Запропонуйте взяти на себе вечерю.", "Залиште можливість легко змінити плани.", "Запитайте, що зменшить навантаження."]],
    ["Сьогодні вона може почуватися відкритішою та енергійнішою.", "Ідіть за її настроєм, не заповнюючи день за неї.", ["Запропонуйте один простий варіант і дайте їй обрати.", "Залиште місце для зручного їй темпу.", "Уточніть, перш ніж додавати щось іще."]],
    ["Сьогодні вона може бути більш схильною до близькості.", "Нехай контакт буде делікатним і комфортним для неї.", ["Виявіть невелику ніжність, нічого не припускаючи.", "Запитайте, який вечір був би їй приємний.", "Оберіть час разом замість гучного плану."]]
  ],
  es: [
    ["Hoy puede tener menos energía para exigencias extra.", "Deja un poco de margen para que los planes cambien.", ["Mantén flexibles los planes de esta noche.", "Quítale una pequeña tarea de encima.", "Pregunta qué haría más fácil la tarde."]],
    ["Hoy puede estar más sensible a la presión extra.", "Mantén las expectativas ligeras y las decisiones menos urgentes.", ["No añadas otro plan sin preguntar.", "Ofrécete a resolver una tarea práctica.", "Dale espacio antes de insistir en una decisión."]],
    ["Hoy puede querer más calma o espacio de lo habitual.", "Deja que ella marque un poco más el ritmo.", ["Elige un plan más tranquilo si parece cansada.", "Pregunta si prefiere compañía o tranquilidad.", "Mantén simples los mensajes y las peticiones."]],
    ["Puede sentirse más cansada al final del día.", "Haz que la noche sea más fácil en vez de más llena.", ["Ofrécete a preparar la cena.", "Deja que los planes puedan cambiar con facilidad.", "Pregunta qué le quitaría presión."]],
    ["Hoy puede sentirse más abierta y con más energía.", "Sigue su iniciativa sin llenar el día por ella.", ["Propón un plan sencillo y deja que ella elija.", "Deja espacio para el ritmo que prefiera.", "Pregunta antes de añadir algo más al día."]],
    ["Hoy puede estar más receptiva a la cercanía.", "Mantén la conexión suave y guiada por su comodidad.", ["Ofrece un pequeño gesto de cariño sin asumir.", "Pregunta qué tipo de tarde le apetecería.", "Elige tiempo juntos en vez de un plan lleno."]]
  ],
  fr: [
    ["Elle peut avoir moins d’énergie pour les demandes en plus aujourd’hui.", "Laissez un peu de marge pour que les plans puissent changer.", ["Gardez les plans de ce soir flexibles.", "Retirez une petite tâche de sa liste.", "Demandez ce qui rendrait la soirée plus simple."]],
    ["Elle peut être plus sensible à la pression supplémentaire aujourd’hui.", "Gardez des attentes légères et des décisions moins urgentes.", ["N’ajoutez pas un autre plan sans demander.", "Proposez de gérer une tâche pratique.", "Laissez lui de l’espace avant d’insister sur une décision."]],
    ["Elle peut avoir envie de plus de calme ou d’espace que d’habitude.", "Laissez-la donner davantage le rythme aujourd’hui.", ["Choisissez un plan plus calme si elle semble fatiguée.", "Demandez si elle préfère de la compagnie ou du calme.", "Gardez les messages et les demandes simples."]],
    ["Elle peut se sentir plus fatiguée en fin de journée.", "Rendez la soirée plus simple plutôt que plus remplie.", ["Proposez de préparer le dîner.", "Gardez les plans faciles à modifier.", "Demandez ce qui enlèverait de la pression."]],
    ["Elle peut se sentir plus ouverte et énergique aujourd’hui.", "Suivez son élan sans remplir la journée à sa place.", ["Proposez un plan simple et laissez-la choisir.", "Laissez de la place au rythme qu’elle préfère.", "Demandez avant d’ajouter autre chose à la journée."]],
    ["Elle peut être plus réceptive à la proximité aujourd’hui.", "Gardez le lien doux et guidé par son confort.", ["Offrez un petit geste affectueux sans présumer.", "Demandez quel type de soirée lui ferait plaisir.", "Choisissez du temps ensemble plutôt qu’un plan chargé."]]
  ]
};

bundles.ms = [
  ["Hari ini dia mungkin kurang bertenaga untuk perkara tambahan.", "Berikan sedikit ruang supaya rancangan boleh berubah.", ["Pastikan rancangan malam ini fleksibel.", "Ambil satu tugas kecil daripada tanggungjawabnya.", "Tanya apa yang boleh menjadikan malam ini lebih mudah."]],
  ["Hari ini dia mungkin lebih peka terhadap tekanan tambahan.", "Ringankan harapan dan jangan tergesa-gesa membuat keputusan.", ["Jangan tambah rancangan tanpa bertanya dahulu.", "Tawarkan diri untuk uruskan satu tugas praktikal.", "Berikan ruang sebelum mendesak keputusan."]],
  ["Hari ini dia mungkin mahukan lebih ketenangan atau ruang peribadi.", "Biarkan dia menentukan rentak hari ini sedikit lagi.", ["Pilih rancangan yang lebih tenang jika dia kelihatan letih.", "Tanya sama ada dia mahu teman atau masa bersendirian.", "Pastikan mesej dan permintaan ringkas."]],
  ["Menjelang hujung hari, dia mungkin berasa lebih letih.", "Jadikan malam ini lebih mudah, bukan lebih padat.", ["Tawarkan untuk uruskan makan malam.", "Biarkan rancangan mudah diubah.", "Tanya apa yang boleh mengurangkan tekanannya."]],
  ["Hari ini dia mungkin berasa lebih terbuka dan bertenaga.", "Ikuti arahannya tanpa memenuhi harinya untuknya.", ["Cadangkan satu rancangan mudah dan biarkan dia memilih.", "Berikan ruang untuk rentak yang dia selesa.", "Semak dahulu sebelum menambah perkara lain."]],
  ["Hari ini dia mungkin lebih terbuka kepada keakraban.", "Pastikan hubungan lembut dan mengikut keselesaannya.", ["Tawarkan isyarat kasih kecil tanpa menganggap apa-apa.", "Tanya jenis malam yang terasa baik baginya.", "Pilih masa bersama berbanding rancangan yang sesak."]]
];
bundles['ms-baba'] = [
  ["Hari ini dia mungkin kurang tenaga untuk banyak hal.", "Kasi sikit ruang, mana tahu rancangan boleh berubah.", ["Bikin rancangan malam ini senang ubah.", "Tolong ambil satu kerja kecil.", "Tanya apa boleh kasi malam ini lagi senang."]],
  ["Hari ini dia mungkin lebih rasa tekanan.", "Jangan taruh banyak harapan atau kasi keputusan cepat.", ["Jangan tambah rancangan tanpa tanya dulu.", "Tolong urus satu hal yang praktikal.", "Kasi dia ruang sebelum desak keputusan."]],
  ["Hari ini dia mungkin mahu lebih diam atau ruang sendiri.", "Biar dia tentukan rentak hari ini.", ["Pilih rancangan yang lebih tenang kalau dia nampak letih.", "Tanya dia mahu teman atau mahu sendiri.", "Kasi mesej dan permintaan ringkas."]],
  ["Akhir hari dia mungkin lebih letih.", "Bikin malam ini mudah, jangan terlalu penuh.", ["Tolong urus makan malam.", "Kasi rancangan senang tukar.", "Tanya apa boleh kurangkan tekanannya."]],
  ["Hari ini dia mungkin rasa lebih terbuka dan bertenaga.", "Ikut rentaknya, jangan penuhkan hari dia.", ["Cadang satu rancangan mudah, biar dia pilih.", "Kasi ruang untuk rentak yang dia suka.", "Tanya dulu sebelum tambah hal lain."]],
  ["Hari ini dia mungkin lebih sedia untuk rasa dekat.", "Biar hubungan lembut ikut keselesaan dia.", ["Beri tanda sayang kecil tanpa anggap apa-apa.", "Tanya malam macam mana dia rasa baik.", "Pilih masa bersama, bukan rancangan yang sesak."]]
];
bundles.hi = [
  ["आज उनमें अतिरिक्त कामों के लिए ऊर्जा कम हो सकती है।", "योजनाएँ बदल सकें, इसके लिए थोड़ा स्थान रखें।", ["आज शाम की योजना लचीली रखें।", "उनका एक छोटा काम अपने हाथ में लें।", "पूछें कि शाम को क्या आसान लगेगा।"]],
  ["आज वे अतिरिक्त दबाव के प्रति अधिक संवेदनशील हो सकती हैं।", "उम्मीदें हल्की रखें और फैसलों की जल्दी न करें।", ["पूछे बिना कोई नई योजना न जोड़ें।", "एक व्यावहारिक काम सँभालने की पेशकश करें।", "किसी निर्णय पर ज़ोर देने से पहले उन्हें जगह दें।"]],
  ["आज उन्हें सामान्य से अधिक शांति या अपना समय चाहिए हो सकता है।", "आज गति तय करने में उन्हें थोड़ी अधिक जगह दें।", ["अगर वे थकी लगें तो शांत योजना चुनें।", "पूछें कि उन्हें साथ चाहिए या थोड़ा सुकून।", "संदेश और अनुरोध सरल रखें।"]],
  ["दिन के अंत तक वे अधिक थकी हुई महसूस कर सकती हैं।", "शाम को भरा हुआ नहीं, आसान रखें।", ["रात के खाने में मदद की पेशकश करें।", "योजना को बदलना आसान रखें।", "पूछें कि किस बात से दबाव कम होगा।"]],
  ["आज वे अधिक खुली और ऊर्जावान महसूस कर सकती हैं।", "उनकी पहल के साथ चलें, दिन को उनके लिए न भरें।", ["एक सरल योजना सुझाएँ और उन्हें चुनने दें।", "उनकी पसंद की गति के लिए जगह रखें।", "कुछ और जोड़ने से पहले पूछें।"]],
  ["आज वे निकटता के लिए अधिक सहज हो सकती हैं।", "जुड़ाव को कोमल और उनकी सहजता के अनुसार रखें।", ["बिना अनुमान लगाए स्नेह का छोटा इशारा करें।", "पूछें कि किस तरह की शाम अच्छी लगेगी।", "भीड़-भरी योजना के बजाय साथ का समय चुनें।"]]
];

const catalog = [];
const locales = Object.fromEntries(Object.keys(bundles).map((language) => [language, {}]));
let globalIndex = 0;
for (const [phase, count, dayRange, learnMoreId] of phases) {
  for (let phaseIndex = 0; phaseIndex < count; phaseIndex += 1) {
    const id = phase + "_" + String(phaseIndex + 1).padStart(3, "0");
    catalog.push({ id, phases: [phase], dayRange, tags: ["relationship", "practical"], learnMoreId });
    for (const [language, languageBundles] of Object.entries(bundles)) {
      const bundle = languageBundles[(phaseIndex + globalIndex) % languageBundles.length];
      locales[language][id] = { howSheMayFeel: bundle[0], whatYouCanDo: bundle[1], practicalMoves: [...bundle[2]] };
    }
    globalIndex += 1;
  }
}

await mkdir(path.join(root, "content", "locales"), { recursive: true });
await writeFile(path.join(root, "content", "catalog.json"), JSON.stringify(catalog, null, 2) + String.fromCharCode(10));
for (const [language, entries] of Object.entries(locales)) {
  await writeFile(path.join(root, "content", "locales", language + ".json"), JSON.stringify(entries, null, 2) + String.fromCharCode(10));
}
console.log("Generated " + catalog.length + " canonical cues in " + Object.keys(locales).length + " languages.");
