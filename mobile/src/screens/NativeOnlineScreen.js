import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const SAMPLE_ROOMS = [
  { code: 'BGR21', name: 'Burger Masters', mode: 'Clone', players: 2, isPublic: true },
  { code: 'POL77', name: 'Hungry Friends', mode: 'Staircase', players: 3, isPublic: true },
  { code: 'CHE55', name: 'Chaos Night', mode: 'Chaotic', players: 4, isPublic: true },
];

const SAMPLE_PLAYERS = [
  { id: 1, name: 'Luis', hat: '🤠', host: true },
  { id: 2, name: 'Chef Bot', hat: '🎩', host: false },
  { id: 3, name: 'Mila', hat: '🦞', host: false },
];

export function NativeOnlineScreen({ onOpenWebGame }) {
  const [tab, setTab] = useState('create');
  const [roomName, setRoomName] = useState('Hungry Room');
  const [joinCode, setJoinCode] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(SAMPLE_ROOMS[0]);

  const roomSummary = useMemo(() => {
    if (!selectedRoom) return null;
    return `${selectedRoom.mode} · ${selectedRoom.players}/4`;
  }, [selectedRoom]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Online nativo</Text>
        <Text style={styles.heroText}>
          Esta pantalla ya imita el flujo online en React Native: crear sala, unirse por código y ver una preview del lobby sin depender todavía del layout web.
        </Text>
      </View>

      <View style={styles.tabsRow}>
        {[
          { id: 'create', label: 'Crear' },
          { id: 'lobby', label: 'Lobby' },
          { id: 'join', label: 'Código' },
        ].map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setTab(item.id)}
            style={[styles.tab, tab === item.id && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === item.id && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'create' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crear sala</Text>
          <TextInput
            value={roomName}
            onChangeText={setRoomName}
            placeholder="Nombre de sala"
            placeholderTextColor="#6f7697"
            style={styles.input}
          />
          <View style={styles.toggleRow}>
            <View style={[styles.toggleCard, styles.toggleCardActive]}>
              <Text style={styles.toggleTitle}>🌐 Pública</Text>
              <Text style={styles.toggleText}>Visible en el lobby</Text>
            </View>
            <View style={styles.toggleCard}>
              <Text style={styles.toggleTitleMuted}>🔒 Privada</Text>
              <Text style={styles.toggleText}>Solo con código</Text>
            </View>
          </View>
          <Pressable style={styles.primaryButton} onPress={onOpenWebGame}>
            <Text style={styles.primaryButtonText}>Seguir en juego web</Text>
          </Pressable>
        </View>
      )}

      {tab === 'lobby' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Salas públicas</Text>
          <View style={styles.roomList}>
            {SAMPLE_ROOMS.map((room) => {
              const active = selectedRoom?.code === room.code;
              return (
                <Pressable
                  key={room.code}
                  onPress={() => setSelectedRoom(room)}
                  style={[styles.roomCard, active && styles.roomCardActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roomName, active && { color: '#FFD700' }]}>{room.name}</Text>
                    <Text style={styles.roomMeta}>{room.mode} · {room.players}/4 jugadores</Text>
                  </View>
                  <Text style={styles.roomCode}>{room.code}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {tab === 'join' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entrar por código</Text>
          <TextInput
            value={joinCode}
            onChangeText={setJoinCode}
            placeholder="ABCD1"
            autoCapitalize="characters"
            placeholderTextColor="#6f7697"
            style={styles.input}
          />
          <Pressable style={styles.secondaryButton} onPress={onOpenWebGame}>
            <Text style={styles.secondaryButtonText}>Abrir sala en web</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preview del lobby</Text>
        <View style={styles.previewHeader}>
          <View>
            <Text style={styles.previewRoomName}>{selectedRoom?.name || roomName}</Text>
            <Text style={styles.previewRoomMeta}>{roomSummary || 'Clone · 1/4'}</Text>
          </View>
          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeText}>{selectedRoom?.code || 'NEW01'}</Text>
          </View>
        </View>

        <View style={styles.playersList}>
          {SAMPLE_PLAYERS.map((player) => (
            <View key={player.id} style={styles.playerRow}>
              <View style={styles.playerAvatar}>
                <Text style={styles.playerAvatarText}>{player.id}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>{player.name} {player.host ? '👑' : ''}</Text>
                <Text style={styles.playerMeta}>Sombrero {player.hat}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,188,212,0.18)',
    padding: 18,
  },
  heroTitle: {
    color: '#4ecdc4',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroText: {
    color: '#d8ddf3',
    fontSize: 15,
    lineHeight: 22,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tab: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,215,0,0.08)',
  },
  tabText: {
    color: '#aeb4d0',
    fontSize: 14,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#FFD700',
  },
  section: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  toggleCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  toggleCardActive: {
    borderColor: '#00BCD4',
    backgroundColor: 'rgba(0,188,212,0.10)',
  },
  toggleTitle: {
    color: '#4ecdc4',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  toggleTitleMuted: {
    color: '#d8ddf3',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  toggleText: {
    color: '#8a8fa8',
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    backgroundColor: '#00BCD4',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#04101c',
    fontSize: 16,
    fontWeight: '900',
  },
  roomList: {
    gap: 10,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  roomCardActive: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,215,0,0.06)',
  },
  roomName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  roomMeta: {
    color: '#8a8fa8',
    fontSize: 12,
    marginTop: 3,
  },
  roomCode: {
    color: '#4ecdc4',
    fontSize: 14,
    fontWeight: '900',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  previewRoomName: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '900',
  },
  previewRoomMeta: {
    color: '#8a8fa8',
    fontSize: 12,
    marginTop: 2,
  },
  codeBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.18)',
  },
  codeBadgeText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '900',
  },
  playersList: {
    gap: 10,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
  },
  playerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    color: '#111',
    fontWeight: '900',
    fontSize: 14,
  },
  playerName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  playerMeta: {
    color: '#8a8fa8',
    fontSize: 12,
    marginTop: 2,
  },
});
