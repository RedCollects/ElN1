import { afterEach, describe, expect, it, vi } from "vitest";
import {
  allowCashPayments,
  autoRefundOutbid,
  mercadoPagoDate,
} from "./payments";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("mercadoPagoDate", () => {
  it("usa el formato ISO con desfase +00:00 en vez de Z", () => {
    expect(mercadoPagoDate(new Date("2026-08-27T15:04:05.000Z"))).toBe(
      "2026-08-27T15:04:05.000+00:00",
    );
  });
});

describe("allowCashPayments", () => {
  it("está desactivado por defecto", () => {
    vi.stubEnv("ALLOW_CASH_PAYMENTS", "");
    expect(allowCashPayments()).toBe(false);
  });

  it("solo se activa con el texto exacto 'true'", () => {
    vi.stubEnv("ALLOW_CASH_PAYMENTS", "true");
    expect(allowCashPayments()).toBe(true);
    vi.stubEnv("ALLOW_CASH_PAYMENTS", "1");
    expect(allowCashPayments()).toBe(false);
  });
});

describe("autoRefundOutbid", () => {
  it("está activado por defecto", () => {
    vi.stubEnv("AUTO_REFUND_OUTBID", "");
    expect(autoRefundOutbid()).toBe(true);
  });

  it("solo se desactiva con el texto exacto 'false'", () => {
    vi.stubEnv("AUTO_REFUND_OUTBID", "false");
    expect(autoRefundOutbid()).toBe(false);
    vi.stubEnv("AUTO_REFUND_OUTBID", "0");
    expect(autoRefundOutbid()).toBe(true);
  });
});
