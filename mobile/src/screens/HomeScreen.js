import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function HomeScreen({ setupSummary, onOpenNativeSetup, onOpenNativeOnline, onOpenWebGame, onOpenWebsite }) {
  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>BURGER</Text>
        <Text style={styles.title}>Hungry Poly</Text>
        <Text style={styles.subtitle}>Base React Native lista para crecer hacia una version movil nativa real.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Setup actual</Text>
        <Text style={styles.cardText}>{setupSummary}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Continuar port nativo</Text>
        <Text style={styles.cardText}>
          Ya tenemos setup nativo, online nativo y conexion real por sockets para el lobby movil.
        </Text>

        <Pressable onPress={onOpenNativeSetup} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Abrir setup nativo</Text>
        </Pressable>

        <Pressable onPress={onOpenNativeOnline} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Abrir online nativo</Text>
        </Pressable>

        <Pressable onPress={onOpenWebGame} style={styles.webButton}>
          <Text style={styles.webButtonText}>Abrir juego web</Text>
        </Pressable>

        <Pressable onPress={onOpenWebsite} style={styles.linkButton}>
          <Text style={styles.linkButtonText}>Abrir web en navegador</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f1117',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  hero: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  heroIcon: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 1,
  },
  title: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    color: '#d8ddf3',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.12)',
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  cardText: {
    color: '#d8ddf3',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#111',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#00BCD4',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#04101c',
    fontSize: 17,
    fontWeight: '800',
  },
  webButton: {
    backgroundColor: '#2a2a4a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  webButtonText: {
    color: '#d8ddf3',
    fontSize: 17,
    fontWeight: '800',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkButtonText: {
    color: '#4ecdc4',
    fontSize: 14,
    fontWeight: '700',
  },
});
