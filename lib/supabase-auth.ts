import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Cliente de Supabase ligado a la sesión del visitante (cookies).
 * Úsalo para todo lo relacionado con Auth. En Server Components no se pueden
 * escribir cookies; ahí el refresco de sesión lo hace `proxy.ts`.
 */
export async function createAuthSupabaseClient() {
  // Primero las cookies: así Next marca la ruta como dinámica y no intenta
  // prerenderizarla en el build (donde las variables de entorno pueden faltar).
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Faltan las variables públicas de Supabase.");
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component: no se pueden escribir cookies aquí.
        }
      },
    },
  });
}

export async function getCurrentUser() {
  const supabase = await createAuthSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
