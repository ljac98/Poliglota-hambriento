import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const LANGS = [
  { id: 'espanol', label: 'Español', emoji: '🤠', color: '#FFB703' },
  { id: 'ingles', label: 'English', emoji: '🎩', color: '#9CA3AF' },
  { id: 'frances', label: 'Français', emoji: '🦞', color: '#FF6B4A' },
  { id: 'italiano', label: 'Italiano', emoji: '👒', color: '#E9D8A6' },
  { id: 'aleman', label: 'Deutsch', emoji: '🪖', color: '#4CAF50' },
  { id: 'portugues', label: 'Português', emoji: '👢', color: '#9D6B53' },
];

const MODES = [
  { id: 'clon', label: 'Clone', desc: 'All equal', emoji: '🪞' },
  { id: 'escalera', label: 'Staircase', desc: 'Ascending', emoji: '🪜' },
  { id: 'caotico', label: 'Chaotic', desc: 'All random', emoji: '🎲' },
];

const INGREDIENT_POOL = ['🥬', '🍅', '🥩', '🧀', '🍗', '🍳', '🧅', '🥑'];

function buildBurger(level, mode) {
  if (mode === 'caotico') return ['🍔', '❓', '❓', '🍔'];
  const base = ['🥬', '🍅', '🧀', '🥩', '🍳', '🧅', '🥑', '🍗'];
  return ['🍔', ...base.slice(0, Math.max(2, Math.min(level + 2, base.length))), '🍔'];
}

export function NativeSetupScreen({ onOpenWebGame }) {
  const [selectedHat, setSelectedHat] = useState(LANGS[0].id);
  const [selectedMode, setSelectedMode] = useState('clon');
  const [burgerCount, setBurgerCount] = useState(2);
  const [aiCount, setAiCount] = useState(2);

  const previewBurgers = useMemo(() => {
    const count = selectedMode === 'caotico' ? 3 : burgerCount;
    return Array.from({ length: count }, (_, index) => buildBurger(index + 1, selectedMode));
  }, [selectedMode, burgerCount]);

  const activeHat = LANGS.find((item) => item.id === selectedHat) || LANGS[0];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Setup nativo</Text>
        <Text style={styles.heroText}>
          Esta es la primera pantalla portada a React Native. Aquí ya puedes elegir sombrero, modo y ver una preview local sin usar WebView.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sombrero principal</Text>
        <View style={styles.grid}>
          {LANGS.map((lang) => {
            const active = lang.id === selectedHat;
            return (
              <Pressable
                key={lang.id}
                onPress={() => setSelectedHat(lang.id)}
                style={[styles.langCard, active && { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.08)' }]}
              >
                <Text style={styles.langEmoji}>{lang.emoji}</Text>
                <Text style={[styles.langLabel, { color: active ? '#FFD700' : lang.color }]}>{lang.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modo de juego</Text>
        <View style={styles.modeColumn}>
          {MODES.map((mode) => {
            const active = mode.id === selectedMode;
            return (
              <Pressable key={mode.id} onPress={() => setSelectedMode(mode.id)} style={[styles.modeCard, active && styles.modeCardActive]}>
                <Text style={styles.modeEmoji}>{mode.emoji}</Text>
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
        <Text style={styles.sectionTitle}>Configuración rápida</Text>
        <View style={styles.counterRow}>
          <Text style={styles.counterLabel}>Hamburguesas</Text>
          <View style={styles.counterControls}>
            <Pressable onPress={() => setBurgerCount((value) => Math.max(1, value - 1))} style={styles.counterBtn}><Text style={styles.counterBtnText}>-</Text></Pressable>
            <Text style={styles.counterValue}>{burgerCount}</Text>
            <Pressable onPress={() => setBurgerCount((value) => Math.min(4, value + 1))} style={styles.counterBtn}><Text style={styles.counterBtnText}>+</Text></Pressable>
          </View>
        </View>
        <View style={styles.counterRow}>
          <Text style={styles.counterLabel}>Rivales IA</Text>
          <View style={styles.counterControls}>
            <Pressable onPress={() => setAiCount((value) => Math.max(1, value - 1))} style={styles.counterBtn}><Text style={styles.counterBtnText}>-</Text></Pressable>
            <Text style={styles.counterValue}>{aiCount}</Text>
            <Pressable onPress={() => setAiCount((value) => Math.min(3, value + 1))} style={styles.counterBtn}><Text style={styles.counterBtnText}>+</Text></Pressable>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preview local</Text>
        <Text style={styles.previewHint}>Sombrero: {activeHat.emoji} {activeHat.label}</Text>
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
        {selectedMode === 'clon' && (
          <View style={styles.poolWrap}>
            {INGREDIENT_POOL.map((item) => (
              <View key={item} style={styles.poolChip}>
                <Text style={styles.poolChipText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Pressable style={styles.primaryButton} onPress={onOpenWebGame}>
        <Text style={styles.primaryButtonText}>Abrir partida web</Text>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  langCard: { width: '31%', minWidth: 92, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 },
  langEmoji: { fontSize: 28, marginBottom: 6 },
  langLabel: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  modeColumn: { gap: 10 },
  modeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', padding: 14 },
  modeCardActive: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.08)' },
  modeEmoji: { fontSize: 30 },
  modeLabel: { color: '#fff', fontSize: 18, fontWeight: '800' },
  modeDesc: { color: '#8a8fa8', fontSize: 13, marginTop: 2 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  counterLabel: { color: '#d8ddf3', fontSize: 15, fontWeight: '700' },
  counterControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  counterBtn: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#2a2a4a', alignItems: 'center', justifyContent: 'center' },
  counterBtnText: { color: '#FFD700', fontSize: 22, fontWeight: '900', marginTop: -2 },
  counterValue: { minWidth: 28, textAlign: 'center', color: '#fff1b3', fontSize: 18, fontWeight: '900' },
  previewHint: { color: '#8a8fa8', fontSize: 13, marginBottom: 12 },
  burgerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 14 },
  previewBurger: { width: 76, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 6, position: 'relative' },
  previewBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#FFD700', color: '#111', width: 24, height: 24, borderRadius: 12, textAlign: 'center', lineHeight: 24, fontWeight: '900', fontSize: 12, overflow: 'hidden' },
  burgerPiece: { fontSize: 26, lineHeight: 26, marginVertical: -2 },
  poolWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  poolChip: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  poolChipText: { fontSize: 20 },
  primaryButton: { backgroundColor: '#00BCD4', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { color: '#04101c', fontSize: 17, fontWeight: '800' },
});
