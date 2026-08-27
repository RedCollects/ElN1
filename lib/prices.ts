/** Número de posiciones del ranking. */
export const RANKING_SIZE = 10;

/** Precio inicial (MXN) de cada posición cuando está libre. */
export const INITIAL_PRICES: Record<number, number> = {
  1: 100,
  2: 80,
  3: 60,
  4: 50,
  5: 40,
  6: 30,
  7: 25,
  8: 20,
  9: 15,
  10: 10,
};

/** Factor mínimo para superar una oferta existente (110 %). */
export const OUTBID_FACTOR = 1.1;

export function isValidPosition(position: number): boolean {
  return Number.isInteger(position) && position >= 1 && position <= RANKING_SIZE;
}

/**
 * Oferta mínima para una posición: el precio inicial si está libre,
 * o el precio actual incrementado por OUTBID_FACTOR (redondeado hacia arriba)
 * si ya está ocupada.
 */
export function minimumOfferFor(
  position: number,
  currentPrice: number | null | undefined
): number {
  if (currentPrice === null || currentPrice === undefined) {
    return INITIAL_PRICES[position] ?? INITIAL_PRICES[RANKING_SIZE];
  }

  return Math.ceil(Number(currentPrice) * OUTBID_FACTOR);
}
