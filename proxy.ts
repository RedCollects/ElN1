import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIX = "/mi-negocio";
const GUEST_ONLY = ["/ingresar", "/registro"];

/**
 * Refresca la sesión de Supabase en cada request (los Server Components no
 * pueden escribir cookies) y aplica las redirecciones de acceso:
 * sin sesión no se entra a /mi-negocio; con sesión no tiene sentido
 * ver /ingresar ni /registro.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && pathname.startsWith(PROTECTED_PREFIX)) {
    const login = new URL("/ingresar", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (user && GUEST_ONLY.includes(pathname)) {
    return NextResponse.redirect(new URL(PROTECTED_PREFIX, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/", "/mi-negocio/:path*", "/ingresar", "/registro"],
};
