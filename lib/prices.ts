/** Número de posiciones del ranking. */
export const MAX_RANKING_POSITION = 50;
export const RANKING_SIZE = MAX_RANKING_POSITION;

/** Solo las primeras posiciones tienen precio de salida escalonado; el resto vale lo mismo que la #10. */
const INITIAL_PRICE_POSITION_COUNT = 10;

/** Factor mínimo para superar una oferta existente (110 %). */
export const OUTBID_FACTOR = 1.1;

/** Precio inicial (MXN) de una posición libre: 100, 90, 80 … 10, y 10 de la #11 en adelante. */
export function getInitialPrice(position: number): number {
  const pricedPosition = Math.min(
    Math.max(position, 1),
    INITIAL_PRICE_POSITION_COUNT
  );

  return (INITIAL_PRICE_POSITION_COUNT - pricedPosition + 1) * 10;
}

/** Tabla precalculada de precios iniciales, indexada por posición. */
export const INITIAL_PRICES: Record<number, number> = Object.fromEntries(
  Array.from({ length: MAX_RANKING_POSITION }, (_, index) => [
    index + 1,
    getInitialPrice(index + 1),
  ])
);

export function isValidPosition(position: number): boolean {
  return (
    Number.isInteger(position) && position >= 1 && position <= MAX_RANKING_POSITION
  );
}

/**
 * Oferta mínima para una posición: el precio inicial si está libre,
 * o el precio actual incrementado por OUTBID_FACTOR (redondeado hacia arriba)
 * si ya está ocupada (o reservada).
 */
export function getMinimumOffer(
  position: number,
  currentPrice: number | null | undefined
): number {
  const price = Number(currentPrice);

  return currentPrice === null || currentPrice === undefined || !Number.isFinite(price)
    ? getInitialPrice(position)
    : Math.ceil(price * OUTBID_FACTOR);
}

export const minimumOfferFor = getMinimumOffer;
