/** Número de posiciones del ranking. */
export const MAX_RANKING_POSITION = 50;
export const RANKING_SIZE = MAX_RANKING_POSITION;

/** Precio (MXN) del siguiente lugar libre. Todas las entradas cuestan lo mismo. */
export const BASE_PRICE = 100;

/** Factor mínimo para superar una oferta existente (110 %). */
export const OUTBID_FACTOR = 1.1;

/** Tope de una oferta (límite prudente para Mercado Pago y contra errores de dedo). */
export const MAX_OFFER = 50_000;

/** Precio de salida de un lugar libre. Se conserva la firma por compatibilidad. */
export function getInitialPrice(): number {
  return BASE_PRICE;
}

/** Tabla de precios iniciales, indexada por posición (hoy todas iguales). */
export const INITIAL_PRICES: Record<number, number> = Object.fromEntries(
  Array.from({ length: MAX_RANKING_POSITION }, (_, index) => [index + 1, BASE_PRICE]),
);

export function isValidPosition(position: number | null | undefined): boolean {
  return (
    typeof position === "number" &&
    Number.isInteger(position) &&
    position >= 1 &&
    position <= MAX_RANKING_POSITION
  );
}

/**
 * Oferta mínima para una posición: el precio base si `floor` es null (lugar
 * libre sin reserva), o `floor` incrementado por OUTBID_FACTOR (redondeado
 * hacia arriba). `floor` es el "piso" de la posición: ver `priceFloor`.
 */
export function getMinimumOffer(
  position: number,
  floor: number | null | undefined,
): number {
  const price = Number(floor);

  if (floor === null || floor === undefined || !Number.isFinite(price)) {
    return getInitialPrice();
  }

  // Redondear a centavos antes de `ceil`: en coma flotante 100 * 1.1 da
  // 110.00000000000001 y `ceil` lo subiría a 111, mientras que `settle_bid`
  // (numeric exacto en Postgres) calcula 110.
  const cents = Math.round(price * OUTBID_FACTOR * 100);

  return Math.ceil(cents / 100);
}

export const minimumOfferFor = getMinimumOffer;

type Ranked = { id?: string; position: number | null; current_price: number | string | null };

/**
 * Piso de una posición: el máximo pagado desde esa posición hacia abajo
 * (así subir siempre cuesta más que quedarse abajo) y la reserva vigente
 * sobre ella. `excludeId` deja fuera al negocio que pregunta, porque si sube
 * de posición su propio precio no cuenta. Devuelve null si no hay nada.
 */
export function priceFloor(
  position: number,
  ranked: Ranked[],
  reservedAmount: number | null | undefined,
  excludeId?: string | null,
): number | null {
  let floor: number | null = null;

  for (const business of ranked) {
    if (business.position === null || business.position < position) continue;
    if (excludeId && business.id === excludeId) continue;
    const price = Number(business.current_price);
    if (!Number.isFinite(price)) continue;
    floor = floor === null ? price : Math.max(floor, price);
  }

  if (reservedAmount !== null && reservedAmount !== undefined && Number.isFinite(reservedAmount)) {
    floor = floor === null ? reservedAmount : Math.max(floor, reservedAmount);
  }

  return floor;
}

/** El único lugar libre que se vende: el siguiente al último ocupado. Null si está lleno. */
export function nextFreePosition(ranked: Ranked[]): number | null {
  let max = 0;

  for (const business of ranked) {
    if (isValidPosition(business.position) && (business.position as number) > max) {
      max = business.position as number;
    }
  }

  return max >= MAX_RANKING_POSITION ? null : max + 1;
}

/**
 * Normaliza el monto que escribe el usuario: entero en pesos, al menos el
 * mínimo y como mucho MAX_OFFER. Devuelve null si no es un número.
 */
export function normalizeOffer(value: unknown, minimum: number): number | null {
  const amount =
    typeof value === "string" ? Number(value.replace(/[^0-9.]/g, "")) : Number(value);

  if (!Number.isFinite(amount) || amount <= 0) return null;

  return Math.min(MAX_OFFER, Math.max(minimum, Math.ceil(amount)));
}
