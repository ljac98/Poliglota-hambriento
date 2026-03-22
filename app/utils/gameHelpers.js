import {
  LANGUAGES,
  FRUITS_VEGS,
} from '../../constants/index.js';
import { checkBurgerComplete } from '../../game/index.js';
import { shuffle } from '../../game/utils.js';
import ingPan from '../../imagenes/hamburguesas/objetivos/pan.png';
import ingLechuga from '../../imagenes/hamburguesas/objetivos/lechuga.png';
import ingTomate from '../../imagenes/hamburguesas/objetivos/tomate.png';
import ingCarne from '../../imagenes/hamburguesas/objetivos/carne.png';
import ingQueso from '../../imagenes/hamburguesas/objetivos/queso.png';
import ingPollo from '../../imagenes/hamburguesas/objetivos/pollo.png';
import ingHuevo from '../../imagenes/hamburguesas/objetivos/huevo.png';
import ingCebolla from '../../imagenes/hamburguesas/objetivos/cebolla.png';
import ingPalta from '../../imagenes/hamburguesas/objetivos/palta.png';
import comodinImg from '../../imagenes/ingredientes/comodines/comodin.png';

export const ING_IMG = {
  pan: ingPan,
  lechuga: ingLechuga,
  tomate: ingTomate,
  carne: ingCarne,
  queso: ingQueso,
  pollo: ingPollo,
  huevo: ingHuevo,
  cebolla: ingCebolla,
  palta: ingPalta,
  perrito: comodinImg,
};

export const ingKey = ing => ing && ing.includes('|') ? ing.split('|')[0] : ing;
export const ingChosen = ing => ing && ing.includes('|') ? ing.split('|')[1] : null;

export const ING_AFFECTED_BY = {
  pan: ['milanesa'],
  huevo: ['milanesa'],
  lechuga: ['ensalada'],
  tomate: ['ensalada'],
  cebolla: ['ensalada'],
  palta: ['ensalada'],
  queso: ['pizza'],
  pollo: ['parrilla'],
  carne: ['parrilla'],
  perrito: ['comecomodines'],
};

export const PLAYER_COLORS = ['#FFD700', '#00BCD4', '#FF7043', '#66BB6A', '#CE93D8'];
export const clone = o => JSON.parse(JSON.stringify(o));

export function drawN(deck, discard, n) {
  let d = [...deck];
  let di = [...discard];
  const drawn = [];

  for (let i = 0; i < n; i += 1) {
    if (d.length === 0) {
      d = shuffle(di.map(c => (
        c.type === 'ingredient' && !c.language
          ? { ...c, language: LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)] }
          : c
      )));
      di = [];
    }
    if (d.length > 0) drawn.push(d.shift());
  }

  return { drawn, deck: d, discard: di };
}

export function advanceBurger(player) {
  if (!checkBurgerComplete(player)) return { player, freed: [], done: false };
  const freed = [...player.table];
  return {
    player: { ...player, table: [], currentBurger: player.currentBurger + 1 },
    freed,
    done: true,
  };
}

export function filterTable(player, discardArr) {
  const target = player.burgers[player.currentBurger] || [];
  const needed = [...target];
  const keep = [];

  for (const item of player.table) {
    const ing = item.startsWith('perrito|') ? item.split('|')[1] : item;
    const neededIndex = needed.indexOf(ing);

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
        id: `c${Date.now()}${Math.random()}`,
      });
    }
  }

  player.table = keep;
}

export function applyMass(players, discard, actionId, playerIdx) {
  const nextPlayers = clone(players);
  let nextDiscard = [...discard];
  const affectedTargets = [];

  if (actionId === 'comecomodines') {
    nextPlayers.forEach((player, index) => {
      if (index === playerIdx) return;
      const kept = [];
      let removedCount = 0;
      player.table.forEach(ing => {
        if (ingKey(ing) === 'perrito') {
          nextDiscard.push({ type: 'ingredient', ingredient: 'perrito', id: `d${Date.now()}${Math.random()}` });
          removedCount += 1;
        } else {
          kept.push(ing);
        }
      });
      player.table = kept;
      if (removedCount > 0) affectedTargets.push({ targetIdx: index, count: removedCount });
    });
    return { players: nextPlayers, discard: nextDiscard, affectedTargets };
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
    let removedCount = 0;
    player.table.forEach(ing => {
      if (targets.includes(ingKey(ing)) || targets.includes(ingChosen(ing))) {
        nextDiscard.push({ type: 'ingredient', ingredient: ingKey(ing), id: `d${Date.now()}${Math.random()}` });
        removedCount += 1;
      } else {
        kept.push(ing);
      }
    });
    player.table = kept;
    if (removedCount > 0) affectedTargets.push({ targetIdx: index, count: removedCount });
  });

  return { players: nextPlayers, discard: nextDiscard, affectedTargets };
}
