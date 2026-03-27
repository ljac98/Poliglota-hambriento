import { translationRegistry } from './traducciones/languageRegistry.js';

const translations = translationRegistry.getAllLanguagePacks();

const LANG_TO_KEY = {
  espanol: "es",
  ingles: "en",
  frances: "fr",
  italiano: "it",
  aleman: "de",
  portugues: "pt"
};

const KEY_TO_LANG = {
  es: "espanol",
  en: "ingles",
  fr: "frances",
  it: "italiano",
  de: "aleman",
  pt: "portugues"
};

const SHORT_BY_UI = {
  es: {
    espanol: "ESP",
    ingles: "ING",
    frances: "FRA",
    italiano: "ITA",
    aleman: "ALE",
    portugues: "POR"
  },
  en: {
    espanol: "SPA",
    ingles: "ENG",
    frances: "FRE",
    italiano: "ITA",
    aleman: "GER",
    portugues: "POR"
  },
  fr: {
    espanol: "ESP",
    ingles: "ANG",
    frances: "FRA",
    italiano: "ITA",
    aleman: "ALL",
    portugues: "POR"
  },
  it: {
    espanol: "SPA",
    ingles: "ING",
    frances: "FRA",
    italiano: "ITA",
    aleman: "TED",
    portugues: "POR"
  },
  de: {
    espanol: "SPA",
    ingles: "ENG",
    frances: "FRA",
    italiano: "ITA",
    aleman: "DEU",
    portugues: "POR"
  },
  pt: {
    espanol: "ESP",
    ingles: "ING",
    frances: "FRA",
    italiano: "ITA",
    aleman: "ALE",
    portugues: "POR"
  }
};

export function getUILang() {
  return localStorage.getItem('hp_ui_lang') || 'es';
}

export function setUILang(lang) {
  localStorage.setItem('hp_ui_lang', lang);
}

export function t(key, lang) {
  const selectedLang = lang || getUILang();
  const languagePack = translationRegistry.getLanguagePack(selectedLang);
  const fallbackPack = translationRegistry.getLanguagePack('es');
  const value = languagePack?.[key];
  if (value === undefined) return fallbackPack[key] || key;
  return value;
}

export function getLocalizedLangName(gameLang, uiLang) {
  const translated = t(gameLang, uiLang);
  return translated === gameLang ? gameLang : translated;
}

export function getLocalizedLangShort(gameLang, uiLang) {
  const selectedLang = uiLang || getUILang();
  const safeGameLang = gameLang || 'espanol';
  const short = SHORT_BY_UI[selectedLang]?.[safeGameLang];
  if (short) return short;
  const name = getLocalizedLangName(safeGameLang, selectedLang) || safeGameLang;
  const clean = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '');
  return (clean.slice(0, 3) || safeGameLang.slice(0, 3)).toUpperCase();
}

export { translations, LANG_TO_KEY, KEY_TO_LANG };
