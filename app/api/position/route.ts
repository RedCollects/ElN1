import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getMinimumOffer } from "../../../lib/prices";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const businessName = String(body.businessName || "").trim();
    const position = Number(body.position);

    if (!businessName) {
      return NextResponse.json(
        { error: "Escribe el nombre del negocio." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(position) || position < 1 || position > 10) {
      return NextResponse.json(
        { error: "Posición inválida." },
        { status: 400 }
      );
    }

    const { data: existingBusiness, error: existingError } =
      await supabase
        .from("businesses")
        .select("id, name, current_price, position")
        .eq("position", position)
        .eq("active", true)
        .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    const currentPrice = existingBusiness?.current_price ?? null;
    const minimumOffer = getMinimumOffer(position, currentPrice);

    return NextResponse.json({
      success: true,
      position,
      currentPrice,
      minimumOffer,
      occupied: Boolean(existingBusiness),
      currentBusiness: existingBusiness
        ? existingBusiness.name
        : null,
      message: existingBusiness
        ? `Para ocupar la posición #${position}, la oferta mínima es de $${minimumOffer} MXN.`
        : `La posición #${position} está disponible por $${minimumOffer} MXN.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}