import "server-only";

import { MercadoPagoConfig, Payment, PaymentRefund } from "mercadopago";
import { createServerSupabaseClient } from "./supabase-server";
import { autoRefundOutbid } from "./payments";

type SettleResult =
  | { settled: true; bidId: string; alreadySettled?: true; result?: unknown }
  | { settled: false; status?: string; rejected?: string; refunded?: boolean };

type SettleBidRpc = {
  success: boolean;
  already_paid?: boolean;
  reason?: string;
  required?: number;
  paid?: number;
  bid_id?: string;
};

/**
 * Verifica un pago contra Mercado Pago y, si es válido, asigna la posición.
 *
 * Errores PERMANENTES (el pago nunca va a validar: sin oferta asociada,
 * oferta inexistente, importe o moneda incorrectos) se registran y devuelven
 * `settled: false` para que el webhook responda 200 y Mercado Pago deje de
 * reintentar. Errores TRANSITORIOS (Mercado Pago o la base de datos no
 * responden) siguen lanzando excepción para que el webhook responda 500 y
 * Mercado Pago reintente más tarde.
 *
 * Si al asignar el importe ya no alcanza (alguien pagó más mientras tanto),
 * `settle_bid` marca la oferta como `outbid` y aquí se reembolsa el pago.
 */
export async function verifyAndSettlePayment(
  paymentId: string,
): Promise<SettleResult> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN.");
  }

  const client = new MercadoPagoConfig({ accessToken });
  const payment = await new Payment(client).get({ id: paymentId });
  const bidId = String(payment.external_reference ?? "").trim();

  if (!bidId) {
    console.warn(`Pago ${paymentId} sin oferta asociada; se ignora.`);
    return { settled: false, rejected: "sin_oferta" };
  }

  if (payment.status !== "approved") {
    return { settled: false, status: payment.status ?? "unknown" };
  }

  const supabase = createServerSupabaseClient();
  const { data: bid, error: bidError } = await supabase
    .from("bids")
    .select("id, amount, status, refund_id")
    .eq("id", bidId)
    .maybeSingle();

  if (bidError) {
    throw new Error(bidError.message);
  }

  if (!bid) {
    console.warn(
      `Pago ${paymentId} referencia la oferta ${bidId}, que no existe.`,
    );
    return { settled: false, rejected: "oferta_inexistente" };
  }

  if (bid.status === "paid") {
    return { settled: true, alreadySettled: true, bidId };
  }

  if (bid.status === "refunded" || bid.status === "outbid") {
    return {
      settled: false,
      rejected: bid.status,
      refunded: Boolean(bid.refund_id),
    };
  }

  const amountMatches =
    Number(payment.transaction_amount) === Number(bid.amount);
  const currencyMatches = payment.currency_id === "MXN";

  if (!amountMatches || !currencyMatches) {
    const reason = !amountMatches ? "importe_incorrecto" : "moneda_incorrecta";
    console.error(
      `Pago ${paymentId} rechazado (${reason}): esperado ${bid.amount} MXN, recibido ${payment.transaction_amount} ${payment.currency_id}.`,
    );

    const { error: rejectError } = await supabase
      .from("bids")
      .update({
        status: "rejected",
        payment_id: paymentId,
        failure_reason: reason,
      })
      .eq("id", bidId)
      .in("status", ["pending", "expired"]);

    if (rejectError) {
      throw new Error(rejectError.message);
    }

    return { settled: false, rejected: reason };
  }

  const { data, error } = await supabase.rpc("settle_bid", {
    p_bid_id: bidId,
    p_payment_id: paymentId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = data as SettleBidRpc;

  if (result.success) {
    return { settled: true, bidId, result };
  }

  // La oferta llegó tarde: alguien pagó más antes de que se confirmara.
  console.warn(
    `Pago ${paymentId} no asignado (${result.reason}): pagó ${result.paid}, se requerían ${result.required}.`,
  );

  if (!autoRefundOutbid()) {
    return {
      settled: false,
      rejected: result.reason ?? "outbid",
      refunded: false,
    };
  }

  const refund = await new PaymentRefund(client).total({
    payment_id: paymentId,
  });
  const { error: refundError } = await supabase
    .from("bids")
    .update({ status: "refunded", refund_id: String(refund.id ?? "") })
    .eq("id", bidId);

  if (refundError) {
    // El reembolso ya se emitió; queda en el log aunque falle el registro.
    console.error(
      `Reembolso ${refund.id} emitido pero no registrado en la oferta ${bidId}:`,
      refundError,
    );
  }

  return {
    settled: false,
    rejected: result.reason ?? "outbid",
    refunded: true,
  };
}
