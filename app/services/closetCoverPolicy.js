const HAT_ACTIONS = new Set(['ladron', 'intercambio_sombreros']);

export function createClosetCoverPolicy({ getRemainingNeeds, getCardKeepScore }) {
  return {
    getDiscardIndices(playerLike) {
      if (!playerLike || playerLike.hand.length < 2) return [];
      const needs = getRemainingNeeds(playerLike);
      return playerLike.hand
        .map((card, idx) => ({ idx, score: getCardKeepScore(card, playerLike.mainHats, needs) }))
        .sort((a, b) => a.score - b.score)
        .slice(0, 2)
        .map((item) => item.idx);
    },

    shouldAvoid(playerLike) {
      if (!playerLike || playerLike.hand.length < 2) return false;
      if (playerLike.perchero?.length > 0) return true;
      if (playerLike.mainHats?.length > 1) return true;
      return playerLike.hand.some((card) => card.type === 'action' && HAT_ACTIONS.has(card.action));
    },
  };
}
