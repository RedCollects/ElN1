import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createServerSupabaseClient } from "../../../lib/supabase-server";
import { getMinimumOffer, MAX_RANKING_POSITION } from "../../../lib/prices";
import { isValidBusinessCategory } from "../../../lib/categories";

export async function POST(request: Request) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Falta MERCADOPAGO_ACCESS_TOKEN." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const businessName = String(body.businessName || "").trim();
    const category = String(body.category || "").trim();
    const position = Number(body.position);

    if (
      !businessName ||
      businessName.length > 120 ||
      !isValidBusinessCategory(category) ||
      !Number.isInteger(position) ||
      position < 1 ||
      position > MAX_RANKING_POSITION
    ) {
      return NextResponse.json(
        { error: "Faltan datos para crear el pago." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: currentBusiness, error: businessError } =
      await supabase
        .from("businesses")
        .select("current_price")
        .eq("position", position)
        .eq("active", true)
        .maybeSingle();

    if (businessError) {
      return NextResponse.json(
        { error: "No se pudo consultar la posición." },
        { status: 500 }
      );
    }

    const currentPrice = currentBusiness?.current_price;
    const amount = getMinimumOffer(position, currentPrice);

    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .insert({
        business_name: businessName,
        category,
        position,
        amount,
        status: "pending",
      })
      .select("id")
      .single();

    if (bidError || !bid) {
      return NextResponse.json(
        { error: "No se pudo registrar la oferta." },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({
      accessToken,
    });

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: `eln1-position-${position}`,
            title: `EL N1 - Posición #${position}`,
            description: `Posición #${position} - ${businessName}`,
            quantity: 1,
            currency_id: "MXN",
            unit_price: amount,
          },
        ],
        external_reference: String(bid.id),
        notification_url: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`
          : undefined,
        back_urls: process.env.NEXT_PUBLIC_APP_URL
          ? {
              success: `${process.env.NEXT_PUBLIC_APP_URL}/?payment=success`,
              failure: `${process.env.NEXT_PUBLIC_APP_URL}/?payment=failure`,
              pending: `${process.env.NEXT_PUBLIC_APP_URL}/?payment=pending`,
            }
          : undefined,
      },
    });

    await supabase
      .from("bids")
      .update({ preference_id: result.id })
      .eq("id", bid.id);

    return NextResponse.json({
      success: true,
      bidId: bid.id,
      init_point: result.init_point,
    });
  } catch (error) {
    console.error("ERROR MERCADO PAGO:", error);

    return NextResponse.json(
      { error: "Mercado Pago rechazó la solicitud." },
      { status: 500 }
    );
  }
}
