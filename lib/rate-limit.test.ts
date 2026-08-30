import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ratelimitCtor = vi.fn();
const redisCtor = vi.fn();

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(
    class {
      constructor(options: unknown) {
        ratelimitCtor(options);
      }
      limit = vi.fn();
    },
    { slidingWindow: (max: number, window: string) => ({ max, window }) },
  ),
}));

vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor(options: unknown) {
      redisCtor(options);
    }
  },
}));

import {
  MemoryLimiter,
  UpstashLimiter,
  clientIp,
  createLimiter,
  resetLimiters,
  tooManyRequests,
} from "./rate-limit";

beforeEach(() => {
  resetLimiters();
  ratelimitCtor.mockClear();
  redisCtor.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("MemoryLimiter", () => {
  it("deja pasar hasta max y bloquea la siguiente con retryAfter", async () => {
    let now = 1_000_000;
    const limiter = new MemoryLimiter(3, 60_000, () => now);

    expect(await limiter.limit("ip")).toEqual({ ok: true });
    now += 1_000;
    expect(await limiter.limit("ip")).toEqual({ ok: true });
    now += 1_000;
    expect(await limiter.limit("ip")).toEqual({ ok: true });
    now += 1_000;
    // La primera petición fue hace 3 s; la ventana dura 60 s → 57 s de espera.
    expect(await limiter.limit("ip")).toEqual({ ok: false, retryAfter: 57 });
  });

  it("vuelve a dejar pasar cuando la ventana desliza", async () => {
    let now = 0;
    const limiter = new MemoryLimiter(1, 10_000, () => now);

    expect(await limiter.limit("ip")).toEqual({ ok: true });
    now = 9_999;
    expect(await limiter.limit("ip")).toMatchObject({ ok: false });
    now = 10_001;
    expect(await limiter.limit("ip")).toEqual({ ok: true });
  });

  it("cuenta por clave", async () => {
    const limiter = new MemoryLimiter(1, 10_000, () => 0);
    expect(await limiter.limit("a")).toEqual({ ok: true });
    expect(await limiter.limit("b")).toEqual({ ok: true });
    expect(await limiter.limit("a")).toMatchObject({ ok: false });
  });
});

describe("UpstashLimiter", () => {
  it("traduce success/reset de Upstash", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    const limit = vi
      .fn()
      .mockResolvedValueOnce({ success: true, reset: 0 })
      .mockResolvedValueOnce({ success: false, reset: 25_000 });
    const limiter = new UpstashLimiter({ limit }, "open", "x");

    expect(await limiter.limit("k")).toEqual({ ok: true });
    expect(await limiter.limit("k")).toEqual({ ok: false, retryAfter: 15 });
    vi.useRealTimers();
  });

  it("con onError=open deja pasar si Upstash falla; con closed bloquea", async () => {
    const limit = vi.fn().mockRejectedValue(new Error("caído"));

    expect(await new UpstashLimiter({ limit }, "open", "x").limit("k")).toEqual(
      { ok: true },
    );
    expect(
      await new UpstashLimiter({ limit }, "closed", "x").limit("k"),
    ).toEqual({
      ok: false,
      retryAfter: 60,
    });
    expect(console.error).toHaveBeenCalledTimes(2);
  });
});

describe("createLimiter", () => {
  it("usa memoria sin variables de Upstash y avisa solo en producción", () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("NODE_ENV", "test");

    expect(createLimiter("a", 1, 1)).toBeInstanceOf(MemoryLimiter);
    expect(console.warn).not.toHaveBeenCalled();

    resetLimiters();
    vi.stubEnv("NODE_ENV", "production");
    createLimiter("a", 1, 1);
    createLimiter("b", 1, 1);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("usa Upstash con las variables definidas y cachea por nombre", () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://x.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "t");

    const first = createLimiter("checkout", 10, 600);
    const second = createLimiter("checkout", 10, 600);

    expect(first).toBeInstanceOf(UpstashLimiter);
    expect(second).toBe(first);
    expect(redisCtor).toHaveBeenCalledWith({
      url: "https://x.upstash.io",
      token: "t",
    });
    expect(ratelimitCtor).toHaveBeenCalledTimes(1);
    expect(ratelimitCtor.mock.calls[0][0]).toMatchObject({
      prefix: "eln1:checkout",
      limiter: { max: 10, window: "600 s" },
    });
  });
});

describe("clientIp", () => {
  it("toma la primera IP de x-forwarded-for, luego x-real-ip, luego unknown", () => {
    expect(
      clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })),
    ).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("tooManyRequests", () => {
  it("responde 429 con Retry-After", async () => {
    const response = tooManyRequests(42);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    await expect(response.json()).resolves.toMatchObject({
      code: "rate_limited",
    });
  });
});
