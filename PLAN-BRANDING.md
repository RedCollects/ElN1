# Plan: implementar la marca v2 Azul en la webapp

Fuente: `../branding/design_handoff_eln1_azul/` (README, `tokens/eln1-tokens.css`,
`tokens/eln1-components.css` y los dos catálogos `.dc.html`). Este documento traduce
ese handoff al código real de `ElN1/` y lo parte en PRs revisables.

## Diagnóstico: qué hay hoy vs. qué pide la marca

| Tema | Hoy en `ElN1/` | Marca v2 Azul |
| --- | --- | --- |
| Color de marca | `brand-*` = sky (#38bdf8), definido en `app/globals.css` con `@theme` | Azul N1 #1746D4 / hover #1239B0 / press #0E2F8F, rampa 100–900 |
| Neutrales | Tailwind `neutral-*` sobre blanco puro | `--n1-bg` #F2F3F6, `--n1-surface` #E7E9EF, tinta #1B1D22, muted #5B6069, faint #95999F |
| Tipografía | Arial/Helvetica | **Archivo** (Google Fonts) 400–900 |
| Forma | `rounded-full` / `xl` / `2xl` / `3xl` en todo el kit (19 archivos) | **Radio 0 en todo**, salvo el sello del logo |
| Separadores | Bordes 1px `neutral-200` | Reglas de **2px** de tinta; 1px solo dentro de tablas/listas |
| Alineación | Botones y estados vacíos centrados | **Todo al ras izquierdo**, incluido el label de botones anchos |
| Logo | Texto "EL <span azul>N1</span>" en `app/ui/Layout.tsx` y duplicado a mano en `app/admin/page.tsx` | Sello circular troquelado "N1" (SVG) + wordmark; 4 versiones |
| Favicon | `app/favicon.ico` (25 KB, del scaffold) | Sello N1 en `icon.svg` + `apple-icon` + `.ico` |
| Cifras | `font-black` sin `tabular-nums` | Peso 900, `-0.03em`, `tabular-nums` siempre |
| Modo oscuro | Clase `.dark` en `<html>` + overrides globales por clase (`.dark .bg-white {…}`) en `globals.css` | `[data-theme="dark"]` con los mismos tokens, valores invertidos |
| Iconos | Emojis (🥇 🏪 🔒 ⏱ 🌙 📞) | **Lucide**, stroke 2.2 (UI) / 3 (indicadores), `linecap: square`. Sin emojis |
| Estados de éxito/aviso/error | `emerald` / `amber` / `red` | No existen colores semánticos: error = texto en `--n1-accent-press` + borde azul; éxito/aviso = tags neutrales/azul |
| Loading | Ninguno definido | Bloques rectangulares en `--n1-surface`; sin spinners |

Conclusión: **no es un retoque de colores, es un cambio de sistema visual**. La buena
noticia es que la app ya pasa por `app/ui` (kit de primitivas) y las páginas casi no
escriben Tailwind a mano, así que la mayor parte del cambio se concentra en ~12
archivos del kit y el resto son ajustes de composición.

## Decisiones de traducción (para no discutirlas en cada PR)

1. **Tokens como variables CSS en `@theme` de Tailwind 4**, no como un CSS paralelo.
   Copiamos los valores de `eln1-tokens.css` a `app/globals.css` bajo nombres Tailwind:
   `--color-accent`, `--color-accent-hover`, `--color-accent-press`, `--color-accent-fg`,
   `--color-accent-100…900`, `--color-bg`, `--color-surface`, `--color-surface-2`,
   `--color-ink`, `--color-muted`, `--color-faint`, `--color-rule`, `--color-rule-soft`,
   `--color-band`, `--color-band-fg`, `--font-sans: Archivo…`. Así en JSX se escribe
   `bg-accent`, `text-accent-press`, `border-rule`, `bg-surface`, igual que hoy con `brand-*`.
   Se **elimina** `brand-*` (grep y reemplazo; ver PR 1).
2. **Radio 0 global**: `--radius-*: 0` en `@theme` para que cualquier `rounded-*` que quede
   por descuido rinda 0, y además se borran las clases del kit. Solo `Logo` usa `rounded-full`.
3. **Reglas**: utilidades semánticas en `@utility`: `rule` (border 2px ink) y `rule-soft`
   (1px rgba). Los componentes las usan por nombre, nadie escribe `border-2 border-[#1b1d22]`.
4. **Fuente**: `next/font/google` (`Archivo`, `weight: ["400","500","600","700","800","900"]`,
   `display: "swap"`) en `app/layout.tsx`, expuesta como `--font-archivo` → `--font-sans`.
   No usamos el `<link>` del handoff (next/font la sirve desde el mismo dominio, sin CLS).
5. **Modo oscuro**: se conserva el toggle de `SiteExperience`, pero cambia a
   `data-theme="dark"` en `<html>` (como pide el handoff) y los tokens se redefinen en
   `[data-theme="dark"]` con `@variant dark`. Se borran los overrides por clase de
   `globals.css` (`.dark .bg-white {…}` etc.), que son frágiles y dejarían de tener sentido.
   Se aplica en el **último PR**, cuando todos los componentes ya usen tokens.
6. **Iconos**: dependencia nueva `lucide-react`. Un wrapper `Icon` en `app/ui/Icon.tsx`
   fija `strokeWidth={2.2}`, `strokeLinecap="square"` y tamaños 12/16/18. Reemplaza los
   emojis de contacto (`contactLinks` en `lib/business.ts`), medallas y avisos.
7. **Colores semánticos**: se eliminan `emerald/amber/red`. `Alert` pasa a tener
   `tone="neutral" | "accent"` (borde 2px, sin fondo de color) y los errores de formulario
   siguen la regla del handoff: texto 13px en `--n1-accent-press`, borde del input en
   `--n1-accent`. Los medallas 🥇🥈🥉 y los fondos amarillo/naranja de `RankingCard`
   desaparecen: el #1 se distingue por el **estado líder** (`.n1-slot--leader`, azul a sangre).
8. **Copy / voz**: al tocar cada componente se ajusta el texto al tono del catálogo
   ("Estás en el #7. Faltan $60 para el #6." / "Ocupar posición"; nunca "¡Impulsa tu negocio!"
   ni "Comprar ahora"). Los CTAs actuales en mayúsculas gritadas ("INTENTAR SUBIR AL RANKING")
   se reescriben; el uppercase lo pone el estilo del botón, no el texto.
9. **Lo que NO se implementa**: el conmutador Rojo/Azul/Marcador del panel (solo demo),
   fotos en B/N (no hay fotografía editorial; los logos de negocio se quedan a color), y las
   métricas de "visitas"/"clics WhatsApp" del panel que aún no existen en la base de datos
   (ver PR 6: se cablean solo las que ya tenemos).

## Reglas de trabajo

- Rama base: `origin/main`. Ramas `branding/<n>-<tema>`, un PR por rama, apiladas en orden.
- Cada PR deja `npm run check` (typecheck + lint + tests) y `npx next build` en verde.
- **Ningún PR toca lógica de negocio** (`lib/`, `settle_bid`, checkout). Si al rediseñar
  el panel hace falta un dato nuevo (p. ej. historial de posición), se abre un PR aparte de
  datos con su migración.
- Verificación visual en `/ui-kit` (dev) contra el catálogo `.dc.html` abierto al lado, en
  375px y 1320px, antes de abrir cada PR.
- El folder `branding/` se queda fuera del repo (es referencia de diseño). Lo único que se
  copia dentro es el logo como SVG.

---

## PR 1 — Tokens, fuente y forma (`branding/1-tokens`)

Cambia la base sin tocar todavía la forma de ningún componente. La app se verá "rara"
(esquinas cuadradas con la composición vieja) durante los PRs 1–2; se acepta porque
nada de esto llega a `main` hasta que la pila completa esté aprobada.

- `app/globals.css`: reemplazar el bloque `@theme` por los tokens de la sección
  "Decisiones" (colores, rampas, fuente, `--radius-* : 0`, `--shadow-modal`), utilidades
  `rule` / `rule-soft` / `figure` (`font-weight 900; letter-spacing -0.03em; tabular-nums`)
  y `label` (11px/700/0.12em/uppercase). `body`: `bg-bg text-ink`. `:focus-visible` con
  outline 2px accent offset 2px; `::selection` en accent-200.
- `app/layout.tsx`: `next/font/google` Archivo → `className={archivo.variable}` en `<html>`.
- Reemplazo mecánico `brand-*` → `accent-*` en todo `app/` (grep). `brand`/`brand-400`
  → `accent`; `brand-500` → `accent-press` cuando es texto, `accent-hover` cuando es hover;
  `brand-50/100` → `accent-100/200`; `brand-900` → `accent-press`.
- `app/ui/README.md`: tabla de tokens nueva y las 5 reglas de la identidad.
- Sin cambio de tests.

## PR 2 — Logo y favicon (`branding/2-logo`)

- `app/ui/Logo.tsx` (nuevo): componente `Logo` con `variant="ink" | "paper" | "accent"`
  y `size` (px, mínimo 24). Renderiza el SVG inline del sello:
  `<circle r=88 stroke-width=5 stroke-dasharray="150 9 44 9 150 9 44 9">` + `<text>` "N1"
  en Archivo 900 / 92px / -0.04em. Prop `lockup` para añadir el wordmark "EL N1"
  (22px/800/-0.02em) a la derecha, gap 10px. `href` como hoy (`null` = no enlace).
  Reemplaza al `Logo` de `Layout.tsx`.
- `public/logo.svg`, `public/logo-ink.svg`, `public/logo-paper.svg`: mismos SVG exportados
  para correos, redes y Open Graph. El texto va **convertido a trazos** (no depende de que
  el destinatario tenga Archivo); se genera una vez con Inkscape/Figma desde el SVG del
  handoff y se versiona.
- Favicon, con la convención de metadata files de Next 16:
  - `app/icon.svg` — sello ink sobre fondo `--n1-bg` (el navegador lo prefiere).
  - `app/icon.png` 512×512 y `app/apple-icon.png` 180×180 — sello sobre azul #1746D4
    con texto en #F2F3F6 (versión "accent", legible en pantallas de inicio).
  - `app/favicon.ico` — se regenera (16/32/48) con el sello; se borra el del scaffold.
  - `app/opengraph-image.tsx` — imagen OG 1200×630 con `ImageResponse`: lockup + tagline,
    fondo bg, regla de 2px. (Usa la fuente Archivo cargada como buffer.)
- `app/admin/page.tsx`: quitar el logo hecho a mano, usar `SiteHeader`.
- `app/auth/AuthShell.tsx`: el texto "EL N1" pasa a `<Logo lockup size={28} />`.

## PR 3 — Primitivas del kit (`branding/3-primitivas`)

Reescritura de `app/ui/*` para que cada primitiva sea la del catálogo. Sin cambiar sus
APIs salvo donde se indica, para que las páginas sigan compilando.

- **`Button`**: variantes `primary` (accent → hover → press, transición 120ms),
  `secondary` (borde 2px ink, hover invierte a fondo ink/texto bg), `ghost` (muted → accent).
  Se eliminan `accent`, `outline`, `link` y `shape`; `size` queda `md` (15px 26px) y
  `sm` (11px 18px). Label 13px/700/0.08em/uppercase, **`text-align: left`** y
  `justify-start` incluso con `block`. Disabled: `bg-surface text-faint opacity-45`.
  Nuevo `IconButton` 46×46 con borde 2px. El alias `accent` → `primary` y `outline` →
  `secondary` se mantiene un PR más para no romper la pila (se borra en PR 5).
- **`Badge`** → **`Tag`**: `tone="first" | "available" | "taken" | "verified" | "neutral" | "up" | "down"`
  con los colores exactos de `.n1-tag--*`, padding 7px 12px, sin radio. Export `Badge`
  se mantiene como alias hasta el PR 5. Nuevo `LiveDot` (cuadro 7–8px accent + label).
- **`Field` / `Input` / `Textarea` / `Select` / `PrefixedInput`**: borde 2px ink, fondo bg,
  padding 13px 14px, focus → `border-accent`, placeholder faint, label 11px uppercase en
  `neutral-800`, hint 13px en `accent-press`. Prop nueva `error` (texto bajo el campo en
  `accent-press`, borde en `accent`). `optional` → borde `rule-soft`.
- **`MoneyInput`** (nuevo): prefijo "$" en banda ink, input `tabular-nums` con
  `w-full min-w-0`, sufijo "MXN" 11px faint. Reemplaza el input de monto del modal de puja.
- **`Segmented`**, **`Switch`**, **`Radio`** (nuevos, cuadrados, según `.n1-seg`,
  `.n1-switch`, `.n1-radio`). `Segmented` con `aria-pressed`.
- **`Card`**: fondo `surface`, borde 2px ink, sin sombra ni radio. `CardSection`: título
  22px/800 y regla de 2px entre título y contenido.
- **`Typography`**: `Heading` con tamaños `display` (clamp 40–68px/800/-0.03em/0.92),
  `title` (34px), `h2` (22px); `Eyebrow` → label 11px/700/0.12em con `tone="accent" |
  "muted" | "faint"`; nuevo `Figure` (cifra 900 tabular-nums, `size` en px);
  `Lead` 16px/1.6 muted; `Muted` 14px.
- **`Price`**: usa `Figure`; `tone="accent" | "ink"`; `accent` = `accent-press` si es texto
  corrido, `accent` si es cifra ≥ 24px (regla de contraste del handoff).
- **`Alert`**: `tone="neutral" | "accent"`, borde 2px, padding 20px, título 22px/800,
  cierre con `Icon x`. Sin fondos de color. Sigue poniendo `role="alert"` si `tone="accent"`
  y se pasa `severity="error"` (prop nueva) para no perder accesibilidad.
- **`Modal`**: `.n1-dialog`: max 420px, fondo bg, borde 2px, sombra modal única,
  cabecera con regla 2px, título 26px/800, pie `actions` (primario `flex-1` + secundario
  separado por regla vertical 2px). Backdrop `rgba(27,29,34,.55)`.
- **`Avatar`**: cuadrado, sin borde blanco ni sombra; fallback = iniciales 12px/800 sobre
  `surface` (nada de 🏪). Tamaños 32 / 56 / 88.
- **`Layout`**: `PageShell` un solo tono (`bg-bg`); `Container` `max-w-[1320px] px-8`
  (`px-4` en móvil); `SiteHeader` → nav de 68px con regla inferior 2px, `Logo lockup`,
  links 12px/700/0.08em uppercase con estado activo (fondo accent) vía `usePathname`;
  `SiteFooter` al ras izquierdo con regla superior 2px; `EmptyState` al ras izquierdo.
- **`Icon`** (nuevo) sobre `lucide-react`. **`Skeleton`** (nuevo): bloque rectangular
  `bg-surface` del tamaño final.
- `app/ui-kit/page.tsx`: reorganizar en el mismo orden del catálogo (logo, paleta,
  tipografía, botones, tags, slot en 3 estados, fila de ranking, campos, diálogo) para
  compararlo lado a lado con el `.dc.html`.
- Tests: `app/ui/Button.test.tsx` y `Tag.test.tsx` mínimos (render de variantes, `href`
  → link, disabled). Vitest ya está configurado; hace falta añadir `@testing-library/react`
  y `jsdom` como devDependencies (entorno `jsdom` solo para `app/**/*.test.tsx`).

## PR 4 — Portada y ranking (`branding/4-ranking`)

Los compuestos del catálogo aplicados a `app/page.tsx`, `app/Ranking.tsx`,
`app/components/RankingCard.tsx`, `app/components/BusinessAd.tsx`, `app/PaymentNotice.tsx`.

- **`SlotCard`** (`app/components/SlotCard.tsx`, sustituye a `RankingCard`): tarjeta
  `.n1-slot` con 3 estados — `leader` (#1, azul a sangre, acción en `accent-fg`),
  `taken` (surface, borde 2px), `available` (borde discontinuo 2px, rank en faint, precio
  en `accent-press`, CTA "Ocupar posición"). Cabecera: rank 34px/900 + tag de estado;
  cuerpo: nombre 20px/800, meta 13px muted, precio 13px/700 uppercase; pie: botón
  `w-full` con regla superior. La fila propia (`isOwn`) usa el mismo azul del líder pero
  con tag "Tu posición". Se mantienen las props `reservation`, `minimumOffer`, `onBid`,
  `forceExpanded` y el anuncio desplegable (`BusinessAd`) para no tocar la lógica.
- **Reserva vigente**: en vez de la caja ámbar, una fila dentro del slot con `LiveDot`,
  "Alguien reservó por $X · vence en 04:12" en 13px y "Supérala desde $Y" en `accent-press`.
  `Countdown` pasa a `tabular-nums` y a tick por segundo solo bajo 5 min (reservas), por
  minuto en el resto.
- **Cabecera de la portada**: kicker "Ranking en vivo" + `LiveDot`, título display
  "Los negocios que más pagan por estar aquí" (ajustar copy con el primer dev), `Lead`
  con la regla del producto. Stats de `SiteExperience` como tres celdas `Figure` 30px con
  divisores 2px (visitas hoy, en línea, históricas), al ras izquierdo. Botón de tema pasa
  a `IconButton` con `sun`/`moon` de Lucide.
- **Vista de lista** (>= 900px): opcional `RankTable` (`app/components/RankTable.tsx`)
  con columnas `70px minmax(0,1fr) 140px 130px 190px` y header en banda ink, para las
  posiciones 4–50; los 3 primeros como `SlotCard` en una fila de 3. En móvil todo son
  `SlotCard` apilados (regla del handoff: nunca scroll horizontal). Si el primer dev
  prefiere solo tarjetas, se omite la tabla; la decisión no bloquea el resto.
- **Diálogo de puja** (`Ranking.tsx`): pasa al `Modal` nuevo con `MoneyInput`, hint
  dinámico "Con $330 quedas en el #5, arriba de X." (ya existe `minimumOfferAt`; solo
  cambia la presentación), total entre reglas de 2px, acciones "Pagar y ocupar" /
  "Cancelar". El label del CTA se recalcula con el monto ("Pagar y subir al #5").
- **`PaymentNotice`**: `Alert` neutral/accent con título 22px; sin colores semánticos.
- **Copy**: revisar todos los textos de portada contra la sección "Voz" del catálogo.

## PR 5 — Cuenta, negocio público y legales (`branding/5-paginas`)

- `app/auth/AuthShell.tsx`, `ingresar/`, `registro/`, `admin/login/`: tarjeta al ras
  izquierdo, `Logo lockup`, campos con `error` en línea (hoy los errores van en `Alert`).
- `app/business/[id]/page.tsx`: cabecera con portada en `filter: grayscale(1)` **solo si el
  primer dev lo aprueba** (regla de fotografía B/N del handoff; los logos siguen a color),
  título display, posición como `Figure`, oferta actual entre reglas, contactos como
  botones `secondary` con `Icon` (whatsapp → `message-circle`, phone, mail, globe) en
  grid 2 columnas, CTA "Subir al ranking" primario `w-full`.
- `app/como-funciona`, `app/terminos`, `app/responsiva`: tipografía y reglas nuevas;
  `STEPS`/`RULES` como filas numeradas al ras izquierdo con regla soft entre ellas.
- `app/admin/page.tsx`: `SiteHeader` + `RankTable` de negocios; `<details>` con regla 2px;
  formularios con las primitivas nuevas.
- Se borran los alias `accent`/`outline` de `Button` y `Badge`; grep final de
  `rounded-`, `emerald`, `amber`, `red-`, `sky-`, `brand-`, emojis en `app/` → cero
  resultados (se añade un test `lib/branding.test.ts` que lee `app/**/*.tsx` y falla si
  aparece alguno; barato y evita regresiones).

## PR 6 — Panel del negocio (`branding/6-panel`)

Rediseño de `/mi-negocio` según `EL N1 - Panel del negocio.dc.html`. Es el PR más grande
y el único que necesita datos que hoy no existen.

Secciones y de dónde sale cada dato (tabla `businesses`, `bids`, `business_clicks`,
`site_visits`):

| Sección del mock | Dato | Estado |
| --- | --- | --- |
| Posición actual "#6" + cambio | `businesses.position`; delta requiere historial | Delta: **falta** tabla `position_history` (migración nueva, trigger en `settle_bid`) |
| "X te superó hace 3 h con $310" | último `bid` aprobado que desplazó a este negocio | Derivable de `bids` + historial |
| Vigencia (días/horas/min) + renovación | No hay vencimiento hoy (memoria: "sin caducidad") | **Se omite**; en su lugar la celda muestra "Tu lugar es tuyo mientras nadie pague más" |
| Métricas: visitas, clics WhatsApp, mejor posición, gasto del mes | `business_clicks` (existe), mejor posición (historial), gasto = suma de `bids` aprobados del mes | Visitas a ficha: **falta** evento `business_view` en `/api/analytics` |
| Gráfica 12 días | historial | Depende de `position_history` |
| Actividad | `bids` + historial | Derivable |
| Competencia cercana | `businesses` ±3 posiciones + `minimumOfferFor` | Existe |
| Ficha + subir posición | `BusinessEditor` actual + formulario de puja | Existe (`Ranking.tsx` tiene la lógica; extraer a `app/components/BidForm.tsx` en PR 4 para reutilizarla aquí) |

Orden dentro del PR (o partirlo en 6a datos / 6b UI si el primer dev prefiere):

1. Migración `0xx_position_history.sql` (`business_id, position, amount, recorded_at`,
   escrita desde `settle_bid` y `expire`), evento `business_view`, RPC
   `business_panel(business_id)` que devuelve todo en una consulta. Tests SQL como en
   `lib/settle-bid.test.ts`.
2. `app/mi-negocio/page.tsx`: layout de 1320px con las secciones apiladas y reglas 2px:
   posición actual (`Figure` clamp 64–120px, tag de cambio con `arrow-down`/`arrow-up`,
   razón 15px muted, acciones), métricas 4 celdas (1 columna < 900px), gráfica SVG
   (`viewBox 0 0 480 140`, `preserveAspectRatio="none"`, `vector-effect:
   non-scaling-stroke`, eje Y invertido) + feed de actividad, tabla de competencia con fila
   propia en azul (móvil → `SlotCard`), y `BusinessEditor` + `BidForm` en 2 columnas.
3. Revalidación al recuperar foco (`visibilitychange` → `router.refresh()`), como pide el
   handoff; `Countdown`/contadores con tick por minuto.
4. Estados de carga con `Skeleton` (Suspense por sección) y estado sin posición con
   `SlotCard available` + "Ocupar posición".

## PR 7 — Modo oscuro (`branding/7-dark`)

- `SiteExperience`: `document.documentElement.dataset.theme = "dark" | ""` en vez de la
  clase; misma persistencia en `localStorage` (`eln1-theme`) y `prefers-color-scheme`.
  Script inline en `layout.tsx` (antes de hidratar) para evitar el flash.
- `globals.css`: `@variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))` y
  redefinición de tokens en `[data-theme="dark"]` con los valores del handoff (bg #14161B,
  surface #1F232A, accent #4B74E8, accent-fg #14161B, reglas rgba(242,243,246,.4)/.16).
  Texto de acento en oscuro = `accent-press-text` #8FA8F5. Borrar todos los overrides
  `.dark .bg-white {…}`.
- Repasar en `/ui-kit` con el tema oscuro que ningún componente use un color fijo
  (el test de PR 5 ya prohíbe hex sueltos en `app/`).
- Iconos `icon.svg` con `<style>@media (prefers-color-scheme: dark)` para invertir sello.

---

## Resumen de esfuerzo y dependencias

| PR | Archivos aprox. | Riesgo | Depende de |
| --- | --- | --- | --- |
| 1 Tokens | 3 + grep | Bajo | — |
| 2 Logo/favicon | 8 | Bajo | 1 |
| 3 Primitivas | 14 | Medio (todo el kit) | 1 |
| 4 Ranking | 6 | Medio (UI de conversión) | 3 |
| 5 Páginas | 10 | Bajo | 3 |
| 6 Panel | 6 + migración | Alto (datos nuevos) | 4 |
| 7 Oscuro | 3 | Bajo | 5 |

Los PRs 2 y 3 pueden ir en paralelo; 4 y 5 también. Lo mínimo para "verse como la marca"
en producción es 1 + 2 + 3 + 4 + 5; el panel (6) y el oscuro (7) pueden esperar.

## Preguntas para el primer dev antes de empezar

1. ¿Confirmamos **cero radios y cero emojis** en toda la app, incluidos los avisos de pago
   y los botones de contacto? (Es lo que exige el handoff; cambia mucho la cara actual.)
2. ¿Portada de negocio en blanco y negro (regla de fotografía del handoff) o a color?
3. Portada: ¿top 3 como tarjetas + tabla para el resto en escritorio, o solo tarjetas?
4. Panel: ¿abrimos la migración de `position_history` + evento `business_view` (PR 6a) o
   entregamos el panel solo con lo que ya hay (posición, competencia, gasto, clics)?
5. La vigencia/renovación del mock contradice la decisión "sin caducidad": ¿la omitimos?
6. Copy de los titulares de portada y del CTA de puja ("Pagar y ocupar") — ¿lo definimos
   entre los dos como hicimos con `/como-funciona`?
