import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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

export function NativeGameScreen({ setup, online, gameSession, chatMessages = [], onSendChat, onBackToLobby, onOpenWebGame, onLeaveRoom }) {
  const objectivesByPlayer = useMemo(() => buildObjectives(gameSession), [gameSession]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const currentObjective = objectivesByPlayer[selectedIdx] || objectivesByPlayer[0];
  const currentPlayerName = setup.playerName;
  const livePlayers = gameSession.liveState?.players || [];
  const liveCp = gameSession.liveState?.cp ?? null;
  const liveDeckCount = gameSession.liveState?.deck?.length ?? null;
  const liveDiscardCount = gameSession.liveState?.discard?.length ?? null;
  const liveWinner = gameSession.liveState?.winner || null;
  const myLivePlayer = livePlayers.find((player) => player?.name === currentPlayerName);

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
                <Text style={styles.playerName}>{player.name}{isMe ? ' (tu)' : ''}</Text>
                <Text style={styles.playerMeta}>Sombrero: {HAT_LABELS[hat] || hat || 'pendiente'}</Text>
              </View>
            );
          })}
        </View>
      </View>

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
                      myLivePlayer.hand.map((card, index) => (
                        <View key={`hand-${card.id || index}`} style={styles.cardChip}>
                          <Text style={styles.cardChipText}>{formatCard(card)}</Text>
                        </View>
                      ))
                    )}
                  </View>
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
          </>
        ) : (
          <Text style={styles.bodyText}>Esperando el primer `stateUpdate` del host para mostrar la partida en vivo.</Text>
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
                <View key={`goal-${burgerIndex}`} style={styles.burgerCard}>
                  <Text style={styles.burgerBadge}>{burgerIndex + 1}</Text>
                  {burger.map((item, itemIndex) => (
                    <Text key={`${item}-${itemIndex}`} style={styles.burgerItem}>{item}</Text>
                  ))}
                </View>
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
  livePlayerCard: { backgroundColor: '#1d2a4a', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', padding: 14 },
  playerName: { color: '#fff', fontSize: 15, fontWeight: '800' },
  playerMeta: { color: '#8a8fa8', fontSize: 12, marginTop: 4 },
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
  cardChipText: { color: '#fff1b3', fontSize: 12, fontWeight: '700' },
  tableChip: { backgroundColor: 'rgba(78,205,196,0.08)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(78,205,196,0.22)', paddingHorizontal: 10, paddingVertical: 8 },
  tableChipText: { color: '#9ff6ef', fontSize: 12, fontWeight: '700' },
  emptyText: { color: '#8a8fa8', fontSize: 12, lineHeight: 18 },
  tabsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  playerTab: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  playerTabActive: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.08)' },
  playerTabText: { color: '#aeb4d0', fontSize: 12, fontWeight: '700' },
  playerTabTextActive: { color: '#FFD700' },
  objectivePanel: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14 },
  objectiveTitle: { color: '#fff1b3', fontSize: 15, fontWeight: '800', marginBottom: 12 },
  burgerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  burgerCard: { width: 102, alignItems: 'center', backgroundColor: '#1d2a4a', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 8, position: 'relative' },
  burgerBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#FFD700', color: '#111', width: 24, height: 24, borderRadius: 12, textAlign: 'center', lineHeight: 24, fontWeight: '900', fontSize: 12, overflow: 'hidden' },
  burgerItem: { color: '#d8ddf3', fontSize: 11, lineHeight: 16, marginVertical: 1, fontWeight: '700', textAlign: 'center' },
  bodyText: { color: '#d8ddf3', fontSize: 14, lineHeight: 21, marginBottom: 8 },
  chatList: { gap: 8, marginBottom: 12 },
  chatBubble: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12 },
  chatAuthor: { color: '#4ecdc4', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  chatText: { color: '#d8ddf3', fontSize: 13, lineHeight: 19 },
  chatComposer: { gap: 10 },
  chatInput: { backgroundColor: '#0f1117', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, color: '#fff', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  chatSendButton: { backgroundColor: '#4ecdc4', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  chatSendButtonText: { color: '#04101c', fontSize: 15, fontWeight: '900' },
  primaryButton: { backgroundColor: '#FFD700', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#111', fontSize: 16, fontWeight: '900' },
  secondaryButton: { backgroundColor: '#00BCD4', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#04101c', fontSize: 16, fontWeight: '900' },
  ghostButton: { alignItems: 'center', paddingVertical: 10 },
  ghostButtonText: { color: '#ff8a80', fontSize: 14, fontWeight: '800' },
});
