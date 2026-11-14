import type { SupportedLanguage } from '../config/constants';

/** The root loads the licensed original font before showing application text. */
export const LIBERTINE_FAMILY = 'LinuxLibertineO';

/** Linux Libertine O does not cover Devanagari or Chinese; use the platform's script font. */
export function fontFamilyForLanguage(language: SupportedLanguage): string | undefined {
  return language === 'hi' || language === 'zh-Hans' ? undefined : LIBERTINE_FAMILY;
}

export function typographyForLanguage(language: SupportedLanguage): { fontFamily: string | undefined; fontWeight: '400' } {
  return { fontFamily: fontFamilyForLanguage(language), fontWeight: '400' };
}
