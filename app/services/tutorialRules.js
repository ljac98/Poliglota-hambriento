const TUTORIAL_ALLOWED_CARD_SELECTION_STEPS = new Set([1, 2, 6, 7, 8]);
const TUTORIAL_ALLOWED_PLAY_BUTTON_STEPS = new Set([1, 7, 8]);

export function getTutorialPermissions(tutorialActive, tutorialStep) {
  if (!tutorialActive) {
    return {
      canSelectCards: true,
      canUsePlayButton: true,
      canChangeHat: true,
      canAddHat: true,
      canNegate: true,
    };
  }

  return {
    canSelectCards: TUTORIAL_ALLOWED_CARD_SELECTION_STEPS.has(tutorialStep),
    canUsePlayButton: TUTORIAL_ALLOWED_PLAY_BUTTON_STEPS.has(tutorialStep),
    canChangeHat: tutorialStep === 3,
    canAddHat: tutorialStep === 4,
    canNegate: tutorialStep === 9,
  };
}

export function shouldAdvanceTutorialStep(tutorialActive, tutorialStep, actionType) {
  if (!tutorialActive) return false;

  return (
    (tutorialStep === 1 && actionType === 'ingredient') ||
    (tutorialStep === 3 && actionType === 'changeHat') ||
    (tutorialStep === 4 && actionType === 'addHat') ||
    (tutorialStep === 5 && actionType === 'passTurn') ||
    (tutorialStep === 6 && actionType === 'discard') ||
    (tutorialStep === 7 && actionType === 'wildcard') ||
    (tutorialStep === 8 && actionType === 'actionCard') ||
    (tutorialStep === 9 && actionType === 'negation')
  );
}
