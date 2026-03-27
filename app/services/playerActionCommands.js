export function createPlayerActionCommands({
  isOnline,
  isHost,
  roomCode,
  socket,
  clonePlayers,
  canPlayCard,
  advanceBurger,
  getIngName,
  getActionInfo,
  ingEmoji,
  ingKey,
  uid,
  addLog,
  endTurn,
  advanceTutorialAfter,
}) {
  function emitRemote(type, action = {}) {
    socket.emit('playerAction', { code: roomCode, action: { type, ...action } });
  }

  return {
    playIngredient({
      human,
      card,
      selectedIdx,
      players,
      discard,
      deck,
      hi,
      setModal,
      setSelectedIdx,
      setPlayers,
      setDiscard,
      setExtraPlay,
    }) {
      if (!canPlayCard(human, card)) return false;

      if (card.ingredient === 'perrito') {
        setModal({ type: 'wildcard', cardIdx: selectedIdx });
        return true;
      }

      if (isOnline && !isHost) {
        emitRemote('playIngredient', { cardIdx: selectedIdx });
        setSelectedIdx(null);
        return true;
      }

      addLog(hi, `jugó ${getIngName(card.ingredient, card.language)} ${ingEmoji[card.ingredient]}`, players);
      const nextPlayers = clonePlayers(players);
      nextPlayers[hi].hand.splice(selectedIdx, 1);
      nextPlayers[hi].table.push(card.ingredient);
      const { player: updatedPlayer, freed, done } = advanceBurger(nextPlayers[hi]);
      nextPlayers[hi] = updatedPlayer;
      const nextDiscard = [...discard, card];
      if (done) {
        freed.forEach((ingredient) => nextDiscard.push({ type: 'ingredient', ingredient: ingKey(ingredient), id: uid() }));
        addLog(hi, '¡completó una hamburguesa! 🎉', nextPlayers);
      }
      setSelectedIdx(null);
      setExtraPlay(false);
      if (advanceTutorialAfter('ingredient')) {
        setPlayers(nextPlayers);
        setDiscard(nextDiscard);
        return true;
      }
      endTurn(nextPlayers, deck, nextDiscard, hi);
      return true;
    },

    discardSelected({
      selectedIdx,
      players,
      discard,
      deck,
      hi,
      setSelectedIdx,
      setPlayers,
      setDiscard,
    }) {
      if (isOnline && !isHost) {
        emitRemote('discard', { cardIdx: selectedIdx });
        setSelectedIdx(null);
        return true;
      }

      const card = players[hi].hand[selectedIdx];
      addLog(hi, `descartó ${card.type === 'ingredient' ? getIngName(card.ingredient, card.language) : getActionInfo(card.action).name}`, players);
      const nextPlayers = clonePlayers(players);
      const discarded = nextPlayers[hi].hand.splice(selectedIdx, 1)[0];
      setSelectedIdx(null);
      if (advanceTutorialAfter('discard')) {
        setPlayers(nextPlayers);
        setDiscard([...discard, discarded]);
        return true;
      }
      endTurn(nextPlayers, deck, [...discard, discarded], hi);
      return true;
    },

    confirmWildcard({
      modal,
      chosenIng,
      players,
      discard,
      deck,
      hi,
      setModal,
      setSelectedIdx,
      setPlayers,
      setDiscard,
      setExtraPlay,
    }) {
      const { cardIdx } = modal;
      setModal(null);
      setSelectedIdx(null);

      if (isOnline && !isHost) {
        emitRemote('playWildcard', { cardIdx, ingredient: chosenIng });
        return true;
      }

      const card = players[hi].hand[cardIdx];
      addLog(hi, 'jugó 🌭 Comodín', players);
      const nextPlayers = clonePlayers(players);
      nextPlayers[hi].hand.splice(cardIdx, 1);
      nextPlayers[hi].table.push(`perrito|${chosenIng}`);
      const { player: updatedPlayer, freed, done } = advanceBurger(nextPlayers[hi]);
      nextPlayers[hi] = updatedPlayer;
      const nextDiscard = [...discard, card];
      if (done) {
        freed.forEach((ingredient) => nextDiscard.push({ type: 'ingredient', ingredient: ingKey(ingredient), id: uid() }));
        addLog(hi, '¡completó una hamburguesa! 🎉', nextPlayers);
      }
      if (advanceTutorialAfter('wildcard')) {
        setPlayers(nextPlayers);
        setDiscard(nextDiscard);
        return true;
      }
      setExtraPlay(false);
      endTurn(nextPlayers, deck, nextDiscard, hi);
      return true;
    },

    passTurn({ players, deck, discard, hi, setExtraPlay }) {
      if (isOnline && !isHost) {
        emitRemote('passTurn');
        return true;
      }
      setExtraPlay(false);
      if (advanceTutorialAfter('passTurn')) return true;
      endTurn(players, deck, discard, hi);
      return true;
    },
  };
}
