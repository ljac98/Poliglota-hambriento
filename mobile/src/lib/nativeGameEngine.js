import {
  normalizeIngredientPool,
  toGameHat,
  toGameIngredient,
} from './gameMapping';

export const LANGUAGES = ['español', 'inglés', 'francés', 'italiano', 'alemán', 'portugués'];
export const INGREDIENTS = ['pan', 'lechuga', 'tomate', 'carne', 'queso', 'pollo', 'huevo', 'cebolla', 'palta'];
export const FRUITS_VEGS = ['lechuga', 'tomate', 'cebolla', 'palta'];
export const ACTION_CARDS = [
  { id: 'milanesa', name: 'La Milanesa', emoji: '🍖' },
  { id: 'ensalada', name: 'La Ensalada', emoji: '🥗' },
  { id: 'pizza', name: 'La Pizza', emoji: '🍕' },
  { id: 'parrilla', name: 'La Parrilla', emoji: '🔥' },
  { id: 'tenedor', name: 'El Tenedor', emoji: '🍴' },
  { id: 'ladron', name: 'Ladrón Sombreros', emoji: '🎩' },
  { id: 'intercambio_sombreros', name: 'Intercambio Sombreros', emoji: '🔄' },
  { id: 'intercambio_hamburguesa', name: 'Intercambio Mesa', emoji: '🍔' },
  { id: 'basurero', name: 'El Basurero', emoji: '🗑️' },
  { id: 'gloton', name: 'El Glotón', emoji: '😋' },
  { id: 'negacion', name: 'Negación', emoji: '🚫' },
  { id: 'comecomodines', name: 'Come Comodines', emoji: '🌭' },
];

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uid() {
  return `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function getActionInfo(id) {
  return ACTION_CARDS.find((action) => action.id === id) || null;
}

export function ingKey(ing) {
  return ing && ing.includes('|') ? ing.split('|')[0] : ing;
}

export function ingChosen(ing) {
  return ing && ing.includes('|') ? ing.split('|')[1] : null;
}

export function generateDeck() {
  let deck = [];
  INGREDIENTS.forEach((ingredient) => {
    LANGUAGES.forEach((language) => {
      deck.push({ type: 'ingredient', ingredient, language, id: uid() });
    });
  });
  INGREDIENTS.forEach((ingredient) => {
    shuffle(LANGUAGES).slice(0, 2).forEach((language) => {
      deck.push({ type: 'ingredient', ingredient, language, id: uid() });
    });
  });
  LANGUAGES.forEach((language) => {
    for (let index = 0; index < 2; index += 1) {
      deck.push({ type: 'ingredient', ingredient: 'perrito', language, id: uid() });
    }
  });
  ACTION_CARDS.forEach((action) => {
    for (let index = 0; index < 3; index += 1) {
      deck.push({ type: 'action', action: action.id, id: uid() });
    }
  });
  return shuffle(deck);
}

export function genBurger(size, ingredientPool = null) {
  const customPool = Array.isArray(ingredientPool) && ingredientPool.length > 0
    ? ingredientPool.filter((item) => item !== 'pan')
    : null;
  const others = shuffle(customPool && customPool.length > 0 ? customPool : INGREDIENTS.filter((item) => item !== 'pan'));
  if (size <= 4) {
    return shuffle(['pan', ...others.slice(0, size - 1)]);
  }
  const uniqueCount = randInt(Math.min(size - 1, 4), Math.min(size, 8));
  const base = ['pan', ...others.slice(0, uniqueCount)];
  const result = [...base];
  while (result.length < size) {
    const noBread = result.filter((item) => item !== 'pan');
    const duplicate = noBread[randInt(0, noBread.length - 1)];
    result.push(duplicate);
  }
  return shuffle(result);
}

export function buildGameConfig(setupLike = {}) {
  return {
    mode: setupLike.gameMode || setupLike.mode || 'clon',
    burgerCount: Number(setupLike.burgerCount) || 2,
    ingredientCount: Number(setupLike.ingredientCount) || 5,
    chaosLevel: Number(setupLike.chaosLevel) || 2,
    ingredientPool: normalizeIngredientPool(setupLike.ingredientPool || []),
  };
}

function withSharedCloneBurgers(gameConfig) {
  if (gameConfig.mode !== 'clon') return gameConfig;
  if (Array.isArray(gameConfig.sharedBurgers) && gameConfig.sharedBurgers.length > 0) return gameConfig;
  return {
    ...gameConfig,
    sharedBurgers: Array.from(
      { length: gameConfig.burgerCount },
      () => genBurger(gameConfig.ingredientCount, gameConfig.ingredientPool),
    ),
  };
}

export function initPlayer(name, deck, chosenHat, gameConfig, isAI = false) {
  const hand = deck.splice(0, 6);
  const perchero = LANGUAGES.filter((language) => language !== chosenHat);
  const config = withSharedCloneBurgers(gameConfig || buildGameConfig());
  const {
    mode = 'clon',
    burgerCount = 2,
    ingredientCount = 5,
    ingredientPool = null,
    sharedBurgers = null,
    chaosLevel = 2,
  } = config;
  let burgers;
  if (Array.isArray(sharedBurgers) && sharedBurgers.length > 0) {
    burgers = sharedBurgers.map((burger) => [...burger]);
  } else if (mode === 'escalera') {
    burgers = Array.from({ length: burgerCount }, (_, index) => genBurger(4 + index));
  } else if (mode === 'caotico') {
    const lvl = Math.max(1, Math.min(3, Number(chaosLevel) || 2));
    let burgerMin = 2;
    let burgerMax = 4;
    let ingMin = 4;
    let ingMax = 7;
    if (lvl === 1) {
      burgerMin = 1; burgerMax = 2;
      ingMin = 3; ingMax = 5;
    } else if (lvl === 3) {
      burgerMin = 3; burgerMax = 5;
      ingMin = 5; ingMax = 8;
    }
    const count = randInt(burgerMin, burgerMax);
    burgers = Array.from({ length: count }, () => genBurger(randInt(ingMin, ingMax)));
  } else {
    burgers = Array.from({ length: burgerCount }, () => genBurger(ingredientCount, ingredientPool));
  }
  return {
    name,
    hand,
    mainHats: [chosenHat],
    manuallyAddedHats: [],
    perchero,
    table: [],
    burgers,
    totalBurgers: burgers.length,
    currentBurger: 0,
    maxHand: 6,
    won: false,
    isAI,
    completed: 0,
  };
}

export function createHostGameState({ players = [], hatPicks = {}, gameConfig = {} }) {
  const normalizedConfig = withSharedCloneBurgers(buildGameConfig(gameConfig));
  const deck = generateDeck();
  const livePlayers = players.map((player, index) => {
    const next = initPlayer(player.name, deck, toGameHat(hatPicks[player.name]), normalizedConfig, false);
    next.idx = player.idx ?? index;
    if (index !== 0) next.isRemote = true;
    return next;
  });
  return {
    players: livePlayers,
    deck,
    discard: [],
    cp: 0,
    log: [],
    extraPlay: false,
    modal: null,
    pendingNeg: null,
    winner: null,
    gameConfig: normalizedConfig,
    phase: 'playing',
  };
}

export function canPlayCard(player, card) {
  if (!player.mainHats.includes(card.language)) return false;
  if (card.ingredient === 'perrito') return true;
  if (player.currentBurger >= player.totalBurgers) return false;
  const target = player.burgers[player.currentBurger];
  const needed = [...target];
  const tableCopy = player.table.map((item) => (item.startsWith('perrito|') ? item.split('|')[1] : item));
  for (let index = needed.length - 1; index >= 0; index -= 1) {
    const existing = tableCopy.indexOf(needed[index]);
    if (existing !== -1) {
      needed.splice(index, 1);
      tableCopy.splice(existing, 1);
    }
  }
  return needed.includes(card.ingredient);
}

export function checkBurgerComplete(player) {
  if (player.currentBurger >= player.totalBurgers) return false;
  const target = player.burgers[player.currentBurger];
  const working = [...player.table];
  for (const ingredient of target) {
    const exact = working.indexOf(ingredient);
    if (exact === -1) {
      const wildcard = working.findIndex((item) => item === 'perrito' || item.startsWith('perrito|'));
      if (wildcard === -1) return false;
      working.splice(wildcard, 1);
    } else {
      working.splice(exact, 1);
    }
  }
  return true;
}

export function drawN(deck, discard, count) {
  let nextDeck = [...deck];
  let nextDiscard = [...discard];
  const drawn = [];
  for (let index = 0; index < count; index += 1) {
    if (nextDeck.length === 0) {
      nextDeck = shuffle(nextDiscard.map((card) => (
        card.type === 'ingredient' && !card.language
          ? { ...card, language: LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)] }
          : card
      )));
      nextDiscard = [];
    }
    if (nextDeck.length > 0) drawn.push(nextDeck.shift());
  }
  return { drawn, deck: nextDeck, discard: nextDiscard };
}

export function advanceBurger(player) {
  if (!checkBurgerComplete(player)) return { player, freed: [], done: false };
  const freed = [...player.table];
  return {
    player: {
      ...player,
      table: [],
      currentBurger: player.currentBurger + 1,
      completed: (player.completed || 0) + 1,
    },
    freed,
    done: true,
  };
}

export function filterTable(player, discardArr) {
  const target = player.burgers[player.currentBurger] || [];
  const needed = [...target];
  const keep = [];
  for (const item of player.table) {
    const ingredient = item.startsWith('perrito|') ? item.split('|')[1] : item;
    const neededIndex = needed.indexOf(ingredient);
    if (neededIndex !== -1) {
      keep.push(item);
      needed.splice(neededIndex, 1);
    } else if ((item === 'perrito' || item.startsWith('perrito|')) && needed.length > 0) {
      keep.push(item);
      needed.splice(0, 1);
    } else {
      discardArr.push({
        type: 'ingredient',
        ingredient: item.startsWith('perrito') ? 'perrito' : item,
        language: LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)],
        id: uid(),
      });
    }
  }
  player.table = keep;
}

export function applyMass(players, discard, actionId, playerIdx) {
  const nextPlayers = clone(players);
  let nextDiscard = [...discard];
  if (actionId === 'comecomodines') {
    nextPlayers.forEach((player, index) => {
      if (index === playerIdx) return;
      const kept = [];
      player.table.forEach((ingredient) => {
        if (ingKey(ingredient) === 'perrito') {
          nextDiscard.push({ type: 'ingredient', ingredient: 'perrito', language: LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)], id: uid() });
        } else {
          kept.push(ingredient);
        }
      });
      player.table = kept;
    });
    return { players: nextPlayers, discard: nextDiscard };
  }
  const targets = {
    milanesa: ['pan', 'huevo'],
    ensalada: FRUITS_VEGS,
    pizza: ['queso'],
    parrilla: ['pollo', 'carne'],
  }[actionId] || [];
  nextPlayers.forEach((player, index) => {
    if (index === playerIdx) return;
    const kept = [];
    player.table.forEach((ingredient) => {
      if (targets.includes(ingKey(ingredient)) || targets.includes(ingChosen(ingredient))) {
        nextDiscard.push({ type: 'ingredient', ingredient: ingKey(ingredient), language: LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)], id: uid() });
      } else {
        kept.push(ingredient);
      }
    });
    player.table = kept;
  });
  return { players: nextPlayers, discard: nextDiscard };
}

export function normalizeActionPayload(action = {}) {
  const nextAction = { ...action };
  if (nextAction.ingredient) nextAction.ingredient = toGameIngredient(nextAction.ingredient);
  if (nextAction.hatLang) nextAction.hatLang = toGameHat(nextAction.hatLang);
  if (nextAction.myHat) nextAction.myHat = toGameHat(nextAction.myHat);
  if (nextAction.theirHat) nextAction.theirHat = toGameHat(nextAction.theirHat);
  return nextAction;
}
