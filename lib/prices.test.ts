import { describe, expect, it } from "vitest";
import {
  INITIAL_PRICES,
  MAX_RANKING_POSITION,
  OUTBID_FACTOR,
  getInitialPrice,
  getMinimumOffer,
  isValidPosition,
  minimumOfferFor,
} from "./prices";

describe("getInitialPrice", () => {
  it("baja de 100 a 10 entre la #1 y la #10", () => {
    expect(getInitialPrice(1)).toBe(100);
    expect(getInitialPrice(2)).toBe(90);
    expect(getInitialPrice(5)).toBe(60);
    expect(getInitialPrice(10)).toBe(10);
  });

  it("vale 10 de la #11 en adelante", () => {
    expect(getInitialPrice(11)).toBe(10);
    expect(getInitialPrice(50)).toBe(10);
    expect(getInitialPrice(99)).toBe(10);
  });

  it("trata posiciones menores que 1 como la #1", () => {
    expect(getInitialPrice(0)).toBe(100);
    expect(getInitialPrice(-3)).toBe(100);
  });
});

describe("INITIAL_PRICES", () => {
  it("tiene una entrada por posición del ranking", () => {
    expect(Object.keys(INITIAL_PRICES)).toHaveLength(MAX_RANKING_POSITION);
    expect(INITIAL_PRICES[1]).toBe(100);
    expect(INITIAL_PRICES[MAX_RANKING_POSITION]).toBe(10);
  });
});

describe("getMinimumOffer", () => {
  it("usa el precio inicial cuando la posición está libre", () => {
    expect(getMinimumOffer(1, null)).toBe(100);
    expect(getMinimumOffer(3, undefined)).toBe(80);
  });

  it("exige OUTBID_FACTOR sobre el precio actual, redondeando hacia arriba", () => {
    expect(OUTBID_FACTOR).toBe(1.1);
    expect(getMinimumOffer(1, 105)).toBe(116); // 115.5 → 116
    expect(getMinimumOffer(7, 10)).toBe(11);
    expect(getMinimumOffer(1, 500)).toBe(550);
  });

  // BUG CONOCIDO (se corrige en el PR "calidad/fix-redondeo-oferta"):
  // `Math.ceil(100 * 1.1)` da 111 porque 100 * 1.1 = 110.00000000000001 en
  // coma flotante. Postgres (`settle_bid`, numeric exacto) calcula 110, así
  // que el cliente paga un peso de más. Cuando se corrija, cambiar `it.fails`
  // por `it`.
  it.fails("cobra exactamente el 110 % cuando el resultado es entero", () => {
    expect(getMinimumOffer(1, 100)).toBe(110);
    expect(getMinimumOffer(1, 50)).toBe(55);
    expect(getMinimumOffer(1, 200)).toBe(220);
  });

  it("acepta el precio como texto (numeric de Postgres)", () => {
    expect(getMinimumOffer(1, "105" as unknown as number)).toBe(116);
  });

  it("cae al precio inicial si el precio actual no es numérico", () => {
    expect(getMinimumOffer(2, Number.NaN)).toBe(90);
    expect(getMinimumOffer(2, "abc" as unknown as number)).toBe(90);
  });

  it("minimumOfferFor es un alias", () => {
    expect(minimumOfferFor).toBe(getMinimumOffer);
  });
});

describe("isValidPosition", () => {
  it("acepta enteros entre 1 y MAX_RANKING_POSITION", () => {
    expect(isValidPosition(1)).toBe(true);
    expect(isValidPosition(MAX_RANKING_POSITION)).toBe(true);
  });

  it("rechaza fuera de rango, decimales y NaN", () => {
    expect(isValidPosition(0)).toBe(false);
    expect(isValidPosition(MAX_RANKING_POSITION + 1)).toBe(false);
    expect(isValidPosition(2.5)).toBe(false);
    expect(isValidPosition(Number.NaN)).toBe(false);
  });
});
