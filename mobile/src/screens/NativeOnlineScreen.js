import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const HAT_OPTIONS = [
  { id: 'espanol', label: 'Espanol' },
  { id: 'ingles', label: 'English' },
  { id: 'frances', label: 'Francais' },
  { id: 'italiano', label: 'Italiano' },
  { id: 'aleman', label: 'Deutsch' },
  { id: 'portugues', label: 'Portugues' },
];

function summarizeConfig(setup) {
  if (setup.gameMode === 'caotico') {
    return `Caotico · caos ${setup.chaosLevel} · ${setup.burgerCount} burgers ref`;
  }
  if (setup.gameMode === 'escalera') {
    return `Escalera · ${setup.burgerCount} burgers · ascendente`;
  }
  return `Clon · ${setup.burgerCount} burgers · ${setup.ingredientCount} ingredientes`;
}

export function NativeOnlineScreen({
  setup,
  online,
  onChangeOnline,
  onCreateRoom,
  onJoinByCode,
  onJoinPublicRoom,
  onRefreshRooms,
  onLeaveRoom,
  onPickHat,
  onStartRoom,
  onOpenWebGame,
}) {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const myPlayer = online.players.find((player) => player.idx === online.myIdx);
  const summary = useMemo(() => summarizeConfig(setup), [setup]);
  const myHat = online.hatPicks[setup.playerName] || setup.hat;
  const everyoneReady = online.players.length > 0 && online.players.every((player) => online.hatPicks[player.name]);

  if (online.roomCode) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Lobby nativo real</Text>
          <Text style={styles.heroText}>Sala {online.roomCode} · {online.roomName || setup.roomName || 'Sin nombre'}</Text>
          <Text style={styles.heroSubtext}>{online.isHost ? 'Eres host' : 'Unido como jugador'} · {summary}</Text>
        </View>

        {online.error ? <Text style={styles.errorText}>{online.error}</Text> : null}
        {online.status ? <Text style={styles.infoText}>{online.status}</Text> : null}
        {online.started ? <Text style={styles.successText}>La partida ya fue iniciada en el servidor.</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jugadores conectados</Text>
          <View style={styles.playersList}>
            {online.players.map((player) => {
              const pickedHat = online.hatPicks[player.name];
              const isMe = player.idx === online.myIdx;
              return (
                <View key={`${player.name}-${player.idx}`} style={styles.playerRow}>
                  <View style={styles.playerAvatar}><Text style={styles.playerAvatarText}>{player.idx + 1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerName}>{player.name}{player.host ? ' HOST' : ''}{isMe ? ' (tu)' : ''}</Text>
                    <Text style={styles.playerMeta}>{pickedHat ? `Sombrero: ${pickedHat}` : 'Falta sombrero'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu sombrero</Text>
          <View style={styles.grid}>
            {HAT_OPTIONS.map((hat) => {
              const active = myHat === hat.id;
              return (
                <Pressable key={hat.id} onPress={() => onPickHat(hat.id)} style={[styles.hatChip, active && styles.hatChipActive]}>
                  <Text style={[styles.hatChipText, active && styles.hatChipTextActive]}>{hat.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuracion real de partida</Text>
          <Text style={styles.configText}>Jugador: {setup.playerName || 'Sin nombre'}</Text>
          <Text style={styles.configText}>Modo: {setup.gameMode}</Text>
          <Text style={styles.configText}>Resumen: {summary}</Text>
          {setup.gameMode === 'clon' && (
            <Text style={styles.configText}>Piscina: {setup.ingredientPool.join(', ')}</Text>
          )}
        </View>

        {online.isHost && !online.started && (
          <Pressable
            onPress={onStartRoom}
            disabled={!everyoneReady || online.loading}
            style={[styles.primaryButton, (!everyoneReady || online.loading) && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>{online.loading ? 'Iniciando...' : 'Emitir startGame real'}</Text>
          </Pressable>
        )}

        <Pressable style={styles.secondaryButton} onPress={onOpenWebGame}>
          <Text style={styles.secondaryButtonText}>Abrir juego web</Text>
        </Pressable>

        <Pressable style={styles.ghostButton} onPress={onLeaveRoom}>
          <Text style={styles.ghostButtonText}>Salir de la sala</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Online nativo real</Text>
        <Text style={styles.heroText}>Estas vistas ya usan sockets reales para listar salas, crear, unirse y recibir jugadores del servidor.</Text>
        <Text style={styles.heroSubtext}>Setup activo: {summary}</Text>
      </View>

      {online.error ? <Text style={styles.errorText}>{online.error}</Text> : null}
      {online.status ? <Text style={styles.infoText}>{online.status}</Text> : null}

      <View style={styles.tabsRow}>
        {[
          { id: 'create', label: 'Crear' },
          { id: 'lobby', label: 'Lobby' },
          { id: 'join', label: 'Codigo' },
        ].map((item) => (
          <Pressable key={item.id} onPress={() => onChangeOnline({ tab: item.id, error: '' })} style={[styles.tab, online.tab === item.id && styles.tabActive]}>
            <Text style={[styles.tabText, online.tab === item.id && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {online.tab === 'create' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crear sala real</Text>
          <Text style={styles.configText}>Se usara el setup actual para iniciar la partida.</Text>
          <Pressable style={styles.primaryButton} onPress={onCreateRoom}>
            <Text style={styles.primaryButtonText}>Crear sala</Text>
          </Pressable>
        </View>
      )}

      {online.tab === 'lobby' && (
        <View style={styles.section}>
          <View style={styles.refreshRow}>
            <Text style={styles.sectionTitle}>Salas publicas</Text>
            <Pressable onPress={onRefreshRooms}><Text style={styles.linkText}>Refrescar</Text></Pressable>
          </View>
          <View style={styles.roomList}>
            {online.rooms.length === 0 ? (
              <Text style={styles.configText}>No hay salas activas ahora mismo.</Text>
            ) : online.rooms.map((room) => (
              <Pressable key={room.code} onPress={() => onJoinPublicRoom(room.code)} style={styles.roomCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roomName}>{room.roomName || room.code}</Text>
                  <Text style={styles.roomMeta}>{room.mode || 'clon'} · {room.playerCount}/4</Text>
                </View>
                <Text style={styles.roomCode}>{room.code}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {online.tab === 'join' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unirse por codigo</Text>
          <TextInput
            value={joinCodeInput}
            onChangeText={setJoinCodeInput}
            placeholder="ABCD1"
            autoCapitalize="characters"
            placeholderTextColor="#6f7697"
            style={styles.input}
          />
          <Pressable style={styles.secondaryButton} onPress={() => onJoinByCode(joinCodeInput)}>
            <Text style={styles.secondaryButtonText}>Unirse</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 32, gap: 16 },
  heroCard: { backgroundColor: '#16213e', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,188,212,0.18)', padding: 18 },
  heroTitle: { color: '#4ecdc4', fontSize: 28, fontWeight: '900', marginBottom: 8 },
  heroText: { color: '#d8ddf3', fontSize: 15, lineHeight: 22 },
  heroSubtext: { color: '#8a8fa8', fontSize: 13, marginTop: 8 },
  tabsRow: { flexDirection: 'row', gap: 10 },
  tab: { flex: 1, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.08)' },
  tabText: { color: '#aeb4d0', fontSize: 14, fontWeight: '800' },
  tabTextActive: { color: '#FFD700' },
  section: { backgroundColor: '#16213e', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 18 },
  sectionTitle: { color: '#FFD700', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  configText: { color: '#d8ddf3', fontSize: 14, lineHeight: 20, marginBottom: 6 },
  input: { backgroundColor: '#0f1117', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, color: '#fff', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  refreshRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  linkText: { color: '#4ecdc4', fontSize: 13, fontWeight: '800' },
  roomList: { gap: 10 },
  roomCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14 },
  roomName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  roomMeta: { color: '#8a8fa8', fontSize: 12, marginTop: 3 },
  roomCode: { color: '#4ecdc4', fontSize: 14, fontWeight: '900' },
  playersList: { gap: 10 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12 },
  playerAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center' },
  playerAvatarText: { color: '#111', fontWeight: '900', fontSize: 14 },
  playerName: { color: '#fff', fontSize: 15, fontWeight: '800' },
  playerMeta: { color: '#8a8fa8', fontSize: 12, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hatChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  hatChipActive: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.08)' },
  hatChipText: { color: '#aeb4d0', fontSize: 12, fontWeight: '700' },
  hatChipTextActive: { color: '#FFD700' },
  primaryButton: { backgroundColor: '#FFD700', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4, marginBottom: 10 },
  primaryButtonText: { color: '#111', fontSize: 16, fontWeight: '900' },
  secondaryButton: { backgroundColor: '#00BCD4', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  secondaryButtonText: { color: '#04101c', fontSize: 16, fontWeight: '900' },
  ghostButton: { alignItems: 'center', paddingVertical: 10 },
  ghostButtonText: { color: '#ff8a80', fontSize: 14, fontWeight: '800' },
  errorText: { color: '#ff8a80', fontSize: 13, fontWeight: '700' },
  infoText: { color: '#8a8fa8', fontSize: 13, fontWeight: '700' },
  successText: { color: '#4CAF50', fontSize: 13, fontWeight: '800' },
  disabledButton: { opacity: 0.45 },
});
