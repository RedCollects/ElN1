import { describe, expect, it } from "vitest";
import { BUSINESS_CATEGORIES, isValidBusinessCategory } from "./categories";

describe("BUSINESS_CATEGORIES", () => {
  it("no tiene duplicados y todas son válidas", () => {
    expect(new Set(BUSINESS_CATEGORIES).size).toBe(BUSINESS_CATEGORIES.length);
    for (const category of BUSINESS_CATEGORIES) {
      expect(isValidBusinessCategory(category)).toBe(true);
    }
  });
});

describe("isValidBusinessCategory", () => {
  it("exige entre 2 y 60 caracteres", () => {
    expect(isValidBusinessCategory("a")).toBe(false);
    expect(isValidBusinessCategory("ab")).toBe(true);
    expect(isValidBusinessCategory("x".repeat(60))).toBe(true);
    expect(isValidBusinessCategory("x".repeat(61))).toBe(false);
  });
});
