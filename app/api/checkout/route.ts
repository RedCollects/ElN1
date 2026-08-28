import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/supabase-auth";
import { minimumOfferFor } from "@/lib/prices";
import { checkoutSchema } from "@/lib/schemas";
import { parseInput, readJson } from "@/lib/validation";
import { checkoutLimiter, tooManyRequests } from "@/lib/rate-limit";
import { missingForPublish } from "@/lib/business";
import {
  RESERVATION_MINUTES,
  allowCashPayments,
  mercadoPagoDate,
} from "@/lib/payments";
import { log } from "@/lib/log";

/**
 * Inicia una oferta: valida al dueño y su perfil, calcula el importe contra
 * el estado real de la posición (precio publicado y reservas vigentes),
 * registra una reserva de RESERVATION_MINUTES y crea la preferencia de pago.
 *
 * Si el cliente manda `expectedAmount` y ya no coincide, responde 409 con el
 * importe nuevo para que el modal lo muestre antes de cobrar.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Inicia sesión para ofertar.", code: "auth" },
        { status: 401 },
      );
    }

    const limit = await checkoutLimiter().limit(user.id);

    if (!limit.ok) {
      return tooManyRequests(limit.retryAfter);
    }

    const parsed = parseInput(checkoutSchema, await readJson(request));

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { position, expectedAmount } = parsed.data;

    const supabase = createServerSupabaseClient();
    const { data: businessRow, error: businessError } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (businessError) {
      return NextResponse.json(
        { error: "No se pudo consultar tu negocio." },
        { status: 500 },
      );
    }

    if (!businessRow) {
      return NextResponse.json(
        {
          error: "No encontramos un negocio ligado a tu cuenta.",
          code: "no_business",
        },
        { status: 400 },
      );
    }

    const business = businessRow;

    if (!business.active) {
      return NextResponse.json(
        { error: "Tu negocio está desactivado. Escríbenos para reactivarlo." },
        { status: 403 },
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
        { status: 400 },
      );
    }

    if (business.position !== null && position > business.position) {
      return NextResponse.json(
        {
          error: `Ya ocupas la posición #${business.position}, que es mejor que la #${position}.`,
        },
        { status: 400 },
      );
    }

    await supabase.rpc("expire_bids");

    const { data: stateRows, error: stateError } = await supabase.rpc(
      "position_state",
      {
        p_position: position,
      },
    );

    if (stateError) {
      return NextResponse.json(
        { error: "No se pudo consultar la posición." },
        { status: 500 },
      );
    }

    const state = (stateRows ?? [])[0] as
      | {
          holder_id: string | null;
          current_price: number | string | null;
          reserved_amount: number | string | null;
          reserved_until: string | null;
        }
      | undefined;

    const holderPrice =
      state?.current_price != null ? Number(state.current_price) : null;
    const reservedAmount =
      state?.reserved_amount != null ? Number(state.reserved_amount) : null;
    const floor =
      holderPrice === null && reservedAmount === null
        ? null
        : Math.max(holderPrice ?? 0, reservedAmount ?? 0);
    const amount = minimumOfferFor(position, floor);

    if (expectedAmount !== null && expectedAmount !== amount) {
      return NextResponse.json(
        {
          error: `El precio de la posición #${position} cambió: ahora la oferta mínima es $${amount} MXN.`,
          code: "price_changed",
          amount,
          reservedUntil: state?.reserved_until ?? null,
        },
        { status: 409 },
      );
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Falta MERCADOPAGO_ACCESS_TOKEN." },
        { status: 500 },
      );
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
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (bidError || !bid) {
      return NextResponse.json(
        { error: "No se pudo registrar la oferta." },
        { status: 500 },
      );
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
          notification_url: appUrl
            ? `${appUrl}/api/webhooks/mercadopago`
            : undefined,
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
      log.error(
        "checkout.preference_failed",
        { bidId: bid.id, position },
        error,
      );
      await supabase
        .from("bids")
        .update({ status: "expired", failure_reason: "preferencia_fallida" })
        .eq("id", bid.id);

      return NextResponse.json(
        { error: "Mercado Pago rechazó la solicitud. Inténtalo de nuevo." },
        { status: 502 },
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
    log.error("checkout.failed", {}, error);

    return NextResponse.json(
      { error: "No se pudo iniciar el pago." },
      { status: 500 },
    );
  }
}
