import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase-server";
import { hasAdminSession } from "../../../lib/admin-auth";
import {
  adminProfileSchema,
  adminToggleSchema,
  uuidSchema,
} from "../../../lib/schemas";
import {
  formDataToObject,
  parseInput,
  readJson,
} from "../../../lib/validation";

async function updateActive(id: string, active: boolean) {
  const supabase = createServerSupabaseClient();
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("position")
    .eq("id", id)
    .single();
  if (businessError || !business) throw new Error("Negocio no encontrado.");

  let position = business.position;
  if (active && position) {
    const { data: occupant, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("active", true)
      .eq("position", position)
      .neq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (occupant) position = null;
  }

  const { error } = await supabase
    .from("businesses")
    .update({ active, position })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function GET() {
  try {
    if (!(await hasAdminSession()))
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const supabase = createServerSupabaseClient();
    const [
      { data: businesses, error: businessesError },
      { data: bids, error: bidsError },
    ] = await Promise.all([
      supabase
        .from("businesses")
        .select("*")
        .order("position", { ascending: true }),
      supabase
        .from("bids")
        .select(
          "id, business_name, category, amount, position, status, created_at",
        )
        .order("created_at", { ascending: false }),
    ]);
    if (businessesError || bidsError)
      return NextResponse.json(
        { error: businessesError?.message ?? bidsError?.message },
        { status: 500 },
      );
    return NextResponse.json({
      businesses: businesses ?? [],
      bids: bids ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await hasAdminSession()))
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const parsed = parseInput(adminToggleSchema, await readJson(request));
    if (!parsed.ok)
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    await updateActive(parsed.data.id, parsed.data.active);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno del servidor.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await hasAdminSession()))
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const form = formDataToObject(await request.formData());
  const id = parseInput(uuidSchema, form.id ?? "");
  if (!id.ok)
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  try {
    if (form.intent === "update_profile") {
      const parsed = parseInput(adminProfileSchema, form);
      if (!parsed.ok) throw new Error(parsed.error);
      const { id: businessId, ...values } = parsed.data;

      const supabase = createServerSupabaseClient();
      const { error } = await supabase
        .from("businesses")
        .update(values)
        .eq("id", businessId);
      if (error) throw new Error(error.message);
    } else {
      await updateActive(id.data, form.active === "true");
    }
    return NextResponse.redirect(new URL("/admin?updated=1", request.url));
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        `/admin?error=${encodeURIComponent(error instanceof Error ? error.message : "No se pudo guardar.")}`,
        request.url,
      ),
    );
  }
}
