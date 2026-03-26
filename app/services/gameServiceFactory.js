import { createClosetCoverPolicy } from './closetCoverPolicy.js';
import { createTurnEngine } from './turnEngine.js';
import { createRemoteActionService } from './remoteActionService.js';
import { createTargetedActionService } from './targetedActionService.js';

export function createGameServices({
  getRemainingNeeds,
  getCardKeepScore,
  effectObserver,
  drawN,
  clonePlayers,
  checkWin,
  canPlayCard,
  advanceBurger,
  getIngName,
  ingEmoji,
  ingKey,
  uid,
  getTableSlotIndexForCurrentBurger,
  triggerGlotonEvent,
  triggerHatStealEvent,
  filterTable,
}) {
  const closetCoverPolicy = createClosetCoverPolicy({
    getRemainingNeeds,
    getCardKeepScore,
  });

  const turnEngine = createTurnEngine({
    drawN,
    clonePlayers,
    checkWin,
  });

  const remoteActionService = createRemoteActionService({
    canPlayCard,
    advanceBurger,
    drawN,
    getIngName,
    ingEmoji,
    ingKey,
    uid,
  });

  const targetedActionService = createTargetedActionService({
    advanceBurger,
    ingKey,
    uid,
    getTableSlotIndexForCurrentBurger,
    effectObserver,
    filterTable,
  });

  return {
    closetCoverPolicy,
    turnEngine,
    remoteActionService,
    targetedActionService,
  };
}
