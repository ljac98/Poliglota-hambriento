export function createActionEffectObserver({
  onComeComodines,
  onMilanesa,
  onEnsalada,
  onPizza,
  onParrilla,
  onGloton,
  onHatSteal,
  onFork,
}) {
  const massActionHandlers = {
    comecomodines: ({ result, actingIdx, actorName }) => onComeComodines?.(result, actingIdx, actorName),
    milanesa: ({ result }) => onMilanesa?.(result),
    ensalada: ({ result }) => onEnsalada?.(result),
    pizza: ({ result }) => onPizza?.(result),
    parrilla: ({ result }) => onParrilla?.(result),
  };

  return {
    publishMassAction(action, payload) {
      massActionHandlers[action]?.(payload);
    },

    publishGlotonEvent(payload) {
      onGloton?.(payload.actingIdx, payload.targetIdx, payload.targetTable, payload.actorName);
    },

    publishHatStealEvent(payload) {
      onHatSteal?.(payload.actingIdx, payload.targetIdx, payload.hatLang, payload.actorName);
    },

    publishForkEvent(payload) {
      onFork?.(payload);
    },
  };
}
