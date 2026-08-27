# Librería de UI de EL N1

Primitivas visuales reutilizables. Todo lo que se ve en la app sale de aquí;
las páginas y los componentes de dominio (`app/components/`) las combinan.

```tsx
import { Button, Card, Alert } from "@/app/ui";
```

Catálogo visual en desarrollo: `http://localhost:3000/ui-kit`.

## Tokens (`app/globals.css`)

| Token | Uso |
| --- | --- |
| `brand` / `brand-400` | Color de marca (sky). Botones `accent`, acentos del logo. |
| `brand-500` | Texto de marca sobre blanco (eyebrows, precios, enlaces) y hover de `accent`. |
| `brand-50` / `brand-100` / `brand-200` | Fondos y bordes suaves (avisos `info`, caja de oferta). |
| `brand-600` / `brand-900` | Degradados y texto sobre fondos `brand-50`. |

Escala neutra: `neutral-950` títulos, `neutral-900` texto, `neutral-500` secundario,
`neutral-400` terciario, `neutral-200/300` bordes, `neutral-50` fondo de paneles.

Estados: `emerald` éxito, `amber` aviso, `red` error.

Radios: `rounded-full` botones pequeños y badges · `rounded-xl` controles y CTAs · `rounded-2xl` tarjetas y avisos · `rounded-3xl` modal y página pública.

## Componentes

### Layout
- **`PageShell`** — `<main>` de cada página. `tone="white" | "muted"`, `centered` para auth/errores.
- **`Container`** — ancho + padding lateral. `width="wide" (6xl) | "content" (4xl) | "narrow" (3xl) | "form" (sm)`.
- **`SiteHeader`** — logo a la izquierda; los hijos van a la derecha como nav. `subtitle` para texto bajo el logo.
- **`SiteFooter`**, **`Logo`** (`href={null}` para que no sea enlace).
- **`EmptyState`** — título centrado + texto + `action`. `tone="error"` para pantallas de error.

### Acciones
- **`Button`** — `<button>` o `next/link` si tiene `href`.
  - `variant`: `primary` (negro, acciones de cuenta) · `accent` (marca, acciones de dinero/ranking) · `outline` · `ghost` · `link`.
  - `size`: `sm` (píldora) · `md` · `lg` (CTA de ancho completo con `block`).
  - `shape="pill" | "rounded"` para salirse del valor por defecto según tamaño.

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
2. El color de marca solo se escribe como `brand-*`; nunca `sky-*` directamente.
3. Los componentes aceptan `className` para ajustes de posición (márgenes, ancho), no para cambiar su aspecto.
4. Los componentes de dominio (tarjeta del ranking, anuncio, subida de imágenes) viven en `app/components/` o junto a su ruta y se construyen con estas primitivas.
