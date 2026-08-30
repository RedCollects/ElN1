import { describe, expect, it } from "vitest";
import { formatPrice } from "./format";

describe("formatPrice", () => {
  it("formatea en pesos mexicanos con separador de miles", () => {
    expect(formatPrice(1500)).toBe("$1,500 MXN");
    expect(formatPrice(10)).toBe("$10 MXN");
  });

  it("acepta texto numérico (numeric de Postgres)", () => {
    expect(formatPrice("2500")).toBe("$2,500 MXN");
  });

  it("trata null y undefined como cero", () => {
    expect(formatPrice(null)).toBe("$0 MXN");
    expect(formatPrice(undefined)).toBe("$0 MXN");
  });
});
