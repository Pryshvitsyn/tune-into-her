import catalogJson from '../../../content/catalog.json';
import en from '../../../content/locales/en.json';
import es from '../../../content/locales/es.json';
import it from '../../../content/locales/it.json';
import ru from '../../../content/locales/ru.json';
import uk from '../../../content/locales/uk.json';
import type { SupportedLanguage } from '../../config/constants';

import type { CueMetadata, LocalizedCue } from './types';

const catalog = catalogJson as CueMetadata[];
const locales = { en, it, ru, uk, es } as Record<SupportedLanguage, Record<string, LocalizedCue>>;

export function getCatalog(): CueMetadata[] {
  return catalog;
}

export function getLocalizedCue(language: SupportedLanguage, id: string): LocalizedCue {
  const entry = locales[language][id] ?? locales.en[id];
  if (!entry) throw new Error(`MISSING_CUE:${id}`);
  return entry;
}
