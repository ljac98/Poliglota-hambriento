function endTurnLater(endTurnFromRemote, players, deck, discard, idx) {
  setTimeout(() => endTurnFromRemote(players, deck, discard, idx), 0);
}

export function createRemoteActionDispatcher({
  remoteActionService,
  endTurnFromRemote,
  setPlayers,
  setDeck,
  setDiscard,
  setExtraPlay,
}) {
  const handlers = {
    playIngredient({ idx, action, players, deck, discard, addLog }) {
      const result = remoteActionService.playIngredient({
        players,
        discard,
        idx,
        cardIdx: action.cardIdx,
        addLog,
      });
      if (!result) return false;
      endTurnLater(endTurnFromRemote, players, deck, result.discard, idx);
      return true;
    },

    playWildcard({ idx, action, players, deck, discard, addLog }) {
      const result = remoteActionService.playWildcard({
        players,
        discard,
        idx,
        cardIdx: action.cardIdx,
        ingredient: action.ingredient,
        addLog,
      });
      if (!result) return false;
      endTurnLater(endTurnFromRemote, players, deck, result.discard, idx);
      return true;
    },

    discard({ idx, action, players, deck, discard, addLog }) {
      const result = remoteActionService.discardCard({
        players,
        discard,
        idx,
        cardIdx: action.cardIdx,
        addLog,
      });
      if (!result) return false;
      endTurnLater(endTurnFromRemote, players, deck, result.discard, idx);
      return true;
    },

    playBasurero({ idx, action, players, deck, discard, addLog }) {
      const result = remoteActionService.playBasurero({
        players,
        discard,
        idx,
        cardIdx: action.cardIdx,
        pickedCardId: action.pickedCardId,
        addLog,
      });
      if (!result) return false;
      endTurnLater(endTurnFromRemote, players, deck, result.discard, idx);
      return true;
    },

    manualCambiar({ idx, action, players, discard, addLog }) {
      const result = remoteActionService.manualCambiar({
        players,
        discard,
        idx,
        hatLang: action.hatLang,
        replaceIdx: action.replaceIdx,
        cardIndices: action.cardIndices,
        addLog,
      });
      if (!result) return false;
      setPlayers(players);
      setDiscard(result.discard);
      setExtraPlay(true);
      return true;
    },

    manualAgregar({ idx, action, players, deck, discard, addLog }) {
      const result = remoteActionService.manualAgregar({
        players,
        deck,
        discard,
        idx,
        hatLang: action.hatLang,
        addLog,
      });
      if (!result) return false;
      setPlayers(players);
      setDeck(result.deck);
      setDiscard(result.discard);
      setExtraPlay(true);
      return true;
    },

    passTurn({ idx, players, deck, discard }) {
      setExtraPlay(false);
      endTurnLater(endTurnFromRemote, players, deck, discard, idx);
      return true;
    },
  };

  return {
    dispatch(type, context) {
      const handler = handlers[type];
      if (!handler) return false;
      return handler(context);
    },
  };
}
