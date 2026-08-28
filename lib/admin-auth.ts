import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "eln1_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 12) {
    throw new Error("ADMIN_PASSWORD debe tener al menos 12 caracteres.");
  }

  return password;
}

function sign(value: string) {
  return createHmac("sha256", getAdminPassword()).update(value).digest("hex");
}

export function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const value = `${expiresAt}.${sign(String(expiresAt))}`;

  return {
    name: COOKIE_NAME,
    value,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    },
  };
}

export function isValidAdminPassword(password: string) {
  const expected = Buffer.from(getAdminPassword());
  const received = Buffer.from(password);

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export async function hasAdminSession() {
  try {
    const value = (await cookies()).get(COOKIE_NAME)?.value ?? "";
    const [expiresAt, signature] = value.split(".");

    if (!expiresAt || !signature || Number(expiresAt) < Date.now() / 1000) {
      return false;
    }

    const expected = Buffer.from(sign(expiresAt));
    const received = Buffer.from(signature);

    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    );
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
