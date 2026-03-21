# Poliglota-hambriento

Repositorio de Hungry Poly.

## Web

```bash
npm install
npm run dev
```

La web ahora incluye:

- `manifest.webmanifest`
- `service worker`
- iconos para instalarla como app desde el navegador del telefono
- pantalla `Descargar app` con QR y enlace directo

En Android se puede instalar desde Chrome con "Agregar a pantalla principal" o el prompt de instalacion.

## Mobile React Native

Se agrego una base en `mobile/` usando Expo + React Native.

```bash
cd mobile
npm install
npx expo start
```

Tambien puedes usar:

```bash
npm run mobile:start
```

### APK / build movil

```bash
cd mobile
npx eas login
npx eas build -p android --profile preview
```

Comandos rapidos desde la raiz:

```bash
npm run mobile:apk
npm run mobile:apk:prod
npm run mobile:eas:version
```

Archivos importantes:

- `mobile/App.js`
- `mobile/src/screens/HomeScreen.js`
- `mobile/src/screens/NativeOnlineScreen.js`
- `mobile/src/screens/NativeSetupScreen.js`
- `mobile/app.json`
- `mobile/eas.json`
- `mobile/README.md`

Nota:

- Expo/React Native recomiendan Node `>= 20.19.4`
- la maquina actual sigue en `20.16.0`, asi que antes de compilar APK final conviene actualizar Node

## Mobile Native Progress
- Native online now connects to the real Socket.IO server for room creation, join by code, public lobby browsing, hat picks and start events.
- Native setup now drives the real mobile game configuration sent to the server.
- The React Native app already includes native home, setup and online flows, plus the web game fallback.


- Native game screen now opens automatically after the real server gameStarted event and shows players, hats and generated burger objectives.

