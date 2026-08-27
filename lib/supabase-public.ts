import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la clave pública (solo lectura vía RLS).
 * Se crea por request, no a nivel de módulo, para que importar una página
 * o un route handler no falle cuando las variables de entorno no existen
 * (por ejemplo, durante `next build` en CI).
 */
export function createPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Faltan las variables públicas de Supabase.");
  }

  return createClient(url, key);
}
