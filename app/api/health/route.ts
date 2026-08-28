import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase-public";

export const dynamic = "force-dynamic";

/**
 * Comprobación de salud para el monitor externo: responde 200 si la app
 * corre y la base de datos contesta; 503 si la base no responde.
 * No expone datos: solo hace una consulta de conteo con la clave pública.
 */
export async function GET() {
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  const headers = { "Cache-Control": "no-store" };

  try {
    const { error } = await createPublicSupabaseClient()
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .limit(1);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, db: "ok", version }, { headers });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        version,
        error: error instanceof Error ? error.message : "desconocido",
      },
      { status: 503, headers },
    );
  }
}
