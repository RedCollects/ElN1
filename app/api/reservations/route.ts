import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase-server";
import type { Reservation } from "../../../lib/payments";

/** Reservas vigentes por posición, para el contador en vivo del ranking. */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.rpc("active_reservations");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const reservations: Reservation[] = (data ?? []).map(
      (row: { ranking_position: number; amount: number | string; expires_at: string }) => ({
        position: row.ranking_position,
        amount: Number(row.amount),
        expiresAt: row.expires_at,
      })
    );

    return NextResponse.json(
      { reservations, now: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
