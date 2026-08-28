import { describe, expect, it } from "vitest";
import {
  BIG_AD_MAX_POSITION,
  contactLinks,
  hasBigAd,
  hasContactChannel,
  missingForPublish,
  normalizeWebsite,
  socialUrl,
  whatsappUrl,
} from "./business";

describe("missingForPublish", () => {
  it("lista todo lo que falta en un perfil vacío", () => {
    const missing = missingForPublish({});

    expect(missing).toHaveLength(5);
    expect(missing).toContain("el nombre del negocio");
    expect(missing).toContain("la categoría");
    expect(missing).toContain("la ciudad");
    expect(missing).toContain("el logo");
    expect(missing[4]).toMatch(/canal de contacto/);
  });

  it("no lista nada cuando el perfil está completo", () => {
    expect(
      missingForPublish({
        name: "Tacos El Güero",
        category: "Alimentos y bebidas",
        city: "Puebla",
        logo_url: "https://x/logo.webp",
        whatsapp: "2221234567",
      }),
    ).toEqual([]);
  });

  it("ignora nombres y ciudades en blanco", () => {
    const missing = missingForPublish({ name: "   ", city: " " });
    expect(missing).toContain("el nombre del negocio");
    expect(missing).toContain("la ciudad");
  });

  it("acepta el sitio web como único canal de contacto", () => {
    expect(hasContactChannel({ website: "https://ejemplo.com" })).toBe(true);
    expect(hasContactChannel({ instagram: "usuario" })).toBe(false);
  });
});

describe("whatsappUrl", () => {
  it("antepone 52 a un número mexicano de 10 dígitos", () => {
    expect(whatsappUrl("2221234567")).toBe(
      "https://wa.me/522221234567?text=Hola%2C%20los%20vi%20en%20EL%20N1",
    );
  });

  it("no duplica el 52 si ya viene", () => {
    expect(whatsappUrl("522221234567")).toContain("wa.me/522221234567?");
  });

  it("limpia espacios, guiones y paréntesis", () => {
    expect(whatsappUrl("(222) 123-45 67")).toContain("wa.me/522221234567?");
  });
});

describe("socialUrl", () => {
  it("construye la URL a partir del usuario, con o sin @", () => {
    expect(socialUrl("instagram", "@negocio")).toBe(
      "https://instagram.com/negocio",
    );
    expect(socialUrl("facebook", "negocio")).toBe(
      "https://facebook.com/negocio",
    );
    expect(socialUrl("tiktok", "negocio")).toBe("https://tiktok.com/@negocio");
  });

  it("respeta URLs completas de registros antiguos", () => {
    expect(socialUrl("instagram", " https://www.instagram.com/x/ ")).toBe(
      "https://www.instagram.com/x/",
    );
  });
});

describe("normalizeWebsite", () => {
  it("añade https:// cuando falta el protocolo", () => {
    expect(normalizeWebsite("ejemplo.com")).toBe("https://ejemplo.com/");
  });

  it("conserva http:// y https:// explícitos", () => {
    expect(normalizeWebsite("http://ejemplo.com/ruta")).toBe(
      "http://ejemplo.com/ruta",
    );
  });

  it("rechaza vacíos y protocolos peligrosos", () => {
    expect(normalizeWebsite("")).toBeNull();
    expect(normalizeWebsite("   ")).toBeNull();
    expect(normalizeWebsite("javascript:alert(1)")).toBeNull();
    expect(normalizeWebsite("https://")).toBeNull();
  });
});

describe("contactLinks", () => {
  it("respeta el orden de prioridad", () => {
    const labels = contactLinks({
      maps_url: "https://maps.example",
      tiktok: "t",
      facebook: "f",
      instagram: "i",
      website: "https://w.example",
      email_public: "a@b.c",
      phone: "2221234567",
      whatsapp: "2221234567",
    }).map((link) => link.label);

    expect(labels).toEqual([
      "WhatsApp",
      "Llamar",
      "Email",
      "Sitio web",
      "Instagram",
      "Facebook",
      "TikTok",
      "Cómo llegar",
    ]);
  });

  it("omite los canales vacíos y marca tel:/mailto: como internos", () => {
    const links = contactLinks({ phone: "2221234567", email_public: "a@b.c" });

    expect(links).toEqual([
      { label: "Llamar", emoji: "📞", href: "tel:2221234567", external: false },
      { label: "Email", emoji: "✉️", href: "mailto:a@b.c", external: false },
    ]);
  });
});

describe("hasBigAd", () => {
  it("solo hasta BIG_AD_MAX_POSITION", () => {
    expect(hasBigAd(1)).toBe(true);
    expect(hasBigAd(BIG_AD_MAX_POSITION)).toBe(true);
    expect(hasBigAd(BIG_AD_MAX_POSITION + 1)).toBe(false);
    expect(hasBigAd(null)).toBe(false);
    expect(hasBigAd(undefined)).toBe(false);
  });
});
