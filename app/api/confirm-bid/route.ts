import { NextResponse } from "next/server";
import { verifyAndSettlePayment } from "../../../lib/settle-bid";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const paymentId = String(body.paymentId ?? "").trim();

    if (!paymentId) {
      return NextResponse.json(
        { error: "Falta el ID del pago." },
        { status: 400 }
      );
    }

    const result = await verifyAndSettlePayment(paymentId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("CONFIRM BID ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo confirmar el pago.",
      },
      { status: 500 }
    );
  }
}
