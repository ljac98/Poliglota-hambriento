export function createRemoteActionService({
  canPlayCard,
  advanceBurger,
  drawN,
  getIngName,
  ingEmoji,
  ingKey,
  uid,
  getRandomGameLanguage,
}) {
  function appendCompletedBurgerRewards(discard, freed) {
    freed.forEach((ing) => discard.push({ type: 'ingredient', ingredient: ingKey(ing), language: getRandomGameLanguage(), id: uid() }));
  }

  return {
    playIngredient({ players, discard, idx, cardIdx, addLog }) {
      const card = players[idx].hand[cardIdx];
      if (!card || !canPlayCard(players[idx], card)) return null;

      addLog(idx, `jugÃ³ ${getIngName(card.ingredient, card.language)} ${ingEmoji[card.ingredient]}`, players);
      players[idx].hand.splice(cardIdx, 1);
      players[idx].table.push(card.ingredient);
      const { player: updatedPlayer, freed, done } = advanceBurger(players[idx]);
      players[idx] = updatedPlayer;
      const nextDiscard = [...discard, card];
      if (done) {
        appendCompletedBurgerRewards(nextDiscard, freed);
        addLog(idx, 'Â¡completÃ³ una hamburguesa! ðŸŽ‰', players);
      }
      return { players, discard: nextDiscard };
    },

    playWildcard({ players, discard, idx, cardIdx, ingredient, addLog }) {
      const card = players[idx].hand[cardIdx];
      if (!card) return null;

      addLog(idx, 'jugÃ³ ðŸŒ­ ComodÃ­n', players);
      players[idx].hand.splice(cardIdx, 1);
      players[idx].table.push(`perrito|${ingredient}`);
      const { player: updatedPlayer, freed, done } = advanceBurger(players[idx]);
      players[idx] = updatedPlayer;
      const nextDiscard = [...discard, card];
      if (done) {
        appendCompletedBurgerRewards(nextDiscard, freed);
        addLog(idx, 'Â¡completÃ³ una hamburguesa! ðŸŽ‰', players);
      }
      return { players, discard: nextDiscard };
    },

    discardCard({ players, discard, idx, cardIdx, addLog }) {
      const card = players[idx].hand[cardIdx];
      if (!card) return null;

      addLog(idx, 'descartÃ³ una carta', players);
      players[idx].hand.splice(cardIdx, 1);
      return { players, discard: [...discard, card] };
    },

    playBasurero({ players, discard, idx, cardIdx, pickedCardId, addLog }) {
      const card = players[idx].hand[cardIdx];
      if (!card) return null;

      players[idx].hand.splice(cardIdx, 1);
      let nextDiscard = [...discard, card];
      const found = nextDiscard.find((discardedCard) => discardedCard.id === pickedCardId);
      if (found) {
        nextDiscard = nextDiscard.filter((discardedCard) => discardedCard.id !== pickedCardId);
        players[idx].hand.push(found);
        addLog(idx, 'rescatÃ³ una carta del ðŸ—‘ï¸ basurero', players);
      }
      return { players, discard: nextDiscard };
    },

    manualCambiar({ players, discard, idx, hatLang, replaceIdx, cardIndices, addLog }) {
      const player = players[idx];
      if (player.closetCovered) return null;
      const closetIdx = player.perchero.indexOf(hatLang);
      if (closetIdx === -1) return null;

      const safeReplaceIdx = Number.isInteger(replaceIdx) && replaceIdx >= 0 && replaceIdx < player.mainHats.length
        ? replaceIdx
        : 0;

      player.perchero.splice(closetIdx, 1);
      const oldMain = player.mainHats[safeReplaceIdx];
      player.mainHats[safeReplaceIdx] = hatLang;
      player.perchero.push(oldMain);

      let discarded;
      if (cardIndices) {
        const sorted = [...cardIndices].sort((a, b) => b - a);
        discarded = sorted.map((handIdx) => player.hand.splice(handIdx, 1)[0]);
      } else {
        const cost = Math.ceil(player.hand.length / 2);
        discarded = player.hand.splice(0, cost);
      }

      const nextDiscard = [...discard, ...discarded];
      addLog(idx, `cambiÃ³ sombrero a ${hatLang} (descartÃ³ ${discarded.length} cartas)`, players);
      return { players, discard: nextDiscard };
    },

    manualAgregar({ players, deck, discard, idx, hatLang, addLog }) {
      const player = players[idx];
      if (player.closetCovered) return null;
      const closetIdx = player.perchero.indexOf(hatLang);
      if (closetIdx === -1) return null;

      player.perchero.splice(closetIdx, 1);
      player.mainHats.push(hatLang);
      player.manuallyAddedHats = [...(player.manuallyAddedHats || []), hatLang];

      let nextDiscard = [...discard, ...player.hand];
      player.hand = [];
      player.maxHand = Math.max(1, player.maxHand - 1);

      const { drawn, deck: nextDeck, discard: updatedDiscard } = drawN(deck, nextDiscard, player.maxHand);
      player.hand = drawn;
      nextDiscard = updatedDiscard;
      addLog(idx, `agregÃ³ sombrero ${hatLang} â€” mano mÃ¡x reducida a ${player.maxHand}`, players);
      return { players, deck: nextDeck, discard: nextDiscard };
    },
  };
}
