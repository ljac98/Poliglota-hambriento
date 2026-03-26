export function createTurnEngine({ drawN, clonePlayers, checkWin }) {
  return {
    resolveTurnEnd({ players, deck, discard, fromIdx }) {
      const player = players[fromIdx];
      const needed = player.maxHand - player.hand.length;

      let nextPlayers = players;
      let nextDeck = deck;
      let nextDiscard = discard;

      if (needed > 0) {
        const { drawn, deck: updatedDeck, discard: updatedDiscard } = drawN(deck, discard, needed);
        nextPlayers = clonePlayers(players);
        nextPlayers[fromIdx].hand.push(...drawn);
        nextDeck = updatedDeck;
        nextDiscard = updatedDiscard;
      }

      if (nextPlayers[fromIdx]?.closetCovered) {
        if (nextPlayers === players) nextPlayers = clonePlayers(players);
        nextPlayers[fromIdx].closetCovered = false;
      }

      const winner = checkWin(nextPlayers);
      const nextIdx = winner ? null : ((fromIdx + 1) % nextPlayers.length);

      return {
        players: nextPlayers,
        deck: nextDeck,
        discard: nextDiscard,
        winner,
        nextIdx,
      };
    },
  };
}
