import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase-server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mexicoDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
  }).format(new Date());
}

async function getStats() {
  const supabase = createServerSupabaseClient();
  const today = mexicoDate();
  const onlineSince = new Date(Date.now() - 90_000).toISOString();

  const [{ count: todayCount }, { count: totalCount }, { count: onlineCount }] =
    await Promise.all([
      supabase.from("site_visits").select("*", { count: "exact", head: true }).eq("visit_date", today),
      supabase.from("site_visits").select("*", { count: "exact", head: true }),
      supabase.from("online_sessions").select("*", { count: "exact", head: true }).gte("last_seen_at", onlineSince),
    ]);

  return { today: todayCount ?? 0, total: totalCount ?? 0, online: onlineCount ?? 0 };
}

export async function GET() {
  try {
    return NextResponse.json(await getStats());
  } catch {
    return NextResponse.json({ today: 0, total: 0, online: 0 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = String(body.sessionId ?? "");

    if (!UUID_PATTERN.test(sessionId)) {
      return NextResponse.json({ error: "Sesión inválida." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const now = new Date().toISOString();
    const today = mexicoDate();

    await Promise.all([
      supabase.from("online_sessions").upsert({ session_id: sessionId, last_seen_at: now }),
      supabase.from("site_visits").upsert(
        { session_id: sessionId, visit_date: today },
        { onConflict: "session_id,visit_date", ignoreDuplicates: true }
      ),
      body.event === "business_click" && UUID_PATTERN.test(String(body.businessId ?? ""))
        ? supabase.from("business_clicks").insert({ session_id: sessionId, business_id: body.businessId })
        : Promise.resolve(),
    ]);

    return NextResponse.json(await getStats());
  } catch {
    return NextResponse.json({ error: "No se pudieron registrar las métricas." }, { status: 500 });
  }
}
