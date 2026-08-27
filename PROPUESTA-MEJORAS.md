# Propuesta de mejoras — EL N1

> Documento redactado por el segundo desarrollador (con Claude Code) tras una revisión completa del código en `main` (commit `3c2d546`). Está pensado para que lo revises con tu propio Claude Code: cada hallazgo incluye archivo y líneas para que puedas verificarlo antes de aceptar o rechazar. Nada de esto está implementado todavía — buscamos tu acuerdo primero.

## ⚡ Resumen rápido — lo urgente en 30 segundos

**La app hoy NO está lista para cobrar dinero real.** Encontramos 5 problemas que afectan directamente el dinero o la confianza de los clientes:

| # | ¿Qué pasa? | ¿Por qué importa? |
|---|---|---|
| 1 | Si alguien compra una posición **que estaba libre**, todos los demás negocios bajan un lugar sin razón | Clientes que ya pagaron pierden el lugar por el que pagaron → reclamos |
| 2 | Cada compra crea un negocio **repetido** en la base de datos | La base se llena de duplicados y basura con cada venta |
| 3 | La app **no se puede publicar** en un servidor si las claves no están presentes al compilar | Bloquea el despliegue automático a producción |
| 4 | El cliente paga en Mercado Pago, vuelve a la página… **y no ve nada** | Pagó y cree que falló → pide reembolso o desconfía |
| 5 | Si llega un pago con monto incorrecto, Mercado Pago **reintenta avisarnos para siempre** | Carga inútil y permanente en el servidor |

**Lo que te pedimos:** tu OK para arreglar estos 5 puntos en una rama aparte (Fase 1), y tu respuesta a las [3 decisiones de producto](#decisiones-que-necesitamos-de-ti) del final — son decisiones tuyas, no técnicas.

**Lo que NO vamos a tocar:** la lógica de pagos que ya hiciste bien (verificación de firma del webhook, precio calculado en el servidor, asignación transaccional, seguridad RLS). Eso se queda como está.

---

## Resumen

La base del proyecto es buena, especialmente la parte de pagos: precio calculado en el servidor, webhook con verificación de firma HMAC timing-safe, `settle_bid` transaccional e idempotente, y RLS activado. Eso ya lo valoramos y no proponemos tocarlo de fondo.

Encontramos **4 problemas críticos** que pueden costar dinero o clientes con pagos reales, más deuda técnica menor. Proponemos trabajar en 3 fases y necesitamos **2 decisiones de producto tuyas** antes de empezar (ver al final).

Verificaciones ejecutadas sobre el repo limpio: `npm run lint` pasa (1 warning), `npx tsc --noEmit` **falla**, `npx next build --webpack` **falla** (detalles en los hallazgos 3 y 8).

---

## Hallazgos críticos (Fase 1)

### 1. Ocupar una posición vacía desplaza a todos los de abajo

`supabase/migrations/001_ranking_and_payments.sql:105-113` — en `settle_bid`, el desplazamiento (`position + 1000` / `- 999`) se ejecuta **siempre**, aunque la posición comprada estuviera libre.

Reproducción: posición 5 vacía, negocios en 6-10. Alguien paga por ocupar la 5 → los de 6-10 bajan a 7-11. El de la posición 10 cae a la 11 y desaparece del ranking (la home solo muestra 1-10), y queda un hueco injustificado en la 6.

**Propuesta:** desplazar solo si la posición está ocupada (`if exists (select 1 from businesses where active and position = selected_bid.position)`).

### 2. `settle_bid` siempre inserta un negocio nuevo

`supabase/migrations/001_ranking_and_payments.sql:115-117` — cada puja pagada hace `insert` de una fila nueva en `businesses`. Consecuencias:

- El mismo negocio pujando dos veces queda **duplicado** en la tabla.
- Los negocios desplazados más allá del puesto 10 quedan `active = true` con posición 11+ — invisibles para siempre, acumulando basura.
- `bids.business_id` existe en el esquema pero nunca se asigna.

**Propuesta:** reutilizar la fila si ya existe un negocio activo con el mismo nombre (o vincular por `business_id`), y definir qué pasa con los que caen del top 10 (decisión de producto — ver abajo).

### 3. El build de producción falla sin variables de entorno

Confirmado ejecutando `npx next build --webpack` en el repo limpio:

```
Error: supabaseUrl is required.
> Build error occurred: Failed to collect page data for /
```

Causa: `app/page.tsx:4-7`, `app/business/[id]/page.tsx:19-22` y `app/api/position/route.ts:4-7` crean el cliente Supabase **a nivel de módulo** con `!`. Cualquier CI o despliegue que compile sin secretos en build time revienta.

**Propuesta:** crear el cliente dentro de cada función/request (como ya hace `lib/supabase-server.ts`, que está bien planteado).

### 4. Al volver de Mercado Pago no se muestra nada

`app/api/checkout/route.ts:111-117` define `back_urls` hacia `/?payment=success|failure|pending`, pero `app/page.tsx` ignora por completo el parámetro `payment`. El usuario paga dinero real y vuelve a una página idéntica, sin confirmación ni estado.

**Propuesta:** banner o pantalla de resultado según `?payment=`, con aviso de que la posición se asigna al confirmarse el pago (el webhook puede tardar).

### 5. Errores permanentes del webhook provocan reintentos infinitos

`lib/settle-bid.ts:34-40` lanza excepción si el importe o la moneda no coinciden → `app/api/webhooks/mercadopago/route.ts:77-83` responde 500 → Mercado Pago reintenta indefinidamente un pago que **nunca** va a validar.

**Propuesta:** distinguir errores permanentes (importe/moneda incorrectos → registrar, marcar el bid y responder 200) de transitorios (BD caída → 500 para que MP reintente).

---

## Problemas medios (Fase 1-2)

### 6. Los datos de contacto del negocio son inalcanzables

`app/business/[id]/page.tsx:141-194` renderiza teléfono, WhatsApp, Instagram, Facebook, TikTok y logo — pero `settle_bid` solo inserta nombre, categoría, precio y posición, y el panel admin (`app/admin/page.tsx`) solo permite activar/desactivar. **No existe ninguna vía en la app para capturar esos datos**: esas secciones jamás se muestran salvo editando la BD a mano.

**Propuesta:** formulario de edición de perfil en el admin (Fase 3), o al menos documentar que hoy se edita por SQL.

### 7. Reactivar un negocio puede violar el índice único

El índice parcial `businesses_active_position_unique` (`001_ranking_and_payments.sql:78-80`) libera la posición al desactivar un negocio. Si otro la ocupa y luego reactivas al primero desde el admin (`app/api/admin/route.ts:53-93`), el `update` viola el índice y responde un 500 crudo.

**Propuesta:** al reactivar, validar la posición o reactivar con `position = null`.

### 8. El README da instrucciones que no funcionan

- `README.md` paso 2: "Copia `.env.example`" — **el archivo no existe en el repo**.
- `README.md` sección Comprobaciones: `npx tsc --noEmit` falla en un clon limpio (`app/layout.tsx:9` usa `LayoutProps`, tipo global que Next 16 genera recién tras el primer `next dev`/`build`).

**Propuesta:** añadir `.env.example` con las 7 variables documentadas, y anotar en el README que el typecheck requiere un build/dev previo.

---

## Deuda técnica menor (Fase 2)

| Qué | Dónde | Propuesta |
|---|---|---|
| Tabla de precios iniciales copiada 3 veces | `app/Ranking.tsx:21-32`, `app/api/checkout/route.ts:5-16`, `app/api/position/route.ts:45-56` | Un solo módulo compartido (`lib/prices.ts`) |
| Código muerto | `lib/supabase.ts`, `app/api/position/`, `app/api/bid/` — nadie los importa/llama | Eliminar |
| El GET de `/api/admin` devuelve bids que el panel nunca muestra | `app/api/admin/route.ts:5-51` | Mostrarlos en el panel o eliminar el endpoint |
| Botón "¿Cómo funciona?" no hace nada | `app/page.tsx:52-54` | Implementar modal o quitar |
| Errores al usuario con `alert()` | `app/Ranking.tsx:115-129` | Mensajes en el propio modal |
| Modal sin Escape / focus trap / aria | `app/Ranking.tsx:265+` | Accesibilidad básica |
| `<img>` en vez de `next/image` (warning de lint) | `app/business/[id]/page.tsx:84` | `next/image` |
| Tipos `Business` duplicados a mano | `app/Ranking.tsx:6-14`, `app/business/[id]/page.tsx:4-17` | Tipos generados con `supabase gen types` |
| Sin rate limiting | login admin (`/api/admin/login`) y checkout | Límite por IP; también limpieza periódica de bids `pending` viejos |
| Cero tests y cero CI | — | Tests de `settle_bid` y de la firma del webhook + CI con typecheck/lint/build |

---

## Plan propuesto

**Fase 1 — Estabilizar** (antes de recibir un solo pago real): hallazgos 1-5 y 8.

**Fase 2 — Sanear**: hallazgo 7 + tabla de deuda técnica + tests y CI.

**Fase 3 — Producto**: hallazgo 6 (admin con edición de perfil e historial de pujas), modal "¿cómo funciona?", rate limiting.

Cada fase iría en su propia rama con PR para que la revises antes de mergear.

---

## Decisiones que necesitamos de ti

1. **¿Qué pasa con un negocio que cae fuera del top 10?** Opciones: (a) se desactiva automáticamente, (b) conserva su fila y su última oferta para poder volver a pujar con un clic, (c) se elimina. Afecta directamente al arreglo de los hallazgos 1 y 2.

2. **¿Un negocio se identifica por nombre?** Hoy dos pujas con el mismo nombre crean dos negocios distintos. ¿Unificamos por nombre exacto, o a futuro habrá cuentas/registro de negocios? Afecta al hallazgo 2 y al diseño del admin (Fase 3).

3. **¿De acuerdo con el orden de fases?** Si prefieres priorizar otra cosa (por ejemplo, el admin completo antes que los tests), lo ajustamos.

---

*Para verificar los hallazgos: clona `main`, corre `npm install`, `npm run lint`, `npx tsc --noEmit` y `npx next build --webpack`, y revisa las referencias archivo:línea de cada punto.*
