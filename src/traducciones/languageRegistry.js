import es from './lenguajes/espanol.js';
import en from './lenguajes/ingles.js';
import fr from './lenguajes/frances.js';
import it from './lenguajes/italiano.js';
import de from './lenguajes/aleman.js';
import pt from './lenguajes/portugues.js';
import { extraTranslations } from './extraTranslations.js';

const defaultLanguagePacks = Object.freeze({
  es: { ...es, ...(extraTranslations.es || {}) },
  en: { ...en, ...(extraTranslations.en || {}) },
  fr: { ...fr, ...(extraTranslations.fr || {}) },
  it: { ...it, ...(extraTranslations.it || {}) },
  de: { ...de, ...(extraTranslations.de || {}) },
  pt: { ...pt, ...(extraTranslations.pt || {}) },
});

export function createTranslationRegistry(overrides = {}) {
  const languagePacks = Object.freeze({ ...defaultLanguagePacks, ...overrides });
  return Object.freeze({
    getLanguagePack(lang) {
      return languagePacks[lang] || languagePacks.es;
    },
    getAllLanguagePacks() {
      return languagePacks;
    },
    listLanguages() {
      return Object.keys(languagePacks);
    },
  });
}

export const translationRegistry = createTranslationRegistry();
