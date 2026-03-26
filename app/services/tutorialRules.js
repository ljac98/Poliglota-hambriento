const TUTORIAL_ALLOWED_CARD_SELECTION_STEPS = new Set([2, 3, 6, 7, 8]);
const TUTORIAL_ALLOWED_PLAY_BUTTON_STEPS = new Set([2, 6, 7, 8]);

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
    canChangeHat: tutorialStep === 4,
    canAddHat: tutorialStep === 5,
    canNegate: tutorialStep === 9,
  };
}

export function shouldAdvanceTutorialStep(tutorialActive, tutorialStep, actionType) {
  if (!tutorialActive) return false;

  return (
    (tutorialStep === 2 && actionType === 'ingredient') ||
    (tutorialStep === 4 && actionType === 'changeHat') ||
    (tutorialStep === 5 && actionType === 'addHat') ||
    (tutorialStep === 6 && actionType === 'discard') ||
    (tutorialStep === 7 && actionType === 'wildcard') ||
    (tutorialStep === 8 && actionType === 'actionCard') ||
    (tutorialStep === 9 && actionType === 'negation')
  );
}
