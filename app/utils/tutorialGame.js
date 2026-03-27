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
    ingredientTag: 'Ingrediente',
    stepLabel: 'Paso',
    next: 'Siguiente',
    prev: 'Anterior',
    finish: 'Terminar tutorial',
    skip: 'Salir del tutorial',
    tutorialWin: '¡Felicidades, completaste el tutorial!',
    addHatCostInfo: 'Este es el costo de agregar sombreros: se descarta toda tu mano y tu máximo de cartas se reduce en 1.',
    practiceObjective: 'Objetivo: completar una hamburguesa.',
    steps: [
      {
        title: 'Objetivo del juego',
        body: 'El objetivo del juego es ser el primero en completar su hamburguesa jugando ingredientes de tu mano.',
        bullets: [
          'La hamburguesa objetivo te muestra lo que necesitas completar.',
          'La carta seleccionada es una carta de ingrediente que puedes usar para avanzar.',
        ],
        focus: { table: true, selectedCard: 0, ingredientLabel: true },
      },
      {
        title: 'Jugar un ingrediente',
        body: 'Para jugar un ingrediente, la carta tiene que ser parte de tu objetivo y el sombrero de la carta debe coincidir con tu sombrero principal.',
        bullets: [
          'No basta con que la carta tenga el ingrediente correcto.',
          'El sombrero de la carta debe coincidir con tu sombrero principal.',
        ],
        focus: { mainHat: true, selectedCard: 0, ingredientLabel: true },
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
          'Si tras cambiar no puedes jugar nada, aparece el botón Pasar turno para terminar.',
        ],
        focus: { closet: true, changeButton: true, selectedCard: 0 },
      },
      {
        title: 'Usar Agregar sombrero',
        body: 'Agregar te deja conservar tu sombrero actual y sumar otro principal. A cambio, descartas tu mano y tu máximo de cartas baja.',
        bullets: [
          'Sirve cuando quieres mantener dos idiomas listos.',
          'Es más caro, pero te da más flexibilidad en turnos futuros.',
          'Al agregar, se descarta toda tu mano y tu máximo de cartas baja en 1. Ese es el costo.',
          'Si tras agregar o cambiar sombrero no puedes jugar nada, usa el botón Pasar turno.',
        ],
        focus: { closet: true, addButton: true, selectedCard: 1 },
      },
      {
        title: 'Pasar turno',
        body: 'Despues de agregar sombrero, la mano nueva no siempre te ayuda. Aqui veras que tu mano anterior se descarto, tu maximo bajo en 1 y no tienes cartas utiles para este objetivo.',
        bullets: [
          'Agregar descarta toda tu mano anterior.',
          'Tu maximo de mano baja en 1 y ese cambio se mantiene.',
          'Si no puedes jugar nada despues de cambiar o agregar, usa Pasar turno.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Descartar',
        body: 'Además de jugar una carta, otra opción en tu turno es descartarla. Selecciona una carta y usa el botón Descartar.',
        bullets: [
          'Descartar es una acción alternativa: en vez de jugar la carta, la envías al descarte.',
          'Es útil cuando no tienes cartas jugables o prefieres deshacerte de algo.',
          'Selecciona una carta y presiona Descartar.',
        ],
        focus: { selectedCard: 0, discardButton: true },
      },
      {
        title: 'Comodines',
        body: 'El comodín (perrito) es un ingrediente especial que puede sustituir cualquier ingrediente que te falte. Solo necesitas tener el sombrero del idioma de la carta.',
        bullets: [
          'Selecciona el comodín y juégalo.',
          'Elige qué ingrediente quieres que represente.',
          'Es muy flexible, pero sigue necesitando un sombrero del idioma correcto.',
        ],
        focus: { selectedCard: 0 },
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
        title: 'Probemos lo aprendido',
        body: 'Ahora jugarás una partida real contra la IA. Usa todo lo que aprendiste para ganar.',
        bullets: [
          'Objetivo: completar una hamburguesa.',
          'Usa ingredientes, sombreros, acciones y negación.',
          'Completa tu hamburguesa para ganar.',
        ],
        focus: {},
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
    ingredientTag: 'Ingredient',
    stepLabel: 'Step',
    next: 'Next',
    prev: 'Back',
    finish: 'Finish tutorial',
    skip: 'Exit tutorial',
    tutorialWin: 'Congratulations, you completed the tutorial!',
    addHatCostInfo: 'This is the cost of adding hats: your entire hand is discarded and your max hand size is reduced by 1.',
    practiceObjective: 'Goal: complete a burger.',
    steps: [
      {
        title: 'Game objective',
        body: 'The goal of the game is to be the first player to complete your burger by playing ingredients from your hand.',
        bullets: [
          'The target burger shows what you still need to complete.',
          'The selected card is an ingredient card you can use to move forward.',
        ],
        focus: { table: true, selectedCard: 0, ingredientLabel: true },
      },
      {
        title: 'Play an ingredient',
        body: 'To play an ingredient, the card must be part of your target and the hat on the card must match your main hat.',
        bullets: [
          'It is not enough for the card to have the right ingredient.',
          'The hat on the card must match your main hat.',
        ],
        focus: { mainHat: true, selectedCard: 0, ingredientLabel: true },
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
          'If you cannot play anything after changing, the Skip Turn button appears to end your turn.',
        ],
        focus: { closet: true, changeButton: true, selectedCard: 0 },
      },
      {
        title: 'Using Add hat',
        body: 'Add lets you keep your current hat and add another main hat. In return, you discard your hand and lower your max hand size.',
        bullets: [
          'It is useful when you want two languages active at once.',
          'It costs more, but gives more flexibility later.',
          'Adding discards your entire hand and reduces your max hand by 1. That is the cost.',
          'If you cannot play anything after adding or changing a hat, use the Skip Turn button.',
        ],
        focus: { closet: true, addButton: true, selectedCard: 1 },
      },
      {
        title: 'Skip turn',
        body: 'After adding a hat, your new hand will not always help. Here you can see that your previous hand was discarded, your max hand was reduced by 1, and none of these cards help this burger.',
        bullets: [
          'Add discards your entire previous hand.',
          'Your max hand goes down by 1 and stays that way.',
          'If you cannot play anything after changing or adding a hat, use Skip Turn.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Discard',
        body: 'Besides playing a card, another option on your turn is to discard it. Select a card and use the Discard button.',
        bullets: [
          'Discarding is an alternative action: instead of playing a card, you send it to the discard pile.',
          'It is useful when you have no playable cards or want to get rid of something.',
          'Select a card and press Discard.',
        ],
        focus: { selectedCard: 0, discardButton: true },
      },
      {
        title: 'Wildcards',
        body: 'The wildcard (hot dog) is a special ingredient that can substitute any missing ingredient. You only need a hat matching the card language.',
        bullets: [
          'Select the wildcard and play it.',
          'Choose which ingredient it will represent.',
          'It is very flexible, but still requires a hat in the right language.',
        ],
        focus: { selectedCard: 0 },
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
        title: "Let's practice!",
        body: 'Now you will play a real match against the AI. Use everything you learned to win.',
        bullets: [
          'Goal: complete a burger.',
          'Use ingredients, hats, actions and negation.',
          'Complete your burger to win.',
        ],
        focus: {},
      },
    ],
  },
  fr: {
    promptTitle: 'Connais-tu deja Hungry Poly ?',
    promptDesc: 'Si tu connais deja le jeu, tu peux entrer directement. Sinon, je peux te preparer une partie tutoriel guidee.',
    promptYes: 'Oui, je sais jouer',
    promptNo: 'Pas encore',
    offerTitle: 'Veux-tu jouer le tutoriel ?',
    offerDesc: 'Nous allons te montrer une partie guidee avec des exemples d ingredients, de chapeaux, de placard, de cartes action et de negation.',
    offerYes: 'Oui, jouer le tutoriel',
    offerNo: 'Non, j apprendrai en jouant',
    badge: 'Tutoriel guide',
    ingredientTag: 'Ingredient',
    stepLabel: 'Etape',
    next: 'Suivant',
    prev: 'Retour',
    finish: 'Terminer le tutoriel',
    skip: 'Quitter le tutoriel',
    tutorialWin: 'Félicitations, tu as terminé le tutoriel !',
    addHatCostInfo: 'Voici le coût d ajouter des chapeaux : toute ta main est défaussée et ton maximum de cartes diminue de 1.',
    practiceObjective: 'Objectif : compléter un burger.',
    steps: [
      {
        title: 'Objectif du jeu',
        body: 'Le but du jeu est d etre le premier a completer ton burger en jouant des ingredients de ta main.',
        bullets: [
          'Le burger objectif te montre ce qu il te manque pour le completer.',
          'La carte selectionnee est une carte ingredient que tu peux utiliser pour avancer.',
        ],
        focus: { table: true, selectedCard: 0, ingredientLabel: true },
      },
      {
        title: 'Jouer un ingredient',
        body: 'Pour jouer un ingredient, la carte doit faire partie de ton objectif et le chapeau de la carte doit correspondre a ton chapeau principal.',
        bullets: [
          'Il ne suffit pas que la carte ait le bon ingredient.',
          'Le chapeau de la carte doit correspondre a ton chapeau principal.',
        ],
        focus: { mainHat: true, selectedCard: 0, ingredientLabel: true },
      },
      {
        title: 'Ingredient correct et bon chapeau',
        body: 'Ici tu peux jouer la laitue parce que ton burger en a besoin et que ton chapeau principal est en espagnol.',
        bullets: [
          'Les cartes jouables restent activees.',
          'Une carte doit correspondre a l ingredient manquant et a l un de tes chapeaux principaux.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Ingredient correct, mauvais chapeau',
        body: 'Maintenant le fromage est necessaire, mais tu ne peux toujours pas le jouer parce que la carte est en anglais et que tu n as qu un chapeau principal espagnol.',
        bullets: [
          'Avoir le bon ingredient ne suffit pas.',
          'Il te faut aussi un chapeau principal dans la langue de cette carte.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Utiliser Echanger',
        body: 'Echanger prend un chapeau du placard et remplace un chapeau principal. Ensuite, tu ne peux jouer qu un seul ingredient.',
        bullets: [
          'Utilise-le quand tu sais exactement quelle langue il te faut tout de suite.',
          'C est la facon la moins couteuse d ouvrir une nouvelle langue pour ce tour.',
          'Si tu ne peux rien jouer apres avoir change, le bouton Passer le tour apparait pour terminer ton tour.',
        ],
        focus: { closet: true, changeButton: true, selectedCard: 0 },
      },
      {
        title: 'Utiliser Ajouter',
        body: 'Ajouter te permet de garder ton chapeau actuel et d ajouter un autre chapeau principal. En echange, tu defausses ta main et ton maximum de cartes baisse.',
        bullets: [
          'C est utile quand tu veux garder deux langues actives en meme temps.',
          'C est plus couteux, mais cela donne plus de flexibilite pour les prochains tours.',
          'Ajouter defausse toute ta main et reduit ton maximum de cartes de 1. C est le cout.',
          'Si tu ne peux rien jouer apres avoir ajoute ou change de chapeau, utilise le bouton Passer le tour.',
        ],
        focus: { closet: true, addButton: true, selectedCard: 1 },
      },
      {
        title: 'Passer le tour',
        body: 'Apres avoir ajoute un chapeau, ta nouvelle main ne t aide pas toujours. Ici tu vois que ton ancienne main a ete defaussee, que ton maximum a baisse de 1 et qu aucune de ces cartes ne sert a cet objectif.',
        bullets: [
          'Ajouter defausse toute ta main precedente.',
          'Ton maximum de main baisse de 1 et cela reste ainsi.',
          'Si tu ne peux rien jouer apres avoir ajoute ou change de chapeau, utilise Passer le tour.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Defausser',
        body: 'En plus de jouer une carte, une autre option pendant ton tour est de la defausser. Selectionne une carte et utilise le bouton Defausser.',
        bullets: [
          'Defausser est une action alternative : au lieu de jouer une carte, tu l envoies a la defausse.',
          'C est utile quand tu n as pas de cartes jouables ou que tu veux te debarrasser de quelque chose.',
          'Selectionne une carte et appuie sur Defausser.',
        ],
        focus: { selectedCard: 0, discardButton: true },
      },
      {
        title: 'Jokers',
        body: 'Le joker (hot-dog) est un ingredient special qui peut remplacer n importe quel ingredient manquant. Il suffit d avoir un chapeau dans la langue de la carte.',
        bullets: [
          'Selectionne le joker et joue-le.',
          'Choisis quel ingredient il representera.',
          'Tres flexible, mais il faut quand meme un chapeau dans la bonne langue.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Cartes action',
        body: 'Les cartes action changent la partie : certaines affectent un joueur, d autres tout le monde, et d autres encore interagissent avec la defausse ou les chapeaux.',
        bullets: [
          'Fourchette vole des ingredients d une autre table.',
          'Voleur vole des chapeaux.',
          'Poubelle recupere des cartes de la defausse.',
        ],
        focus: { selectedCard: 0, actionCards: true },
      },
      {
        title: 'Negation',
        body: 'La Negation ne se joue pas comme une carte action normale pendant ton tour. Elle sert a bloquer une action ennemie quand elle t affecte.',
        bullets: [
          'Garde-la pour arreter une action importante.',
          'Si une action n affecte pas un autre joueur, elle ne peut pas etre niee.',
        ],
        focus: { selectedCard: 0, actionCards: true },
      },
      {
        title: 'Pratiquons !',
        body: 'Tu vas maintenant jouer une vraie partie contre l IA. Utilise tout ce que tu as appris pour gagner.',
        bullets: [
          'Objectif : completer un burger.',
          'Utilise ingredients, chapeaux, actions et negation.',
          'Complete ton burger pour gagner.',
        ],
        focus: {},
      },
    ],
  },
  it: {
    promptTitle: 'Conosci gia Hungry Poly?',
    promptDesc: 'Se conosci gia il gioco, entri subito. Altrimenti posso prepararti una partita tutorial guidata.',
    promptYes: 'Si, so gia giocare',
    promptNo: 'Non ancora',
    offerTitle: 'Vuoi giocare il tutorial?',
    offerDesc: 'Ti mostreremo una partita guidata con esempi di ingredienti, cappelli, armadio, carte azione e negazione.',
    offerYes: 'Si, gioca il tutorial',
    offerNo: 'No, imparero giocando',
    badge: 'Tutorial guidato',
    ingredientTag: 'Ingrediente',
    stepLabel: 'Passo',
    next: 'Avanti',
    prev: 'Indietro',
    finish: 'Termina tutorial',
    skip: 'Esci dal tutorial',
    tutorialWin: 'Congratulazioni, hai completato il tutorial!',
    addHatCostInfo: 'Questo e il costo di aggiungere cappelli: tutta la mano viene scartata e il massimo di carte si riduce di 1.',
    practiceObjective: 'Obiettivo: completare un hamburger.',
    steps: [
      {
        title: 'Obiettivo del gioco',
        body: 'L obiettivo del gioco e essere il primo a completare il tuo hamburger giocando ingredienti dalla tua mano.',
        bullets: [
          'L hamburger obiettivo mostra cosa ti manca per completarlo.',
          'La carta selezionata e una carta ingrediente che puoi usare per avanzare.',
        ],
        focus: { table: true, selectedCard: 0, ingredientLabel: true },
      },
      {
        title: 'Giocare un ingrediente',
        body: 'Per giocare un ingrediente, la carta deve far parte del tuo obiettivo e il cappello della carta deve corrispondere al tuo cappello principale.',
        bullets: [
          'Non basta che la carta abbia l ingrediente giusto.',
          'Il cappello della carta deve corrispondere al tuo cappello principale.',
        ],
        focus: { mainHat: true, selectedCard: 0, ingredientLabel: true },
      },
      {
        title: 'Ingrediente corretto e cappello corretto',
        body: 'Qui puoi giocare la lattuga perche il tuo hamburger ne ha bisogno e il tuo cappello principale e spagnolo.',
        bullets: [
          'Le carte giocabili restano abilitate.',
          'Una carta deve combaciare sia con l ingrediente mancante sia con uno dei tuoi cappelli principali.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Ingrediente corretto, cappello sbagliato',
        body: 'Ora il formaggio serve, ma non puoi ancora giocarlo perche la carta e in inglese e tu hai solo un cappello principale spagnolo.',
        bullets: [
          'Avere l ingrediente giusto non basta.',
          'Ti serve anche un cappello principale nella lingua di quella carta.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Usare Cambia',
        body: 'Cambia prende un cappello dall armadio e sostituisce un cappello principale. Dopo questo, puoi giocare solo 1 ingrediente.',
        bullets: [
          'Usalo quando sai esattamente quale lingua ti serve subito.',
          'E il modo piu economico per sbloccare una nuova lingua in quel turno.',
          'Se non puoi giocare nulla dopo aver cambiato, appare il pulsante Passa turno per terminare.',
        ],
        focus: { closet: true, changeButton: true, selectedCard: 0 },
      },
      {
        title: 'Usare Aggiungi',
        body: 'Aggiungi ti permette di mantenere il cappello attuale e aggiungerne un altro principale. In cambio, scarti la mano e il tuo massimo di carte si riduce.',
        bullets: [
          'Serve quando vuoi tenere attive due lingue allo stesso tempo.',
          'Costa di piu, ma ti da piu flessibilita nei turni futuri.',
          'Aggiungere scarta tutta la mano e riduce il massimo di carte di 1. Questo e il costo.',
          'Se non puoi giocare nulla dopo aver aggiunto o cambiato cappello, usa il pulsante Passa turno.',
        ],
        focus: { closet: true, addButton: true, selectedCard: 1 },
      },
      {
        title: 'Passa turno',
        body: 'Dopo aver aggiunto un cappello, la nuova mano non sempre aiuta. Qui vedi che la mano precedente e stata scartata, il massimo e sceso di 1 e nessuna di queste carte aiuta questo obiettivo.',
        bullets: [
          'Aggiungi scarta tutta la mano precedente.',
          'Il tuo massimo di mano scende di 1 e resta cosi.',
          'Se non puoi giocare nulla dopo aver aggiunto o cambiato cappello, usa Passa turno.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Scartare',
        body: 'Oltre a giocare una carta, un altra opzione nel tuo turno e scartarla. Seleziona una carta e usa il pulsante Scarta.',
        bullets: [
          'Scartare e un azione alternativa: invece di giocare una carta, la mandi nella pila degli scarti.',
          'E utile quando non hai carte giocabili o vuoi liberarti di qualcosa.',
          'Seleziona una carta e premi Scarta.',
        ],
        focus: { selectedCard: 0, discardButton: true },
      },
      {
        title: 'Jolly',
        body: 'Il jolly (hot dog) e un ingrediente speciale che puo sostituire qualsiasi ingrediente mancante. Basta avere un cappello nella lingua della carta.',
        bullets: [
          'Seleziona il jolly e giocalo.',
          'Scegli quale ingrediente rappresentera.',
          'Molto flessibile, ma serve comunque un cappello nella lingua giusta.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Carte azione',
        body: 'Le carte azione cambiano la partita: alcune colpiscono un giocatore, altre tutti, e altre ancora interagiscono con la pila degli scarti o con i cappelli.',
        bullets: [
          'Forchetta ruba ingredienti da un altro tavolo.',
          'Ladro ruba cappelli.',
          'Pattumiera recupera carte dagli scarti.',
        ],
        focus: { selectedCard: 0, actionCards: true },
      },
      {
        title: 'Negazione',
        body: 'La Negazione non si gioca come una normale carta azione nel tuo turno. Si usa per bloccare un azione nemica quando ti colpisce.',
        bullets: [
          'Conservala per fermare una carta importante.',
          'Se un azione non colpisce un altro giocatore, non puo essere negata.',
        ],
        focus: { selectedCard: 0, actionCards: true },
      },
      {
        title: 'Mettiamo in pratica!',
        body: 'Ora giocherai una partita vera contro l IA. Usa tutto quello che hai imparato per vincere.',
        bullets: [
          'Obiettivo: completare un hamburger.',
          'Usa ingredienti, cappelli, azioni e negazione.',
          'Completa il tuo hamburger per vincere.',
        ],
        focus: {},
      },
    ],
  },
  de: {
    promptTitle: 'Kennst du Hungry Poly schon?',
    promptDesc: 'Wenn du das Spiel schon kennst, kannst du direkt loslegen. Wenn nicht, kann ich eine gefuhrte Tutorial-Partie fur dich vorbereiten.',
    promptYes: 'Ja, ich kenne es',
    promptNo: 'Noch nicht',
    offerTitle: 'Mochtest du das Tutorial spielen?',
    offerDesc: 'Wir zeigen dir eine gefuhrte Partie mit Beispielen zu Zutaten, Huten, Schrank, Aktionskarten und Negation.',
    offerYes: 'Ja, Tutorial spielen',
    offerNo: 'Nein, ich lerne unterwegs',
    badge: 'Gefuhrtes Tutorial',
    ingredientTag: 'Zutat',
    stepLabel: 'Schritt',
    next: 'Weiter',
    prev: 'Zuruck',
    finish: 'Tutorial beenden',
    skip: 'Tutorial verlassen',
    tutorialWin: 'Herzlichen Gluckwunsch, du hast das Tutorial abgeschlossen!',
    addHatCostInfo: 'Das sind die Kosten fur das Hinzufugen von Huten: Deine gesamte Hand wird abgeworfen und dein Handlimit sinkt um 1.',
    practiceObjective: 'Ziel: einen Burger vervollstandigen.',
    steps: [
      {
        title: 'Spielziel',
        body: 'Das Ziel des Spiels ist es, als erster deinen Burger zu vervollstandigen, indem du Zutaten aus deiner Hand spielst.',
        bullets: [
          'Der Ziel-Burger zeigt dir, was dir noch zum Fertigstellen fehlt.',
          'Die ausgewahlte Karte ist eine Zutatenkarte, mit der du vorankommst.',
        ],
        focus: { table: true, selectedCard: 0, ingredientLabel: true },
      },
      {
        title: 'Eine Zutat spielen',
        body: 'Um eine Zutat zu spielen, muss die Karte Teil deines Ziels sein und der Hut auf der Karte muss zu deinem Haupthut passen.',
        bullets: [
          'Es reicht nicht, dass die Karte nur die richtige Zutat hat.',
          'Der Hut auf der Karte muss zu deinem Haupthut passen.',
        ],
        focus: { mainHat: true, selectedCard: 0, ingredientLabel: true },
      },
      {
        title: 'Richtige Zutat und richtiger Hut',
        body: 'Hier kannst du Salat spielen, weil dein Burger ihn braucht und dein Haupthut Spanisch ist.',
        bullets: [
          'Spielbare Karten bleiben aktiviert.',
          'Eine Karte muss sowohl zur fehlenden Zutat als auch zu einem deiner Haupthute passen.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Richtige Zutat, falscher Hut',
        body: 'Jetzt wird Kase benotigt, aber du kannst ihn trotzdem nicht spielen, weil die Karte auf Englisch ist und du nur einen spanischen Haupthut hast.',
        bullets: [
          'Die richtige Zutat allein reicht nicht aus.',
          'Du brauchst auch einen Haupthut in der Sprache dieser Karte.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Hut wechseln benutzen',
        body: 'Wechseln nimmt einen Hut aus dem Schrank und ersetzt einen Haupthut. Danach darfst du nur noch 1 Zutat spielen.',
        bullets: [
          'Nutze es, wenn du genau weisst, welche Sprache du sofort brauchst.',
          'Das ist die gunstigste Art, fur diesen Zug eine neue Sprache freizuschalten.',
          'Wenn du nach dem Wechsel nichts spielen kannst, erscheint der Zug-passen-Button.',
        ],
        focus: { closet: true, changeButton: true, selectedCard: 0 },
      },
      {
        title: 'Hut hinzufugen benutzen',
        body: 'Hinzufugen lasst dich deinen aktuellen Hut behalten und einen weiteren Haupthut dazunehmen. Dafur wirfst du deine Hand ab und dein Handlimit sinkt.',
        bullets: [
          'Das ist stark, wenn du zwei Sprachen gleichzeitig aktiv haben willst.',
          'Es kostet mehr, gibt dir aber mehr Flexibilitat fur spatere Zuge.',
          'Hinzufugen wirft deine gesamte Hand ab und senkt dein Handlimit um 1. Das sind die Kosten.',
          'Wenn du nach dem Hinzufugen oder Wechseln nichts spielen kannst, benutze den Zug-passen-Button.',
        ],
        focus: { closet: true, addButton: true, selectedCard: 1 },
      },
      {
        title: 'Zug passen',
        body: 'Nach dem Hinzufugen eines Hutes hilft dir die neue Hand nicht immer. Hier siehst du, dass deine vorherige Hand abgeworfen wurde, dein Handlimit um 1 gesunken ist und keine dieser Karten diesem Ziel hilft.',
        bullets: [
          'Hinzufugen wirft deine gesamte vorherige Hand ab.',
          'Dein Handlimit sinkt um 1 und bleibt so.',
          'Wenn du nach dem Hinzufugen oder Wechseln nichts spielen kannst, nutze Zug passen.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Abwerfen',
        body: 'Neben dem Spielen einer Karte ist eine weitere Option in deinem Zug, sie abzuwerfen. Wahle eine Karte und benutze den Abwerfen-Button.',
        bullets: [
          'Abwerfen ist eine alternative Aktion: statt eine Karte zu spielen, schickst du sie auf den Ablagestapel.',
          'Nutzlich wenn du keine spielbaren Karten hast oder etwas loswerden willst.',
          'Wahle eine Karte und drucke Abwerfen.',
        ],
        focus: { selectedCard: 0, discardButton: true },
      },
      {
        title: 'Joker',
        body: 'Der Joker (Hot Dog) ist eine spezielle Zutat, die jede fehlende Zutat ersetzen kann. Du brauchst nur einen Hut in der Sprache der Karte.',
        bullets: [
          'Wahle den Joker aus und spiele ihn.',
          'Bestimme, welche Zutat er darstellen soll.',
          'Sehr flexibel, aber er braucht trotzdem einen Hut in der richtigen Sprache.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Aktionskarten',
        body: 'Aktionskarten verandern die Partie: einige betreffen einen Spieler, andere alle, und wieder andere interagieren mit Ablagestapel oder Huten.',
        bullets: [
          'Gabel stiehlt Zutaten von einem anderen Tisch.',
          'Dieb stiehlt Hute.',
          'Mulleimer holt Karten aus dem Ablagestapel zuruck.',
        ],
        focus: { selectedCard: 0, actionCards: true },
      },
      {
        title: 'Negation',
        body: 'Negation wird nicht wie eine normale Aktionskarte in deinem Zug gespielt. Sie wird benutzt, um eine gegnerische Aktion zu blockieren, wenn sie dich betrifft.',
        bullets: [
          'Heb sie fur eine wichtige gegnerische Karte auf.',
          'Wenn eine Aktion keinen anderen Spieler betrifft, kann sie nicht negiert werden.',
        ],
        focus: { selectedCard: 0, actionCards: true },
      },
      {
        title: 'Lass uns uben!',
        body: 'Jetzt spielst du eine echte Partie gegen die KI. Nutze alles, was du gelernt hast, um zu gewinnen.',
        bullets: [
          'Ziel: einen Burger vervollstandigen.',
          'Nutze Zutaten, Hute, Aktionen und Negation.',
          'Vervollstandige deinen Burger, um zu gewinnen.',
        ],
        focus: {},
      },
    ],
  },
  pt: {
    promptTitle: 'Ja conheces Hungry Poly?',
    promptDesc: 'Se ja conheces o jogo, entras direto. Se nao, posso preparar uma partida tutorial guiada.',
    promptYes: 'Sim, ja sei jogar',
    promptNo: 'Ainda nao',
    offerTitle: 'Queres jogar o tutorial?',
    offerDesc: 'Vamos mostrar uma partida guiada com exemplos de ingredientes, chapeus, armario, cartas de acao e negacao.',
    offerYes: 'Sim, jogar tutorial',
    offerNo: 'Nao, vou aprender jogando',
    badge: 'Tutorial guiado',
    ingredientTag: 'Ingrediente',
    stepLabel: 'Passo',
    next: 'Seguinte',
    prev: 'Voltar',
    finish: 'Terminar tutorial',
    skip: 'Sair do tutorial',
    tutorialWin: 'Parabens, completaste o tutorial!',
    addHatCostInfo: 'Este e o custo de adicionar chapeus: toda a tua mao e descartada e o maximo de cartas diminui em 1.',
    practiceObjective: 'Objetivo: completar um hamburguer.',
    steps: [
      {
        title: 'Objetivo do jogo',
        body: 'O objetivo do jogo e ser o primeiro a completar o teu hamburguer jogando ingredientes da tua mao.',
        bullets: [
          'O hamburguer objetivo mostra o que ainda precisas para completar.',
          'A carta selecionada e uma carta de ingrediente que podes usar para avancar.',
        ],
        focus: { table: true, selectedCard: 0, ingredientLabel: true },
      },
      {
        title: 'Jogar um ingrediente',
        body: 'Para jogar um ingrediente, a carta tem de fazer parte do teu objetivo e o chapeu da carta tem de coincidir com o teu chapeu principal.',
        bullets: [
          'Nao basta a carta ter o ingrediente certo.',
          'O chapeu da carta tem de coincidir com o teu chapeu principal.',
        ],
        focus: { mainHat: true, selectedCard: 0, ingredientLabel: true },
      },
      {
        title: 'Ingrediente correto e chapeu correto',
        body: 'Aqui podes jogar alface porque o teu hamburguer precisa dela e o teu chapeu principal e espanhol.',
        bullets: [
          'As cartas jogaveis ficam ativas.',
          'Uma carta tem de combinar com o ingrediente em falta e com um dos teus chapeus principais.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Ingrediente correto, chapeu errado',
        body: 'Agora o queijo e necessario, mas ainda nao o podes jogar porque a carta esta em ingles e so tens um chapeu principal em espanhol.',
        bullets: [
          'Ter o ingrediente certo nao basta.',
          'Tambem precisas de um chapeu principal na lingua dessa carta.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Usar Trocar',
        body: 'Trocar pega um chapeu do armario e substitui um chapeu principal. Depois disso, so podes jogar 1 ingrediente.',
        bullets: [
          'Usa quando sabes exatamente de que lingua precisas naquele momento.',
          'E a forma mais barata de desbloquear uma nova lingua nesse turno.',
          'Se nao puderes jogar nada apos trocar, aparece o botao Passar vez para terminar.',
        ],
        focus: { closet: true, changeButton: true, selectedCard: 0 },
      },
      {
        title: 'Usar Adicionar',
        body: 'Adicionar permite-te manter o teu chapeu atual e somar outro chapeu principal. Em troca, descartas a mao e o teu maximo de cartas diminui.',
        bullets: [
          'Serve quando queres manter duas linguas ativas ao mesmo tempo.',
          'Custa mais, mas da-te mais flexibilidade nos turnos seguintes.',
          'Adicionar descarta toda a tua mao e reduz o maximo de cartas em 1. Esse e o custo.',
          'Se nao puderes jogar nada apos adicionar ou trocar chapeu, usa o botao Passar vez.',
        ],
        focus: { closet: true, addButton: true, selectedCard: 1 },
      },
      {
        title: 'Passar turno',
        body: 'Depois de adicionar um chapeu, a nova mao nem sempre ajuda. Aqui ves que a tua mao anterior foi descartada, o teu maximo baixou em 1 e nenhuma destas cartas ajuda neste objetivo.',
        bullets: [
          'Adicionar descarta toda a tua mao anterior.',
          'O teu maximo de mao baixa em 1 e fica assim.',
          'Se nao podes jogar nada depois de adicionar ou trocar chapeu, usa Passar turno.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Descartar',
        body: 'Alem de jogar uma carta, outra opcao no teu turno e descarta-la. Seleciona uma carta e usa o botao Descartar.',
        bullets: [
          'Descartar e uma acao alternativa: em vez de jogar uma carta, envias para o descarte.',
          'E util quando nao tens cartas jogaveis ou queres livrar-te de algo.',
          'Seleciona uma carta e carrega em Descartar.',
        ],
        focus: { selectedCard: 0, discardButton: true },
      },
      {
        title: 'Coringas',
        body: 'O coringa (cachorro-quente) e um ingrediente especial que pode substituir qualquer ingrediente em falta. So precisas de um chapeu na lingua da carta.',
        bullets: [
          'Seleciona o coringa e joga-o.',
          'Escolhe que ingrediente ele vai representar.',
          'Muito flexivel, mas continua a precisar de um chapeu na lingua certa.',
        ],
        focus: { selectedCard: 0 },
      },
      {
        title: 'Cartas de acao',
        body: 'As cartas de acao mudam a partida: algumas afetam um jogador, outras afetam todos, e outras interagem com o descarte ou com os chapeus.',
        bullets: [
          'Garfo rouba ingredientes de outra mesa.',
          'Ladrao rouba chapeus.',
          'Lixo recupera cartas do descarte.',
        ],
        focus: { selectedCard: 0, actionCards: true },
      },
      {
        title: 'Negacao',
        body: 'A Negacao nao se joga como uma carta de acao normal no teu turno. E usada para bloquear uma acao inimiga quando ela te afeta.',
        bullets: [
          'Guarda-a para travar uma carta importante.',
          'Se uma acao nao afeta outro jogador, ela nao pode ser negada.',
        ],
        focus: { selectedCard: 0, actionCards: true },
      },
      {
        title: 'Vamos praticar!',
        body: 'Agora vais jogar uma partida real contra a IA. Usa tudo o que aprendeste para ganhar.',
        bullets: [
          'Objetivo: completar um hamburguer.',
          'Usa ingredientes, chapeus, acoes e negacao.',
          'Completa o teu hamburguer para ganhar.',
        ],
        focus: {},
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
    // Step 0: Game objective
    () => ({
      players: [
        createPlayer({
          ...playerMeta,
          hand: [
            ingredientCard('lechuga', 'espanol'),
            ingredientCard('queso', 'ingles'),
            actionCard('tenedor'),
            actionCard('negacion'),
          ],
          mainHats: ['espanol'],
          perchero: ['ingles', 'frances', 'italiano', 'aleman', 'portugues'],
          table: [],
          burgers: [['pan', 'lechuga', 'queso']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['ingles'],
          perchero: ['espanol', 'frances', 'italiano', 'aleman', 'portugues'],
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
            ingredientCard('lechuga', 'espanol'),
            ingredientCard('queso', 'ingles'),
            actionCard('tenedor'),
            actionCard('negacion'),
          ],
          mainHats: ['espanol'],
          perchero: ['ingles', 'frances', 'italiano', 'aleman', 'portugues'],
          table: [],
          burgers: [['pan', 'lechuga', 'queso']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['ingles'],
          perchero: ['espanol', 'frances', 'italiano', 'aleman', 'portugues'],
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
            ingredientCard('lechuga', 'espanol'),
            ingredientCard('queso', 'ingles'),
            actionCard('tenedor'),
          ],
          mainHats: ['espanol'],
          perchero: ['ingles', 'frances', 'italiano', 'aleman', 'portugues'],
          table: [],
          burgers: [['pan', 'lechuga', 'queso']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['ingles'],
          perchero: ['espanol', 'frances', 'italiano', 'aleman', 'portugues'],
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
            ingredientCard('queso', 'ingles'),
            ingredientCard('tomate', 'espanol'),
            actionCard('tenedor'),
          ],
          mainHats: ['espanol'],
          perchero: ['ingles', 'frances', 'italiano', 'aleman', 'portugues'],
          table: ['lechuga'],
          burgers: [['pan', 'lechuga', 'queso']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['ingles'],
          perchero: ['espanol', 'frances', 'italiano', 'aleman', 'portugues'],
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
            ingredientCard('queso', 'ingles'),
            ingredientCard('pan', 'espanol'),
            ingredientCard('tomate', 'espanol'),
            actionCard('tenedor'),
          ],
          mainHats: ['espanol'],
          perchero: ['ingles', 'frances', 'italiano', 'aleman', 'portugues'],
          table: ['lechuga'],
          burgers: [['pan', 'lechuga', 'queso']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['ingles'],
          perchero: ['espanol', 'frances', 'italiano', 'aleman', 'portugues'],
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
            ingredientCard('tomate', 'espanol'),
            ingredientCard('queso', 'ingles'),
            ingredientCard('pollo', 'ingles'),
            actionCard('tenedor'),
          ],
          mainHats: ['espanol'],
          perchero: ['ingles', 'frances', 'italiano', 'aleman', 'portugues'],
          table: ['pan'],
          burgers: [['pan', 'tomate', 'queso']],
          maxHand: 5,
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['frances'],
          perchero: ['espanol', 'ingles', 'italiano', 'aleman', 'portugues'],
          table: ['carne'],
          burgers: [['pan', 'carne', 'queso']],
        }),
      ],
      selectedIdx: 1,
    }),
    // Step 6: Skip turn after adding a hat
    () => ({
      players: [
        createPlayer({
          ...playerMeta,
          hand: [
            ingredientCard('pan', 'espanol'),
            ingredientCard('carne', 'ingles'),
            ingredientCard('pollo', 'frances'),
          ],
          mainHats: ['espanol'],
          perchero: ['ingles', 'frances', 'italiano', 'aleman', 'portugues'],
          table: ['pan'],
          burgers: [['pan', 'tomate', 'queso']],
          maxHand: 5,
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['frances'],
          perchero: ['espanol', 'ingles', 'italiano', 'aleman', 'portugues'],
          table: ['carne'],
          burgers: [['pan', 'carne', 'queso']],
        }),
      ],
      selectedIdx: 0,
      extraPlay: true,
    }),
    // Step 7: Discard
    () => ({
      players: [
        createPlayer({
          ...playerMeta,
          hand: [
            ingredientCard('queso', 'frances'),
            ingredientCard('carne', 'aleman'),
            ingredientCard('pollo', 'portugues'),
          ],
          mainHats: ['espanol'],
          perchero: ['ingles', 'frances', 'italiano', 'aleman', 'portugues'],
          table: ['pan'],
          burgers: [['pan', 'tomate', 'queso']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['ingles'],
          perchero: ['espanol', 'frances', 'italiano', 'aleman', 'portugues'],
          table: ['tomate'],
          burgers: [['pan', 'tomate', 'queso']],
        }),
      ],
      selectedIdx: 0,
    }),
    // Step 8: Wildcards
    () => ({
      players: [
        createPlayer({
          ...playerMeta,
          hand: [
            ingredientCard('perrito', 'espanol'),
            ingredientCard('tomate', 'espanol'),
            actionCard('tenedor'),
          ],
          mainHats: ['espanol'],
          perchero: ['ingles', 'frances', 'italiano', 'aleman', 'portugues'],
          table: ['pan'],
          burgers: [['pan', 'lechuga', 'queso']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['ingles'],
          perchero: ['espanol', 'frances', 'italiano', 'aleman', 'portugues'],
          table: ['tomate'],
          burgers: [['pan', 'tomate', 'queso']],
        }),
      ],
      selectedIdx: 0,
    }),
    // Step 9: Action cards
    () => ({
      players: [
        createPlayer({
          ...playerMeta,
          hand: [
            actionCard('tenedor'),
            actionCard('milanesa'),
            actionCard('basurero'),
          ],
          mainHats: ['espanol'],
          perchero: ['ingles', 'frances', 'italiano', 'aleman', 'portugues'],
          table: ['pan'],
          burgers: [['pan', 'tomate', 'queso']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['ingles'],
          perchero: ['espanol', 'frances', 'italiano', 'aleman', 'portugues'],
          table: ['tomate', 'queso'],
          burgers: [['pan', 'tomate', 'queso']],
        }),
        createPlayer({
          name: 'Chef Rival',
          username: null,
          userId: null,
          avatarUrl: null,
          isAI: true,
          hand: [],
          mainHats: ['frances'],
          perchero: ['espanol', 'ingles', 'italiano', 'aleman', 'portugues'],
          table: ['pan', 'carne'],
          burgers: [['pan', 'carne', 'queso']],
        }),
      ],
      discard: [ingredientCard('lechuga', 'aleman'), ingredientCard('pollo', 'frances')],
      selectedIdx: null,
    }),
    // Step 10: Negation
    () => {
      const opponentFork = actionCard('tenedor');
      return {
        players: [
          createPlayer({
            ...playerMeta,
            hand: [
              actionCard('negacion'),
              actionCard('tenedor'),
              ingredientCard('queso', 'espanol'),
            ],
            mainHats: ['espanol'],
            perchero: ['ingles', 'frances', 'italiano', 'aleman', 'portugues'],
            table: ['pan'],
            burgers: [['pan', 'queso', 'tomate']],
          }),
          createPlayer({
            ...opponentMeta,
            hand: [opponentFork],
            mainHats: ['ingles'],
            perchero: ['espanol', 'frances', 'italiano', 'aleman', 'portugues'],
            table: ['tomate'],
            burgers: [['pan', 'tomate', 'queso']],
          }),
        ],
        pendingNeg: {
          actingIdx: 1,
          card: opponentFork,
          cardInfo: { emoji: '🍴', name: 'The Fork' },
          eligibleIdxs: [0],
          responses: {},
        },
        selectedIdx: 0,
      };
    },
    // Step 11: Practice
    () => ({
      players: [
        createPlayer({
          ...playerMeta,
          hand: [
            ingredientCard('tomate', 'espanol'),
            ingredientCard('queso', 'ingles'),
            actionCard('tenedor'),
            actionCard('negacion'),
          ],
          mainHats: ['espanol'],
          perchero: ['ingles', 'frances', 'italiano', 'aleman', 'portugues'],
          table: ['pan'],
          burgers: [['pan', 'tomate', 'queso']],
        }),
        createPlayer({
          ...opponentMeta,
          hand: [],
          mainHats: ['ingles'],
          perchero: ['espanol', 'frances', 'italiano', 'aleman', 'portugues'],
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
    pendingNeg: built.pendingNeg || null,
    cp: 0,
    extraPlay: !!built.extraPlay,
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
