// ═══ INGREDIENTS ═══
export const INGREDIENTS = ["pan","lechuga","tomate","carne","queso","pollo","huevo","cebolla","palta"];

export const ING_EMOJI = {
  pan:"🍞", lechuga:"🥬", tomate:"🍅", carne:"🥩", queso:"🧀",
  pollo:"🍗", huevo:"🥚", cebolla:"🧅", palta:"🥑", perrito:"🌭"
};

export const ING_BG = {
  pan:"#D4A574", lechuga:"#7CB342", tomate:"#E53935", carne:"#8D6E63",
  queso:"#FFD54F", pollo:"#FF8A65", huevo:"#FFF9C4", cebolla:"#CE93D8",
  palta:"#66BB6A", perrito:"#E8B87A"
};

export const FRUITS_VEGS = ["lechuga","tomate","cebolla","palta"];

// ═══ LANGUAGES ═══
export const LANGUAGES = ["espanol","ingles","frances","italiano","aleman","portugues"];

const LANGUAGE_ALIASES = {
  es: "espanol",
  esp: "espanol",
  spa: "espanol",
  english: "ingles",
  en: "ingles",
  ing: "ingles",
  eng: "ingles",
  fr: "frances",
  fra: "frances",
  fre: "frances",
  french: "frances",
  it: "italiano",
  ita: "italiano",
  italian: "italiano",
  de: "aleman",
  ale: "aleman",
  ger: "aleman",
  deu: "aleman",
  german: "aleman",
  pt: "portugues",
  por: "portugues",
  portuguese: "portugues",
};

export function normalizeGameLanguage(language) {
  const raw = String(language || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!raw) return "";
  if (LANGUAGES.includes(raw)) return raw;
  return LANGUAGE_ALIASES[raw] || raw;
}

export function getRandomGameLanguage() {
  return LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];
}

export function languageMatches(left, right) {
  const normalizedLeft = normalizeGameLanguage(left);
  const normalizedRight = normalizeGameLanguage(right);
  return !!normalizedLeft && normalizedLeft === normalizedRight;
}

export const LANG_SHORT = {
  espanol:"ESP", ingles:"ING", frances:"FRA",
  italiano:"ITA", aleman:"ALE", portugues:"POR"
};

export const LANG_BORDER = {
  espanol:"#C41E1E", ingles:"#1a1a1a", frances:"#E65100",
  italiano:"#8D7B5A", aleman:"#2E7D32", portugues:"#5D4037"
};

export const LANG_BG = {
  espanol:"#FFF2CC", ingles:"#2A2A2A", frances:"#FFF0E8",
  italiano:"#FFF8E1", aleman:"#E8F5E9", portugues:"#F5F0EB"
};

export const LANG_TEXT = {
  espanol:"#C41E1E", ingles:"#E0E0E0", frances:"#E65100",
  italiano:"#8D7B5A", aleman:"#2E7D32", portugues:"#5D4037"
};

export const LANG_BADGE = {
  espanol:"#DAA520", ingles:"#333", frances:"#E65100",
  italiano:"#8D7B5A", aleman:"#2E7D32", portugues:"#5D4037"
};

export const EXTRA_PLAY_INDICATOR_STYLE = {
  background: 'rgba(255,215,0,0.12)',
  border: '1px solid rgba(255,215,0,0.28)',
  color: '#fff3bf',
  fontWeight: 800,
};

// ═══ INGREDIENT TRANSLATIONS ═══
export const ING_NAMES = {
  pan:     {espanol:"Pan",     ingles:"Bread",   frances:"Pain",    italiano:"Pane",     aleman:"Brot",     portugues:"Pão"},
  lechuga: {espanol:"Lechuga", ingles:"Lettuce", frances:"Laitue",  italiano:"Lattuga",  aleman:"Salat",    portugues:"Alface"},
  tomate:  {espanol:"Tomate",  ingles:"Tomato",  frances:"Tomate",  italiano:"Pomodoro", aleman:"Tomate",   portugues:"Tomate"},
  carne:   {espanol:"Carne",   ingles:"Beef",    frances:"Viande",  italiano:"Carne",    aleman:"Fleisch",  portugues:"Carne"},
  queso:   {espanol:"Queso",   ingles:"Cheese",  frances:"Fromage", italiano:"Formaggio",aleman:"Käse",     portugues:"Queijo"},
  pollo:   {espanol:"Pollo",   ingles:"Chicken", frances:"Poulet",  italiano:"Pollo",    aleman:"Hähnchen", portugues:"Frango"},
  huevo:   {espanol:"Huevo",   ingles:"Egg",     frances:"Œuf",     italiano:"Uovo",     aleman:"Ei",       portugues:"Ovo"},
  cebolla: {espanol:"Cebolla", ingles:"Onion",   frances:"Oignon",  italiano:"Cipolla",  aleman:"Zwiebel",  portugues:"Cebola"},
  palta:   {espanol:"Palta",   ingles:"Avocado", frances:"Avocat",  italiano:"Avocado",  aleman:"Avocado",  portugues:"Abacate"},
  perrito: {espanol:"Comodín", ingles:"Wildcard", frances:"Joker",  italiano:"Jolly",    aleman:"Joker",    portugues:"Coringa"},
};

export const getIngName = (ing, lang) => ING_NAMES[ing]?.[lang] || ing;

// ═══ ACTION CARDS ═══
export const ACTION_CARDS = [
  {id:"milanesa",    name:"La Milanesa",          emoji:"🍖", desc:"Todos descartan pan y huevo"},
  {id:"ensalada",    name:"La Ensalada",          emoji:"🥗", desc:"Todos descartan frutas/verduras"},
  {id:"pizza",       name:"La Pizza",             emoji:"🍕", desc:"Todos descartan queso"},
  {id:"parrilla",    name:"La Parrilla",          emoji:"🔥", desc:"Todos descartan pollo y carne"},
  {id:"tenedor",     name:"El Tenedor",           emoji:"🍴", desc:"Roba ingrediente de otro"},
  {id:"ladron",      name:"Ladrón Sombreros",     emoji:"🎩", desc:"Quita sombrero principal"},
  {id:"intercambio_sombreros",  name:"Intercambio Sombreros",  emoji:"🔄", desc:"Intercambia sombreros"},
  {id:"intercambio_hamburguesa",name:"Intercambio Mesa",       emoji:"🍔", desc:"Intercambia ingredientes de mesa"},
  {id:"perchero_cubierto", name:"Perchero Cubierto", emoji:"PC", desc:"Bloquea el perchero enemigo por un turno"},
  {id:"basurero",    name:"El Basurero",          emoji:"🗑️", desc:"Busca en descartes"},
  {id:"gloton",      name:"El Glotón",            emoji:"😋", desc:"Vacía mesa de otro"},
  {id:"negacion",    name:"Negación",             emoji:"🚫", desc:"Bloquea acción enemiga"},
  {id:"comecomodines",name:"Come Comodines",       emoji:"🌭", desc:"Todos descartan sus comodines de la mesa"},
];

export const getActionInfo = (id) => ACTION_CARDS.find(a => a.id === id);

// ═══ AI NAMES ═══
export const AI_NAMES = ["Chef Bot", "Cocinerito", "Señor Hambre"];


