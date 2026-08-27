import { NextResponse } from "next/server";
import { getMinimumOffer, MAX_RANKING_POSITION } from "../../../lib/prices";
import { createServerSupabaseClient } from "../../../lib/supabase-server";

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

    if (
      !Number.isInteger(position) ||
      position < 1 ||
      position > MAX_RANKING_POSITION
    ) {
      return NextResponse.json(
        { error: "Posición inválida." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
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
