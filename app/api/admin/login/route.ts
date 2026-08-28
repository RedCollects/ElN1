import { NextResponse } from "next/server";
import {
  createAdminSession,
  isValidAdminPassword,
} from "../../../../lib/admin-auth";
import { adminLoginSchema } from "../../../../lib/schemas";
import { parseInput, readJson } from "../../../../lib/validation";
import {
  adminLoginLimiter,
  clientIp,
  tooManyRequests,
} from "../../../../lib/rate-limit";

export async function POST(request: Request) {
  try {
    const limit = await adminLoginLimiter().limit(clientIp(request.headers));

    if (!limit.ok) {
      return tooManyRequests(limit.retryAfter);
    }

    const parsed = parseInput(adminLoginSchema, await readJson(request));

    if (!parsed.ok || !isValidAdminPassword(parsed.data.password)) {
      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ success: true });
    const session = createAdminSession();
    response.cookies.set({
      name: session.name,
      value: session.value,
      ...session.options,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "No se pudo iniciar sesión." },
      { status: 400 },
    );
  }
}
