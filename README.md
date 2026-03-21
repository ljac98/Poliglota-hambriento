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

En Android se puede instalar desde Chrome con "Agregar a pantalla principal" o el prompt de instalacion.

## Mobile React Native

Se agrego una base en `mobile/` usando Expo + React Native.

```bash
cd mobile
npm install
npx expo start
```

### APK / build movil

```bash
cd mobile
npx eas login
npx eas build -p android --profile preview
```

Archivos importantes:

- `mobile/App.js`
- `mobile/app.json`
- `mobile/eas.json`
- `mobile/README.md`
