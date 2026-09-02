import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  createAdminSession,
  hasAdminSession,
  isValidAdminPassword,
} from "./admin-auth";

const PASSWORD = "contraseña-larga-123";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function stubCookie(value: string | undefined) {
  const store = {
    get: (name: string) =>
      name === COOKIE_NAME && value !== undefined ? { name, value } : undefined,
  };
  vi.mocked(cookies).mockResolvedValue(store as unknown as CookieStore);
}

/** Cambia el último carácter hexadecimal de la firma. */
function tamper(signature: string) {
  const last = signature.at(-1);
  return signature.slice(0, -1) + (last === "0" ? "1" : "0");
}

beforeEach(() => {
  vi.stubEnv("ADMIN_PASSWORD", PASSWORD);
  vi.stubEnv("NODE_ENV", "test");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("isValidAdminPassword", () => {
  it("acepta la contraseña exacta", () => {
    expect(isValidAdminPassword(PASSWORD)).toBe(true);
  });

  it("rechaza contraseñas distintas o de otra longitud", () => {
    expect(isValidAdminPassword("contraseña-larga-124")).toBe(false);
    expect(isValidAdminPassword("corta")).toBe(false);
    expect(isValidAdminPassword("")).toBe(false);
  });

  it("lanza si ADMIN_PASSWORD no está o tiene menos de 12 caracteres", () => {
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(() => isValidAdminPassword("x")).toThrow(/12 caracteres/);
    vi.stubEnv("ADMIN_PASSWORD", "once-chars!");
    expect(() => isValidAdminPassword("once-chars!")).toThrow(/12 caracteres/);
  });
});

describe("createAdminSession", () => {
  it("devuelve una cookie httpOnly con caducidad de 12 h", () => {
    const session = createAdminSession();

    expect(session.name).toBe(COOKIE_NAME);
    expect(session.options.httpOnly).toBe(true);
    expect(session.options.sameSite).toBe("lax");
    expect(session.options.maxAge).toBe(12 * 60 * 60);
    expect(session.options.secure).toBe(false);
    expect(session.value).toMatch(/^\d+\.[0-9a-f]{64}$/);
  });

  it("marca la cookie como secure en producción", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(createAdminSession().options.secure).toBe(true);
  });
});

describe("hasAdminSession", () => {
  it("acepta la cookie que acaba de emitir createAdminSession", async () => {
    stubCookie(createAdminSession().value);
    await expect(hasAdminSession()).resolves.toBe(true);
  });

  it("rechaza si no hay cookie", async () => {
    stubCookie(undefined);
    await expect(hasAdminSession()).resolves.toBe(false);
  });

  it("rechaza una firma alterada", async () => {
    const [expiresAt, signature] = createAdminSession().value.split(".");
    stubCookie(`${expiresAt}.${tamper(signature)}`);
    await expect(hasAdminSession()).resolves.toBe(false);
  });

  it("rechaza una cookie caducada aunque la firma sea válida", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const value = createAdminSession().value;
    vi.setSystemTime(new Date("2026-01-01T13:00:00Z"));
    stubCookie(value);
    await expect(hasAdminSession()).resolves.toBe(false);
  });

  it("rechaza una cookie firmada con otra contraseña", async () => {
    const value = createAdminSession().value;
    vi.stubEnv("ADMIN_PASSWORD", "otra-contraseña-larga");
    stubCookie(value);
    await expect(hasAdminSession()).resolves.toBe(false);
  });

  it("devuelve false si ADMIN_PASSWORD no está configurada", async () => {
    stubCookie("1.abc");
    vi.stubEnv("ADMIN_PASSWORD", "");
    await expect(hasAdminSession()).resolves.toBe(false);
  });
});
