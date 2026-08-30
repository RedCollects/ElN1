import { describe, expect, it } from "vitest";
import { z } from "zod";
import { MAX_RANKING_POSITION } from "./prices";
import {
  adminProfileSchema,
  adminToggleSchema,
  analyticsSchema,
  checkoutSchema,
  profileSchema,
  signInSchema,
  signUpSchema,
} from "./schemas";
import { firstMessage, formDataToObject, parseInput } from "./validation";

const UUID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

describe("checkoutSchema", () => {
  it("acepta una posición válida y normaliza expectedAmount ausente a null", () => {
    expect(parseInput(checkoutSchema, { position: 3 })).toEqual({
      ok: true,
      data: { position: 3, expectedAmount: null },
    });
    expect(
      parseInput(checkoutSchema, { position: "7", expectedAmount: "110" }),
    ).toEqual({
      ok: true,
      data: { position: 7, expectedAmount: 110 },
    });
  });

  it("rechaza posiciones fuera de rango, decimales o no numéricas", () => {
    for (const position of [
      0,
      MAX_RANKING_POSITION + 1,
      2.5,
      "abc",
      undefined,
    ]) {
      expect(parseInput(checkoutSchema, { position })).toEqual({
        ok: false,
        error: "Posición inválida.",
      });
    }
  });

  it("rechaza importes no positivos", () => {
    expect(
      parseInput(checkoutSchema, { position: 1, expectedAmount: -5 }),
    ).toEqual({
      ok: false,
      error: "Importe inválido.",
    });
  });
});

describe("adminToggleSchema", () => {
  it("exige uuid y booleano real", () => {
    expect(parseInput(adminToggleSchema, { id: UUID, active: true }).ok).toBe(
      true,
    );
    expect(parseInput(adminToggleSchema, { id: "1", active: true }).ok).toBe(
      false,
    );
    expect(parseInput(adminToggleSchema, { id: UUID, active: "true" }).ok).toBe(
      false,
    );
  });
});

describe("adminProfileSchema", () => {
  const base = { id: UUID, name: "Tacos", category: "Alimentos y bebidas" };

  it("normaliza vacíos a null y añade protocolo a los enlaces", () => {
    const result = parseInput(adminProfileSchema, {
      ...base,
      description: "  ",
      phone: "",
      whatsapp: "5512345678",
      logo_url: "",
      website: "ejemplo.com",
      instagram: "https://instagram.com/x",
      facebook: "",
      tiktok: "",
    });

    expect(result).toEqual({
      ok: true,
      data: {
        ...base,
        description: null,
        phone: null,
        whatsapp: "5512345678",
        logo_url: null,
        website: "https://ejemplo.com/",
        instagram: "https://instagram.com/x",
        facebook: null,
        tiktok: null,
      },
    });
  });

  it("exige nombre y categoría", () => {
    expect(parseInput(adminProfileSchema, { ...base, name: " " })).toEqual({
      ok: false,
      error: "Nombre y categoría son obligatorios.",
    });
    expect(parseInput(adminProfileSchema, { ...base, category: "x" })).toEqual({
      ok: false,
      error: "Nombre y categoría son obligatorios.",
    });
  });

  it("rechaza enlaces que no sean http(s)", () => {
    expect(
      parseInput(adminProfileSchema, {
        ...base,
        website: "javascript:alert(1)",
      }),
    ).toEqual({
      ok: false,
      error: "Revisa que los enlaces usen http:// o https://.",
    });
  });
});

describe("analyticsSchema", () => {
  it("exige sesión uuid", () => {
    expect(parseInput(analyticsSchema, { sessionId: "x" })).toEqual({
      ok: false,
      error: "Sesión inválida.",
    });
  });

  it("ignora eventos o negocios inválidos sin rechazar la petición", () => {
    expect(
      parseInput(analyticsSchema, {
        sessionId: UUID,
        event: "otro",
        businessId: "1",
      }),
    ).toEqual({
      ok: true,
      data: { sessionId: UUID, event: undefined, businessId: undefined },
    });
    expect(
      parseInput(analyticsSchema, {
        sessionId: UUID,
        event: "business_click",
        businessId: UUID,
      }),
    ).toEqual({
      ok: true,
      data: { sessionId: UUID, event: "business_click", businessId: UUID },
    });
  });
});

describe("signUpSchema", () => {
  it("normaliza el correo y recorta el nombre", () => {
    expect(
      parseInput(signUpSchema, {
        email: "  Ana@Ejemplo.COM ",
        password: "12345678",
        businessName: " Mi negocio ",
        acceptTerms: "on",
      }),
    ).toEqual({
      ok: true,
      data: {
        email: "ana@ejemplo.com",
        password: "12345678",
        businessName: "Mi negocio",
        acceptTerms: "on",
      },
    });
  });

  it("devuelve los mensajes de siempre", () => {
    const valid = {
      email: "a@b.co",
      password: "12345678",
      businessName: "Bar",
      acceptTerms: "on",
    };
    expect(
      parseInput(signUpSchema, { ...valid, email: "no-es-correo" }).ok,
    ).toBe(false);
    expect(
      parseInput(signUpSchema, { ...valid, email: "no-es-correo" }),
    ).toMatchObject({
      error: "Escribe un correo válido.",
    });
    expect(
      parseInput(signUpSchema, { ...valid, password: "1234567" }),
    ).toMatchObject({
      error: "La contraseña debe tener al menos 8 caracteres.",
    });
    expect(
      parseInput(signUpSchema, { ...valid, businessName: "B" }),
    ).toMatchObject({
      error: "El nombre del negocio debe tener entre 2 y 60 caracteres.",
    });
  });

  it("exige la casilla de Términos (un checkbox sin marcar no viaja)", () => {
    const sinCasilla = {
      email: "a@b.co",
      password: "12345678",
      businessName: "Bar",
    };
    expect(parseInput(signUpSchema, sinCasilla)).toMatchObject({
      ok: false,
      error:
        "Para crear tu cuenta acepta los Términos y el Aviso de privacidad.",
    });
    expect(
      parseInput(signUpSchema, { ...sinCasilla, acceptTerms: "true" }).ok,
    ).toBe(false);
  });
});

describe("signInSchema", () => {
  it("exige ambos campos con un solo mensaje", () => {
    expect(parseInput(signInSchema, { email: "", password: "x" })).toEqual({
      ok: false,
      error: "Escribe tu correo y tu contraseña.",
    });
    expect(parseInput(signInSchema, { email: "A@b.co", password: "" })).toEqual(
      {
        ok: false,
        error: "Escribe tu correo y tu contraseña.",
      },
    );
    expect(
      parseInput(signInSchema, { email: " A@b.co ", password: "x" }),
    ).toEqual({
      ok: true,
      data: { email: "a@b.co", password: "x" },
    });
  });
});

describe("profileSchema", () => {
  const valid = {
    name: "Tacos El Güero",
    category: "Alimentos y bebidas",
    city: "Puebla",
  };

  it("normaliza WhatsApp, teléfono, redes y enlaces; vacíos a null", () => {
    const result = parseInput(profileSchema, {
      ...valid,
      whatsapp: "(55) 1234-5678",
      phone: "+52 222 123 45 67",
      instagram: "@tacos.guero",
      facebook: "",
      website: "tacos.mx",
      maps_url: "maps.app.goo.gl/abc",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      ...valid,
      whatsapp: "5512345678",
      phone: "+522221234567",
      instagram: "tacos.guero",
      facebook: null,
      tiktok: null,
      website: "https://tacos.mx/",
      maps_url: "https://maps.app.goo.gl/abc",
      description: null,
    });
  });

  it("acepta WhatsApp con 52 delante", () => {
    const result = parseInput(profileSchema, {
      ...valid,
      whatsapp: "52 55 1234 5678",
    });
    expect(result).toMatchObject({
      ok: true,
      data: { whatsapp: "525512345678" },
    });
  });

  it("devuelve los mensajes de validación de siempre", () => {
    const cases: Array<[Record<string, string>, string | RegExp]> = [
      [
        { name: "T" },
        "El nombre del negocio debe tener al menos 2 caracteres.",
      ],
      [{ category: "Inventada" }, "Elige una categoría de la lista."],
      [
        { whatsapp: "123" },
        "El WhatsApp debe tener 10 dígitos (por ejemplo, 5512345678).",
      ],
      [{ phone: "12" }, "El teléfono no parece válido."],
      [{ email_public: "no" }, "El email público no es válido."],
      [
        { website: "javascript:x" },
        "El sitio web debe ser una dirección http(s) válida.",
      ],
      [{ tiktok: "con espacios" }, /usuario de tiktok/],
      [{ maps_url: "javascript:x" }, "El enlace de Google Maps no es válido."],
      [
        { description: "x".repeat(301) },
        'El campo "description" supera los 300 caracteres.',
      ],
    ];

    for (const [override, message] of cases) {
      const result = parseInput(profileSchema, { ...valid, ...override });
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      if (typeof message === "string") expect(result.error).toBe(message);
      else expect(result.error).toMatch(message);
    }
  });
});

describe("helpers", () => {
  it("formDataToObject ignora archivos", () => {
    const formData = new FormData();
    formData.set("a", "1");
    formData.set("f", new Blob(["x"]), "x.txt");
    expect(formDataToObject(formData)).toEqual({ a: "1" });
  });

  it("firstMessage cae a un texto genérico sin issues", () => {
    const result = checkoutSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstMessage(result.error)).toBe("Posición inválida.");
    }
    expect(firstMessage(new z.ZodError([]))).toBe("Datos inválidos.");
  });
});
