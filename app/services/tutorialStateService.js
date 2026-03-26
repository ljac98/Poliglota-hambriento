export function createTutorialState(step = 0) {
  return { active: true, step };
}

export function advanceTutorialState(currentState, totalSteps) {
  if (!currentState?.active) {
    return { type: 'noop', state: currentState };
  }

  const nextStep = (currentState.step ?? 0) + 1;
  if (nextStep >= totalSteps) {
    return { type: 'practice', state: null };
  }

  return {
    type: 'step',
    state: { ...currentState, step: nextStep },
  };
}

export function rewindTutorialState(currentState) {
  if (!currentState?.active) {
    return currentState;
  }

  return {
    ...currentState,
    step: Math.max(0, currentState.step ?? 0),
  };
}

