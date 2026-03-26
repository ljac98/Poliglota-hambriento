import { genBurger } from '../../game';

export function normalizeGameConfig(gameConfig) {
  if (!gameConfig || gameConfig.mode !== 'clon') return gameConfig;

  if (Array.isArray(gameConfig.sharedBurgers) && gameConfig.sharedBurgers.length > 0) {
    return {
      ...gameConfig,
      sharedBurgers: gameConfig.sharedBurgers.map((burger) => [...burger]),
    };
  }

  return {
    ...gameConfig,
    sharedBurgers: Array.from(
      { length: gameConfig.burgerCount },
      () => genBurger(gameConfig.ingredientCount, gameConfig.ingredientPool),
    ),
  };
}
