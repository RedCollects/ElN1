import { NextResponse } from "next/server";
import {
  createAdminSession,
  isValidAdminPassword,
} from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = String(body.password ?? "");

    if (!isValidAdminPassword(password)) {
      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 }
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
      { status: 400 }
    );
  }
}
