# Plan: calidad, seguridad y mantenibilidad de EL N1

Estado actual: la arquitectura de fondo es sólida (Next 16 App Router, tres
clientes de Supabase por rol, RLS + RPC con grants restringidos, webhook con
firma verificada y `settle_bid` transaccional). `tsc --noEmit` y `eslint`
pasan limpios. Lo que falta es la **red de seguridad** alrededor de ese código:
no hay tests, no hay CI, no hay límites de peticiones, y hay algo de deuda de
organización (endpoint muerto, tipos a mano, imports mezclados, `Ranking.tsx`
sobrecargado).

Este plan va de lo más barato y de mayor impacto a lo más largo, en 6 PRs
pequeños e independientes. Cada PR se puede revisar y mergear por separado.

Reglas generales:

- **Ningún PR cambia comportamiento de negocio** (precios, reservas,
  `settle_bid`, RLS). Si un test revela un bug, se abre un PR aparte para el
  bug con su test de regresión; no se mezcla con la infraestructura.
- Cada PR deja `npx tsc --noEmit`, `npm run lint`, `npm test` y
  `npx next build --webpack` en verde.
- Rama base: `origin/main` (lo que corre en producción; `integracion` ya
  está mergeada ahí en el PR #2). Ramas `calidad/<n>-<tema>`. Los PRs de
  responsive (`responsive/*`) van en paralelo; solo comparten `Ranking.tsx`
  (ver PR 5).

---

## PR 1 — Blindaje barato (`server-only`, `engines`, tsconfig)

Cambios de una línea que cierran huecos reales. Sin riesgo, sin decisiones.

1. **`import "server-only"`** como primera línea de los módulos que tocan
   secretos o solo tienen sentido en servidor:
   - `lib/supabase-server.ts` (usa `SUPABASE_SECRET_KEY`)
   - `lib/settle-bid.ts` (usa `MERCADOPAGO_ACCESS_TOKEN`)
   - `lib/admin-auth.ts` (usa `ADMIN_PASSWORD`, `next/headers`)
   - `lib/images-server.ts` (usa `sharp`)
   - `lib/supabase-auth.ts` (usa `next/headers`)

   Efecto: si alguien importa uno de estos desde un `"use client"`, el build
   falla en vez de intentar mandar el módulo (y sus variables) al navegador.
   `server-only` viene con Next; no hay dependencia nueva.

2. **`engines`** en `package.json`: `"node": ">=20.9"` (mínimo de Next 16) y
   `.nvmrc` con `22` (versión local actual). Vercel respeta `engines`.

3. **`tsconfig.json`**: `"target": "ES2022"`. Node 22 y todos los navegadores
   que soporta Next 16 lo entienden; evita polyfills de `async/await` y
   permite `Array.prototype.at`, `Object.hasOwn`, etc. sin `lib` extra.

4. **`lib/supabase-public.ts`**: pasar
   `{ auth: { persistSession: false, autoRefreshToken: false } }` al
   `createClient` — es un cliente de solo lectura por request, no debe
   intentar gestionar sesión.

Verificación: `tsc`, `lint`, `build`. Probar a propósito
`import { createServerSupabaseClient } from "@/lib/supabase-server"` en
`app/Ranking.tsx` y confirmar que el build falla con el mensaje de
`server-only`; luego revertir.

---

## PR 2 — Tests unitarios (Vitest) + CI (GitHub Actions)

El PR más importante del plan. Cubre la lógica que mueve dinero **sin tocar
red ni base de datos**: todo lo que se prueba aquí es puro o se mockea.

### 2.1 Instalación

```bash
npm i -D vitest @vitest/coverage-v8
```

`vitest.config.ts` en la raíz:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
  resolve: { alias: { "@": path.resolve(__dirname) } },
});
```

Scripts en `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "next typegen && tsc --noEmit",
"check": "npm run typecheck && npm run lint && npm test"
```

Añadir `**/*.test.ts` al `exclude` de `tsconfig.json`? **No**: los tests
deben compilar con `strict` igual que el código. Sí excluir `coverage/` en
`.gitignore` (ya está).

### 2.2 Tests a escribir (archivo junto al módulo)

| Archivo | Qué cubre |
|---|---|
| `lib/prices.test.ts` | `getInitialPrice` (1→100, 10→10, 11→10, 50→10, 0→100, 99→10); `getMinimumOffer` (libre → inicial; ocupada → `ceil(precio*1.1)`; `null`/`undefined`/`NaN`/string numérico); `isValidPosition` (0, 1, 50, 51, 2.5, `NaN`); `INITIAL_PRICES` tiene exactamente 50 entradas. |
| `lib/business.test.ts` | `missingForPublish` (perfil vacío lista 5 faltantes; con logo+nombre+categoría+ciudad+whatsapp → `[]`; solo `website` cuenta como contacto); `whatsappUrl` (10 dígitos → `52…`; ya con 52 → sin duplicar; con espacios/guiones); `socialUrl` (`@usuario`, `usuario`, URL completa); `normalizeWebsite` (`ejemplo.com` → `https://ejemplo.com/`; `javascript:alert(1)` → `null`; vacío → `null`); `contactLinks` respeta el orden WhatsApp → teléfono → email → web → redes → mapa. |
| `lib/image-specs.test.ts` | `storagePathFromUrl` (URL de nuestro bucket → ruta; con `?t=…` → sin query; URL externa → `null`; ruta con `%20` → decodificada). |
| `lib/payments.test.ts` | `mercadoPagoDate` produce `+00:00`; `allowCashPayments` / `autoRefundOutbid` leen la env (usar `vi.stubEnv`). |
| `lib/admin-auth.test.ts` | `isValidAdminPassword` (correcta, incorrecta, longitud distinta, `ADMIN_PASSWORD` < 12 lanza); `createAdminSession` + `hasAdminSession` con `next/headers` mockeado (cookie válida → `true`; expirada → `false`; firma alterada → `false`; sin cookie → `false`). |
| `app/api/webhooks/mercadopago/signature.test.ts` | Extraer `hasValidSignature` a `lib/mercadopago-signature.ts` (export puro que recibe `headers`, `paymentId`, `secret`, `now`) y probar: firma correcta → `true`; hash alterado → `false`; `ts` fuera de ±5 min → `false`; falta `x-request-id` → `false`; sin secreto en dev → `true`, en prod → `false`. El route handler queda como envoltorio de 3 líneas. |
| `lib/settle-bid.test.ts` | `verifyAndSettlePayment` con `mercadopago` y `./supabase-server` mockeados (`vi.mock`). Escenarios: pago sin `external_reference` → `rejected: "sin_oferta"`; `status !== "approved"` → `settled: false`; bid inexistente → `oferta_inexistente`; bid ya `paid` → `alreadySettled`; importe distinto → marca `rejected` y **no** llama a `settle_bid`; moneda ≠ MXN → ídem; RPC `success: true` → `settled: true`; RPC `success: false` con `AUTO_REFUND_OUTBID=true` → llama `PaymentRefund.total` y marca `refunded`; con `AUTO_REFUND_OUTBID=false` → no reembolsa; error de BD → **lanza** (para que el webhook responda 500). |

Objetivo de cobertura para `lib/`: ≥ 90 % líneas. No perseguir cobertura en
`app/` (componentes) en este PR.

### 2.3 CI

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test -- --coverage
      - run: npx next build --webpack
        env:
          # El build no necesita valores reales; solo que existan para next.config.ts.
          NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ci
```

Después de mergear: en GitHub → Settings → Branches → proteger `main` con
"Require status checks: CI / check" y "Require pull request before merging".
(Esto lo configura el dueño del repo; anotarlo en el PR.)

### 2.4 Tests de la función SQL `settle_bid` (opcional dentro de este PR)

Los 7 escenarios que ya se probaron a mano por SQL en la rama
`pr-c-pago-reservas` se guardan como `supabase/tests/settle_bid.test.sql`
usando `pgTAP` (viene en la imagen de Supabase local) y se corren con
`npx supabase test db`. Escenarios: posición libre; ocupada con importe
suficiente; ocupada con importe insuficiente → `outbid`; el mismo negocio sube;
el mismo negocio compra su propia posición; desplazamiento al final del top 50
→ `position = null`; idempotencia (dos llamadas con el mismo `payment_id`).

Requiere Docker, así que en CI se deja fuera (o como job separado que se
ejecuta solo con `workflow_dispatch`). Si complica el PR, se saca a PR 2b.

---

## PR 3 — Rate limiting

Hoy: la contraseña única del admin se puede probar sin límite; un cliente
puede crear reservas de 5 min en bucle (cada una sube el piso de la
posición); `/api/analytics` acepta escrituras sin límite.

### Decisión de infraestructura (confirmar con el primer dev)

- **Opción A (recomendada): Upstash Redis** (`@upstash/ratelimit` +
  `@upstash/redis`). Plan gratuito suficiente; funciona en Vercel serverless
  donde la memoria no se comparte entre instancias. Dos variables nuevas:
  `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- **Opción B: en Postgres** (tabla `rate_limits (key, window_start, count)` +
  función `check_rate_limit(key, limit, window)`). Sin servicio nuevo, pero
  añade una consulta por petición y hay que limpiar la tabla.
- **Opción C: en memoria** (`Map` por instancia). Solo sirve como
  degradación local; **no** protege en producción. Se usa como *fallback*
  cuando faltan las variables de Upstash, para que `npm run dev` funcione sin
  configurar nada.

### Implementación (asumiendo A con fallback C)

`lib/rate-limit.ts`:

```ts
import "server-only";
export type Limiter = { limit(key: string): Promise<{ ok: boolean; retryAfter: number }> };
export function createLimiter(name: string, max: number, windowSeconds: number): Limiter
```

- Con Upstash configurado → `Ratelimit.slidingWindow(max, `${windowSeconds} s`)`.
- Sin Upstash → `Map<string, number[]>` en memoria + `console.warn` una sola
  vez ("rate limit en memoria: solo para desarrollo").
- Clave = `${name}:${ip}` donde `ip` sale de `x-forwarded-for` (primer
  valor) o `x-real-ip`; si no hay, `"unknown"`.

Límites iniciales:

| Endpoint | Límite | Clave |
|---|---|---|
| `POST /api/admin/login` | 5 / 15 min | IP |
| `POST /api/checkout` | 10 / 10 min | `user.id` (ya hay sesión) |
| `POST /api/analytics` | 60 / min | IP |
| `signUp` / `signIn` (Server Actions) | 10 / 15 min | IP (`headers()`) — Supabase ya limita el envío de correos, pero no los intentos de contraseña |
| `POST /api/webhooks/mercadopago` | **sin límite** (Mercado Pago reintenta; la firma ya lo protege) | — |

Respuesta al exceder: `429` con `{ error: "Demasiadas solicitudes. Inténtalo en X segundos." }`
y cabecera `Retry-After`. En `Ranking.tsx` el modal ya muestra `error` del
servidor, así que no hace falta UI nueva.

Tests: `lib/rate-limit.test.ts` con el fallback en memoria (N peticiones
pasan, N+1 falla, tras la ventana vuelve a pasar con `vi.useFakeTimers`).

---

## PR 4 — Tipos generados de Supabase + validación con Zod

### 4.1 Tipos de la base de datos

```bash
npx supabase gen types typescript --local > lib/database.types.ts
```

- Script `"db:types"` en `package.json` para regenerar tras cada migración.
- Los tres `createClient` pasan a `createClient<Database>(…)`.
- `lib/business.ts`: `Business` deja de escribirse a mano:
  `export type Business = Database["public"]["Tables"]["businesses"]["Row"]`.
  `BusinessStatus` sale del `check` de la columna (o se mantiene como union
  si el generador lo devuelve como `string`).
- Desaparecen los `as Business` en `app/page.tsx`, `app/api/checkout/route.ts`,
  `app/mi-negocio/page.tsx`, `app/business/[id]/page.tsx`.
- Los tipos de las RPC (`position_state`, `active_reservations`,
  `settle_bid`) también se generan; se eliminan los tipos inline de
  `app/api/checkout/route.ts:108-110`, `app/api/reservations/route.ts:17`,
  `app/page.tsx:60` y `SettleBidRpc` en `lib/settle-bid.ts`.

Riesgo: el generador tipa `numeric` como `number` y `jsonb` como `Json`; los
`Number(row.amount)` que hay hoy siguen siendo correctos y se dejan.

CI: añadir un paso que regenera los tipos y falla si `git diff --exit-code
lib/database.types.ts` detecta cambios (requiere Supabase local en CI; si no
se hace el PR 2.4, este paso se omite y se confía en la revisión manual).

### 4.2 Validación de entrada con Zod

```bash
npm i zod
```

Un esquema por endpoint, junto al route handler o en `lib/schemas.ts`:

| Endpoint | Esquema |
|---|---|
| `POST /api/checkout` | `{ position: z.number().int().min(1).max(MAX_RANKING_POSITION), expectedAmount: z.number().positive().nullable().optional() }` |
| `POST /api/admin/login` | `{ password: z.string().min(1).max(200) }` |
| `PATCH /api/admin` | `{ id: z.string().uuid(), active: z.boolean() }` |
| `POST /api/admin` (formData) | esquema con `z.coerce` para `intent`, `id`, campos de perfil con los límites de `FIELD_LIMITS`, URLs con `z.string().url()` |
| `POST /api/analytics` | `{ sessionId: z.string().uuid(), event: z.enum(["business_click"]).optional(), businessId: z.string().uuid().optional() }` |
| `updateProfile` (Server Action) | esquema derivado de `EDITABLE_FIELDS` + `FIELD_LIMITS` (se puede construir con `z.object(Object.fromEntries(...))`) |
| `signUp` / `signIn` | `{ email: z.string().email(), password: z.string().min(8), businessName: z.string().trim().min(2).max(60) }` |

Helper `lib/parse-body.ts`: `parseJson(request, schema)` que devuelve
`{ data } | { response: NextResponse 400 }` con el primer mensaje de error
en español. Los mensajes de error actuales ("Posición inválida.", etc.) se
conservan como `message` en cada campo del esquema para no cambiar la UX.

Se elimina `UUID_PATTERN` duplicado en `api/admin/route.ts` y
`api/analytics/route.ts`.

---

## PR 5 — Limpieza y consistencia

1. **Borrar `app/api/position/route.ts`**: nadie lo llama y usa la lógica
   anterior a las reservas (ignora `status = 'published'` y las reservas
   vigentes). Si en el futuro se necesita "consultar precio sin reservar",
   se reimplementa sobre `position_state`.
2. **`GET /api/admin`**: el panel no lo usa (lee de Supabase directo en el
   Server Component). Eliminar el `GET` o, si el primer dev quiere el
   historial de ofertas en el panel, mostrarlo en `app/admin/page.tsx` y
   quitar el endpoint igualmente (Server Component no necesita fetch).
3. **Admin con Server Actions**: `POST /api/admin` (formData + redirect) pasa
   a `app/admin/actions.ts` con `"use server"` y `useActionState`, igual que
   `/mi-negocio`. El `PATCH` JSON se vuelve `toggleActive(id, active)` en el
   mismo archivo. `updateActive` se mueve a `lib/admin.ts`. `/api/admin/*`
   queda solo con `login` y `logout` (que necesitan setear/borrar cookie en
   una respuesta; también podrían ser actions, pero no aporta).
4. **Imports**: todo a `@/lib/...` y `@/app/...`. Regla ESLint en
   `eslint.config.mjs`:
   ```js
   "no-restricted-imports": ["error", { patterns: [{ group: ["../*lib/*", "../../*", "../../../*"], message: "Usa el alias @/" }] }]
   ```
   Se aplica con un `sed`/búsqueda-reemplazo; ~51 líneas.
5. **`Ranking.tsx` (351 líneas)** → dividir en:
   - `app/hooks/useReservations.ts`: el `useEffect` de sondeo + estado.
   - `app/components/BidModal.tsx`: el modal de oferta (estado
     `quotedAmount`, `notice`, `error`, `loading`, `fetch("/api/checkout")`).
   - `Ranking.tsx` queda con el filtro por categoría y el grid de tarjetas
     (~120 líneas).
   **Coordinación**: el PR `responsive/portada` también toca `Ranking.tsx`.
   Este paso se hace **después** de mergear los responsive para evitar
   conflictos; hasta entonces PR 5 se abre sin este punto.
6. **Prettier**: `npm i -D prettier prettier-plugin-tailwindcss`,
   `.prettierrc` (`{ "plugins": ["prettier-plugin-tailwindcss"] }`),
   `"format": "prettier --write ."`, `"format:check": "prettier --check ."`
   en scripts y en CI. Un único commit "Formatear con Prettier" separado del
   resto para que el diff de revisión sea legible. Coordinar con el primer
   dev **antes** de hacerlo: reformatear todo genera conflictos con cualquier
   rama abierta.
7. **`.editorconfig`** (2 espacios, LF, UTF-8, newline final) para que ambos
   editores coincidan.
8. **`public/`**: borrar `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`,
   `window.svg` (restos del `create-next-app`, nadie los usa).

---

## PR 6 — Observabilidad y operación

1. **Logger estructurado** (`lib/log.ts`, sin dependencias):
   `log.info("webhook.settled", { paymentId, bidId })` → imprime JSON en
   producción y texto legible en dev. Reemplaza los 13 `console.*`. Vercel
   indexa los campos JSON, así se puede buscar por `paymentId`.
2. **Limpieza de `bids` viejos**: hoy `expire_bids()` solo se llama al
   iniciar un checkout. Añadir un *cron* (Vercel Cron → `GET /api/cron/expire`
   protegido con `CRON_SECRET`, cada 5 min) o `pg_cron` en Supabase
   (`select cron.schedule('expire-bids', '*/5 * * * *', 'select public.expire_bids()')`).
   **Recomendado `pg_cron`**: sin endpoint nuevo ni secreto. Va como migración
   `008_cron_expire_bids.sql`.
3. **Health check**: `GET /api/health` que hace `select 1` contra Supabase y
   responde `{ ok, db, version }`. Útil para el monitor de Vercel/UptimeRobot.
4. **Cabeceras de seguridad** en `next.config.ts` (`headers()`):
   `X-Content-Type-Options: nosniff`, `Referrer-Policy:
   strict-origin-when-cross-origin`, `Permissions-Policy` mínima,
   `X-Frame-Options: DENY` (el admin no debe poder embeberse). Una CSP
   completa se deja para más adelante porque Mercado Pago y `next/image`
   necesitan ajustes finos.
5. **README**: sección "Calidad" con `npm run check`, cómo correr los tests
   SQL, y qué hace el CI. Actualizar "Antes de producción" con Upstash y
   `pg_cron`.

---

## Orden y dependencias

```
PR 1 (blindaje)  ─┐
                  ├─► PR 2 (tests + CI) ─► PR 3 (rate limit) ─┐
                  │                                            ├─► PR 6 (operación)
                  └─► PR 4 (tipos + zod) ─► PR 5 (limpieza) ──┘
```

- PR 1 y PR 2 se pueden abrir el mismo día; PR 2 es el que hay que mergear
  primero para que los siguientes ya pasen por CI.
- PR 3 y PR 4 son independientes entre sí.
- PR 5.5 (`Ranking.tsx`) espera a `responsive/*`; PR 5.6 (Prettier) espera a
  que no haya ramas abiertas.

Estimación de tamaño (líneas cambiadas, sin contar tests generados):
PR 1 ≈ 20 · PR 2 ≈ 600 (casi todo tests) · PR 3 ≈ 150 · PR 4 ≈ 400 (mayoría
`database.types.ts` generado) · PR 5 ≈ 300 (+ Prettier) · PR 6 ≈ 200.

---

## Decisiones tomadas (2026-08-27)

- **Rama base**: `origin/main`.
- **Rate limiting**: Upstash Redis en producción con fallback en memoria en
  desarrollo. *Fail-open* (dejar pasar y registrar) si Upstash no responde,
  salvo en el login del admin, que es *fail-closed*.
- **Prettier en dos tiempos**: en PR 1 se instala con `.prettierrc` y
  `.editorconfig`, y cada PR de calidad formatea solo los archivos que toca.
  El reformateo global va en un PR propio ("Formatear con Prettier") cuando no
  haya ramas abiertas; a partir de ahí `format:check` en CI sobre todo el repo.

## Pendiente del primer dev

1. **Historial de ofertas en `/admin`**: ¿se muestra o se elimina el `GET`? →
   afecta PR 5.2.
2. **Protección de `main`** en GitHub (requiere PR + CI verde): lo configura
   el dueño del repo tras mergear PR 2.
3. **Cuenta de Upstash** y sus dos variables en Vercel antes de mergear PR 3.
4. **Momento del reformateo global** con Prettier (PR 5.6).
