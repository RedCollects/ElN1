import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createAuthSupabaseClient } from "@/lib/supabase-auth";
import { log } from "@/lib/log";

/**
 * Destino de los enlaces de confirmación de correo y recuperación de
 * contraseña que envía Supabase Auth.
 *
 * Admite dos formatos:
 * - `?token_hash=...&type=email|recovery` (nuestra plantilla de correo): se
 *   verifica aquí y se inicia sesión.
 * - Sin parámetros o con `error=...` (plantilla por defecto de Supabase, que
 *   confirma en su servidor y luego redirige aquí): el correo ya quedó
 *   confirmado, así que se envía al usuario a ingresar con un aviso de éxito
 *   en vez de un error.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/mi-negocio";
  const destination =
    next.startsWith("/") && !next.startsWith("//") ? next : "/mi-negocio";
  const login = new URL("/ingresar", request.url);

  if (tokenHash && type) {
    const supabase = await createAuthSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(destination, request.url));
    }

    log.warn("auth.confirm_rejected", { type, reason: error.message });
    login.searchParams.set("error", "confirmacion");
    return NextResponse.redirect(login);
  }

  // Supabase reporta enlaces vencidos o ya usados con error_code=otp_expired.
  if (searchParams.get("error") || searchParams.get("error_code")) {
    login.searchParams.set("error", "confirmacion");
    return NextResponse.redirect(login);
  }

  login.searchParams.set("confirmado", "1");
  return NextResponse.redirect(login);
}
