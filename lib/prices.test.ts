import { describe, expect, it } from "vitest";
import {
  BASE_PRICE,
  INITIAL_PRICES,
  MAX_OFFER,
  MAX_RANKING_POSITION,
  OUTBID_FACTOR,
  getInitialPrice,
  getMinimumOffer,
  isValidPosition,
  nextFreePosition,
  normalizeOffer,
  priceFloor,
} from "./prices";

function ranked(
  rows: Array<[position: number, price: number, id?: string]>,
) {
  return rows.map(([position, current_price, id]) => ({
    id: id ?? `b${position}`,
    position,
    current_price,
  }));
}

describe("getInitialPrice", () => {
  it("todas las entradas cuestan el precio base", () => {
    expect(getInitialPrice()).toBe(BASE_PRICE);
    expect(BASE_PRICE).toBe(100);
  });
});

describe("INITIAL_PRICES", () => {
  it("cubre todas las posiciones con el precio base", () => {
    expect(Object.keys(INITIAL_PRICES)).toHaveLength(MAX_RANKING_POSITION);
    expect(INITIAL_PRICES[1]).toBe(BASE_PRICE);
    expect(INITIAL_PRICES[MAX_RANKING_POSITION]).toBe(BASE_PRICE);
  });
});

describe("isValidPosition", () => {
  it("acepta 1..MAX y rechaza el resto", () => {
    expect(isValidPosition(1)).toBe(true);
    expect(isValidPosition(MAX_RANKING_POSITION)).toBe(true);
    expect(isValidPosition(0)).toBe(false);
    expect(isValidPosition(MAX_RANKING_POSITION + 1)).toBe(false);
    expect(isValidPosition(1.5)).toBe(false);
    expect(isValidPosition(null)).toBe(false);
    expect(isValidPosition(undefined)).toBe(false);
  });
});

describe("getMinimumOffer", () => {
  it("sin piso devuelve el precio base", () => {
    expect(getMinimumOffer(1, null)).toBe(BASE_PRICE);
    expect(getMinimumOffer(50, undefined)).toBe(BASE_PRICE);
  });

  it("con piso aplica el 110 % redondeado hacia arriba", () => {
    expect(getMinimumOffer(1, 100)).toBe(110);
    expect(getMinimumOffer(1, 110)).toBe(121);
    expect(getMinimumOffer(1, 121)).toBe(134); // ceil(133.1)
  });

  it("coincide con ceil exacto (numeric de Postgres) hasta 10 000", () => {
    for (let price = 1; price <= 10_000; price += 1) {
      const cents = Math.round(price * OUTBID_FACTOR * 100);
      expect(getMinimumOffer(1, price)).toBe(Math.ceil(cents / 100));
    }
  });
});

describe("priceFloor", () => {
  const board = ranked([
    [1, 182],
    [2, 150],
    [3, 90],
    [4, 500],
    [5, 55],
  ]);

  it("es el máximo pagado desde la posición hacia abajo", () => {
    expect(priceFloor(1, board, null)).toBe(500);
    expect(priceFloor(4, board, null)).toBe(500);
    expect(priceFloor(5, board, null)).toBe(55);
  });

  it("incluye la reserva vigente sobre la posición", () => {
    expect(priceFloor(5, board, 600)).toBe(600);
    expect(priceFloor(6, [], 120)).toBe(120);
  });

  it("excluye al negocio que pregunta (cuando sube de posición)", () => {
    expect(priceFloor(3, board, null, "b4")).toBe(90);
  });

  it("devuelve null si no hay nada desde ahí hacia abajo", () => {
    expect(priceFloor(6, board, null)).toBe(null);
    expect(priceFloor(1, [], null)).toBe(null);
  });
});

describe("nextFreePosition", () => {
  it("ranking vacío: se vende el #1", () => {
    expect(nextFreePosition([])).toBe(1);
  });

  it("es el siguiente al último ocupado", () => {
    expect(nextFreePosition(ranked([[1, 100], [2, 100], [3, 100]]))).toBe(4);
  });

  it("ranking lleno: no hay lugar libre", () => {
    const full = ranked(
      Array.from({ length: MAX_RANKING_POSITION }, (_, i) => [i + 1, 100]),
    );
    expect(nextFreePosition(full)).toBe(null);
  });
});

describe("normalizeOffer", () => {
  it("acepta números y textos con formato", () => {
    expect(normalizeOffer(150, 110)).toBe(150);
    expect(normalizeOffer("150", 110)).toBe(150);
    expect(normalizeOffer("1,500", 110)).toBe(1500);
  });

  it("sube al mínimo y redondea hacia arriba", () => {
    expect(normalizeOffer(50, 110)).toBe(110);
    expect(normalizeOffer(110.2, 110)).toBe(111);
  });

  it("aplica el tope", () => {
    expect(normalizeOffer(999_999, 110)).toBe(MAX_OFFER);
  });

  it("rechaza lo que no es un monto", () => {
    expect(normalizeOffer("abc", 110)).toBe(null);
    expect(normalizeOffer(NaN, 110)).toBe(null);
    expect(normalizeOffer(-5, 110)).toBe(null);
  });
});
