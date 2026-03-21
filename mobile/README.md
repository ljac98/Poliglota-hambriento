# Hungry Poly Mobile

Version movil en Expo + React Native.

## Estado actual

La app movil ya incluye:

- home nativa
- setup nativo
- online nativo con Socket.IO real
- partida nativa con `stateUpdate`
- host nativo capaz de procesar la partida
- chat nativo
- mano, mesa, rivales, descarte y objetivos visuales
- acciones de ingrediente y accion
- negacion
- cambiar/agregar sombreros
- reemplazo de sombrero robado

La web sigue disponible como respaldo desde la app, pero la ruta principal ya es la nativa.

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

## Compilar APK preview

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
- checklist de prueba manual: [QA_CHECKLIST.md](C:\Users\luisj\OneDrive\Documents\New project\mobile\QA_CHECKLIST.md)

## URL del juego

La app abre por defecto:

`https://hungry-poly.up.railway.app`

Si luego quieres apuntarla a otro backend/web, cambia `expo.extra.gameUrl` en `mobile/app.json`.

## Notas

- Si el host de una sala es movil, ahora tambien puede sostener la partida y sincronizar estado a los demas clientes.
- Para cerrar la salida Android de forma seria, el siguiente paso es correr un build preview y probarlo en 2 telefonos reales.
