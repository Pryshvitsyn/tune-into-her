import type { SupportedLanguage } from '../config/constants';

/** Resource IDs stay unchanged; native formatters use their supported locale names. */
export function localeForLanguage(language: SupportedLanguage): string {
  return language === 'mbf' ? 'ms' : language === 'zh-Hans' ? 'zh-CN' : language;
}
