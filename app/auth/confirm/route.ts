import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createAuthSupabaseClient } from "../../../lib/supabase-auth";

/**
 * Destino de los enlaces de confirmación de correo y recuperación de
 * contraseña que envía Supabase Auth.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/mi-negocio";
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/mi-negocio";

  if (tokenHash && type) {
    const supabase = await createAuthSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  const login = new URL("/ingresar", request.url);
  login.searchParams.set("error", "confirmacion");
  return NextResponse.redirect(login);
}
