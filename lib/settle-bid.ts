import { MercadoPagoConfig, Payment } from "mercadopago";
import { createServerSupabaseClient } from "./supabase-server";

export async function verifyAndSettlePayment(paymentId: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN.");
  }

  const client = new MercadoPagoConfig({ accessToken });
  const payment = await new Payment(client).get({ id: paymentId });
  const bidId = String(payment.external_reference ?? "").trim();

  if (!bidId) {
    throw new Error("El pago no tiene una oferta asociada.");
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

  if (bidError || !bid) {
    throw new Error(bidError?.message || "No encontramos la oferta.");
  }

  if (Number(payment.transaction_amount) !== Number(bid.amount)) {
    throw new Error("El importe pagado no coincide con la oferta.");
  }

  if (payment.currency_id !== "MXN") {
    throw new Error("La moneda del pago no es válida.");
  }

  if (bid.status === "paid") {
    return { settled: true, alreadySettled: true, bidId };
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
