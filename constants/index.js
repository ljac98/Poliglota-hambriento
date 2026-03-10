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
export const LANGUAGES = ["español","inglés","francés","italiano","alemán","portugués"];

export const LANG_SHORT = {
  español:"ESP", inglés:"ING", francés:"FRA",
  italiano:"ITA", alemán:"ALE", portugués:"POR"
};

export const LANG_BORDER = {
  español:"#C41E1E", inglés:"#1a1a1a", francés:"#E65100",
  italiano:"#8D7B5A", alemán:"#2E7D32", portugués:"#5D4037"
};

export const LANG_BG = {
  español:"#FFF2CC", inglés:"#2A2A2A", francés:"#FFF0E8",
  italiano:"#FFF8E1", alemán:"#E8F5E9", portugués:"#F5F0EB"
};

export const LANG_TEXT = {
  español:"#C41E1E", inglés:"#E0E0E0", francés:"#E65100",
  italiano:"#8D7B5A", alemán:"#2E7D32", portugués:"#5D4037"
};

export const LANG_BADGE = {
  español:"#DAA520", inglés:"#333", francés:"#E65100",
  italiano:"#8D7B5A", alemán:"#2E7D32", portugués:"#5D4037"
};

// ═══ INGREDIENT TRANSLATIONS ═══
export const ING_NAMES = {
  pan:     {español:"Pan",     inglés:"Bread",   francés:"Pain",    italiano:"Pane",     alemán:"Brot",     portugués:"Pão"},
  lechuga: {español:"Lechuga", inglés:"Lettuce", francés:"Laitue",  italiano:"Lattuga",  alemán:"Salat",    portugués:"Alface"},
  tomate:  {español:"Tomate",  inglés:"Tomato",  francés:"Tomate",  italiano:"Pomodoro", alemán:"Tomate",   portugués:"Tomate"},
  carne:   {español:"Carne",   inglés:"Beef",    francés:"Viande",  italiano:"Carne",    alemán:"Fleisch",  portugués:"Carne"},
  queso:   {español:"Queso",   inglés:"Cheese",  francés:"Fromage", italiano:"Formaggio",alemán:"Käse",     portugués:"Queijo"},
  pollo:   {español:"Pollo",   inglés:"Chicken", francés:"Poulet",  italiano:"Pollo",    alemán:"Hähnchen", portugués:"Frango"},
  huevo:   {español:"Huevo",   inglés:"Egg",     francés:"Œuf",     italiano:"Uovo",     alemán:"Ei",       portugués:"Ovo"},
  cebolla: {español:"Cebolla", inglés:"Onion",   francés:"Oignon",  italiano:"Cipolla",  alemán:"Zwiebel",  portugués:"Cebola"},
  palta:   {español:"Palta",   inglés:"Avocado", francés:"Avocat",  italiano:"Avocado",  alemán:"Avocado",  portugués:"Abacate"},
  perrito: {español:"Comodín", inglés:"Wildcard", francés:"Joker",  italiano:"Jolly",    alemán:"Joker",    portugués:"Coringa"},
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
  {id:"cambio_sombrero",       name:"Cambio Sombrero",        emoji:"👒", desc:"Cambia perchero + juega"},
  {id:"basurero",    name:"El Basurero",          emoji:"🗑️", desc:"Busca en descartes"},
  {id:"gloton",      name:"El Glotón",            emoji:"😋", desc:"Vacía mesa de otro"},
  {id:"negacion",    name:"Negación",             emoji:"🚫", desc:"Bloquea acción enemiga"},
];

export const getActionInfo = (id) => ACTION_CARDS.find(a => a.id === id);

// ═══ AI NAMES ═══
export const AI_NAMES = ["Chef Bot", "Cocinerito", "Señor Hambre"];

// ═══ IMAGE PATHS ═══
export const ING_IMG = {
  pan:     'imagenes/ingredientes/esquinas/pan.png',
  lechuga: 'imagenes/ingredientes/esquinas/lechuga.png',
  tomate:  'imagenes/ingredientes/esquinas/tomate.png',
  carne:   'imagenes/ingredientes/esquinas/carne.png',
  queso:   'imagenes/ingredientes/esquinas/queso.png',
  pollo:   'imagenes/ingredientes/esquinas/pollo.png',
  huevo:   'imagenes/ingredientes/esquinas/huevo.png',
  cebolla: 'imagenes/ingredientes/esquinas/cebolla.png',
  palta:   'imagenes/ingredientes/esquinas/palta.png',
};

export const ACTION_IMG = {
  milanesa:                'imagenes/acciones/milanesa.png',
  ensalada:                'imagenes/acciones/ensalada3.png',
  pizza:                   'imagenes/acciones/pizza.png',
  parrilla:                'imagenes/acciones/carnita.png',
  tenedor:                 'imagenes/acciones/tenedor.png',
  ladron:                  'imagenes/acciones/ladron.png',
  intercambio_sombreros:   'imagenes/acciones/intercambio de sombreros.png',
  intercambio_hamburguesa: 'imagenes/acciones/intercambio de hamburguesar.png',
  cambio_sombrero:         'imagenes/acciones/intercambio.png',
  basurero:                'imagenes/acciones/robar descarte.png',
  gloton:                  'imagenes/acciones/comecomodines.png',
  negacion:                'imagenes/acciones/cancel.png',
};

export const HAT_IMG = {
  español:   'imagenes/sombreros/sobreros esp.png',
  inglés:    'imagenes/sombreros/sobreros ing.png',
  francés:   'imagenes/sombreros/sobreros fra.png',
  italiano:  'imagenes/sombreros/sobreros ita.png',
  alemán:    'imagenes/sombreros/sobreros ale.png',
  portugués: 'imagenes/sombreros/sombrero por.png',
};
