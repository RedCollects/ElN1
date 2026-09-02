import { describe, expect, it } from "vitest";
import {
  BASE_PRICE,
  FLOOR_FACTOR,
  MAX_OFFER,
  MAX_RANKING_POSITION,
  isValidPosition,
  lowestRankedPrice,
  minimumOffer,
  normalizeOffer,
  projectedPosition,
} from "./prices";

function ranked(rows: Array<[position: number, price: number, id?: string]>) {
  return rows.map(([position, current_price, id]) => ({
    id: id ?? `b${position}`,
    position,
    current_price,
  }));
}

describe("isValidPosition", () => {
  it("acepta 1..MAX y rechaza el resto", () => {
    expect(isValidPosition(1)).toBe(true);
    expect(isValidPosition(MAX_RANKING_POSITION)).toBe(true);
    expect(isValidPosition(0)).toBe(false);
    expect(isValidPosition(MAX_RANKING_POSITION + 1)).toBe(false);
    expect(isValidPosition(1.5)).toBe(false);
    expect(isValidPosition(null)).toBe(false);
  });
});

describe("lowestRankedPrice", () => {
  it("es el precio más bajo dentro del ranking", () => {
    expect(lowestRankedPrice(ranked([[1, 400], [2, 200], [3, 100]]))).toBe(100);
  });

  it("ignora negocios sin posición y devuelve null si está vacío", () => {
    expect(lowestRankedPrice([{ id: "x", position: null, current_price: 5 }])).toBe(null);
    expect(lowestRankedPrice([])).toBe(null);
  });
});

describe("minimumOffer", () => {
  it("ranking vacío: el mínimo absoluto", () => {
    expect(minimumOffer([])).toBe(BASE_PRICE);
  });

  it("con ranking: 10 % arriba del más bajo, redondeado hacia arriba", () => {
    expect(minimumOffer(ranked([[1, 400], [2, 100]]))).toBe(110);
    expect(minimumOffer(ranked([[1, 101]]))).toBe(112); // ceil(111.1)
    expect(FLOOR_FACTOR).toBe(1.1);
  });

  it("nunca baja del mínimo absoluto aunque el más bajo sea menor", () => {
    expect(minimumOffer(ranked([[1, 50]]))).toBe(BASE_PRICE);
  });

  it("estando dentro, además debe superar el precio propio", () => {
    const board = ranked([[1, 400, "yo"], [2, 100]]);
    expect(minimumOffer(board, { position: 1, current_price: 400 })).toBe(401);
    // El propio es el más bajo: manda el piso del 10 %.
    const low = ranked([[1, 400], [2, 100, "yo"]]);
    expect(minimumOffer(low, { position: 2, current_price: 100 })).toBe(110);
  });

  it("fuera del ranking el precio propio no aplica", () => {
    expect(
      minimumOffer(ranked([[1, 400], [2, 100]]), { position: null, current_price: 999 }),
    ).toBe(110);
  });

  it("no tiene el error de coma flotante (100 × 1.1 = 110, no 111)", () => {
    expect(minimumOffer(ranked([[1, 100]]))).toBe(110);
  });
});

describe("projectedPosition", () => {
  const board = ranked([[1, 400], [2, 200], [3, 100]]);

  it("más que todos: #1; empate exacto queda debajo (el antiguo arriba)", () => {
    expect(projectedPosition(401, board)).toBe(1);
    expect(projectedPosition(400, board)).toBe(2);
    expect(projectedPosition(150, board)).toBe(3);
    expect(projectedPosition(110, board)).toBe(3);
  });

  it("no cuenta al propio negocio", () => {
    const own = ranked([[1, 400, "yo"], [2, 200], [3, 100]]);
    expect(projectedPosition(250, own, "yo")).toBe(1);
  });

  it("null si el monto no alcanza el top 50", () => {
    const full = ranked(
      Array.from({ length: MAX_RANKING_POSITION }, (_, i) => [i + 1, 1000 - i]),
    );
    expect(projectedPosition(10, full)).toBe(null);
    expect(projectedPosition(2000, full)).toBe(1);
  });
});

describe("normalizeOffer", () => {
  it("acepta números y textos con formato", () => {
    expect(normalizeOffer(150)).toBe(150);
    expect(normalizeOffer("150")).toBe(150);
    expect(normalizeOffer("1,500")).toBe(1500);
  });

  it("redondea hacia arriba y aplica el tope", () => {
    expect(normalizeOffer(110.2)).toBe(111);
    expect(normalizeOffer(999_999)).toBe(MAX_OFFER);
  });

  it("rechaza lo que no es un monto (el mínimo se valida aparte)", () => {
    expect(normalizeOffer("abc")).toBe(null);
    expect(normalizeOffer(NaN)).toBe(null);
    expect(normalizeOffer(-5)).toBe(null);
    expect(normalizeOffer(0)).toBe(null);
  });
});
