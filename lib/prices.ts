/** Número de posiciones visibles del ranking. */
export const MAX_RANKING_POSITION = 50;
export const RANKING_SIZE = MAX_RANKING_POSITION;

/** Oferta mínima absoluta (MXN) para participar. */
export const BASE_PRICE = 100;

/** Toda oferta debe superar en este factor al precio más bajo del ranking. */
export const FLOOR_FACTOR = 1.1;
export const OUTBID_FACTOR = FLOOR_FACTOR;

/** Tope de una oferta (límite prudente para Mercado Pago y contra errores de dedo). */
export const MAX_OFFER = 50_000;

export function isValidPosition(position: number | null | undefined): boolean {
  return (
    typeof position === "number" &&
    Number.isInteger(position) &&
    position >= 1 &&
    position <= MAX_RANKING_POSITION
  );
}

/** Redondeo hacia arriba tras cortar a centavos (100 × 1.1 es 110, no 111). */
function ceilPesos(value: number): number {
  return Math.ceil(Math.round(value * 100) / 100);
}

type Ranked = { id?: string; position: number | null; current_price: number | string | null };

/** Precio más bajo dentro del ranking (posiciones 1..50), o null si está vacío. */
export function lowestRankedPrice(ranked: Ranked[]): number | null {
  let lowest: number | null = null;

  for (const business of ranked) {
    if (!isValidPosition(business.position)) continue;
    const price = Number(business.current_price);
    if (!Number.isFinite(price)) continue;
    lowest = lowest === null ? price : Math.min(lowest, price);
  }

  return lowest;
}

/**
 * Oferta mínima del Método A: al menos BASE_PRICE, al menos 10 % arriba del
 * precio más bajo del ranking, y —si el negocio ya está dentro— mayor que su
 * propio precio (una oferta nueva reemplaza a la anterior, no se acumula).
 */
export function minimumOffer(
  ranked: Ranked[],
  own?: { position: number | null; current_price: number | string | null } | null,
): number {
  let minimum = BASE_PRICE;

  const lowest = lowestRankedPrice(ranked);
  if (lowest !== null) {
    minimum = Math.max(minimum, ceilPesos(lowest * FLOOR_FACTOR));
  }

  if (own && isValidPosition(own.position)) {
    const ownPrice = Number(own.current_price);
    if (Number.isFinite(ownPrice)) {
      minimum = Math.max(minimum, Math.floor(ownPrice) + 1);
    }
  }

  return minimum;
}

/**
 * Posición proyectada para una oferta: 1 + cuántos negocios del ranking
 * (sin contar al propio) tienen un precio mayor o igual — en el empate exacto
 * queda arriba quien llegó primero. Null si el monto no alcanza el top 50.
 */
export function projectedPosition(
  amount: number,
  ranked: Ranked[],
  ownId?: string | null,
): number | null {
  let above = 0;

  for (const business of ranked) {
    if (!isValidPosition(business.position)) continue;
    if (ownId && business.id === ownId) continue;
    const price = Number(business.current_price);
    if (Number.isFinite(price) && price >= amount) above += 1;
  }

  const projected = above + 1;

  return projected <= MAX_RANKING_POSITION ? projected : null;
}

/**
 * Normaliza el monto que escribe el usuario: entero en pesos y como mucho
 * MAX_OFFER. Devuelve null si no es un número positivo. (El mínimo se valida
 * aparte, para poder avisar en vez de corregir en silencio.)
 */
export function normalizeOffer(value: unknown): number | null {
  const amount =
    typeof value === "string" ? Number(value.replace(/[^0-9.]/g, "")) : Number(value);

  if (!Number.isFinite(amount) || amount <= 0) return null;

  return Math.min(MAX_OFFER, Math.ceil(amount));
}
