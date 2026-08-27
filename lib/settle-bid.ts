import { MercadoPagoConfig, Payment } from "mercadopago";
import { createServerSupabaseClient } from "./supabase-server";

async function markBidInvalid(
  bidId: string,
  failureReason: string
) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("bids")
    .update({ status: "invalid", failure_reason: failureReason })
    .eq("id", bidId)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }
}

export async function verifyAndSettlePayment(paymentId: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN.");
  }

  const client = new MercadoPagoConfig({ accessToken });
  const payment = await new Payment(client).get({ id: paymentId });
  const bidId = String(payment.external_reference ?? "").trim();

  if (!bidId) {
    return { settled: false, ignored: true };
  }

  if (payment.status !== "approved") {
    return { settled: false, status: payment.status ?? "unknown" };
  }

  const supabase = createServerSupabaseClient();
  const { data: bid, error: bidError } = await supabase
    .from("bids")
    .select("id, amount, status")
    .eq("id", bidId)
    .single();

  if (!bid && bidError?.code === "PGRST116") {
    return { settled: false, ignored: true };
  }

  if (bidError || !bid) {
    throw new Error(bidError?.message || "No encontramos la oferta.");
  }

  if (Number(payment.transaction_amount) !== Number(bid.amount)) {
    await markBidInvalid(bidId, "El importe pagado no coincide con la oferta.");
    return { settled: false, invalid: true, bidId };
  }

  if (payment.currency_id !== "MXN") {
    await markBidInvalid(bidId, "La moneda del pago no es válida.");
    return { settled: false, invalid: true, bidId };
  }

  if (bid.status === "paid") {
    return { settled: true, alreadySettled: true, bidId };
  }

  if (bid.status !== "pending") {
    return { settled: false, invalid: true, bidId };
  }

  const { data, error } = await supabase.rpc("settle_bid", {
    p_bid_id: bidId,
    p_payment_id: paymentId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { settled: true, bidId, result: data };
}
