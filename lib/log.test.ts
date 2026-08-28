import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { log } from "./log";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("log en desarrollo", () => {
  it("escribe el evento entre corchetes, los campos y el error", () => {
    vi.stubEnv("NODE_ENV", "test");
    const error = new Error("boom");

    log.info("a.b");
    log.warn("c.d", { id: 1 });
    log.error("e.f", { id: 2 }, error);

    expect(console.log).toHaveBeenCalledWith("[a.b]");
    expect(console.warn).toHaveBeenCalledWith("[c.d]", { id: 1 });
    expect(console.error).toHaveBeenCalledWith("[e.f]", { id: 2 }, error);
  });
});

describe("log en producción", () => {
  it("escribe una línea JSON con nivel, evento, hora y campos", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-27T12:00:00.000Z"));

    log.warn("pago.tarde", { paymentId: "p1", required: 121 });

    expect(console.warn).toHaveBeenCalledTimes(1);
    const line = vi.mocked(console.warn).mock.calls[0][0] as string;
    expect(JSON.parse(line)).toEqual({
      level: "warn",
      event: "pago.tarde",
      time: "2026-08-27T12:00:00.000Z",
      paymentId: "p1",
      required: 121,
    });
    vi.useRealTimers();
  });

  it("serializa errores con nombre, mensaje y stack; los objetos planos tal cual", () => {
    vi.stubEnv("NODE_ENV", "production");

    log.error("x", {}, new TypeError("mal"));
    log.error("y", {}, { message: "postgrest", code: "23505" });

    const first = JSON.parse(
      vi.mocked(console.error).mock.calls[0][0] as string,
    );
    const second = JSON.parse(
      vi.mocked(console.error).mock.calls[1][0] as string,
    );
    expect(first.error).toMatchObject({ name: "TypeError", message: "mal" });
    expect(first.error.stack).toContain("TypeError: mal");
    expect(second.error).toEqual({ message: "postgrest", code: "23505" });
  });
});
