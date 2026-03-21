# QA Mobile Native

Checklist corta para validar que la version movil ya esta lista para jugar.

## Antes de empezar

- Tener 2 telefonos o 1 telefono + 1 navegador web.
- Usar el mismo backend:
  - `https://hungry-poly.up.railway.app`
- Verificar que ambos clientes entren a la misma sala.

## Flujo base

1. Abrir la app movil.
2. Entrar a `Setup nativo`.
3. Elegir:
   - nombre
   - sombrero
   - modo
   - configuracion real
4. Ir a `Online nativo`.
5. Crear sala.
6. Entrar con otro cliente.
7. Elegir sombreros en ambos clientes.
8. Iniciar partida.

## Lobby online

- Crear sala publica.
- Crear sala privada.
- Entrar por codigo.
- Ver lista de salas publicas.
- Cambiar sombrero y confirmar que se refleja en el otro cliente.
- Validar cambio de host si el host sale.

## Partida nativa

- Ver `stateUpdate` vivo.
- Ver turno actual correcto.
- Ver mazo y descarte cambiar.
- Ver chat en vivo.
- Ver mano, mesa, rivales y objetivos.

## Acciones de ingrediente

- Jugar ingrediente valido.
- Intentar jugar ingrediente invalido.
- Jugar comodin eligiendo ingrediente.
- Descartar carta.
- Pasar turno.

## Acciones de accion

- Masivas:
  - `milanesa`
  - `ensalada`
  - `pizza`
  - `parrilla`
  - `comecomodines`
- Con objetivo:
  - `tenedor`
  - `gloton`
  - `ladron`
  - `intercambio_sombreros`
  - `intercambio_hamburguesa`
- Basurero:
  - rescatar carta del descarte

## Sombreros

- `Cambiar`
- `Agregar`
- Robo de sombrero principal
- Elegir reemplazo desde perchero

## Negacion

- Abrir ventana de negacion.
- Responder `usar negacion`.
- Responder `dejar pasar`.
- Confirmar que la accion se cancela o sigue correctamente.

## Cierre de partida

- Completar hamburguesa.
- Detectar ganador.
- Ver banner final correcto.
- Confirmar que todos los clientes reciben el ganador.

## APK preview

Cuando Node este en `>= 20.19.4`:

```bash
cd mobile
npx eas login
npx eas build -p android --profile preview
```
