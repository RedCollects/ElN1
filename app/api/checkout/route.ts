import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/supabase-auth";
import {
  BASE_PRICE,
  FLOOR_FACTOR,
  MAX_OFFER,
  MAX_RANKING_POSITION,
  normalizeOffer,
} from "@/lib/prices";
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
import { TERMS_VERSION, withTax } from "@/lib/legal";

type RankingState = {
  lowest_price: number | string | null;
  ranked_count: number | null;
  own_price: number | string | null;
  own_position: number | null;
};

/**
 * Inicia una oferta (Método A): el usuario elige un MONTO y el ranking se
 * ordena por lo pagado. El mínimo es BASE_PRICE, al menos FLOOR_FACTOR sobre
 * el precio más bajo del ranking y —si el negocio ya está dentro— mayor que
 * su propio precio. Registra la oferta con su posición proyectada
 * (informativa), reserva RESERVATION_MINUTES y crea la preferencia de pago
 * (el total cobrado en Mercado Pago es la oferta neta más IVA).
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

    const requestedAmount = parsed.data.amount;

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

    await supabase.rpc("expire_bids");

    const { data: stateRows, error: stateError } = await supabase.rpc(
      "ranking_state",
      { p_business_id: business.id },
    );

    if (stateError) {
      return NextResponse.json(
        { error: "No se pudo consultar el ranking." },
        { status: 500 },
      );
    }

    const state = ((stateRows ?? [])[0] ?? {}) as Partial<RankingState>;
    const lowest = state.lowest_price != null ? Number(state.lowest_price) : null;
    const ownPrice = state.own_price != null ? Number(state.own_price) : null;
    const ownPosition = state.own_position ?? null;

    let minimum = BASE_PRICE;
    if (lowest !== null) {
      minimum = Math.max(
        minimum,
        Math.ceil(Math.round(lowest * FLOOR_FACTOR * 100) / 100),
      );
    }
    if (ownPosition !== null && ownPrice !== null) {
      minimum = Math.max(minimum, Math.floor(ownPrice) + 1);
    }

    const amount = normalizeOffer(requestedAmount);

    if (amount === null) {
      return NextResponse.json(
        { error: "Escribe un monto válido en pesos." },
        { status: 400 },
      );
    }

    if (Number(requestedAmount) > MAX_OFFER) {
      return NextResponse.json(
        {
          error: `El monto máximo por oferta es $${MAX_OFFER.toLocaleString("es-MX")} MXN.`,
        },
        { status: 400 },
      );
    }

    if (amount < minimum) {
      return NextResponse.json(
        {
          error: `La oferta mínima ahora mismo es $${minimum} MXN.`,
          code: "below_minimum",
          minimum,
        },
        { status: 400 },
      );
    }

    // Posición proyectada (informativa): cuántos pagan igual o más que esto.
    const { count: aboveCount } = await supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("active", true)
      .eq("status", "published")
      .not("position", "is", null)
      .neq("id", business.id)
      .gte("current_price", amount);

    const projected = Math.min((aboveCount ?? 0) + 1, MAX_RANKING_POSITION);

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
        position: projected,
        amount,
        terms_version: TERMS_VERSION,
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
              id: `eln1-offer-${bid.id}`,
              title: `EL N1 - Oferta de $${amount} MXN (IVA incluido)`,
              description: `${business.name} - posición estimada #${projected}`,
              quantity: 1,
              currency_id: "MXN",
              unit_price: withTax(amount),
            },
          ],
          external_reference: String(bid.id),
          metadata: { bid_id: bid.id, business_id: business.id, projected },
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
        { bidId: bid.id, amount },
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
      projected,
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
