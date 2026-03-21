import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const LANGS = [
  { id: 'espanol', label: 'Espanol', accent: '#FFB703' },
  { id: 'ingles', label: 'English', accent: '#9CA3AF' },
  { id: 'frances', label: 'Francais', accent: '#FF6B4A' },
  { id: 'italiano', label: 'Italiano', accent: '#E9D8A6' },
  { id: 'aleman', label: 'Deutsch', accent: '#4CAF50' },
  { id: 'portugues', label: 'Portugues', accent: '#9D6B53' },
];

const MODES = [
  { id: 'clon', label: 'Clone', desc: 'All equal' },
  { id: 'escalera', label: 'Staircase', desc: 'Ascending' },
  { id: 'caotico', label: 'Chaotic', desc: 'All random' },
];

const CLONE_INGS = ['lettuce', 'tomato', 'beef', 'cheese', 'chicken', 'egg', 'onion', 'avocado'];
const ING_LABELS = {
  lettuce: 'Lettuce', tomato: 'Tomato', beef: 'Beef', cheese: 'Cheese',
  chicken: 'Chicken', egg: 'Egg', onion: 'Onion', avocado: 'Avocado',
};

function buildPreview(setup) {
  const makeBurger = (count, hidden = false) => {
    const selected = setup.ingredientPool.slice(0, Math.max(2, Math.min(count, setup.ingredientPool.length)));
    return ['BUN', ...(hidden ? selected.map(() => '?') : selected), 'BUN'];
  };

  if (setup.gameMode === 'caotico') {
    return [makeBurger(3, true), makeBurger(4, true), makeBurger(5, true)];
  }
  if (setup.gameMode === 'escalera') {
    return Array.from({ length: setup.burgerCount }, (_, index) => makeBurger(2 + index));
  }
  return Array.from({ length: setup.burgerCount }, () => makeBurger(setup.ingredientCount));
}

export function NativeSetupScreen({ setup, onChangeSetup, onContinueOnline, onOpenWebGame }) {
  const previewBurgers = useMemo(() => buildPreview(setup), [setup]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Setup nativo real</Text>
        <Text style={styles.heroText}>
          Esta configuracion ya alimenta el online nativo. Lo que elijas aqui se usa luego en el lobby movil como configuracion real de partida.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jugador y sala</Text>
        <TextInput
          value={setup.playerName}
          onChangeText={(value) => onChangeSetup({ playerName: value })}
          placeholder="Tu nombre"
          placeholderTextColor="#6f7697"
          style={styles.input}
        />
        <TextInput
          value={setup.roomName}
          onChangeText={(value) => onChangeSetup({ roomName: value })}
          placeholder="Nombre de sala"
          placeholderTextColor="#6f7697"
          style={styles.input}
        />
        <View style={styles.rowGap}>
          <Pressable
            onPress={() => onChangeSetup({ isPublic: true })}
            style={[styles.visibilityCard, setup.isPublic && styles.visibilityCardActive]}
          >
            <Text style={[styles.visibilityTitle, setup.isPublic && styles.visibilityTitleActive]}>Publica</Text>
            <Text style={styles.visibilityText}>Visible en el lobby</Text>
          </Pressable>
          <Pressable
            onPress={() => onChangeSetup({ isPublic: false })}
            style={[styles.visibilityCard, !setup.isPublic && styles.visibilityCardActive]}
          >
            <Text style={[styles.visibilityTitle, !setup.isPublic && styles.visibilityTitleActive]}>Privada</Text>
            <Text style={styles.visibilityText}>Solo con codigo</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sombrero principal</Text>
        <View style={styles.grid}>
          {LANGS.map((lang) => {
            const active = setup.hat === lang.id;
            return (
              <Pressable
                key={lang.id}
                onPress={() => onChangeSetup({ hat: lang.id })}
                style={[styles.langCard, active && { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.08)' }]}
              >
                <Text style={[styles.langLabel, { color: active ? '#FFD700' : lang.accent }]}>{lang.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modo de juego</Text>
        <View style={styles.modeColumn}>
          {MODES.map((mode) => {
            const active = setup.gameMode === mode.id;
            return (
              <Pressable key={mode.id} onPress={() => onChangeSetup({ gameMode: mode.id })} style={[styles.modeCard, active && styles.modeCardActive]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modeLabel, active && { color: '#FFD700' }]}>{mode.label}</Text>
                  <Text style={styles.modeDesc}>{mode.desc}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuracion real</Text>
        <View style={styles.counterRow}>
          <Text style={styles.counterLabel}>Hamburguesas</Text>
          <View style={styles.counterControls}>
            <Pressable onPress={() => onChangeSetup({ burgerCount: Math.max(1, setup.burgerCount - 1) })} style={styles.counterBtn}><Text style={styles.counterBtnText}>-</Text></Pressable>
            <Text style={styles.counterValue}>{setup.burgerCount}</Text>
            <Pressable onPress={() => onChangeSetup({ burgerCount: Math.min(4, setup.burgerCount + 1) })} style={styles.counterBtn}><Text style={styles.counterBtnText}>+</Text></Pressable>
          </View>
        </View>
        {setup.gameMode === 'clon' && (
          <View style={styles.counterRow}>
            <Text style={styles.counterLabel}>Ingredientes</Text>
            <View style={styles.counterControls}>
              <Pressable onPress={() => onChangeSetup({ ingredientCount: Math.max(2, setup.ingredientCount - 1) })} style={styles.counterBtn}><Text style={styles.counterBtnText}>-</Text></Pressable>
              <Text style={styles.counterValue}>{setup.ingredientCount}</Text>
              <Pressable onPress={() => onChangeSetup({ ingredientCount: Math.min(8, setup.ingredientCount + 1) })} style={styles.counterBtn}><Text style={styles.counterBtnText}>+</Text></Pressable>
            </View>
          </View>
        )}
        {setup.gameMode === 'caotico' && (
          <View style={styles.counterRow}>
            <Text style={styles.counterLabel}>Caos</Text>
            <View style={styles.counterControls}>
              <Pressable onPress={() => onChangeSetup({ chaosLevel: Math.max(1, setup.chaosLevel - 1) })} style={styles.counterBtn}><Text style={styles.counterBtnText}>-</Text></Pressable>
              <Text style={styles.counterValue}>{setup.chaosLevel}</Text>
              <Pressable onPress={() => onChangeSetup({ chaosLevel: Math.min(3, setup.chaosLevel + 1) })} style={styles.counterBtn}><Text style={styles.counterBtnText}>+</Text></Pressable>
            </View>
          </View>
        )}
        <View style={styles.counterRow}>
          <Text style={styles.counterLabel}>Rivales IA</Text>
          <View style={styles.counterControls}>
            <Pressable onPress={() => onChangeSetup({ aiCount: Math.max(1, setup.aiCount - 1) })} style={styles.counterBtn}><Text style={styles.counterBtnText}>-</Text></Pressable>
            <Text style={styles.counterValue}>{setup.aiCount}</Text>
            <Pressable onPress={() => onChangeSetup({ aiCount: Math.min(3, setup.aiCount + 1) })} style={styles.counterBtn}><Text style={styles.counterBtnText}>+</Text></Pressable>
          </View>
        </View>
      </View>

      {setup.gameMode === 'clon' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Piscina de ingredientes</Text>
          <View style={styles.poolWrap}>
            {CLONE_INGS.map((ingredient) => {
              const active = setup.ingredientPool.includes(ingredient);
              return (
                <Pressable
                  key={ingredient}
                  onPress={() => {
                    if (active && setup.ingredientPool.length === 1) return;
                    onChangeSetup({
                      ingredientPool: active
                        ? setup.ingredientPool.filter((item) => item !== ingredient)
                        : [...setup.ingredientPool, ingredient],
                    });
                  }}
                  style={[styles.poolChip, active && styles.poolChipActive]}
                >
                  <Text style={[styles.poolChipText, active && styles.poolChipTextActive]}>{ING_LABELS[ingredient]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preview local</Text>
        <Text style={styles.previewHint}>Modo {setup.gameMode} · Sombrero {setup.hat}</Text>
        <View style={styles.burgerRow}>
          {previewBurgers.map((burger, index) => (
            <View key={`native-preview-${index}`} style={styles.previewBurger}>
              <Text style={styles.previewBadge}>{index + 1}</Text>
              {burger.map((item, itemIndex) => (
                <Text key={`${item}-${itemIndex}`} style={styles.burgerPiece}>{item}</Text>
              ))}
            </View>
          ))}
        </View>
      </View>

      <Pressable style={styles.primaryButton} onPress={onContinueOnline}>
        <Text style={styles.primaryButtonText}>Ir al online nativo</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={onOpenWebGame}>
        <Text style={styles.secondaryButtonText}>Abrir juego web</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 32, gap: 16 },
  heroCard: { backgroundColor: '#16213e', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,0.12)', padding: 18 },
  heroTitle: { color: '#FFD700', fontSize: 28, fontWeight: '900', marginBottom: 8 },
  heroText: { color: '#d8ddf3', fontSize: 15, lineHeight: 22 },
  section: { backgroundColor: '#16213e', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 18 },
  sectionTitle: { color: '#FFD700', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  input: { backgroundColor: '#0f1117', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, color: '#fff', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  rowGap: { flexDirection: 'row', gap: 10 },
  visibilityCard: { flex: 1, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', padding: 14 },
  visibilityCardActive: { borderColor: '#4ecdc4', backgroundColor: 'rgba(0,188,212,0.10)' },
  visibilityTitle: { color: '#d8ddf3', fontSize: 15, fontWeight: '800', marginBottom: 4 },
  visibilityTitleActive: { color: '#4ecdc4' },
  visibilityText: { color: '#8a8fa8', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  langCard: { width: '31%', minWidth: 92, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 },
  langLabel: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  modeColumn: { gap: 10 },
  modeCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', padding: 14 },
  modeCardActive: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.08)' },
  modeLabel: { color: '#fff', fontSize: 18, fontWeight: '800' },
  modeDesc: { color: '#8a8fa8', fontSize: 13, marginTop: 2 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  counterLabel: { color: '#d8ddf3', fontSize: 15, fontWeight: '700' },
  counterControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  counterBtn: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#2a2a4a', alignItems: 'center', justifyContent: 'center' },
  counterBtnText: { color: '#FFD700', fontSize: 22, fontWeight: '900', marginTop: -2 },
  counterValue: { minWidth: 28, textAlign: 'center', color: '#fff1b3', fontSize: 18, fontWeight: '900' },
  poolWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  poolChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  poolChipActive: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.08)' },
  poolChipText: { color: '#aeb4d0', fontSize: 12, fontWeight: '700' },
  poolChipTextActive: { color: '#FFD700' },
  previewHint: { color: '#8a8fa8', fontSize: 13, marginBottom: 12 },
  burgerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 14 },
  previewBurger: { width: 92, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 8, position: 'relative' },
  previewBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#FFD700', color: '#111', width: 24, height: 24, borderRadius: 12, textAlign: 'center', lineHeight: 24, fontWeight: '900', fontSize: 12, overflow: 'hidden' },
  burgerPiece: { color: '#d8ddf3', fontSize: 12, lineHeight: 16, marginVertical: 1, fontWeight: '700' },
  primaryButton: { backgroundColor: '#FFD700', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { color: '#111', fontSize: 17, fontWeight: '800' },
  secondaryButton: { backgroundColor: '#00BCD4', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#04101c', fontSize: 17, fontWeight: '800' },
});

