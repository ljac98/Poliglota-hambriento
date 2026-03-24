import { uid } from '../../game/utils.js';

function ingredientCard(ingredient, language) {
  return { type: 'ingredient', ingredient, language, id: uid() };
}

function actionCard(action) {
  return { type: 'action', action, id: uid() };
}

function createPlayer({
  name,
  username = null,
  userId = null,
  avatarUrl = null,
  hand = [],
  mainHats = [],
  perchero = [],
  table = [],
  burgers = [],
  currentBurger = 0,
  maxHand = 6,
  isAI = false,
}) {
  return {
    name,
    username,
    userId,
    avatarUrl,
    hand,
    mainHats,
    manuallyAddedHats: [],
    perchero,
    table,
    burgers,
    totalBurgers: burgers.length,
    currentBurger,
    maxHand,
    closetCovered: false,
    won: false,
    isAI,
  };
}

const COPY = {
  es: {
    promptTitle: '¿Ya conoces Hungry Poly?',
    promptDesc: 'Si ya estás familiarizado con el juego, entras directo. Si no, te puedo preparar una partida guiada.',
    promptYes: 'Sí, ya sé jugar',
    promptNo: 'No todavía',
    offerTitle: '¿Quieres jugar el tutorial?',
    offerDesc: 'Te mostraremos una partida guiada con ejemplos de ingredientes, sombreros, perchero, acciones y negación.',
    offerYes: 'Sí, jugar tutorial',
    offerNo: 'No, aprenderé sobre la marcha',
    badge: 'Tutorial guiado',
    stepLabel: 'Paso',
    next: 'Siguiente',
    prev: 'Anterior',
    finish: 'Terminar tutorial',
    skip: 'Salir del tutorial',
    steps: [
      {
        title: 'Sombreros principales y perchero',
        body: 'Tus sombreros principales deciden en qué idiomas puedes jugar ingredientes. El perchero guarda los sombreros extra para cambiar o agregar.',
        bullets: [
          'Mira tus sombreros principales a la derecha.',
          'El perchero muestra los idiomas que todavía puedes mover a tu zona principal.',
        ],
        focus: { hats: true, closet: true },
      },
      {
        title: 'Ingrediente correcto y sombrero correcto',
        body: 'Aquí sí puedes jugar la lechuga porque tu hamburguesa la necesita y tu sombrero principal es español.',
        bullets: [
          'Las cartas jugables aparecen habilitadas.',
          'Si una carta coincide con el ingrediente faltante y con tu sombrero, la puedes bajar a la mesa.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Ingrediente correcto, sombrero incorrecto',
        body: 'Ahora el queso sí sirve para la hamburguesa, pero no lo puedes jugar porque solo tienes sombrero español y la carta está en inglés.',
        bullets: [
          'No basta con tener el ingrediente correcto.',
          'También necesitas un sombrero principal del idioma de esa carta.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Usar Cambiar sombrero',
        body: 'Cambiar toma un sombrero del perchero y reemplaza uno principal. Después de hacerlo, solo puedes jugar 1 ingrediente.',
        bullets: [
          'Úsalo cuando ya sabes qué idioma necesitas inmediatamente.',
          'Es la forma barata de abrir un idioma nuevo por un turno.',
        ],
        focus: { closet: true, changeButton: true, selectedCard: 0 },
      },
      {
        title: 'Usar Agregar sombrero',
        body: 'Agregar te deja conservar tu sombrero actual y sumar otro principal. A cambio, descartas tu mano y tu máximo de cartas baja.',
        bullets: [
          'Sirve cuando quieres mantener dos idiomas listos.',
          'Es más caro, pero te da más flexibilidad en turnos futuros.',
        ],
        focus: { closet: true, addButton: true, selectedCard: 1 },
      },
      {
        title: 'Cartas de acción',
        body: 'Las acciones cambian la partida: unas afectan a un jugador, otras a todos y otras interactúan con descarte o sombreros.',
        bullets: [
          'Tenedor roba ingredientes de otra mesa.',
          'Ladrón roba sombreros.',
          'Basurero recupera cartas del descarte.',
        ],
        focus: { selectedCard: 0, actionCards: true },
      },
      {
        title: 'Negación',
        body: 'La Negación no se juega como una acción normal en tu turno. Se usa para bloquear una acción enemiga cuando te afecta.',
        bullets: [
          'Guárdala para frenar una carta importante.',
          'Si una acción no afecta a otro jugador, no se puede negar.',
        ],
        focus: { selectedCard: 0, actionCards: true },
      },
      {
        title: 'Resumen final',
        body: 'Antes de terminar tu turno, revisa qué pide la hamburguesa, qué idiomas tienes activos y qué acciones conviene guardar.',
        bullets: [
          'Hamburguesa + idioma correcto = ingrediente jugable.',
          'Perchero = reserva de idiomas.',
          'Cambiar y Agregar te abren nuevas cartas.',
        ],
        focus: { hats: true, closet: true, actionCards: true },
      },
    ],
  },
  en: {
    promptTitle: 'Do you already know Hungry Poly?',
    promptDesc: 'If you already know the game, you can jump straight in. If not, I can prepare a guided tutorial match.',
    promptYes: 'Yes, I know it',
    promptNo: 'Not yet',
    offerTitle: 'Do you want to play the tutorial?',
    offerDesc: 'We will show you a guided match with examples of ingredients, hats, closet, action cards and negation.',
    offerYes: 'Yes, play tutorial',
    offerNo: 'No, I will learn on the go',
    badge: 'Guided tutorial',
    stepLabel: 'Step',
    next: 'Next',
    prev: 'Back',
    finish: 'Finish tutorial',
    skip: 'Exit tutorial',
    steps: [
      {
        title: 'Main hats and closet',
        body: 'Your main hats decide which card languages you can play. The closet stores extra hats you can change to or add.',
        bullets: [
          'Check your main hats on the right.',
          'The closet shows the extra languages you can still move into play.',
        ],
        focus: { hats: true, closet: true },
      },
      {
        title: 'Correct ingredient and correct hat',
        body: 'Here you can play lettuce because your burger needs it and your main hat is Spanish.',
        bullets: [
          'Playable cards stay enabled.',
          'A card must match both the missing ingredient and one of your main hats.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Correct ingredient, wrong hat',
        body: 'Now cheese is needed, but you still cannot play it because the card is in English and you only have a Spanish main hat.',
        bullets: [
          'Having the right ingredient is not enough.',
          'You also need a main hat matching that card language.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Using Change hat',
        body: 'Change takes a hat from the closet and replaces one main hat. After that, you may only play 1 ingredient.',
        bullets: [
          'Use it when you know exactly which language you need right now.',
          'It is the cheaper way to unlock a new language for the turn.',
        ],
        focus: { closet: true, changeButton: true, selectedCard: 0 },
      },
      {
        title: 'Using Add hat',
        body: 'Add lets you keep your current hat and add another main hat. In return, you discard your hand and lower your max hand size.',
        bullets: [
          'It is useful when you want two languages active at once.',
          'It costs more, but gives more flexibility later.',
        ],
        focus: { closet: true, addButton: true, selectedCard: 1 },
      },
      {
        title: 'Action cards',
        body: 'Action cards change the match: some affect one player, some affect everyone, and some interact with discard or hats.',
        bullets: [
          'Fork steals ingredients from another table.',
          'Thief steals hats.',
          'Trash Bin recovers cards from discard.',
        ],
        focus: { selectedCard: 0, actionCards: true },
      },
      {
        title: 'Negation',
        body: 'Negation is not played like a normal action on your turn. It is used to block an enemy action when it affects you.',
        bullets: [
          'Save it for important enemy actions.',
          'If an action does not affect another player, it cannot be negated.',
        ],
        focus: { selectedCard: 0, actionCards: true },
      },
      {
        title: 'Final recap',
        body: 'Before ending your turn, check what the burger needs, which languages are active, and which action cards are worth saving.',
        bullets: [
          'Burger need + matching hat = playable ingredient.',
          'Closet = language reserve.',
          'Change and Add unlock new cards.',
        ],
        focus: { hats: true, closet: true, actionCards: true },
      },
    ],
  },
};

export function getTutorialContent(uiLang = 'es') {
  return COPY[uiLang] || COPY.en;
}

export function buildTutorialScenario(step, { playerName = 'Jugador', user = null } = {}) {
  const playerMeta = {
    name: playerName,
    username: user?.username || null,
    userId: user?.id || null,
    avatarUrl: user?.avatarUrl || null,
  };
  const opponentMeta = {
    name: 'Chef Tutor',
    username: null,
    userId: null,
    avatarUrl: null,
  };

  const scenarios = [
    () => ({
      players: [
        createPlayer({
          ...playerMeta,
          hand: [
            ingredientCard('lechuga', 'español'),
            ingredientCard('queso', 'inglés'),
            actionCard('tenedor'),
            actionCard('negacion'),
          ],
          mainHats: ['español'],
          perchero: ['inglés', 'francés', 'italiano', 'alemán', 'portugués'],
          table: [],
          burgers: [['pan', 'lechuga', 'queso']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['inglés'],
          perchero: ['español', 'francés', 'italiano', 'alemán', 'portugués'],
          table: ['tomate'],
          burgers: [['pan', 'tomate', 'queso']],
        }),
      ],
      selectedIdx: null,
    }),
    () => ({
      players: [
        createPlayer({
          ...playerMeta,
          hand: [
            ingredientCard('lechuga', 'español'),
            ingredientCard('queso', 'inglés'),
            actionCard('tenedor'),
          ],
          mainHats: ['español'],
          perchero: ['inglés', 'francés', 'italiano', 'alemán', 'portugués'],
          table: [],
          burgers: [['pan', 'lechuga', 'queso']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['inglés'],
          perchero: ['español', 'francés', 'italiano', 'alemán', 'portugués'],
          table: ['tomate'],
          burgers: [['pan', 'tomate', 'queso']],
        }),
      ],
      selectedIdx: 0,
    }),
    () => ({
      players: [
        createPlayer({
          ...playerMeta,
          hand: [
            ingredientCard('queso', 'inglés'),
            ingredientCard('tomate', 'español'),
            actionCard('tenedor'),
          ],
          mainHats: ['español'],
          perchero: ['inglés', 'francés', 'italiano', 'alemán', 'portugués'],
          table: ['lechuga'],
          burgers: [['pan', 'lechuga', 'queso']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['inglés'],
          perchero: ['español', 'francés', 'italiano', 'alemán', 'portugués'],
          table: ['tomate'],
          burgers: [['pan', 'tomate', 'queso']],
        }),
      ],
      selectedIdx: 0,
    }),
    () => ({
      players: [
        createPlayer({
          ...playerMeta,
          hand: [
            ingredientCard('queso', 'inglés'),
            ingredientCard('pan', 'español'),
            ingredientCard('tomate', 'español'),
            actionCard('tenedor'),
          ],
          mainHats: ['español'],
          perchero: ['inglés', 'francés', 'italiano', 'alemán', 'portugués'],
          table: ['lechuga'],
          burgers: [['pan', 'lechuga', 'queso']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['inglés'],
          perchero: ['español', 'francés', 'italiano', 'alemán', 'portugués'],
          table: ['tomate'],
          burgers: [['pan', 'tomate', 'queso']],
        }),
      ],
      selectedIdx: 0,
    }),
    () => ({
      players: [
        createPlayer({
          ...playerMeta,
          hand: [
            ingredientCard('tomate', 'español'),
            ingredientCard('queso', 'inglés'),
            ingredientCard('pollo', 'inglés'),
            actionCard('tenedor'),
          ],
          mainHats: ['español'],
          perchero: ['inglés', 'francés', 'italiano', 'alemán', 'portugués'],
          table: ['pan'],
          burgers: [['pan', 'tomate', 'queso']],
          maxHand: 5,
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['francés'],
          perchero: ['español', 'inglés', 'italiano', 'alemán', 'portugués'],
          table: ['carne'],
          burgers: [['pan', 'carne', 'queso']],
        }),
      ],
      selectedIdx: 1,
    }),
    () => ({
      players: [
        createPlayer({
          ...playerMeta,
          hand: [
            actionCard('tenedor'),
            actionCard('ladron'),
            actionCard('basurero'),
          ],
          mainHats: ['español'],
          perchero: ['inglés', 'francés', 'italiano', 'alemán', 'portugués'],
          table: ['pan'],
          burgers: [['pan', 'tomate', 'queso']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['inglés'],
          perchero: ['español', 'francés', 'italiano', 'alemán', 'portugués'],
          table: ['tomate', 'queso'],
          burgers: [['pan', 'tomate', 'queso']],
        }),
      ],
      discard: [ingredientCard('lechuga', 'alemán'), ingredientCard('pollo', 'francés')],
      selectedIdx: 0,
    }),
    () => ({
      players: [
        createPlayer({
          ...playerMeta,
          hand: [
            actionCard('negacion'),
            actionCard('tenedor'),
            ingredientCard('queso', 'español'),
          ],
          mainHats: ['español'],
          perchero: ['inglés', 'francés', 'italiano', 'alemán', 'portugués'],
          table: ['pan'],
          burgers: [['pan', 'queso', 'tomate']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['inglés'],
          perchero: ['español', 'francés', 'italiano', 'alemán', 'portugués'],
          table: ['tomate'],
          burgers: [['pan', 'tomate', 'queso']],
        }),
      ],
      selectedIdx: 0,
    }),
    () => ({
      players: [
        createPlayer({
          ...playerMeta,
          hand: [
            ingredientCard('tomate', 'español'),
            ingredientCard('queso', 'inglés'),
            actionCard('tenedor'),
            actionCard('negacion'),
          ],
          mainHats: ['español'],
          perchero: ['inglés', 'francés', 'italiano', 'alemán', 'portugués'],
          table: ['pan'],
          burgers: [['pan', 'tomate', 'queso']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['inglés'],
          perchero: ['español', 'francés', 'italiano', 'alemán', 'portugués'],
          table: ['tomate', 'queso'],
          burgers: [['pan', 'tomate', 'queso']],
        }),
      ],
      selectedIdx: null,
    }),
  ];

  const makeScenario = scenarios[Math.max(0, Math.min(step, scenarios.length - 1))];
  const built = makeScenario();

  return {
    players: built.players,
    deck: [],
    discard: built.discard || [],
    cp: 0,
    extraPlay: false,
    selectedIdx: built.selectedIdx ?? null,
    gameConfig: {
      mode: 'clon',
      burgerCount: 1,
      ingredientCount: 3,
      ingredientPool: ['lechuga', 'tomate', 'queso', 'carne', 'pollo'],
      cloneWildcardsEnabled: true,
      sharedBurgers: [['pan', 'lechuga', 'queso']],
      tutorial: true,
    },
  };
}
