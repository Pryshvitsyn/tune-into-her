import type { SupportedLanguage } from '../config/constants';

// Startup-only copy. Existing daily/editorial translations are unchanged.
const copy: Record<SupportedLanguage, { loading: string; error: string }> = {
  en: { loading: 'Opening Tune Into Her', error: 'The app could not start. Please try again.' },
  it: { loading: 'Apertura di Tune Into Her', error: 'Impossibile avviare l’app. Riprova.' },
  fr: { loading: 'Ouverture de Tune Into Her', error: 'Impossible de démarrer l’application. Réessayez.' },
  es: { loading: 'Abriendo Tune Into Her', error: 'No se pudo iniciar la aplicación. Inténtalo de nuevo.' },
  de: { loading: 'Tune Into Her wird geöffnet', error: 'Die App konnte nicht starten. Bitte versuche es erneut.' },
  ru: { loading: 'Запуск Tune Into Her', error: 'Не удалось запустить приложение. Попробуйте ещё раз.' },
  uk: { loading: 'Запуск Tune Into Her', error: 'Не вдалося запустити застосунок. Спробуйте ще раз.' },
  hi: { loading: 'Tune Into Her खुल रहा है', error: 'ऐप शुरू नहीं हो सका। फिर कोशिश करें।' },
  'zh-Hans': { loading: '正在打开 Tune Into Her', error: '应用无法启动，请重试。' },
  ms: { loading: 'Membuka Tune Into Her', error: 'Aplikasi tidak dapat dimulakan. Cuba lagi.' },
  mbf: { loading: 'Tengah buka Tune Into Her', error: 'App tak dapat mula. Cuba lagi.' },
};
export function getLaunchCopy(language: SupportedLanguage) { return copy[language] ?? copy.en; }
