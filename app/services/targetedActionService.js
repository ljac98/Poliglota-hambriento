export function createTargetedActionService({
  advanceBurger,
  ingKey,
  uid,
  getTableSlotIndexForCurrentBurger,
  effectObserver,
  filterTable,
}) {
  return {
    apply({ card, actingIdx, targetIdx, action, players, discard, humanIdx }) {
      if (card.action === 'gloton') {
        effectObserver?.publishGlotonEvent({
          actingIdx,
          targetIdx,
          targetTable: [...players[targetIdx].table],
          actorName: players[actingIdx]?.name || 'Jugador',
        });
        players[targetIdx].table.forEach((ing) => discard.push({ type: 'ingredient', ingredient: ingKey(ing), id: uid() }));
        players[targetIdx].table = [];
        return { kind: 'resolved', players, discard };
      }

      if (card.action === 'tenedor' && action.ingIdx !== undefined) {
        const sourceSlotIdx = targetIdx === humanIdx ? getTableSlotIndexForCurrentBurger(players[targetIdx], action.ingIdx) : null;
        const stolen = players[targetIdx].table.splice(action.ingIdx, 1)[0];
        players[actingIdx].table.push(stolen);
        const { player: updatedPlayer, freed, done } = advanceBurger(players[actingIdx]);
        players[actingIdx] = updatedPlayer;
        if (done) {
          freed.forEach((ing) => discard.push({ type: 'ingredient', ingredient: ingKey(ing), id: uid() }));
        }
        effectObserver?.publishForkEvent({
          id: uid(),
          actingIdx,
          targetIdx,
          actorName: players[actingIdx]?.name || 'Oponente',
          ingredient: ingKey(stolen),
          stolenRaw: stolen,
          sourceIngIdx: action.ingIdx,
          sourceSlotIdx,
        });
        return { kind: 'resolved', players, discard };
      }

      if (card.action === 'ladron') {
        if (players[targetIdx].mainHats.length > 0) {
          const stealHat = action.hatLang && players[targetIdx].mainHats.includes(action.hatLang)
            ? action.hatLang
            : players[targetIdx].mainHats[0];
          const stealIdx = players[targetIdx].mainHats.indexOf(stealHat);
          const stolen = players[targetIdx].mainHats.splice(stealIdx, 1)[0];
          players[actingIdx].mainHats.push(stolen);
          effectObserver?.publishHatStealEvent({
            actingIdx,
            targetIdx,
            hatLang: stolen,
            actorName: players[actingIdx]?.name || 'Jugador',
          });
          if (players[targetIdx].mainHats.length > 0) {
            players[targetIdx].maxHand = Math.min(6, players[targetIdx].maxHand + 1);
          }
          if (players[targetIdx].mainHats.length === 0 && players[targetIdx].perchero.length > 0) {
            return {
              kind: 'needs_hat_replace',
              players,
              discard,
              victimIdx: targetIdx,
              fromIdx: actingIdx,
            };
          }
        }
        return { kind: 'resolved', players, discard };
      }

      if (card.action === 'intercambio_sombreros') {
        const myHat = action.myHat;
        const theirHat = action.theirHat;
        if (myHat && theirHat) {
          const myIdx = players[actingIdx].mainHats.indexOf(myHat);
          const targetHatIdx = players[targetIdx].mainHats.indexOf(theirHat);
          if (myIdx !== -1 && targetHatIdx !== -1) {
            players[actingIdx].mainHats.splice(myIdx, 1);
            players[targetIdx].mainHats.splice(targetHatIdx, 1);
            players[actingIdx].mainHats.push(theirHat);
            players[targetIdx].mainHats.push(myHat);
          }
        } else {
          const temp = players[actingIdx].mainHats[0];
          players[actingIdx].mainHats[0] = players[targetIdx].mainHats[0];
          players[targetIdx].mainHats[0] = temp;
        }
        return { kind: 'resolved', players, discard };
      }

      if (card.action === 'intercambio_hamburguesa') {
        const temp = players[actingIdx].table;
        players[actingIdx].table = players[targetIdx].table;
        players[targetIdx].table = temp;
        filterTable(players[actingIdx], discard);
        filterTable(players[targetIdx], discard);
        return { kind: 'resolved', players, discard };
      }

      if (card.action === 'perchero_cubierto') {
        return { kind: 'closet_cover', players, discard };
      }

      return null;
    },
  };
}
