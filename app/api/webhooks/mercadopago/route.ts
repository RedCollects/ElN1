import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { verifyAndSettlePayment } from "../../../../lib/settle-bid";

function hasValidSignature(request: Request, paymentId: string) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const signature = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const timestamp = signature
    .split(",")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === "ts")?.[1];
  const receivedHash = signature
    .split(",")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === "v1")?.[1];

  if (!timestamp || !receivedHash || !requestId) {
    return false;
  }

  if (
    !/^\d+$/.test(timestamp) ||
    Math.abs(Date.now() - Number(timestamp) * 1000) > 5 * 60 * 1000
  ) {
    return false;
  }

  const manifest = `id:${paymentId};request-id:${requestId};ts:${timestamp};`;
  const expectedHash = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");
  const expected = Buffer.from(expectedHash);
  const received = Buffer.from(receivedHash);

  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
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
        ""
    ).trim();

    const eventType = String(
      url.searchParams.get("type") ?? body?.type ?? body?.topic ?? ""
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
    console.error("MERCADO PAGO WEBHOOK ERROR:", error);
    return NextResponse.json(
      { error: "No se pudo procesar la notificación." },
      { status: 500 }
    );
  }
}
