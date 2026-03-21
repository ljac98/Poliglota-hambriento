# Hungry Poly Mobile

Base mobile hecha con Expo + React Native.

## Que incluye

- contenedor nativo para jugar Hungry Poly en telefono
- configuracion lista para compilar Android/iOS con Expo
- archivo `eas.json` para sacar APK preview y builds de produccion

## Ejecutar local

```bash
cd mobile
npm install
npx expo start
```

## Compilar APK

```bash
cd mobile
npm install
npx eas login
npx eas build -p android --profile preview
```

## Compilar produccion

```bash
cd mobile
npx eas build -p android --profile production
npx eas build -p ios --profile production
```

## URL del juego

La app abre por defecto:

`https://hungry-poly.up.railway.app`

Si luego quieres apuntarla a otro backend/web, cambia `expo.extra.gameUrl` en `mobile/app.json`.
