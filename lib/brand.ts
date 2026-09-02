/**
 * Constantes de la marca EL N1 (v2 Azul) que necesitan tanto los componentes
 * de React como los generadores de imágenes (favicon, Open Graph, SVGs).
 * Los mismos valores viven como tokens CSS en app/globals.css; aquí van los que
 * hay que usar fuera del CSS.
 */

export const BRAND = {
  accent: "#1746d4",
  accentFg: "#f2f3f6",
  ink: "#1b1d22",
  bg: "#f2f3f6",
  surface: "#e7e9ef",
  muted: "#5b6069",
} as const;

/**
 * Sello circular "N1": anillo troquelado. El grosor del trazo es el 2.5 % del
 * diámetro y el patrón de troquel es fijo. Única forma redonda de la marca.
 */
export const SEAL = {
  viewBox: 200,
  radius: 88,
  strokeWidth: 5,
  dash: "150 9 44 9 150 9 44 9",
  /** Tamaño del "N1" dentro del viewBox (Archivo 900, -0.04em). */
  fontSize: 92,
  letterSpacing: "-0.04em",
  /** Por debajo de esto el anillo no se distingue; usar solo el "N1". */
  minSize: 24,
} as const;

/** Anillo del sello como SVG autónomo (sin texto), para usar como imagen. */
/** `fill` rellena el disco interior (p. ej. el fondo claro en el favicon). */
export function sealRingSvg(
  stroke: string,
  strokeWidth: number = SEAL.strokeWidth,
  fill: string = "none",
): string {
  const c = SEAL.viewBox / 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SEAL.viewBox} ${SEAL.viewBox}">` +
    `<circle cx="${c}" cy="${c}" r="${SEAL.radius}" fill="${fill}" stroke="${stroke}" ` +
    `stroke-width="${strokeWidth}" stroke-dasharray="${SEAL.dash}" stroke-linecap="butt"/>` +
    `</svg>`
  );
}
