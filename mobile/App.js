import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';

const FALLBACK_URL = 'https://hungry-poly.up.railway.app';

export default function App() {
  const [showGame, setShowGame] = useState(false);
  const [loadingGame, setLoadingGame] = useState(true);

  const gameUrl = useMemo(() => {
    return Constants.expoConfig?.extra?.gameUrl || FALLBACK_URL;
  }, []);

  if (showGame) {
    return (
      <SafeAreaView style={styles.webviewScreen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.webviewHeader}>
          <Pressable onPress={() => setShowGame(false)} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Volver</Text>
          </Pressable>
          <Text style={styles.webviewTitle}>Hungry Poly Mobile</Text>
          <Pressable onPress={() => Linking.openURL(gameUrl)} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Abrir web</Text>
          </Pressable>
        </View>
        <View style={styles.webviewWrap}>
          {loadingGame && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loaderText}>Cargando partida...</Text>
            </View>
          )}
          <WebView
            source={{ uri: gameUrl }}
            style={styles.webview}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            onLoadEnd={() => setLoadingGame(false)}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>🍔</Text>
        <Text style={styles.title}>Hungry Poly</Text>
        <Text style={styles.subtitle}>Version React Native lista para jugar en telefono.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Jugar en movil</Text>
        <Text style={styles.cardText}>
          Esta app usa un contenedor nativo con React Native para abrir el juego en una experiencia mas comoda en telefono.
        </Text>

        <Pressable onPress={() => { setLoadingGame(true); setShowGame(true); }} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Abrir Hungry Poly</Text>
        </Pressable>

        <Pressable onPress={() => Linking.openURL(gameUrl)} style={styles.secondaryLink}>
          <Text style={styles.secondaryLinkText}>Abrir tambien en navegador</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Publicacion</Text>
        <Text style={styles.cardText}>
          Para generar un APK o binario instalable desde web, esta base queda lista para compilar con Expo y EAS.
        </Text>
        <Text style={styles.hint}>Archivo clave: mobile/eas.json</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f1117',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  webviewScreen: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  webviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.15)',
  },
  webviewTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '800',
  },
  webviewWrap: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f1117',
    gap: 12,
  },
  loaderText: {
    color: '#d8ddf3',
    fontSize: 16,
    fontWeight: '600',
  },
  hero: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  heroIcon: {
    fontSize: 56,
    marginBottom: 8,
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
  hint: {
    color: '#8a8fa8',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: '#00BCD4',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#04101c',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#d8ddf3',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryLinkText: {
    color: '#4ecdc4',
    fontSize: 14,
    fontWeight: '700',
  },
});
