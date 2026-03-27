import es from './languages/es.js';
import en from './languages/en.js';
import fr from './languages/fr.js';
import it from './languages/it.js';
import de from './languages/de.js';
import pt from './languages/pt.js';

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
