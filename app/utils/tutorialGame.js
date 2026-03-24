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
    stepLabel: 'Etape',
    next: 'Suivant',
    prev: 'Retour',
    finish: 'Terminer le tutoriel',
    skip: 'Quitter le tutoriel',
    steps: [
      {
        title: 'Chapeaux principaux et placard',
        body: 'Tes chapeaux principaux decident dans quelles langues tu peux jouer tes cartes. Le placard garde les chapeaux supplementaires que tu peux echanger ou ajouter.',
        bullets: [
          'Regarde tes chapeaux principaux a droite.',
          'Le placard montre les langues supplementaires que tu peux encore mettre en jeu.',
        ],
        focus: { hats: true, closet: true },
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
        ],
        focus: { closet: true, changeButton: true, selectedCard: 0 },
      },
      {
        title: 'Utiliser Ajouter',
        body: 'Ajouter te permet de garder ton chapeau actuel et d ajouter un autre chapeau principal. En echange, tu defausses ta main et ton maximum de cartes baisse.',
        bullets: [
          'C est utile quand tu veux garder deux langues actives en meme temps.',
          'C est plus couteux, mais cela donne plus de flexibilite pour les prochains tours.',
        ],
        focus: { closet: true, addButton: true, selectedCard: 1 },
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
        title: 'Resume final',
        body: 'Avant de terminer ton tour, verifie ce que le burger demande, quelles langues sont actives et quelles actions valent la peine d etre conservees.',
        bullets: [
          'Burger requis + chapeau correspondant = ingredient jouable.',
          'Placard = reserve de langues.',
          'Echanger et Ajouter ouvrent de nouvelles cartes.',
        ],
        focus: { hats: true, closet: true, actionCards: true },
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
    stepLabel: 'Passo',
    next: 'Avanti',
    prev: 'Indietro',
    finish: 'Termina tutorial',
    skip: 'Esci dal tutorial',
    steps: [
      {
        title: 'Cappelli principali e armadio',
        body: 'I tuoi cappelli principali decidono in quali lingue puoi giocare le carte. L armadio conserva i cappelli extra che puoi cambiare o aggiungere.',
        bullets: [
          'Guarda i tuoi cappelli principali a destra.',
          'L armadio mostra le lingue extra che puoi ancora portare in gioco.',
        ],
        focus: { hats: true, closet: true },
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
        ],
        focus: { closet: true, changeButton: true, selectedCard: 0 },
      },
      {
        title: 'Usare Aggiungi',
        body: 'Aggiungi ti permette di mantenere il cappello attuale e aggiungerne un altro principale. In cambio, scarti la mano e il tuo massimo di carte si riduce.',
        bullets: [
          'Serve quando vuoi tenere attive due lingue allo stesso tempo.',
          'Costa di piu, ma ti da piu flessibilita nei turni futuri.',
        ],
        focus: { closet: true, addButton: true, selectedCard: 1 },
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
        title: 'Riepilogo finale',
        body: 'Prima di terminare il turno, controlla cosa richiede l hamburger, quali lingue sono attive e quali carte azione conviene conservare.',
        bullets: [
          'Richiesta dell hamburger + cappello corretto = ingrediente giocabile.',
          'Armadio = riserva di lingue.',
          'Cambia e Aggiungi sbloccano nuove carte.',
        ],
        focus: { hats: true, closet: true, actionCards: true },
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
    stepLabel: 'Schritt',
    next: 'Weiter',
    prev: 'Zuruck',
    finish: 'Tutorial beenden',
    skip: 'Tutorial verlassen',
    steps: [
      {
        title: 'Haupthute und Schrank',
        body: 'Deine Haupthute entscheiden, in welchen Sprachen du Karten spielen kannst. Der Schrank bewahrt zusatzliche Hute auf, die du wechseln oder hinzufugen kannst.',
        bullets: [
          'Sieh dir rechts deine Haupthute an.',
          'Der Schrank zeigt die zusatzlichen Sprachen, die du noch ins Spiel bringen kannst.',
        ],
        focus: { hats: true, closet: true },
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
        ],
        focus: { closet: true, changeButton: true, selectedCard: 0 },
      },
      {
        title: 'Hut hinzufugen benutzen',
        body: 'Hinzufugen lasst dich deinen aktuellen Hut behalten und einen weiteren Haupthut dazunehmen. Dafur wirfst du deine Hand ab und dein Handlimit sinkt.',
        bullets: [
          'Das ist stark, wenn du zwei Sprachen gleichzeitig aktiv haben willst.',
          'Es kostet mehr, gibt dir aber mehr Flexibilitat fur spatere Zuge.',
        ],
        focus: { closet: true, addButton: true, selectedCard: 1 },
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
        title: 'Letzte Zusammenfassung',
        body: 'Bevor du deinen Zug beendest, prufe, was der Burger braucht, welche Sprachen aktiv sind und welche Aktionskarten du lieber behalten solltest.',
        bullets: [
          'Burger-Anforderung + passender Hut = spielbare Zutat.',
          'Schrank = Sprachreserve.',
          'Wechseln und Hinzufugen schalten neue Karten frei.',
        ],
        focus: { hats: true, closet: true, actionCards: true },
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
    stepLabel: 'Passo',
    next: 'Seguinte',
    prev: 'Voltar',
    finish: 'Terminar tutorial',
    skip: 'Sair do tutorial',
    steps: [
      {
        title: 'Chapeus principais e armario',
        body: 'Os teus chapeus principais decidem em que linguas podes jogar cartas. O armario guarda os chapeus extra que podes trocar ou adicionar.',
        bullets: [
          'Olha para os teus chapeus principais a direita.',
          'O armario mostra os idiomas extra que ainda podes colocar em jogo.',
        ],
        focus: { hats: true, closet: true },
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
        ],
        focus: { closet: true, changeButton: true, selectedCard: 0 },
      },
      {
        title: 'Usar Adicionar',
        body: 'Adicionar permite-te manter o teu chapeu atual e somar outro chapeu principal. Em troca, descartas a mao e o teu maximo de cartas diminui.',
        bullets: [
          'Serve quando queres manter duas linguas ativas ao mesmo tempo.',
          'Custa mais, mas da-te mais flexibilidade nos turnos seguintes.',
        ],
        focus: { closet: true, addButton: true, selectedCard: 1 },
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
        title: 'Resumo final',
        body: 'Antes de terminares o turno, verifica o que o hamburguer pede, que linguas estao ativas e que cartas de acao vale a pena guardar.',
        bullets: [
          'Necessidade do hamburguer + chapeu correspondente = ingrediente jogavel.',
          'Armario = reserva de linguas.',
          'Trocar e Adicionar desbloqueiam novas cartas.',
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
