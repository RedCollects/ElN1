import { describe, expect, it } from "vitest";
import { IVA_RATE, TERMS_VERSION, taxBreakdown, withTax } from "./legal";

describe("taxBreakdown", () => {
  it("desglosa subtotal, IVA y total con centavos exactos", () => {
    expect(taxBreakdown(100)).toEqual({ subtotal: 100, iva: 16, total: 116 });
    expect(taxBreakdown(110)).toEqual({
      subtotal: 110,
      iva: 17.6,
      total: 127.6,
    });
    expect(taxBreakdown(330)).toEqual({
      subtotal: 330,
      iva: 52.8,
      total: 382.8,
    });
  });

  it("no arrastra errores de flotante", () => {
    // 100 * 1.16 en JS da 115.99999999999999
    expect(withTax(100)).toBe(116);
    expect(withTax(0.1 + 0.2)).toBe(0.35);
  });

  it("usa la tasa general del 16 %", () => {
    expect(IVA_RATE).toBe(0.16);
  });

  it("la versión de los Términos tiene formato mayor.menor", () => {
    expect(TERMS_VERSION).toMatch(/^\d+\.\d+$/);
  });
});
