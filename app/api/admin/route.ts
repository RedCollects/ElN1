import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase-server";
import { hasAdminSession } from "../../../lib/admin-auth";

export async function GET() {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { data: businesses, error: businessesError } =
      await supabase
        .from("businesses")
        .select(
          "id, name, category, current_price, position, active"
        )
        .order("position", { ascending: true });

    if (businessesError) {
      return NextResponse.json(
        { error: businessesError.message },
        { status: 500 }
      );
    }

    const { data: bids, error: bidsError } = await supabase
      .from("bids")
      .select(
        "id, business_name, category, amount, position, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (bidsError) {
      return NextResponse.json(
        { error: bidsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      businesses: businesses ?? [],
      bids: bids ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const id = body.id;
    const active = body.active;

    if (!id || typeof active !== "boolean") {
      return NextResponse.json(
        { error: "Datos inválidos." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("businesses")
      .update({ active })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";

  const response = await PATCH(
    new Request(request.url, {
      method: "PATCH",
      body: JSON.stringify({ id, active }),
      headers: { "Content-Type": "application/json" },
    })
  );

  if (!response.ok) {
    return response;
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}