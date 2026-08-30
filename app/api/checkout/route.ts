import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createServerSupabaseClient } from "../../../lib/supabase-server";
import { getCurrentUser } from "../../../lib/supabase-auth";
import {
  MAX_OFFER,
  isValidPosition,
  minimumOfferFor,
  normalizeOffer,
} from "../../../lib/prices";
import { missingForPublish, type Business } from "../../../lib/business";
import {
  RESERVATION_MINUTES,
  allowCashPayments,
  mercadoPagoDate,
} from "../../../lib/payments";

type PositionState = {
  holder_id: string | null;
  current_price: number | string | null;
  floor_price: number | string | null;
  reserved_amount: number | string | null;
  reserved_until: string | null;
  next_free_position: number | null;
};

/**
 * Inicia una oferta: valida al dueño y su perfil, calcula el mínimo contra
 * el estado real de la posición (máximo pagado hacia abajo y reservas
 * vigentes), acepta un monto libre por encima del mínimo, registra una
 * reserva de RESERVATION_MINUTES y crea la preferencia de pago.
 *
 * Solo se vende el siguiente lugar libre o superar a un ocupado. Si el
 * ranking cambió desde que el cliente lo vio, responde 409 con el estado
 * nuevo (`price_changed` o `ranking_changed`) para que el modal lo muestre
 * antes de cobrar.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Inicia sesión para ofertar.", code: "auth" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const position = Number(body.position);
    const requestedAmount =
      body.amount === undefined || body.amount === null ? null : body.amount;

    if (!isValidPosition(position)) {
      return NextResponse.json({ error: "Posición inválida." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: businessRow, error: businessError } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (businessError) {
      return NextResponse.json({ error: "No se pudo consultar tu negocio." }, { status: 500 });
    }

    if (!businessRow) {
      return NextResponse.json(
        { error: "No encontramos un negocio ligado a tu cuenta.", code: "no_business" },
        { status: 400 }
      );
    }

    const business = businessRow as Business;

    if (!business.active) {
      return NextResponse.json(
        { error: "Tu negocio está desactivado. Escríbenos para reactivarlo." },
        { status: 403 }
      );
    }

    const missing = missingForPublish(business);

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Completa tu perfil antes de publicar. Falta: ${missing.join(", ")}.`,
          code: "profile_incomplete",
          missing,
        },
        { status: 400 }
      );
    }

    if (business.position !== null && position > business.position) {
      return NextResponse.json(
        { error: `Ya ocupas la posición #${business.position}, que es mejor que la #${position}.` },
        { status: 400 }
      );
    }

    await supabase.rpc("expire_bids");

    const { data: stateRows, error: stateError } = await supabase.rpc("position_state", {
      p_position: position,
      p_business_id: business.id,
    });

    if (stateError) {
      return NextResponse.json({ error: "No se pudo consultar la posición." }, { status: 500 });
    }

    const state = ((stateRows ?? [])[0] ?? {}) as Partial<PositionState>;
    const holderId = state.holder_id ?? null;
    const nextFree = state.next_free_position ?? null;

    // Lugar libre: solo se vende el siguiente al último ocupado.
    if (holderId === null && position !== nextFree) {
      return NextResponse.json(
        {
          error:
            nextFree === null
              ? "El ranking está lleno: solo puedes entrar superando a un negocio."
              : `Alguien acaba de entrar al ranking. El siguiente lugar libre ahora es el #${nextFree}.`,
          code: "ranking_changed",
          nextFree,
        },
        { status: 409 }
      );
    }

    const floorPrice = state.floor_price != null ? Number(state.floor_price) : null;
    const reservedAmount = state.reserved_amount != null ? Number(state.reserved_amount) : null;
    const floor =
      floorPrice === null && reservedAmount === null
        ? null
        : Math.max(floorPrice ?? 0, reservedAmount ?? 0);
    const minimum = minimumOfferFor(position, floor);

    let amount = minimum;

    if (requestedAmount !== null) {
      const normalized = normalizeOffer(requestedAmount, minimum);

      if (normalized === null) {
        return NextResponse.json({ error: "Escribe un monto válido en pesos." }, { status: 400 });
      }

      if (normalized < Number(requestedAmount) - 0.5) {
        return NextResponse.json(
          { error: `El monto máximo por oferta es $${MAX_OFFER.toLocaleString("es-MX")} MXN.` },
          { status: 400 }
        );
      }

      if (Number(requestedAmount) < minimum) {
        return NextResponse.json(
          {
            error: `El precio de la posición #${position} cambió: ahora la oferta mínima es $${minimum} MXN.`,
            code: "price_changed",
            amount: minimum,
            reservedUntil: state.reserved_until ?? null,
          },
          { status: 409 }
        );
      }

      amount = normalized;
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json({ error: "Falta MERCADOPAGO_ACCESS_TOKEN." }, { status: 500 });
    }

    // Una sola reserva viva por negocio.
    await supabase
      .from("bids")
      .update({ status: "expired", failure_reason: "nueva_reserva" })
      .eq("business_id", business.id)
      .eq("status", "pending");

    const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .insert({
        business_id: business.id,
        business_name: business.name,
        category: business.category ?? "General",
        position,
        amount,
        status: "pending",
        entry: holderId === null,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (bidError || !bid) {
      return NextResponse.json({ error: "No se pudo registrar la oferta." }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const preference = new Preference(new MercadoPagoConfig({ accessToken }));

    let result;

    try {
      result = await preference.create({
        body: {
          items: [
            {
              id: `eln1-position-${position}`,
              title: `EL N1 - Posición #${position}`,
              description: `Posición #${position} - ${business.name}`,
              quantity: 1,
              currency_id: "MXN",
              unit_price: amount,
            },
          ],
          external_reference: String(bid.id),
          metadata: { bid_id: bid.id, business_id: business.id, position },
          notification_url: appUrl ? `${appUrl}/api/webhooks/mercadopago` : undefined,
          back_urls: appUrl
            ? {
                success: `${appUrl}/?payment=success`,
                failure: `${appUrl}/?payment=failure`,
                pending: `${appUrl}/?payment=pending`,
              }
            : undefined,
          expires: true,
          expiration_date_from: mercadoPagoDate(new Date()),
          expiration_date_to: mercadoPagoDate(expiresAt),
          payment_methods: allowCashPayments()
            ? undefined
            : { excluded_payment_types: [{ id: "ticket" }, { id: "atm" }] },
        },
      });
    } catch (error) {
      console.error("ERROR MERCADO PAGO (preferencia):", error);
      await supabase
        .from("bids")
        .update({ status: "expired", failure_reason: "preferencia_fallida" })
        .eq("id", bid.id);

      return NextResponse.json(
        { error: "Mercado Pago rechazó la solicitud. Inténtalo de nuevo." },
        { status: 502 }
      );
    }

    await supabase
      .from("bids")
      .update({ preference_id: result.id })
      .eq("id", bid.id);

    return NextResponse.json({
      success: true,
      bidId: bid.id,
      amount,
      expiresAt: expiresAt.toISOString(),
      init_point: result.init_point,
    });
  } catch (error) {
    console.error("ERROR CHECKOUT:", error);

    return NextResponse.json(
      { error: "No se pudo iniciar el pago." },
      { status: 500 }
    );
  }
}
