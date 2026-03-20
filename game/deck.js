import { INGREDIENTS, LANGUAGES, ACTION_CARDS } from '../constants';
import { shuffle, uid, randInt } from './utils';

// ═══ DECK GENERATION ═══
export function generateDeck() {
  let d = [];
  
  // One of each ingredient in each language
  INGREDIENTS.forEach(ing =>
    LANGUAGES.forEach(lang =>
      d.push({ type: "ingredient", ingredient: ing, language: lang, id: uid() })
    )
  );
  
  // Extra 2 random-language copies of each ingredient
  INGREDIENTS.forEach(ing => {
    shuffle(LANGUAGES).slice(0, 2).forEach(lang =>
      d.push({ type: "ingredient", ingredient: ing, language: lang, id: uid() })
    );
  });
  
  // Wildcards (perritos) - 2 per language
  LANGUAGES.forEach(lang => {
    for (let i = 0; i < 2; i++)
      d.push({ type: "ingredient", ingredient: "perrito", language: lang, id: uid() });
  });
  
  // Action cards - 3 of each
  ACTION_CARDS.forEach(ac => {
    for (let i = 0; i < 3; i++)
      d.push({ type: "action", action: ac.id, id: uid() });
  });
  
  return shuffle(d);
}

// ═══ BURGER GENERATION ═══
export function genBurger(size) {
  const others = shuffle(INGREDIENTS.filter(i => i !== "pan"));
  
  if (size <= 4) {
    // 4 ingredients: all unique
    return shuffle(["pan", ...others.slice(0, size - 1)]);
  }
  
  // 5-7: start with pan + pick some unique, then allow repeats
  const uniqueCount = randInt(Math.min(size - 1, 4), Math.min(size, 8));
  const base = ["pan", ...others.slice(0, uniqueCount)];
  const result = [...base];
  
  // Fill remaining with duplicates of existing ingredients
  while (result.length < size) {
    const noPan = result.filter(i => i !== "pan");
    const dupe = noPan[randInt(0, noPan.length - 1)];
    result.push(dupe);
  }
  
  return shuffle(result);
}

// ═══ PLAYER INITIALIZATION ═══
export function initPlayer(name, deck, chosenHat, gameConfig, isAI = false) {
  const hand = deck.splice(0, 6);
  const perchero = LANGUAGES.filter(l => l !== chosenHat);

  const {
    mode = 'clon',
    burgerCount = 2,
    ingredientCount = 5,
    sharedBurgers = null,
  } = gameConfig || {};

  let burgers;
  if (Array.isArray(sharedBurgers) && sharedBurgers.length > 0) {
    burgers = sharedBurgers.map(burger => [...burger]);
  } else if (mode === 'escalera') {
    burgers = Array.from({ length: burgerCount }, (_, i) => genBurger(4 + i));
  } else if (mode === 'caotico') {
    const count = randInt(2, 4);
    burgers = Array.from({ length: count }, () => genBurger(randInt(3, 8)));
  } else {
    // clon (default)
    burgers = Array.from({ length: burgerCount }, () => genBurger(ingredientCount));
  }

  const totalBurgers = burgers.length;
  
  return {
    name,
    hand,
    mainHats: [chosenHat],
    manuallyAddedHats: [],
    perchero,
    table: [],
    burgers,
    totalBurgers,
    currentBurger: 0,
    maxHand: 6,
    won: false,
    isAI,
  };
}

// ═══ GAME CHECKS ═══
export function canPlayCard(player, card) {
  if (!player.mainHats.includes(card.language)) return false;
  if (card.ingredient === "perrito") return true;
  if (player.currentBurger >= player.totalBurgers) return false;
  
  const target = player.burgers[player.currentBurger];
  const needed = [...target];
  const tableCopy = player.table.map(t => t.startsWith('perrito|') ? t.split('|')[1] : t);
  
  for (let i = needed.length - 1; i >= 0; i--) {
    const idx = tableCopy.indexOf(needed[i]);
    if (idx !== -1) {
      needed.splice(i, 1);
      tableCopy.splice(idx, 1);
    }
  }
  
  return needed.includes(card.ingredient);
}

export function checkBurgerComplete(player) {
  if (player.currentBurger >= player.totalBurgers) return false;
  const target = player.burgers[player.currentBurger];
  const tc = [...player.table];
  
  for (const ing of target) {
    const i = tc.indexOf(ing);
    if (i === -1) {
      const w = tc.findIndex(t => t === "perrito" || t.startsWith("perrito|"));
      if (w === -1) return false;
      tc.splice(w, 1);
    } else {
      tc.splice(i, 1);
    }
  }
  
  return true;
}
