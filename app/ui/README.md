# Librería de UI de EL N1

Primitivas visuales reutilizables. Todo lo que se ve en la app sale de aquí;
las páginas y los componentes de dominio (`app/components/`) las combinan.

```tsx
import { Button, Card, Alert } from "@/app/ui";
```

Catálogo visual en desarrollo: `http://localhost:3000/ui-kit`.

## Tokens (`app/globals.css`)

Marca **v2 Azul** (handoff en `../branding/`). Los valores viven una sola vez en
`@theme`; en el código solo se usan como clases.

| Token                                   | Clase                                           | Uso                                                                                                    |
| --------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `accent` #1746D4                        | `bg-accent`, `text-accent-fg`                   | Acción primaria, posición #1, fila propia, estado en vivo. Como texto solo en cifras grandes (≥ 24px). |
| `accent-hover` #1239B0                  | `hover:bg-accent-hover`                         | Hover del botón primario.                                                                              |
| `accent-press` #0E2F8F                  | `text-accent-press`, `active:bg-accent-press`   | Pressed y **todo texto corrido en azul** (contraste AA).                                               |
| `accent-100…900`                        | `bg-accent-200`, …                              | Rampa. `accent-200` = fondo de tags "disponible"/"sube" y `::selection`.                               |
| `bg` #F2F3F6                            | `bg-bg`                                         | Fondo de toda la app.                                                                                  |
| `surface` #E7E9EF · `surface-2` #F5F7FA | `bg-surface`, `bg-surface-2`                    | Tarjetas, campos, skeletons · hover de fila.                                                           |
| `ink` #1B1D22                           | `text-ink`                                      | Texto principal.                                                                                       |
| `muted` #5B6069 · `faint` #95999F       | `text-muted`, `text-faint`                      | Secundario · etiquetas y valores vacíos.                                                               |
| `rule` / `rule-soft`                    | `rule`, `rule-soft` (+ `border-t`, `border-b`…) | Regla fuerte de 2px entre secciones · 1px solo en filas internas.                                      |
| `band` / `band-fg`                      | `bg-band text-band-fg`                          | Bandas de tinta: header de tabla, prefijo `$`.                                                         |
| `neutral-100…950`                       | `text-neutral-800`, …                           | Rampa neutra del handoff (sustituye a la de Tailwind).                                                 |
| `shadow-modal`                          | `shadow-modal`                                  | Única sombra permitida: diálogos.                                                                      |

Utilidades de texto: `figure` (900 / -0.03em / `tabular-nums`, para cifras) y
`label` (11px / 700 / 0.12em / mayúsculas).

Tipografía: **Archivo** (única familia, pesos 400–900) vía `next/font` en `app/layout.tsx`.

### Reglas de la identidad

1. **Radio 0 en todo.** Todos los `--radius-*` valen 0 y no se escribe `rounded-*`. La
   única excepción es el sello circular del logo.
2. **Reglas de 2px** (`border-2 border-rule`) para separar secciones; 1px (`border-rule-soft`) solo dentro de
   tablas y listas.
3. **Todo al ras izquierdo**, incluido el label dentro de botones anchos. Nunca centrar.
4. **El azul con moderación**: acción primaria, posición #1, fila propia, en vivo. Sin
   fondos azules extensos salvo la tarjeta del líder.
5. **Cifras siempre `figure`** (`tabular-nums`) para que no salten al actualizar.
6. **Sin emojis ni colores semánticos** (verde/ámbar/rojo). Iconos: Lucide. Los errores
   se marcan con texto en `accent-press` y borde `accent`.

## Componentes

### Layout

- **`PageShell`** — `<main>` de cada página, siempre sobre `bg`. `centered` para auth/errores.
- **`Container`** — ancho + padding lateral. `width="wide" (1320) | "content" (960) | "narrow" (760) | "form" (420)`.
- **`SiteHeader`** — nav de 68px con regla inferior de 2px: `Logo` a la izquierda, los hijos a la
  derecha. `subtitle` junto al logo. **`NavLink`** para enlaces de nav con estado activo (azul).
- **`SiteFooter`** — regla superior, enlaces legales al ras.
- **`Logo`** — lockup sello + "EL N1". `size` (alto del sello, mín. 24), `tone="ink" | "paper" | "accent"`,
  `compact` (solo sello), `href={null}` para que no sea enlace. **`Seal`** es el sello solo.
  Es la única forma redonda de la app. Los mismos valores viven en `lib/brand.ts`; los
  archivos de `public/logo-*.svg|png` se regeneran con `node scripts/brand-assets.mjs`.
  Favicon, icono iOS y Open Graph se generan en `app/icon.tsx`, `app/apple-icon.tsx` y
  `app/opengraph-image.tsx` con la fuente vendida en `app/fonts/`.
- **`EmptyState`** — título + texto + `action`, al ras izquierdo. `tone="error"`.

### Acciones

- **`Button`** — `<button>` o `next/link` si tiene `href`. Label 13px en mayúsculas, **al ras
  izquierdo incluso con `block`**.
  - `variant`: `primary` (azul: pagar, ocupar, subir) · `secondary` (borde 2px: ver, volver,
    cancelar) · `ghost` (texto discreto) · `link` (enlace en línea). `accent` y `outline` son
    alias de `primary` y `secondary`.
  - `size`: `sm` · `md` · `lg`. `block` para ancho completo.
- **`IconButton`** — cuadrado de 46px con borde, solo icono; `label` obligatorio.
- **`Icon`** — Lucide con stroke 2.2 (3 en ≤ 12px) y terminales cuadradas. `name` de la lista
  en `Icon.tsx`; añadir ahí los que hagan falta. Nunca emojis.

### Formularios

- **`Field`** — `label` (11px mayúsculas) + control hijo + `hint` (azul de párrafo) o `error`
  (mismo estilo, `role="alert"`; poner `aria-invalid` en el control para el borde azul).
- **`Input`**, **`Textarea`**, **`Select`** — borde 2px, fondo `bg`, focus azul (`controlClassName`).
- **`PrefixedInput`** — prefijo dentro del borde (`@usuario`).
- **`MoneyInput`** — prefijo `$` en banda de tinta, cifra tabular, sufijo `MXN`.
- **`Segmented`**, **`Switch`**, **`Radio`** — controles cuadrados con estado (cliente).

### Feedback

- **`Alert`** — `tone="accent" | "neutral"`: borde 2px azul (pide atención o acción) o de tinta
  (informativo). `title`, `compact`, `closeHref`. Los tonos viejos se traducen
  (`error`/`warning`/`info` → `accent`, `success` → `neutral`); `error` conserva `role="alert"`.
- **`Tag`** — etiqueta de estado 11px: `first` (#1, azul) · `available` · `taken` · `verified` ·
  `neutral` · `up` · `down`. `Badge` es alias.
- **`LiveDot`** — cuadro azul de 8px + etiqueta ("En vivo").
- **`Modal`** — diálogo de 420px con borde 2px y la única sombra. `eyebrow`, `title`, `actions`
  (primer botón `flex-1`, el resto separados por regla vertical). Cliente.
- **`Skeleton`** — bloque rectangular en `surface` del tamaño final. Sin spinners.

### Contenido

- **`Card`** — superficie con borde 2px. `padding`, `tone="surface" | "bg"`.
- **`CardSection`** — tarjeta con `title` (22px) separado por regla; bloques de un formulario.
- **`Eyebrow`** — etiqueta 11px sobre un título. `tone="accent" | "muted" | "faint" | "paper"`.
- **`Heading`** — `as` independiente de `size="display" | "title" | "h2" | "lg" | "md" | "sm"`.
- **`Figure`** — cifra 900 / `tabular-nums`. `size` en px, `tone="ink" | "accent" | "paper"`.
  El azul solo en cifras ≥ 24px.
- **`Lead`**, **`Muted`** — párrafo introductorio / texto secundario.
- **`Price`** — cantidad en MXN como `Figure`. `size`, `tone="accent" | "ink"`.
- **`Avatar`** — logo de negocio cuadrado; sin imagen, iniciales de `alt` sobre `surface`.
  `size="xs" | "sm" | "md" | "lg"`.

## Reglas de la identidad

1. **Radio 0 en todo.** Todos los `--radius-*` valen 0 y no se escribe `rounded-*`. La
   única excepción es el sello circular del logo.
2. **Reglas de 2px** (`border-2 border-rule`) para separar secciones; 1px (`border-rule-soft`) solo dentro de
   tablas y listas.
3. **Todo al ras izquierdo**, incluido el label dentro de botones anchos. Nunca centrar.
4. **El azul con moderación**: acción primaria, posición #1, fila propia, en vivo. Sin
   fondos azules extensos salvo la tarjeta del líder.
5. **Cifras siempre `figure`** (`tabular-nums`) para que no salten al actualizar.
6. **Sin emojis ni colores semánticos** (verde/ámbar/rojo). Iconos: Lucide. Los errores
   se marcan con texto en `accent-press` y borde `accent`.

## Componentes

### Layout

- **`PageShell`** — `<main>` de cada página. `tone="white" | "muted"`, `centered` para auth/errores.
- **`Container`** — ancho + padding lateral. `width="wide" (6xl) | "content" (4xl) | "narrow" (3xl) | "form" (sm)`.
- **`SiteHeader`** — logo a la izquierda; los hijos van a la derecha como nav. `subtitle` para texto bajo el logo.
- **`SiteFooter`**.
- **`Logo`** — lockup sello + "EL N1". `size` (alto del sello, mín. 24), `tone="ink" | "paper" | "accent"`,
  `compact` (solo sello), `href={null}` para que no sea enlace. **`Seal`** es el sello solo.
  Es la única forma redonda de la app. Los mismos valores viven en `lib/brand.ts`; los
  archivos de `public/logo-*.svg|png` se regeneran con `node scripts/brand-assets.mjs`.
  Favicon, icono iOS y Open Graph se generan en `app/icon.tsx`, `app/apple-icon.tsx` y
  `app/opengraph-image.tsx` con la fuente vendida en `app/fonts/`.
- **`EmptyState`** — título centrado + texto + `action`. `tone="error"` para pantallas de error.

### Acciones

- **`Button`** — `<button>` o `next/link` si tiene `href`.
  - `variant`: `primary` (negro, acciones de cuenta) · `accent` (marca, acciones de dinero/ranking) · `outline` · `ghost` · `link`.
  - `size`: `sm` · `md` · `lg` (CTA de ancho completo con `block`).

### Formularios

- **`Field`** — `label` + control hijo + `hint`.
- **`Input`**, **`Textarea`**, **`Select`** — controles con el estilo base (`controlClassName`).
- **`PrefixedInput`** — control con prefijo fijo dentro del borde (`@usuario`).

### Feedback

- **`Alert`** — `tone="info" | "success" | "warning" | "error" | "neutral"`, `title`, `compact` (dentro de formularios), `closeHref`. Pone `role="alert"` a los errores y `role="status"` al resto.
- **`Badge`** — etiqueta pequeña en mayúsculas con los mismos tonos.
- **`Modal`** — diálogo centrado con `eyebrow`, `title`, `onClose` (×, Escape o clic fuera). Cliente.

### Contenido

- **`Card`** — superficie blanca. `padding="none" | "sm" | "md" | "lg"`, `elevated`.
- **`CardSection`** — tarjeta con `title` y `description`; bloques de un formulario largo.
- **`Eyebrow`** — texto pequeño en mayúsculas sobre un título. `tone="brand" | "muted" | "light"`, `size="sm" | "xs"`.
- **`Heading`** — `as="h1" | "h2" | "h3"` independiente de `size="display" | "xl" | "lg" | "md" | "sm"`.
- **`Lead`**, **`Muted`** — párrafo grande introductorio / texto secundario.
- **`Price`** — cantidad en MXN (`formatPrice` de `lib/format.ts`). `size`, `tone="brand" | "ink"`.
- **`Avatar`** — logo de negocio con fallback (🏪, medalla, `#3`). `size="sm" | "md" | "lg"`.

## Reglas

1. Antes de escribir clases de Tailwind a mano, busca si ya existe el componente. Si un patrón se repite dos veces, súbelo aquí.
2. El color de marca solo se escribe como `accent-*`; nunca un hex ni `sky-*`.
3. Los componentes aceptan `className` para ajustes de posición (márgenes, ancho), no para cambiar su aspecto.
4. Sin `rounded-*`, sin emojis, sin `emerald`/`amber`/`red`. Si un estado necesita
   distinguirse, se usa tinta, gris o el azul de acento.
5. Los componentes de dominio (tarjeta del ranking, anuncio, subida de imágenes) viven en `app/components/` o junto a su ruta y se construyen con estas primitivas.
