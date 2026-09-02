import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { log } from "./log";

export type LimitResult = { ok: true } | { ok: false; retryAfter: number };

export type Limiter = {
  /** `key` identifica a quién se limita (IP, id de usuario…). */
  limit(key: string): Promise<LimitResult>;
};

export type LimiterOptions = {
  /**
   * Qué hacer si el servicio de límites falla: `open` deja pasar y registra
   * el error (checkout, analítica); `closed` bloquea (login del admin).
   */
  onError?: "open" | "closed";
};

/**
 * Ventana deslizante en memoria. Solo sirve en desarrollo: en Vercel cada
 * instancia tiene su propia memoria y el límite no se comparte.
 */
export class MemoryLimiter implements Limiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  async limit(key: string): Promise<LimitResult> {
    const now = this.now();
    const since = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > since);

    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return {
        ok: false,
        retryAfter: Math.ceil((recent[0] + this.windowMs - now) / 1000),
      };
    }

    recent.push(now);
    this.hits.set(key, recent);

    // Evita que el mapa crezca sin límite con claves que ya no vuelven.
    if (this.hits.size > 10_000) {
      for (const [k, v] of this.hits) {
        if (!v.some((t) => t > since)) this.hits.delete(k);
      }
    }

    return { ok: true };
  }
}

/** Envuelve Upstash aplicando la política de error elegida. */
export class UpstashLimiter implements Limiter {
  constructor(
    private readonly ratelimit: Pick<Ratelimit, "limit">,
    private readonly onError: "open" | "closed",
    private readonly name: string,
  ) {}

  async limit(key: string): Promise<LimitResult> {
    try {
      const result = await this.ratelimit.limit(key);
      return result.success
        ? { ok: true }
        : {
            ok: false,
            retryAfter: Math.max(
              1,
              Math.ceil((result.reset - Date.now()) / 1000),
            ),
          };
    } catch (error) {
      log.error(
        "ratelimit.unavailable",
        { name: this.name, onError: this.onError },
        error,
      );
      return this.onError === "open"
        ? { ok: true }
        : { ok: false, retryAfter: 60 };
    }
  }
}

let warnedMemory = false;
const limiters = new Map<string, Limiter>();

/**
 * Límite de `max` peticiones por `windowSeconds`. Usa Upstash Redis si
 * `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` están definidas; si no,
 * cae a memoria (solo desarrollo). Los limitadores se cachean por nombre.
 */
export function createLimiter(
  name: string,
  max: number,
  windowSeconds: number,
  { onError = "open" }: LimiterOptions = {},
): Limiter {
  const cached = limiters.get(name);
  if (cached) return cached;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  let limiter: Limiter;

  if (url && token) {
    limiter = new UpstashLimiter(
      new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
        prefix: `eln1:${name}`,
      }),
      onError,
      name,
    );
  } else {
    if (!warnedMemory && process.env.NODE_ENV === "production") {
      log.warn("ratelimit.memory_fallback", {
        hint: "define UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN",
      });
      warnedMemory = true;
    }
    limiter = new MemoryLimiter(max, windowSeconds * 1000);
  }

  limiters.set(name, limiter);
  return limiter;
}

/** Solo para pruebas: olvida los limitadores cacheados. */
export function resetLimiters() {
  limiters.clear();
  warnedMemory = false;
}

/** IP del cliente detrás del proxy de Vercel; "unknown" si no hay cabeceras. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || "unknown";
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    {
      error: `Demasiadas solicitudes. Inténtalo en ${retryAfter} segundos.`,
      code: "rate_limited",
    },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

// --- Límites de la aplicación ----------------------------------------------

/** Login del admin: 5 intentos por IP cada 15 minutos; bloquea si Upstash falla. */
export const adminLoginLimiter = () =>
  createLimiter("admin-login", 5, 15 * 60, { onError: "closed" });

/** Checkout: 10 reservas por usuario cada 10 minutos. */
export const checkoutLimiter = () => createLimiter("checkout", 10, 10 * 60);

/** Analítica: 60 escrituras por IP por minuto. */
export const analyticsLimiter = () => createLimiter("analytics", 60, 60);

/** Registro e ingreso: 10 intentos por IP cada 15 minutos. */
export const authLimiter = () => createLimiter("auth", 10, 15 * 60);
