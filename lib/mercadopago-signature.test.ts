import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  SIGNATURE_MAX_AGE_MS,
  isMercadoPagoWebhookAuthorized,
} from "./mercadopago-signature";

const SECRET = "secreto-de-prueba";
const PAYMENT_ID = "123456789";
const REQUEST_ID = "req-abc";
const NOW = 1_700_000_000_000;

function signedHeader(ts: number, secret = SECRET, requestId = REQUEST_ID) {
  const manifest = `id:${PAYMENT_ID};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

type Input = Parameters<typeof isMercadoPagoWebhookAuthorized>[0];

function check(overrides: Partial<Input>) {
  return isMercadoPagoWebhookAuthorized({
    signatureHeader: signedHeader(NOW / 1000),
    requestId: REQUEST_ID,
    paymentId: PAYMENT_ID,
    secret: SECRET,
    production: true,
    now: NOW,
    ...overrides,
  });
}

/** Cambia el último carácter hexadecimal del hash. */
function tamper(header: string) {
  const last = header.at(-1);
  return header.slice(0, -1) + (last === "0" ? "1" : "0");
}

describe("isMercadoPagoWebhookAuthorized", () => {
  it("acepta una firma correcta y reciente", () => {
    expect(check({})).toBe(true);
  });

  it("acepta espacios alrededor de las partes de la cabecera", () => {
    const header = signedHeader(NOW / 1000).replace(",", " , ");
    expect(check({ signatureHeader: header })).toBe(true);
  });

  it("rechaza un hash alterado", () => {
    expect(check({ signatureHeader: tamper(signedHeader(NOW / 1000)) })).toBe(
      false,
    );
  });

  it("rechaza una firma hecha con otro secreto", () => {
    expect(check({ signatureHeader: signedHeader(NOW / 1000, "otro") })).toBe(
      false,
    );
  });

  it("rechaza si el request-id no coincide con el firmado", () => {
    expect(check({ requestId: "otro-request" })).toBe(false);
  });

  it("rechaza si el id de pago no coincide con el firmado", () => {
    expect(check({ paymentId: "999" })).toBe(false);
  });

  it("rechaza timestamps fuera de la ventana", () => {
    const tooOld = (NOW - SIGNATURE_MAX_AGE_MS - 1000) / 1000;
    const tooNew = (NOW + SIGNATURE_MAX_AGE_MS + 1000) / 1000;
    expect(check({ signatureHeader: signedHeader(tooOld) })).toBe(false);
    expect(check({ signatureHeader: signedHeader(tooNew) })).toBe(false);
  });

  it("acepta timestamps justo dentro de la ventana", () => {
    const edge = (NOW - SIGNATURE_MAX_AGE_MS + 1000) / 1000;
    expect(check({ signatureHeader: signedHeader(edge) })).toBe(true);
  });

  it("rechaza cabeceras incompletas o mal formadas", () => {
    expect(check({ signatureHeader: null })).toBe(false);
    expect(check({ signatureHeader: "" })).toBe(false);
    expect(check({ signatureHeader: "v1=abc" })).toBe(false);
    expect(check({ signatureHeader: "ts=abc,v1=abc" })).toBe(false);
    expect(check({ requestId: null })).toBe(false);
  });

  it("sin secreto acepta en desarrollo y rechaza en producción", () => {
    expect(check({ secret: undefined, production: false })).toBe(true);
    expect(check({ secret: "", production: false })).toBe(true);
    expect(check({ secret: undefined, production: true })).toBe(false);
  });
});
