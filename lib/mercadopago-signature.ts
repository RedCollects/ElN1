import { createHmac, timingSafeEqual } from "node:crypto";

/** Tolerancia entre el `ts` de la firma y la hora del servidor. */
export const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;

export type WebhookAuthInput = {
  /** Cabecera `x-signature` tal cual la manda Mercado Pago (`ts=…,v1=…`). */
  signatureHeader: string | null;
  /** Cabecera `x-request-id`. */
  requestId: string | null;
  paymentId: string;
  /** `MERCADOPAGO_WEBHOOK_SECRET`; si falta, solo se acepta fuera de producción. */
  secret: string | undefined;
  production: boolean;
  /** Milisegundos desde epoch; inyectable para las pruebas. */
  now?: number;
};

function parseSignature(header: string): { ts?: string; v1?: string } {
  const parts: { ts?: string; v1?: string } = {};

  for (const segment of header.split(",")) {
    const [key, value] = segment.trim().split("=");
    if (key === "ts" || key === "v1") {
      parts[key] = value;
    }
  }

  return parts;
}

/**
 * Valida la notificación de Mercado Pago según su esquema de firma:
 * HMAC-SHA256 del manifiesto `id:<paymentId>;request-id:<requestId>;ts:<ts>;`
 * con el secreto del webhook, comparado en tiempo constante, y con `ts`
 * dentro de una ventana de cinco minutos.
 *
 * Sin secreto configurado se acepta todo en desarrollo y nada en producción.
 */
export function isMercadoPagoWebhookAuthorized({
  signatureHeader,
  requestId,
  paymentId,
  secret,
  production,
  now = Date.now(),
}: WebhookAuthInput): boolean {
  if (!secret) {
    return !production;
  }

  const { ts, v1 } = parseSignature(signatureHeader ?? "");

  if (!ts || !v1 || !requestId) {
    return false;
  }

  if (
    !/^\d+$/.test(ts) ||
    Math.abs(now - Number(ts) * 1000) > SIGNATURE_MAX_AGE_MS
  ) {
    return false;
  }

  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
  const expected = Buffer.from(
    createHmac("sha256", secret).update(manifest).digest("hex"),
  );
  const received = Buffer.from(v1);

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}
