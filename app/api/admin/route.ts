import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase-server";
import { hasAdminSession } from "../../../lib/admin-auth";
import { isValidBusinessCategory } from "../../../lib/categories";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function optionalText(value: FormDataEntryValue | null, maxLength: number) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, maxLength) : null;
}

function optionalUrl(value: FormDataEntryValue | null) {
  const text = optionalText(value, 500);
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

async function updateActive(id: string, active: boolean) {
  const supabase = createServerSupabaseClient();
  const { data: business, error: businessError } = await supabase
    .from("businesses").select("position").eq("id", id).single();
  if (businessError || !business) throw new Error("Negocio no encontrado.");

  let position = business.position;
  if (active && position) {
    const { data: occupant, error } = await supabase
      .from("businesses").select("id").eq("active", true)
      .eq("position", position).neq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (occupant) position = null;
  }

  const { error } = await supabase.from("businesses")
    .update({ active, position }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function GET() {
  try {
    if (!(await hasAdminSession())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const supabase = createServerSupabaseClient();
    const [{ data: businesses, error: businessesError }, { data: bids, error: bidsError }] = await Promise.all([
      supabase.from("businesses").select("*").order("position", { ascending: true }),
      supabase.from("bids").select("id, business_name, category, amount, position, status, created_at").order("created_at", { ascending: false }),
    ]);
    if (businessesError || bidsError) return NextResponse.json({ error: businessesError?.message ?? bidsError?.message }, { status: 500 });
    return NextResponse.json({ businesses: businesses ?? [], bids: bids ?? [] });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await hasAdminSession())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const { id, active } = await request.json();
    if (!UUID_PATTERN.test(String(id)) || typeof active !== "boolean") return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    await updateActive(id, active);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error interno del servidor." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const formData = await request.formData();
  const id = String(formData.get("id") ?? "");
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  try {
    if (formData.get("intent") === "update_profile") {
      const name = optionalText(formData.get("name"), 120);
      const category = optionalText(formData.get("category"), 60);
      const logoUrl = optionalUrl(formData.get("logo_url"));
      const website = optionalUrl(formData.get("website"));
      const instagram = optionalUrl(formData.get("instagram"));
      const facebook = optionalUrl(formData.get("facebook"));
      const tiktok = optionalUrl(formData.get("tiktok"));
      if (!name || !category || !isValidBusinessCategory(category)) throw new Error("Nombre y categoría son obligatorios.");
      if ([logoUrl, website, instagram, facebook, tiktok].some((value) => value === undefined)) throw new Error("Revisa que los enlaces usen http:// o https://.");

      const supabase = createServerSupabaseClient();
      const { error } = await supabase.from("businesses").update({
        name, category,
        description: optionalText(formData.get("description"), 1_500),
        phone: optionalText(formData.get("phone"), 30),
        whatsapp: optionalText(formData.get("whatsapp"), 30),
        logo_url: logoUrl, website, instagram, facebook, tiktok,
      }).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      await updateActive(id, formData.get("active") === "true");
    }
    return NextResponse.redirect(new URL("/admin?updated=1", request.url));
  } catch (error) {
    return NextResponse.redirect(new URL(`/admin?error=${encodeURIComponent(error instanceof Error ? error.message : "No se pudo guardar.")}`, request.url));
  }
}
