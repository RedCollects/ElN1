import { NextResponse } from "next/server";
import { verifyAndSettlePayment } from "@/lib/settle-bid";
import { isMercadoPagoWebhookAuthorized } from "@/lib/mercadopago-signature";
import { log } from "@/lib/log";

function hasValidSignature(request: Request, paymentId: string) {
  return isMercadoPagoWebhookAuthorized({
    signatureHeader: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    paymentId,
    secret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    production: process.env.NODE_ENV === "production",
  });
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const paymentId = String(
      url.searchParams.get("data.id") ??
        url.searchParams.get("id") ??
        body?.data?.id ??
        body?.id ??
        "",
    ).trim();

    const eventType = String(
      url.searchParams.get("type") ?? body?.type ?? body?.topic ?? "",
    );

    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    if (eventType && eventType !== "payment") {
      return NextResponse.json({ received: true });
    }

    if (!hasValidSignature(request, paymentId)) {
      return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
    }

    const result = await verifyAndSettlePayment(paymentId);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    log.error("webhook.failed", {}, error);
    return NextResponse.json(
      { error: "No se pudo procesar la notificación." },
      { status: 500 },
    );
  }
}
