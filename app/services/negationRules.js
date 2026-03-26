const MASS_NEGATABLE_ACTIONS = new Set(['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines']);
const CLOSET_BLOCKED_ACTIONS = new Set(['ladron', 'intercambio_sombreros']);

export function actionCanBeNegated(card, affectedIdxs) {
  if (!card?.action) return false;
  if (card.action === 'basurero') return false;
  if (Array.isArray(affectedIdxs) && affectedIdxs.length > 0) return true;
  return MASS_NEGATABLE_ACTIONS.has(card.action);
}

export function isClosetActionBlocked(playerLike, actionId) {
  if (!playerLike?.closetCovered) return false;
  return CLOSET_BLOCKED_ACTIONS.has(actionId);
}
