import es from './lenguajes/espanol.js';
import en from './lenguajes/ingles.js';
import fr from './lenguajes/frances.js';
import it from './lenguajes/italiano.js';
import de from './lenguajes/aleman.js';
import pt from './lenguajes/portugues.js';

const defaultLanguagePacks = Object.freeze({ es, en, fr, it, de, pt });

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
