import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase-server";
import { isValidPosition } from "../../../lib/prices";
import type { Business } from "../../../lib/business";
import type { Reservation } from "../../../lib/payments";

/**
 * Estado en vivo del ranking (negocios con posición + reservas vigentes).
 * La portada lo consulta cada pocos segundos y cuando Realtime avisa de un
 * cambio, para que el modal nunca cobre con datos viejos.
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const [
      { data: businesses, error: businessError },
      { data: reservationRows, error: reservationError },
    ] = await Promise.all([
      supabase
        .from("businesses")
        .select("*")
        .eq("active", true)
        .eq("status", "published")
        .not("position", "is", null)
        .order("position", { ascending: true }),
      supabase.rpc("active_reservations"),
    ]);

    if (businessError || reservationError) {
      return NextResponse.json(
        { error: businessError?.message ?? reservationError?.message },
        { status: 500 }
      );
    }

    const reservations: Reservation[] = (reservationRows ?? []).map(
      (row: { ranking_position: number; amount: number | string; expires_at: string }) => ({
        position: row.ranking_position,
        amount: Number(row.amount),
        expiresAt: row.expires_at,
      })
    );

    return NextResponse.json(
      {
        businesses: ((businesses ?? []) as Business[]).filter((business) =>
          isValidPosition(business.position)
        ),
        reservations,
        now: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
