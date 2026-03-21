export const UI_TO_GAME_HAT = {
  espanol: 'español',
  ingles: 'inglés',
  frances: 'francés',
  italiano: 'italiano',
  aleman: 'alemán',
  portugues: 'portugués',
};

export const GAME_TO_UI_HAT = Object.fromEntries(
  Object.entries(UI_TO_GAME_HAT).map(([ui, game]) => [game, ui]),
);

export const UI_TO_GAME_INGREDIENT = {
  bread: 'pan',
  lettuce: 'lechuga',
  tomato: 'tomate',
  beef: 'carne',
  cheese: 'queso',
  chicken: 'pollo',
  egg: 'huevo',
  onion: 'cebolla',
  avocado: 'palta',
  wildcard: 'perrito',
};

export const GAME_TO_UI_INGREDIENT = Object.fromEntries(
  Object.entries(UI_TO_GAME_INGREDIENT).map(([ui, game]) => [game, ui]),
);

export const HAT_LABELS = {
  espanol: 'Espanol',
  ingles: 'English',
  frances: 'Francais',
  italiano: 'Italiano',
  aleman: 'Deutsch',
  portugues: 'Portugues',
};

export const INGREDIENT_LABELS = {
  lettuce: 'Lettuce',
  tomato: 'Tomato',
  beef: 'Beef',
  cheese: 'Cheese',
  chicken: 'Chicken',
  egg: 'Egg',
  onion: 'Onion',
  avocado: 'Avocado',
  bread: 'Bread',
  wildcard: 'Wildcard',
};

export function toGameHat(value) {
  if (!value) return null;
  return UI_TO_GAME_HAT[value] || value;
}

export function toUiHat(value) {
  if (!value) return null;
  return GAME_TO_UI_HAT[value] || value;
}

export function getHatLabel(value) {
  const ui = toUiHat(value);
  return HAT_LABELS[ui] || value || 'Hat';
}

export function toGameIngredient(value) {
  return UI_TO_GAME_INGREDIENT[value] || value;
}

export function toUiIngredient(value) {
  return GAME_TO_UI_INGREDIENT[value] || value;
}

export function getIngredientLabel(value) {
  const ui = toUiIngredient(value);
  return INGREDIENT_LABELS[ui] || value || 'Ingredient';
}

export function normalizeIngredientPool(pool = []) {
  return (pool || []).map((item) => toGameIngredient(item)).filter(Boolean);
}

export function normalizeHatPicksToGame(hatPicks = {}) {
  return Object.fromEntries(
    Object.entries(hatPicks || {}).map(([name, hat]) => [name, toGameHat(hat)]),
  );
}

export function normalizeHatPicksToUi(hatPicks = {}) {
  return Object.fromEntries(
    Object.entries(hatPicks || {}).map(([name, hat]) => [name, toUiHat(hat)]),
  );
}
