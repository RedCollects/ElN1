import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Dobles de Mercado Pago -------------------------------------------------

const paymentGet = vi.fn();
const refundTotal = vi.fn();

vi.mock("mercadopago", () => ({
  MercadoPagoConfig: class {
    constructor(public options: { accessToken: string }) {}
  },
  Payment: class {
    get = paymentGet;
  },
  PaymentRefund: class {
    total = refundTotal;
  },
}));

// --- Doble de Supabase ------------------------------------------------------
//
// Reproduce solo la parte del query builder que usa settle-bid:
//   from("bids").select(...).eq(...).maybeSingle()
//   from("bids").update(...).eq(...).in(...)   (también sin .in)
//   rpc("settle_bid", ...)

type Row = {
  id: string;
  amount: number;
  status: string;
  refund_id: string | null;
};

type Fake = {
  bid: Row | null;
  bidError: { message: string } | null;
  rpcResult: unknown;
  rpcError: { message: string } | null;
  updateError: { message: string } | null;
  updates: Array<{ values: Record<string, unknown>; filters: unknown[] }>;
  rpcCalls: unknown[];
};

const fake: Fake = {
  bid: null,
  bidError: null,
  rpcResult: null,
  rpcError: null,
  updateError: null,
  updates: [],
  rpcCalls: [],
};

function makeClient() {
  return {
    from(table: string) {
      expect(table).toBe("bids");
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({
                  data: fake.bid,
                  error: fake.bidError,
                }),
              };
            },
          };
        },
        update(values: Record<string, unknown>) {
          const entry = { values, filters: [] as unknown[] };
          fake.updates.push(entry);
          const chain = {
            eq(...args: unknown[]) {
              entry.filters.push(["eq", ...args]);
              return chain;
            },
            in(...args: unknown[]) {
              entry.filters.push(["in", ...args]);
              return chain;
            },
            then(resolve: (value: { error: unknown }) => void) {
              resolve({ error: fake.updateError });
            },
          };
          return chain;
        },
      };
    },
    rpc(name: string, args: unknown) {
      fake.rpcCalls.push([name, args]);
      return Promise.resolve({ data: fake.rpcResult, error: fake.rpcError });
    },
  };
}

vi.mock("./supabase-server", () => ({
  createServerSupabaseClient: () => makeClient(),
}));

import { verifyAndSettlePayment } from "./settle-bid";

// --- Helpers ----------------------------------------------------------------

const PAYMENT_ID = "pay-1";
const BID_ID = "bid-1";

function approvedPayment(overrides: Record<string, unknown> = {}) {
  return {
    external_reference: BID_ID,
    status: "approved",
    transaction_amount: 110,
    currency_id: "MXN",
    ...overrides,
  };
}

function pendingBid(overrides: Partial<Row> = {}): Row {
  return {
    id: BID_ID,
    amount: 110,
    status: "pending",
    refund_id: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "token");
  vi.stubEnv("AUTO_REFUND_OUTBID", "");
  fake.bid = null;
  fake.bidError = null;
  fake.rpcResult = null;
  fake.rpcError = null;
  fake.updateError = null;
  fake.updates = [];
  fake.rpcCalls = [];
  paymentGet.mockReset();
  refundTotal.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// --- Tests ------------------------------------------------------------------

describe("verifyAndSettlePayment", () => {
  it("lanza si falta el token de Mercado Pago (error de configuración → 500)", async () => {
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "");
    await expect(verifyAndSettlePayment(PAYMENT_ID)).rejects.toThrow(
      /MERCADOPAGO_ACCESS_TOKEN/,
    );
  });

  it("propaga el fallo de Mercado Pago para que el webhook responda 500 y reintente", async () => {
    paymentGet.mockRejectedValue(new Error("MP caído"));
    await expect(verifyAndSettlePayment(PAYMENT_ID)).rejects.toThrow(
      "MP caído",
    );
  });

  it("ignora pagos sin oferta asociada", async () => {
    paymentGet.mockResolvedValue(approvedPayment({ external_reference: "  " }));

    await expect(verifyAndSettlePayment(PAYMENT_ID)).resolves.toEqual({
      settled: false,
      rejected: "sin_oferta",
    });
    expect(fake.rpcCalls).toHaveLength(0);
  });

  it("no asigna nada si el pago no está aprobado", async () => {
    paymentGet.mockResolvedValue(approvedPayment({ status: "pending" }));

    await expect(verifyAndSettlePayment(PAYMENT_ID)).resolves.toEqual({
      settled: false,
      status: "pending",
    });
    expect(fake.rpcCalls).toHaveLength(0);
  });

  it("propaga un error de base de datos al leer la oferta", async () => {
    paymentGet.mockResolvedValue(approvedPayment());
    fake.bidError = { message: "BD caída" };

    await expect(verifyAndSettlePayment(PAYMENT_ID)).rejects.toThrow(
      "BD caída",
    );
  });

  it("rechaza si la oferta referenciada no existe", async () => {
    paymentGet.mockResolvedValue(approvedPayment());
    fake.bid = null;

    await expect(verifyAndSettlePayment(PAYMENT_ID)).resolves.toEqual({
      settled: false,
      rejected: "oferta_inexistente",
    });
  });

  it("es idempotente: una oferta ya pagada no se vuelve a asignar", async () => {
    paymentGet.mockResolvedValue(approvedPayment());
    fake.bid = pendingBid({ status: "paid" });

    await expect(verifyAndSettlePayment(PAYMENT_ID)).resolves.toEqual({
      settled: true,
      alreadySettled: true,
      bidId: BID_ID,
    });
    expect(fake.rpcCalls).toHaveLength(0);
  });

  it("no reprocesa ofertas ya superadas o reembolsadas", async () => {
    paymentGet.mockResolvedValue(approvedPayment());
    fake.bid = pendingBid({ status: "refunded", refund_id: "ref-1" });

    await expect(verifyAndSettlePayment(PAYMENT_ID)).resolves.toEqual({
      settled: false,
      rejected: "refunded",
      refunded: true,
    });
    expect(fake.rpcCalls).toHaveLength(0);
    expect(refundTotal).not.toHaveBeenCalled();
  });

  it("marca la oferta como rechazada si el importe no coincide, sin llamar a settle_bid", async () => {
    paymentGet.mockResolvedValue(approvedPayment({ transaction_amount: 100 }));
    fake.bid = pendingBid({ amount: 110 });

    await expect(verifyAndSettlePayment(PAYMENT_ID)).resolves.toEqual({
      settled: false,
      rejected: "importe_incorrecto",
    });
    expect(fake.rpcCalls).toHaveLength(0);
    expect(fake.updates).toHaveLength(1);
    expect(fake.updates[0].values).toEqual({
      status: "rejected",
      payment_id: PAYMENT_ID,
      failure_reason: "importe_incorrecto",
    });
    // Solo se rechaza una oferta pendiente o caducada, nunca una ya pagada.
    expect(fake.updates[0].filters).toContainEqual([
      "in",
      "status",
      ["pending", "expired"],
    ]);
  });

  it("acepta el importe aunque Postgres lo devuelva como texto", async () => {
    paymentGet.mockResolvedValue(approvedPayment({ transaction_amount: 110 }));
    fake.bid = pendingBid({ amount: "110" as unknown as number });
    fake.rpcResult = { success: true };

    await expect(verifyAndSettlePayment(PAYMENT_ID)).resolves.toMatchObject({
      settled: true,
    });
  });

  it("marca la oferta como rechazada si la moneda no es MXN", async () => {
    paymentGet.mockResolvedValue(approvedPayment({ currency_id: "USD" }));
    fake.bid = pendingBid();

    await expect(verifyAndSettlePayment(PAYMENT_ID)).resolves.toEqual({
      settled: false,
      rejected: "moneda_incorrecta",
    });
    expect(fake.rpcCalls).toHaveLength(0);
  });

  it("propaga el error si no se puede registrar el rechazo", async () => {
    paymentGet.mockResolvedValue(approvedPayment({ currency_id: "USD" }));
    fake.bid = pendingBid();
    fake.updateError = { message: "BD caída" };

    await expect(verifyAndSettlePayment(PAYMENT_ID)).rejects.toThrow(
      "BD caída",
    );
  });

  it("asigna la posición cuando settle_bid tiene éxito", async () => {
    paymentGet.mockResolvedValue(approvedPayment());
    fake.bid = pendingBid();
    fake.rpcResult = { success: true, bid_id: BID_ID };

    await expect(verifyAndSettlePayment(PAYMENT_ID)).resolves.toEqual({
      settled: true,
      bidId: BID_ID,
      result: { success: true, bid_id: BID_ID },
    });
    expect(fake.rpcCalls).toEqual([
      ["settle_bid", { p_bid_id: BID_ID, p_payment_id: PAYMENT_ID }],
    ]);
    expect(refundTotal).not.toHaveBeenCalled();
  });

  it("propaga el error de settle_bid (transitorio → 500)", async () => {
    paymentGet.mockResolvedValue(approvedPayment());
    fake.bid = pendingBid();
    fake.rpcError = { message: "deadlock" };

    await expect(verifyAndSettlePayment(PAYMENT_ID)).rejects.toThrow(
      "deadlock",
    );
  });

  it("reembolsa y registra el refund_id cuando la oferta llegó tarde", async () => {
    paymentGet.mockResolvedValue(approvedPayment());
    fake.bid = pendingBid();
    fake.rpcResult = {
      success: false,
      reason: "outbid",
      required: 121,
      paid: 110,
    };
    refundTotal.mockResolvedValue({ id: 555 });

    await expect(verifyAndSettlePayment(PAYMENT_ID)).resolves.toEqual({
      settled: false,
      rejected: "outbid",
      refunded: true,
    });
    expect(refundTotal).toHaveBeenCalledWith({ payment_id: PAYMENT_ID });
    expect(fake.updates.at(-1)?.values).toEqual({
      status: "refunded",
      refund_id: "555",
    });
  });

  it("no reembolsa si AUTO_REFUND_OUTBID=false", async () => {
    vi.stubEnv("AUTO_REFUND_OUTBID", "false");
    paymentGet.mockResolvedValue(approvedPayment());
    fake.bid = pendingBid();
    fake.rpcResult = { success: false, reason: "outbid" };

    await expect(verifyAndSettlePayment(PAYMENT_ID)).resolves.toEqual({
      settled: false,
      rejected: "outbid",
      refunded: false,
    });
    expect(refundTotal).not.toHaveBeenCalled();
  });

  it("si el reembolso se emitió pero no se pudo registrar, lo reporta como reembolsado y lo registra en el log", async () => {
    paymentGet.mockResolvedValue(approvedPayment());
    fake.bid = pendingBid();
    fake.rpcResult = { success: false, reason: "outbid" };
    refundTotal.mockResolvedValue({ id: 556 });
    fake.updateError = { message: "BD caída" };

    await expect(verifyAndSettlePayment(PAYMENT_ID)).resolves.toMatchObject({
      refunded: true,
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("webhook.refund_unrecorded"),
      expect.objectContaining({ paymentId: PAYMENT_ID, refundId: 556 }),
      { message: "BD caída" },
    );
  });
});
