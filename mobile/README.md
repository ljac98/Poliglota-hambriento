# Hungry Poly Mobile

Base mobile hecha con Expo + React Native.

## Que incluye

- contenedor nativo para jugar Hungry Poly en telefono
- una primera pantalla nativa de online en `mobile/src/screens/NativeOnlineScreen.js`
- una primera pantalla nativa de setup en `mobile/src/screens/NativeSetupScreen.js`
- configuracion lista para compilar Android/iOS con Expo
- archivo `eas.json` para sacar APK preview y builds de produccion

## Ejecutar local

```bash
cd mobile
npm install
npx expo start
```

O desde la raiz del repo:

```bash
npm run mobile:start
```

## Compilar APK

```bash
cd mobile
npm install
npx eas login
npx eas build -p android --profile preview
```

O mas rapido desde la raiz:

```bash
npm run mobile:apk
```

## Compilar produccion

```bash
cd mobile
npx eas build -p android --profile production
npx eas build -p ios --profile production
```

## Validar configuracion

```bash
cd mobile
npx expo config --type public
npx eas --version
```

Importante:

- Expo y React Native estan pidiendo Node `>= 20.19.4`
- en esta maquina sigue en `20.16.0`, asi que para build final conviene actualizar Node antes de sacar APK/IPA reales
- para publicar el APK hara falta `npx eas login`

## URL del juego

La app abre por defecto:

`https://hungry-poly.up.railway.app`

Si luego quieres apuntarla a otro backend/web, cambia `expo.extra.gameUrl` en `mobile/app.json`.
