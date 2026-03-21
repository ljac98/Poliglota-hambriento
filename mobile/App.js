import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import { HomeScreen } from './src/screens/HomeScreen';
import { NativeSetupScreen } from './src/screens/NativeSetupScreen';

const FALLBACK_URL = 'https://hungry-poly.up.railway.app';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [loadingGame, setLoadingGame] = useState(true);

  const gameUrl = useMemo(() => {
    return Constants.expoConfig?.extra?.gameUrl || FALLBACK_URL;
  }, []);

  if (currentScreen === 'web') {
    return (
      <SafeAreaView style={styles.webviewScreen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.webviewHeader}>
          <Pressable onPress={() => setCurrentScreen('home')} style={styles.secondaryButton}>
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

  if (currentScreen === 'nativeSetup') {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.webviewHeader}>
          <Pressable onPress={() => setCurrentScreen('home')} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Volver</Text>
          </Pressable>
          <Text style={styles.webviewTitle}>Setup nativo</Text>
          <Pressable onPress={() => { setLoadingGame(true); setCurrentScreen('web'); }} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Jugar web</Text>
          </Pressable>
        </View>
        <NativeSetupScreen onOpenWebGame={() => { setLoadingGame(true); setCurrentScreen('web'); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <HomeScreen
        onOpenNativeSetup={() => setCurrentScreen('nativeSetup')}
        onOpenWebGame={() => { setLoadingGame(true); setCurrentScreen('web'); }}
        onOpenWebsite={() => Linking.openURL(gameUrl)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f1117',
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
});
