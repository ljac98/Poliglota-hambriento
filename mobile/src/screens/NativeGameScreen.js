import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const HAT_LABELS = {
  espanol: 'Espanol',
  ingles: 'English',
  frances: 'Francais',
  italiano: 'Italiano',
  aleman: 'Deutsch',
  portugues: 'Portugues',
};
const INGREDIENT_LABELS = {
  lettuce: 'Lettuce',
  tomato: 'Tomato',
  beef: 'Beef',
  cheese: 'Cheese',
  chicken: 'Chicken',
  egg: 'Egg',
  onion: 'Onion',
  avocado: 'Avocado',
};
const FALLBACK_POOL = ['lettuce', 'tomato', 'beef', 'cheese', 'chicken', 'egg', 'onion', 'avocado'];
const INGREDIENT_IMAGE_SOURCES = {
  lettuce: require('../../assets/game/lettuce.png'),
  tomato: require('../../assets/game/tomato.png'),
  beef: require('../../assets/game/beef.png'),
  cheese: require('../../assets/game/cheese.png'),
  chicken: require('../../assets/game/chicken.png'),
  egg: require('../../assets/game/egg.png'),
  onion: require('../../assets/game/onion.png'),
  avocado: require('../../assets/game/avocado.png'),
  bread: require('../../assets/game/bread.png'),
  wildcard: require('../../assets/game/wildcard.png'),
  bunTop: require('../../assets/game/bun-top.png'),
  bunBottom: require('../../assets/game/bun-bottom.png'),
};
const HAT_IMAGE_SOURCES = {
  espanol: require('../../assets/game/hat-espanol.png'),
  ingles: require('../../assets/game/hat-ingles.png'),
  frances: require('../../assets/game/hat-frances.png'),
  italiano: require('../../assets/game/hat-italiano.png'),
  aleman: require('../../assets/game/hat-aleman.png'),
  portugues: require('../../assets/game/hat-portugues.png'),
};

function buildBurgerStack(mode, pool, ingredientCount, burgerIndex, playerIndex) {
  const safePool = pool && pool.length ? pool : FALLBACK_POOL;
  const minIngredients = mode === 'escalera' ? 2 + burgerIndex : Math.max(2, ingredientCount || 5);
  const totalIngredients = mode === 'caotico'
    ? Math.max(5, (ingredientCount || 5) + burgerIndex)
    : Math.max(2, minIngredients);
  const selected = [];
  for (let index = 0; index < totalIngredients; index += 1) {
    if (mode === 'caotico') {
      selected.push('?');
      continue;
    }
    const ingredient = safePool[(playerIndex + burgerIndex + index) % safePool.length];
    selected.push(INGREDIENT_LABELS[ingredient] || ingredient);
  }
  return ['BUN TOP', ...selected, 'BUN BOT'];
}

function buildObjectives(gameSession) {
  const config = gameSession.gameConfig || {};
  const mode = config.mode || 'clon';
  const burgerCount = config.burgerCount || 2;
  const ingredientCount = config.ingredientCount || 5;
  const pool = config.ingredientPool || FALLBACK_POOL;
  const players = gameSession.players || [];

  if (mode === 'clon') {
    const shared = Array.from({ length: burgerCount }, (_, burgerIndex) =>
      buildBurgerStack(mode, pool, ingredientCount, burgerIndex, 0)
    );
    return players.map((player) => ({
      player,
      burgers: shared,
    }));
  }

  return players.map((player, playerIndex) => ({
    player,
    burgers: Array.from({ length: burgerCount }, (_, burgerIndex) =>
      buildBurgerStack(mode, pool, ingredientCount, burgerIndex, playerIndex)
    ),
  }));
}

function summarizeMode(config) {
  if (!config) return 'Sin configuracion';
  if (config.mode === 'caotico') return `Caotico - caos ${config.chaosLevel || 2}`;
  if (config.mode === 'escalera') return `Escalera - ${config.burgerCount || 2} burgers por jugador`;
  return `Clon - ${config.burgerCount || 2} burgers compartidas`;
}

function formatCard(card) {
  if (!card) return 'Carta';
  if (card.type === 'ingredient') {
    const ing = INGREDIENT_LABELS[card.ingredient] || card.ingredient || 'Ingrediente';
    return `${ing} - ${card.language || 'lang'}`;
  }
  if (card.type === 'action') {
    return `Action - ${card.action || 'accion'}`;
  }
  return card.name || 'Carta';
}

function formatTableItem(item) {
  if (!item) return 'Ingrediente';
  if (typeof item !== 'string') return String(item);
  if (item.startsWith('perrito|')) {
    const chosen = item.split('|')[1];
    return `Comodin - ${INGREDIENT_LABELS[chosen] || chosen}`;
  }
  if (item === 'perrito') return 'Comodin';
  return INGREDIENT_LABELS[item] || item;
}

function resolveNeededIngredients(target = [], table = []) {
  const remaining = [...target];
  const normalizedTable = [...table].map((item) => {
    if (typeof item !== 'string') return item;
    if (item.startsWith('perrito|')) return item.split('|')[1];
    if (item === 'perrito') return null;
    return item;
  }).filter(Boolean);

  normalizedTable.forEach((ing) => {
    const idx = remaining.indexOf(ing);
    if (idx !== -1) remaining.splice(idx, 1);
  });

  return remaining;
}

function normalizeIngredientKey(item) {
  if (!item) return null;
  if (typeof item !== 'string') return item;
  if (item === 'BUN TOP') return 'bunTop';
  if (item === 'BUN BOT') return 'bunBottom';
  if (item === 'bread' || item === 'pan') return 'bread';
  if (item.startsWith('perrito|')) return item.split('|')[1];
  if (item === 'perrito') return 'wildcard';
  return item;
}

function burgerStackFromObjective(target = [], table = []) {
  const tableLayers = (table || []).map((item) => normalizeIngredientKey(item)).filter(Boolean);
  const targetLayers = (target || []).map((item) => normalizeIngredientKey(item)).filter(Boolean);
  return ['bunTop', ...tableLayers, ...targetLayers, 'bunBottom'];
}

function RenderBurgerVisual({ target = [], table = [], badge, compact = false }) {
  const layers = burgerStackFromObjective(target, table);
  return (
    <View style={[styles.visualBurgerCard, compact && styles.visualBurgerCardCompact]}>
      {badge != null && <Text style={styles.visualBurgerBadge}>{badge}</Text>}
      <View style={styles.visualBurgerStack}>
        {layers.map((item, index) => {
          const source = INGREDIENT_IMAGE_SOURCES[item] || INGREDIENT_IMAGE_SOURCES.wildcard;
          return <Image key={`${item}-${index}`} source={source} style={[styles.visualBurgerLayer, compact && styles.visualBurgerLayerCompact]} resizeMode="contain" />;
        })}
      </View>
    </View>
  );
}

const MASS_ACTIONS = ['milanesa', 'ensalada', 'pizza', 'parrilla', 'comecomodines'];
const TARGETED_ACTIONS = ['tenedor', 'ladron', 'intercambio_sombreros', 'intercambio_hamburguesa', 'gloton'];
const ACTION_LABELS = {
  milanesa: 'La milanesa',
  ensalada: 'La ensalada',
  pizza: 'La pizza',
  parrilla: 'La parrilla',
  comecomodines: 'Come comodines',
  tenedor: 'El tenedor',
  ladron: 'Ladron sombreros',
  intercambio_sombreros: 'Intercambio sombreros',
  intercambio_hamburguesa: 'Intercambio mesa',
  basurero: 'Basurero',
  negacion: 'Negacion',
};

export function NativeGameScreen({ setup, online, gameSession, chatMessages = [], onSendChat, onSendAction, onBackToLobby, onOpenWebGame, onLeaveRoom }) {
  const objectivesByPlayer = useMemo(() => buildObjectives(gameSession), [gameSession]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [actionDraft, setActionDraft] = useState(null);
  const [hatDraft, setHatDraft] = useState(null);
  const currentObjective = objectivesByPlayer[selectedIdx] || objectivesByPlayer[0];
  const currentPlayerName = setup.playerName;
  const livePlayers = gameSession.liveState?.players || [];
  const liveCp = gameSession.liveState?.cp ?? null;
  const liveDeckCount = gameSession.liveState?.deck?.length ?? null;
  const liveDiscardCount = gameSession.liveState?.discard?.length ?? null;
  const liveDiscardCards = gameSession.liveState?.discard || [];
  const liveWinner = gameSession.liveState?.winner || null;
  const myLivePlayer = livePlayers.find((player) => player?.name === currentPlayerName);
  const isMyTurn = online.myIdx === liveCp;
  const selectedCard = selectedCardIdx != null ? myLivePlayer?.hand?.[selectedCardIdx] : null;
  const myTarget = myLivePlayer?.burgers?.[myLivePlayer?.currentBurger || 0] || [];
  const neededIngredients = resolveNeededIngredients(myTarget, myLivePlayer?.table || []);
  const wildcardOptions = [...new Set(neededIngredients)].filter(Boolean);
  const currentBurgerIndex = (myLivePlayer?.currentBurger || 0) + 1;
  const discardIngredients = liveDiscardCards.filter((card) => card?.type === 'ingredient');
  const urgentHatReplace = !isMyTurn && myLivePlayer && (myLivePlayer.mainHats?.length || 0) === 0 && (myLivePlayer.perchero?.length || 0) > 0;
  const targetedPlayers = TARGETED_ACTIONS.includes(selectedCard?.action)
    ? livePlayers.filter((player) => {
      if (!player || player.name === currentPlayerName) return false;
      if (selectedCard.action === 'tenedor') return (player.table?.length || 0) > 0;
      if (selectedCard.action === 'ladron') return (player.mainHats?.length || 0) > 0;
      if (selectedCard.action === 'intercambio_sombreros') return (myLivePlayer?.mainHats?.length || 0) > 0 && (player.mainHats?.length || 0) > 0;
      if (selectedCard.action === 'gloton') return (player.table?.length || 0) > 0;
      return true;
    })
    : [];
  const targetPlayer = actionDraft?.targetIdx != null ? livePlayers[actionDraft.targetIdx] : null;
  const manualCambiarCost = Math.ceil((myLivePlayer?.hand?.length || 0) / 2);

  useEffect(() => {
    setActionDraft(null);
  }, [selectedCardIdx]);

  useEffect(() => {
    if (!urgentHatReplace && hatDraft?.mode === 'replace') {
      setHatDraft(null);
    }
  }, [urgentHatReplace, hatDraft]);

  function resetCardFlow() {
    setSelectedCardIdx(null);
    setActionDraft(null);
  }

  function submitTargetAction(base = {}) {
    if (!selectedCard) return;
    onSendAction?.({
      type: 'playActionTarget',
      cardIdx: selectedCardIdx,
      targetIdx: actionDraft?.targetIdx,
      action: selectedCard.action,
      ...base,
    });
    resetCardFlow();
  }

  function toggleCambiarCard(index) {
    setHatDraft((prev) => {
      if (!prev || prev.mode !== 'cambiar') return prev;
      const exists = prev.cardIndices.includes(index);
      if (exists) {
        return { ...prev, cardIndices: prev.cardIndices.filter((item) => item !== index) };
      }
      if (prev.cardIndices.length >= manualCambiarCost) return prev;
      return { ...prev, cardIndices: [...prev.cardIndices, index] };
    });
  }

  function startHatDraft(mode, hatLang) {
    if (mode === 'agregar') {
      setHatDraft({ mode, hatLang });
      return;
    }
    setHatDraft({ mode, hatLang, cardIndices: [] });
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Partida nativa iniciada</Text>
        <Text style={styles.heroText}>Sala {gameSession.roomCode || online.roomCode || 'sin codigo'} - {gameSession.roomName || online.roomName || 'Sin nombre'}</Text>
        <Text style={styles.heroSubtext}>{summarizeMode(gameSession.gameConfig)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jugadores y sombreros</Text>
        <View style={styles.playerList}>
          {(gameSession.players || []).map((player) => {
            const isMe = player.name === currentPlayerName;
            const hat = gameSession.hatPicks?.[player.name] || online.hatPicks?.[player.name] || setup.hat;
            return (
              <View key={`${player.name}-${player.idx}`} style={styles.playerCard}>
                <View style={styles.playerHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerName}>{player.name}{isMe ? ' (tu)' : ''}</Text>
                    <Text style={styles.playerMeta}>Sombrero: {HAT_LABELS[hat] || hat || 'pendiente'}</Text>
                  </View>
                  {hat ? <Image source={HAT_IMAGE_SOURCES[hat]} style={styles.playerHatImage} resizeMode="contain" /> : null}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {myLivePlayer && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tablero nativo</Text>
          <View style={styles.boardHero}>
            <View style={styles.boardHeroColumn}>
              <Text style={styles.boardHeroLabel}>Objetivo actual</Text>
              <Text style={styles.boardHeroSubtext}>Hamburguesa {currentBurgerIndex}</Text>
              <RenderBurgerVisual target={myTarget} table={[]} badge={currentBurgerIndex} />
            </View>
            <View style={styles.boardHeroColumn}>
              <Text style={styles.boardHeroLabel}>Tu mesa ahora</Text>
              <Text style={styles.boardHeroSubtext}>Progreso real de la partida</Text>
              <RenderBurgerVisual target={[]} table={myLivePlayer.table || []} />
            </View>
          </View>

          <View style={styles.boardSplit}>
            <View style={styles.boardPanel}>
              <Text style={styles.liveColumnTitle}>Ingredientes que faltan</Text>
              <View style={styles.ingredientIconRow}>
                {neededIngredients.length === 0 ? (
                  <Text style={styles.emptyText}>Ya no faltan ingredientes para esta hamburguesa.</Text>
                ) : (
                  neededIngredients.map((ingredient, index) => (
                    <View key={`need-${ingredient}-${index}`} style={styles.ingredientNeedCard}>
                      <Image source={INGREDIENT_IMAGE_SOURCES[ingredient] || INGREDIENT_IMAGE_SOURCES.wildcard} style={styles.ingredientNeedImage} resizeMode="contain" />
                      <Text style={styles.ingredientNeedText}>{INGREDIENT_LABELS[ingredient] || ingredient}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>

            <View style={styles.boardPanel}>
              <Text style={styles.liveColumnTitle}>Sombreros activos</Text>
              <View style={styles.hatBoardRow}>
                {(myLivePlayer.mainHats || []).map((hatLang) => (
                  <View key={`mainhat-${hatLang}`} style={styles.hatBoardCard}>
                    <Image source={HAT_IMAGE_SOURCES[hatLang]} style={styles.hatBoardImage} resizeMode="contain" />
                    <Text style={styles.hatBoardText}>{HAT_LABELS[hatLang] || hatLang}</Text>
                  </View>
                ))}
              </View>
              {(myLivePlayer.perchero?.length || 0) > 0 && (
                <>
                  <Text style={[styles.actionHint, { marginTop: 10 }]}>Perchero listo para Cambiar o Agregar.</Text>
                  <View style={styles.hatBoardRow}>
                    {(myLivePlayer.perchero || []).map((hatLang) => (
                      <View key={`perchero-${hatLang}`} style={styles.hatBoardCardMuted}>
                        <Image source={HAT_IMAGE_SOURCES[hatLang]} style={styles.hatBoardImage} resizeMode="contain" />
                        <Text style={styles.hatBoardTextMuted}>{HAT_LABELS[hatLang] || hatLang}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado vivo de la partida</Text>
        {gameSession.liveState ? (
          <>
            <View style={styles.liveMetrics}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Turno actual</Text>
                <Text style={styles.metricValue}>
                  {liveCp != null && livePlayers[liveCp]?.name ? livePlayers[liveCp].name : `Jugador ${liveCp != null ? liveCp + 1 : '-'}`}
                </Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Mazo</Text>
                <Text style={styles.metricValue}>{liveDeckCount ?? '-'}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Descarte</Text>
                <Text style={styles.metricValue}>{liveDiscardCount ?? '-'}</Text>
              </View>
            </View>

            {liveWinner && (
              <View style={styles.winnerBanner}>
                <Text style={styles.winnerTitle}>Ganador</Text>
                <Text style={styles.winnerText}>{liveWinner.name}</Text>
              </View>
            )}

            {myLivePlayer && (
              <View style={styles.myStateCard}>
                <Text style={styles.myStateTitle}>Tu estado</Text>
                <Text style={styles.myStateText}>Cartas en mano: {myLivePlayer.hand?.length ?? 0}</Text>
                <Text style={styles.myStateText}>Sombreros principales: {myLivePlayer.mainHats?.length ?? 0}</Text>
                <Text style={styles.myStateText}>Sombreros en perchero: {myLivePlayer.perchero?.length ?? 0}</Text>
                <Text style={styles.myStateText}>Hamburguesas cerradas: {myLivePlayer.completed || 0}</Text>
                {urgentHatReplace && (
                  <View style={styles.urgentPanel}>
                    <Text style={styles.urgentTitle}>Te robaron el sombrero principal</Text>
                    <Text style={styles.actionHint}>Elige ahora un sombrero del perchero para seguir jugando.</Text>
                    <View style={styles.optionWrap}>
                      {(myLivePlayer.perchero || []).map((hatLang) => (
                        <Pressable key={`replace-${hatLang}`} style={styles.optionChip} onPress={() => onSendAction?.({ type: 'pickHatReplace', hatLang })}>
                          <Text style={styles.optionChipText}>{HAT_LABELS[hatLang] || hatLang}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
                {isMyTurn && (myLivePlayer.perchero?.length || 0) > 0 && (
                  <View style={styles.actionPanel}>
                    <Text style={styles.actionPanelTitle}>Sombreros del perchero</Text>
                    <Text style={styles.actionHint}>Ya puedes usar Cambiar o Agregar sin salir a la web.</Text>
                    <View style={styles.optionWrap}>
                      {(myLivePlayer.perchero || []).map((hatLang) => (
                        <View key={`hat-${hatLang}`} style={styles.hatActionCard}>
                          <Text style={styles.hatActionName}>{HAT_LABELS[hatLang] || hatLang}</Text>
                          <View style={styles.hatActionButtons}>
                            <Pressable style={styles.smallActionButton} onPress={() => startHatDraft('cambiar', hatLang)}>
                              <Text style={styles.smallActionButtonText}>Cambiar</Text>
                            </Pressable>
                            <Pressable style={styles.smallActionButtonAlt} onPress={() => startHatDraft('agregar', hatLang)}>
                              <Text style={styles.smallActionButtonAltText}>Agregar</Text>
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                    {hatDraft?.mode === 'agregar' && (
                      <View style={styles.inlineActionGroup}>
                        <Text style={styles.actionHint}>Agregar {HAT_LABELS[hatDraft.hatLang] || hatDraft.hatLang} vacia tu mano y reduce tu mano maxima.</Text>
                        <Pressable
                          style={styles.inlineActionButton}
                          onPress={() => {
                            onSendAction?.({ type: 'manualAgregar', hatLang: hatDraft.hatLang });
                            setHatDraft(null);
                          }}
                        >
                          <Text style={styles.inlineActionButtonText}>Confirmar agregar</Text>
                        </Pressable>
                      </View>
                    )}
                    {hatDraft?.mode === 'cambiar' && (
                      <View style={styles.inlineActionGroup}>
                        <Text style={styles.actionHint}>Selecciona {manualCambiarCost} carta{manualCambiarCost !== 1 ? 's' : ''} para descartar.</Text>
                        <View style={styles.optionWrap}>
                          {(myLivePlayer.hand || []).map((card, index) => {
                            const active = hatDraft.cardIndices.includes(index);
                            return (
                              <Pressable key={`cambiar-card-${card.id || index}`} style={[styles.optionChip, active && styles.optionChipActive]} onPress={() => toggleCambiarCard(index)}>
                                <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{formatCard(card)}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                        <Pressable
                          style={[styles.inlineActionButton, hatDraft.cardIndices.length !== manualCambiarCost && styles.inlineActionButtonDisabled]}
                          disabled={hatDraft.cardIndices.length !== manualCambiarCost}
                          onPress={() => {
                            onSendAction?.({ type: 'manualCambiar', hatLang: hatDraft.hatLang, cardIndices: hatDraft.cardIndices });
                            setHatDraft(null);
                          }}
                        >
                          <Text style={styles.inlineActionButtonText}>Confirmar cambiar</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {myLivePlayer && (
              <View style={styles.liveColumns}>
                <View style={styles.liveColumnCard}>
                  <Text style={styles.liveColumnTitle}>Tu mano</Text>
                  <View style={styles.cardChipWrap}>
                    {(myLivePlayer.hand || []).length === 0 ? (
                      <Text style={styles.emptyText}>Sin cartas visibles todavia.</Text>
                    ) : (
                      myLivePlayer.hand.map((card, index) => {
                        const active = index === selectedCardIdx;
                        return (
                          <Pressable key={`hand-${card.id || index}`} style={[styles.cardChip, active && styles.cardChipActive]} onPress={() => setSelectedCardIdx(index)}>
                            <Text style={[styles.cardChipText, active && styles.cardChipTextActive]}>{formatCard(card)}</Text>
                          </Pressable>
                        );
                      })
                    )}
                  </View>
                  {selectedCard && (
                    <View style={styles.actionPanel}>
                      <Text style={styles.actionPanelTitle}>Carta seleccionada</Text>
                      <Text style={styles.actionPanelText}>{formatCard(selectedCard)}</Text>
                      {!isMyTurn ? (
                        <Text style={styles.actionHint}>Todavia no es tu turno.</Text>
                      ) : (
                        <>
                          {selectedCard.type === 'ingredient' && selectedCard.ingredient !== 'perrito' && (
                            <Pressable
                              style={styles.inlineActionButton}
                              onPress={() => {
                                onSendAction?.({ type: 'playIngredient', cardIdx: selectedCardIdx });
                                resetCardFlow();
                              }}
                            >
                              <Text style={styles.inlineActionButtonText}>Jugar ingrediente</Text>
                            </Pressable>
                          )}
                          {selectedCard.type === 'ingredient' && selectedCard.ingredient === 'perrito' && (
                            <View style={styles.inlineActionGroup}>
                              <Text style={styles.actionHint}>Elige como usar el comodin:</Text>
                              <View style={styles.optionWrap}>
                                {wildcardOptions.length === 0 ? (
                                  <Text style={styles.emptyText}>No hay ingredientes faltantes visibles.</Text>
                                ) : (
                                  wildcardOptions.map((ingredient) => (
                                    <Pressable
                                      key={`wild-${ingredient}`}
                                      style={styles.optionChip}
                                      onPress={() => {
                                        onSendAction?.({ type: 'playWildcard', cardIdx: selectedCardIdx, ingredient });
                                        resetCardFlow();
                                      }}
                                    >
                                      <Text style={styles.optionChipText}>{INGREDIENT_LABELS[ingredient] || ingredient}</Text>
                                    </Pressable>
                                  ))
                                )}
                              </View>
                            </View>
                          )}
                          {selectedCard.type === 'action' && MASS_ACTIONS.includes(selectedCard.action) && (
                            <Pressable
                              style={styles.inlineActionButton}
                              onPress={() => {
                                onSendAction?.({ type: 'playMass', cardIdx: selectedCardIdx });
                                resetCardFlow();
                              }}
                            >
                              <Text style={styles.inlineActionButtonText}>Jugar accion masiva</Text>
                            </Pressable>
                          )}
                          {selectedCard.type === 'action' && selectedCard.action === 'basurero' && (
                            <View style={styles.inlineActionGroup}>
                              <Text style={styles.actionHint}>Elige una carta de ingrediente del descarte.</Text>
                              <View style={styles.optionWrap}>
                                {discardIngredients.length === 0 ? (
                                  <Text style={styles.emptyText}>No hay ingredientes en el basurero.</Text>
                                ) : (
                                  discardIngredients.map((card) => {
                                    const active = actionDraft?.pickedCardId === card.id;
                                    return (
                                      <Pressable
                                        key={`discard-ing-${card.id}`}
                                        style={[styles.optionChip, active && styles.optionChipActive]}
                                        onPress={() => setActionDraft({ type: 'basurero', pickedCardId: card.id })}
                                      >
                                        <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{formatCard(card)}</Text>
                                      </Pressable>
                                    );
                                  })
                                )}
                              </View>
                              <Pressable
                                style={[styles.inlineActionButton, !actionDraft?.pickedCardId && styles.inlineActionButtonDisabled]}
                                disabled={!actionDraft?.pickedCardId}
                                onPress={() => {
                                  onSendAction?.({ type: 'playBasurero', cardIdx: selectedCardIdx, pickedCardId: actionDraft.pickedCardId });
                                  resetCardFlow();
                                }}
                              >
                                <Text style={styles.inlineActionButtonText}>Rescatar del basurero</Text>
                              </Pressable>
                            </View>
                          )}
                          {selectedCard.type === 'action' && TARGETED_ACTIONS.includes(selectedCard.action) && (
                            <View style={styles.inlineActionGroup}>
                              <Text style={styles.actionHint}>Selecciona el objetivo para {ACTION_LABELS[selectedCard.action] || selectedCard.action}.</Text>
                              <View style={styles.optionWrap}>
                                {targetedPlayers.length === 0 ? (
                                  <Text style={styles.emptyText}>No hay objetivos validos en este momento.</Text>
                                ) : (
                                  targetedPlayers.map((player) => {
                                    const active = actionDraft?.targetIdx === player.idx;
                                    return (
                                      <Pressable
                                        key={`target-${player.idx}`}
                                        style={[styles.optionChip, active && styles.optionChipActive]}
                                        onPress={() => setActionDraft({ type: 'targeted', targetIdx: player.idx })}
                                      >
                                        <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{player.name}</Text>
                                      </Pressable>
                                    );
                                  })
                                )}
                              </View>

                              {targetPlayer && selectedCard.action === 'tenedor' && (
                                <View style={styles.inlineActionGroup}>
                                  <Text style={styles.actionHint}>Elige el ingrediente que vas a robar de la mesa de {targetPlayer.name}.</Text>
                                  <View style={styles.optionWrap}>
                                    {(targetPlayer.table || []).map((item, index) => {
                                      const active = actionDraft?.ingIdx === index;
                                      return (
                                        <Pressable
                                          key={`tenedor-${index}-${item}`}
                                          style={[styles.optionChip, active && styles.optionChipActive]}
                                          onPress={() => setActionDraft((prev) => ({ ...(prev || {}), type: 'targeted', targetIdx: targetPlayer.idx, ingIdx: index }))}
                                        >
                                          <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{formatTableItem(item)}</Text>
                                        </Pressable>
                                      );
                                    })}
                                  </View>
                                  <Pressable
                                    style={[styles.inlineActionButton, actionDraft?.ingIdx == null && styles.inlineActionButtonDisabled]}
                                    disabled={actionDraft?.ingIdx == null}
                                    onPress={() => submitTargetAction({ ingIdx: actionDraft.ingIdx })}
                                  >
                                    <Text style={styles.inlineActionButtonText}>Jugar tenedor</Text>
                                  </Pressable>
                                </View>
                              )}

                              {targetPlayer && selectedCard.action === 'intercambio_sombreros' && (
                                <View style={styles.inlineActionGroup}>
                                  <Text style={styles.actionHint}>Elige el sombrero tuyo y el del rival que se van a intercambiar.</Text>
                                  <Text style={styles.actionHint}>Tus sombreros principales</Text>
                                  <View style={styles.optionWrap}>
                                    {(myLivePlayer?.mainHats || []).map((hatLang) => {
                                      const active = actionDraft?.myHat === hatLang;
                                      return (
                                        <Pressable
                                          key={`myhat-${hatLang}`}
                                          style={[styles.optionChip, active && styles.optionChipActive]}
                                          onPress={() => setActionDraft((prev) => ({ ...(prev || {}), type: 'targeted', targetIdx: targetPlayer.idx, myHat: hatLang }))}
                                        >
                                          <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{HAT_LABELS[hatLang] || hatLang}</Text>
                                        </Pressable>
                                      );
                                    })}
                                  </View>
                                  <Text style={styles.actionHint}>Sombreros principales de {targetPlayer.name}</Text>
                                  <View style={styles.optionWrap}>
                                    {(targetPlayer.mainHats || []).map((hatLang) => {
                                      const active = actionDraft?.theirHat === hatLang;
                                      return (
                                        <Pressable
                                          key={`theirhat-${hatLang}`}
                                          style={[styles.optionChip, active && styles.optionChipActive]}
                                          onPress={() => setActionDraft((prev) => ({ ...(prev || {}), type: 'targeted', targetIdx: targetPlayer.idx, theirHat: hatLang }))}
                                        >
                                          <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{HAT_LABELS[hatLang] || hatLang}</Text>
                                        </Pressable>
                                      );
                                    })}
                                  </View>
                                  <Pressable
                                    style={[styles.inlineActionButton, (!actionDraft?.myHat || !actionDraft?.theirHat) && styles.inlineActionButtonDisabled]}
                                    disabled={!actionDraft?.myHat || !actionDraft?.theirHat}
                                    onPress={() => submitTargetAction({ myHat: actionDraft.myHat, theirHat: actionDraft.theirHat })}
                                  >
                                    <Text style={styles.inlineActionButtonText}>Intercambiar sombreros</Text>
                                  </Pressable>
                                </View>
                              )}

                              {targetPlayer && ['gloton', 'ladron', 'intercambio_hamburguesa'].includes(selectedCard.action) && (
                                <Pressable style={styles.inlineActionButton} onPress={() => submitTargetAction()}>
                                  <Text style={styles.inlineActionButtonText}>Confirmar accion</Text>
                                </Pressable>
                              )}
                            </View>
                          )}
                          {selectedCard.type === 'action' && selectedCard.action === 'negacion' && (
                            <Text style={styles.actionHint}>Negacion sigue siendo automatica cuando otro jugador hace una accion.</Text>
                          )}
                          <Pressable
                            style={styles.inlineDiscardButton}
                            onPress={() => {
                              onSendAction?.({ type: 'discard', cardIdx: selectedCardIdx });
                              resetCardFlow();
                            }}
                          >
                            <Text style={styles.inlineDiscardButtonText}>Descartar</Text>
                          </Pressable>
                        </>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.liveColumnCard}>
                  <Text style={styles.liveColumnTitle}>Tu mesa</Text>
                  <View style={styles.cardChipWrap}>
                    {(myLivePlayer.table || []).length === 0 ? (
                      <Text style={styles.emptyText}>Tu mesa esta vacia.</Text>
                    ) : (
                      myLivePlayer.table.map((item, index) => (
                        <View key={`table-${item}-${index}`} style={styles.tableChip}>
                          <Text style={styles.tableChipText}>{formatTableItem(item)}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              </View>
            )}

            <View style={styles.playerList}>
              {livePlayers.map((player, index) => (
                <View key={`${player.name}-${index}-live`} style={styles.livePlayerCard}>
                  <Text style={styles.playerName}>
                    {player.name}
                    {index === liveCp ? ' - turno' : ''}
                  </Text>
                  <Text style={styles.playerMeta}>Mano: {player.hand?.length ?? 0}</Text>
                  <Text style={styles.playerMeta}>Mesa: {player.table?.length ?? 0} ingredientes</Text>
                  <Text style={styles.playerMeta}>Perchero: {player.perchero?.length ?? 0}</Text>
                  <Text style={styles.playerMeta}>Sombreros: {player.mainHats?.length ?? 0}</Text>
                </View>
              ))}
            </View>

            <View style={styles.rivalsBoard}>
              {livePlayers.map((player, index) => {
                const target = player?.burgers?.[player?.currentBurger || 0] || [];
                return (
                  <View key={`${player.name}-${index}-board`} style={styles.rivalBoardCard}>
                    <Text style={styles.rivalBoardTitle}>{player.name}{index === liveCp ? ' - turno' : ''}</Text>
                    <Text style={styles.playerMeta}>Burger actual: {(player?.currentBurger || 0) + 1}</Text>
                    <View style={styles.rivalBoardBody}>
                      <RenderBurgerVisual target={target} table={player?.table || []} compact badge={(player?.currentBurger || 0) + 1} />
                      <View style={styles.rivalMetaColumn}>
                        <Text style={styles.playerMeta}>Mesa: {player.table?.length ?? 0}</Text>
                        <Text style={styles.playerMeta}>Mano: {player.hand?.length ?? 0}</Text>
                        <Text style={styles.playerMeta}>Sombreros: {player.mainHats?.length ?? 0}</Text>
                        <Text style={styles.playerMeta}>Perchero: {player.perchero?.length ?? 0}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.bodyText}>Esperando el primer `stateUpdate` del host para mostrar la partida en vivo.</Text>
        )}
        {isMyTurn && (
          <Pressable
            style={styles.passTurnButton}
            onPress={() => {
              onSendAction?.({ type: 'passTurn' });
              resetCardFlow();
              setHatDraft(null);
            }}
          >
            <Text style={styles.passTurnButtonText}>Pasar turno</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Objetivos por jugador</Text>
        <View style={styles.tabsRow}>
          {objectivesByPlayer.map((entry, index) => {
            const active = index === selectedIdx;
            return (
              <Pressable key={`${entry.player.name}-${entry.player.idx}`} onPress={() => setSelectedIdx(index)} style={[styles.playerTab, active && styles.playerTabActive]}>
                <Text style={[styles.playerTabText, active && styles.playerTabTextActive]}>{entry.player.name}</Text>
              </Pressable>
            );
          })}
        </View>

        {currentObjective ? (
          <View style={styles.objectivePanel}>
            <Text style={styles.objectiveTitle}>Hamburguesas de {currentObjective.player.name}</Text>
            <View style={styles.burgerGrid}>
              {currentObjective.burgers.map((burger, burgerIndex) => (
                <RenderBurgerVisual key={`goal-${burgerIndex}`} target={burger.filter((item) => item !== 'BUN TOP' && item !== 'BUN BOT').map((item) => normalizeIngredientKey(item))} table={[]} badge={burgerIndex + 1} compact />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado del port nativo</Text>
        <Text style={styles.bodyText}>Ya abrimos automatico esta vista con el evento real `gameStarted` del servidor.</Text>
        <Text style={styles.bodyText}>Aqui se muestran jugadores, sombreros y objetivos generados desde la configuracion real de la sala.</Text>
        <Text style={styles.bodyText}>Todavia el gameplay completo sigue mejor en la version web, asi que deje el salto rapido abajo.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chat nativo</Text>
        <View style={styles.chatList}>
          {chatMessages.length === 0 ? (
            <Text style={styles.emptyText}>Todavia no hay mensajes.</Text>
          ) : (
            chatMessages.map((msg, index) => (
              <View key={`${msg.timestamp || index}-${index}`} style={styles.chatBubble}>
                <Text style={styles.chatAuthor}>{msg.playerName || 'Jugador'}</Text>
                <Text style={styles.chatText}>{msg.text || ''}</Text>
              </View>
            ))
          )}
        </View>
        <View style={styles.chatComposer}>
          <TextInput
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Escribe un mensaje"
            placeholderTextColor="#6f7697"
            style={styles.chatInput}
          />
          <Pressable
            style={styles.chatSendButton}
            onPress={() => {
              const clean = chatInput.trim();
              if (!clean) return;
              onSendChat?.(clean);
              setChatInput('');
            }}
          >
            <Text style={styles.chatSendButtonText}>Enviar</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.primaryButton} onPress={onOpenWebGame}>
        <Text style={styles.primaryButtonText}>Abrir gameplay web completo</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={onBackToLobby}>
        <Text style={styles.secondaryButtonText}>Volver al lobby nativo</Text>
      </Pressable>

      <Pressable style={styles.ghostButton} onPress={onLeaveRoom}>
        <Text style={styles.ghostButtonText}>Salir de la sala</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 32, gap: 16 },
  heroCard: { backgroundColor: '#16213e', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,0.14)', padding: 18 },
  heroTitle: { color: '#FFD700', fontSize: 28, fontWeight: '900', marginBottom: 8 },
  heroText: { color: '#d8ddf3', fontSize: 15, lineHeight: 22 },
  heroSubtext: { color: '#8a8fa8', fontSize: 13, marginTop: 8 },
  section: { backgroundColor: '#16213e', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 18 },
  sectionTitle: { color: '#FFD700', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  playerList: { gap: 10 },
  playerCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14 },
  playerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playerHatImage: { width: 44, height: 44 },
  livePlayerCard: { backgroundColor: '#1d2a4a', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', padding: 14 },
  playerName: { color: '#fff', fontSize: 15, fontWeight: '800' },
  playerMeta: { color: '#8a8fa8', fontSize: 12, marginTop: 4 },
  boardHero: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  boardHeroColumn: { flex: 1, minWidth: 150, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12, alignItems: 'center' },
  boardHeroLabel: { color: '#FFD700', fontSize: 14, fontWeight: '800' },
  boardHeroSubtext: { color: '#8a8fa8', fontSize: 12, marginTop: 4, marginBottom: 8 },
  boardSplit: { gap: 12 },
  boardPanel: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12 },
  rivalsBoard: { gap: 10, marginTop: 12 },
  rivalBoardCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12 },
  rivalBoardTitle: { color: '#fff1b3', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  rivalBoardBody: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rivalMetaColumn: { flex: 1, gap: 4 },
  liveMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metricCard: { flexGrow: 1, minWidth: 96, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12 },
  metricLabel: { color: '#8a8fa8', fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  metricValue: { color: '#FFD700', fontSize: 18, fontWeight: '900' },
  winnerBanner: { backgroundColor: 'rgba(255,215,0,0.10)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,215,0,0.30)', padding: 14, marginBottom: 12 },
  winnerTitle: { color: '#fff1b3', fontSize: 12, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' },
  winnerText: { color: '#FFD700', fontSize: 22, fontWeight: '900' },
  myStateCard: { backgroundColor: 'rgba(78,205,196,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(78,205,196,0.25)', padding: 14, marginBottom: 12 },
  myStateTitle: { color: '#4ecdc4', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  myStateText: { color: '#d8ddf3', fontSize: 13, lineHeight: 20, marginBottom: 4 },
  liveColumns: { gap: 12, marginBottom: 12 },
  liveColumnCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14 },
  liveColumnTitle: { color: '#fff1b3', fontSize: 14, fontWeight: '800', marginBottom: 10 },
  cardChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardChip: { backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,215,0,0.22)', paddingHorizontal: 10, paddingVertical: 8 },
  cardChipActive: { backgroundColor: 'rgba(255,215,0,0.18)', borderColor: '#FFD700' },
  cardChipText: { color: '#fff1b3', fontSize: 12, fontWeight: '700' },
  cardChipTextActive: { color: '#FFD700' },
  tableChip: { backgroundColor: 'rgba(78,205,196,0.08)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(78,205,196,0.22)', paddingHorizontal: 10, paddingVertical: 8 },
  tableChipText: { color: '#9ff6ef', fontSize: 12, fontWeight: '700' },
  emptyText: { color: '#8a8fa8', fontSize: 12, lineHeight: 18 },
  actionPanel: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', gap: 10 },
  actionPanelTitle: { color: '#FFD700', fontSize: 13, fontWeight: '800' },
  actionPanelText: { color: '#d8ddf3', fontSize: 13, lineHeight: 19 },
  actionHint: { color: '#8a8fa8', fontSize: 12, lineHeight: 18 },
  inlineActionGroup: { gap: 8 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { backgroundColor: 'rgba(78,205,196,0.08)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(78,205,196,0.22)', paddingHorizontal: 10, paddingVertical: 8 },
  optionChipText: { color: '#9ff6ef', fontSize: 12, fontWeight: '700' },
  optionChipActive: { backgroundColor: 'rgba(255,215,0,0.14)', borderColor: '#FFD700' },
  optionChipTextActive: { color: '#FFD700' },
  inlineActionButton: { backgroundColor: '#FFD700', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  inlineActionButtonText: { color: '#111', fontSize: 13, fontWeight: '900' },
  inlineActionButtonDisabled: { opacity: 0.4 },
  inlineDiscardButton: { backgroundColor: '#2a2a4a', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  inlineDiscardButtonText: { color: '#d8ddf3', fontSize: 13, fontWeight: '800' },
  urgentPanel: { marginTop: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,138,128,0.30)', backgroundColor: 'rgba(255,138,128,0.08)', padding: 12, gap: 8 },
  urgentTitle: { color: '#ffb3ac', fontSize: 13, fontWeight: '800' },
  hatActionCard: { minWidth: 150, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 10, gap: 8 },
  hatActionName: { color: '#fff1b3', fontSize: 13, fontWeight: '800' },
  hatActionButtons: { flexDirection: 'row', gap: 8 },
  smallActionButton: { flex: 1, backgroundColor: '#FFD700', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  smallActionButtonText: { color: '#111', fontSize: 12, fontWeight: '900' },
  smallActionButtonAlt: { flex: 1, backgroundColor: '#4ecdc4', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  smallActionButtonAltText: { color: '#04101c', fontSize: 12, fontWeight: '900' },
  tabsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  playerTab: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  playerTabActive: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.08)' },
  playerTabText: { color: '#aeb4d0', fontSize: 12, fontWeight: '700' },
  playerTabTextActive: { color: '#FFD700' },
  objectivePanel: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14 },
  objectiveTitle: { color: '#fff1b3', fontSize: 15, fontWeight: '800', marginBottom: 12 },
  burgerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  visualBurgerCard: { width: 118, minHeight: 170, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1d2a4a', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 8, position: 'relative' },
  visualBurgerCardCompact: { width: 106, minHeight: 154 },
  visualBurgerBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#FFD700', color: '#111', width: 28, height: 28, borderRadius: 14, textAlign: 'center', lineHeight: 28, fontWeight: '900', fontSize: 13, overflow: 'hidden' },
  visualBurgerStack: { alignItems: 'center', justifyContent: 'center' },
  visualBurgerLayer: { width: 84, height: 24, marginTop: -8 },
  visualBurgerLayerCompact: { width: 72, height: 20, marginTop: -7 },
  ingredientIconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ingredientNeedCard: { width: 92, alignItems: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', paddingVertical: 10, paddingHorizontal: 6 },
  ingredientNeedImage: { width: 42, height: 42, marginBottom: 8 },
  ingredientNeedText: { color: '#d8ddf3', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  hatBoardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hatBoardCard: { width: 98, alignItems: 'center', borderRadius: 14, backgroundColor: 'rgba(255,215,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.22)', paddingVertical: 10, paddingHorizontal: 8 },
  hatBoardCardMuted: { width: 98, alignItems: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingVertical: 10, paddingHorizontal: 8 },
  hatBoardImage: { width: 48, height: 48, marginBottom: 8 },
  hatBoardText: { color: '#fff1b3', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  hatBoardTextMuted: { color: '#aeb4d0', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  bodyText: { color: '#d8ddf3', fontSize: 14, lineHeight: 21, marginBottom: 8 },
  chatList: { gap: 8, marginBottom: 12 },
  chatBubble: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12 },
  chatAuthor: { color: '#4ecdc4', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  chatText: { color: '#d8ddf3', fontSize: 13, lineHeight: 19 },
  chatComposer: { gap: 10 },
  chatInput: { backgroundColor: '#0f1117', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, color: '#fff', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  chatSendButton: { backgroundColor: '#4ecdc4', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  chatSendButtonText: { color: '#04101c', fontSize: 15, fontWeight: '900' },
  passTurnButton: { backgroundColor: '#2a2a4a', borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  passTurnButtonText: { color: '#FFD700', fontSize: 14, fontWeight: '900' },
  primaryButton: { backgroundColor: '#FFD700', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#111', fontSize: 16, fontWeight: '900' },
  secondaryButton: { backgroundColor: '#00BCD4', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#04101c', fontSize: 16, fontWeight: '900' },
  ghostButton: { alignItems: 'center', paddingVertical: 10 },
  ghostButtonText: { color: '#ff8a80', fontSize: 14, fontWeight: '800' },
});
