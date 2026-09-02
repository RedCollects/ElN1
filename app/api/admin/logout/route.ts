import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.delete(COOKIE_NAME);
  return response;
}
