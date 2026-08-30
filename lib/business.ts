import { BUSINESS_CATEGORIES } from "./categories";

/** Lista única de categorías (compartida con el admin y el filtro del ranking). */
export const CATEGORIES: readonly string[] = BUSINESS_CATEGORIES;

export type Category = string;

export type BusinessStatus = "draft" | "published";

export type Business = {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string | null;
  category: string | null;
  city: string | null;
  tagline: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email_public: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  logo_url: string | null;
  cover_url: string | null;
  maps_url: string | null;
  hours: string | null;
  position: number | null;
  current_price: number | null;
  active: boolean;
  status: BusinessStatus;
  updated_at?: string;
};

/**
 * Hasta qué posición se muestra el anuncio grande (hover / toque).
 * Pendiente de decisión de producto: 10 = todos, 3 = solo el podio, 1 = solo EL N1.
 */
export const BIG_AD_MAX_POSITION = 3;

export function hasBigAd(position: number | null | undefined): boolean {
  return typeof position === "number" && position >= 1 && position <= BIG_AD_MAX_POSITION;
}

export type ContactLink = {
  label: string;
  emoji: string;
  href: string;
  external: boolean;
};

/** Botones de contacto en orden de prioridad (WhatsApp primero). */
export function contactLinks(business: Partial<Business>): ContactLink[] {
  const links: ContactLink[] = [];

  if (business.whatsapp) {
    links.push({ label: "WhatsApp", emoji: "💬", href: whatsappUrl(business.whatsapp), external: true });
  }
  if (business.phone) {
    links.push({ label: "Llamar", emoji: "📞", href: `tel:${business.phone}`, external: false });
  }
  if (business.email_public) {
    links.push({ label: "Email", emoji: "✉️", href: `mailto:${business.email_public}`, external: false });
  }
  if (business.website) {
    links.push({ label: "Sitio web", emoji: "🌐", href: business.website, external: true });
  }
  if (business.instagram) {
    links.push({ label: "Instagram", emoji: "📸", href: socialUrl("instagram", business.instagram), external: true });
  }
  if (business.facebook) {
    links.push({ label: "Facebook", emoji: "👍", href: socialUrl("facebook", business.facebook), external: true });
  }
  if (business.tiktok) {
    links.push({ label: "TikTok", emoji: "🎵", href: socialUrl("tiktok", business.tiktok), external: true });
  }
  if (business.maps_url) {
    links.push({ label: "Cómo llegar", emoji: "📍", href: business.maps_url, external: true });
  }

  return links;
}

/** Campos del perfil que el dueño puede editar desde /mi-negocio. */
export const EDITABLE_FIELDS = [
  "name",
  "category",
  "city",
  "tagline",
  "description",
  "phone",
  "whatsapp",
  "email_public",
  "website",
  "instagram",
  "facebook",
  "tiktok",
  "maps_url",
  "hours",
] as const;

export type EditableField = (typeof EDITABLE_FIELDS)[number];

export const FIELD_LIMITS: Record<EditableField, number> = {
  name: 60,
  category: 40,
  city: 60,
  tagline: 80,
  description: 300,
  phone: 20,
  whatsapp: 15,
  email_public: 120,
  website: 200,
  instagram: 50,
  facebook: 50,
  tiktok: 50,
  maps_url: 500,
  hours: 120,
};

export function hasContactChannel(business: Partial<Business>): boolean {
  return Boolean(
    business.whatsapp ||
      business.phone ||
      business.email_public ||
      business.website
  );
}

/** Lo que falta para poder publicar el negocio; vacío si ya puede. */
export function missingForPublish(business: Partial<Business>): string[] {
  const missing: string[] = [];

  if (!business.name?.trim()) missing.push("el nombre del negocio");
  if (!business.category) missing.push("la categoría");
  if (!business.city?.trim()) missing.push("la ciudad");
  if (!business.logo_url) missing.push("el logo");
  if (!hasContactChannel(business)) {
    missing.push("al menos un canal de contacto (WhatsApp, teléfono, email o sitio web)");
  }

  return missing;
}

const WHATSAPP_MESSAGE = "Hola, los vi en EL N1";

/** Enlace de WhatsApp para un número mexicano de 10 dígitos (o ya con 52). */
export function whatsappUrl(number: string): string {
  const digits = number.replace(/\D/g, "");
  const full = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
}

type SocialNetwork = "instagram" | "facebook" | "tiktok";

const SOCIAL_BASE: Record<SocialNetwork, string> = {
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  tiktok: "https://tiktok.com/@",
};

/**
 * URL pública de una red social a partir del usuario guardado.
 * Acepta también URLs completas de registros antiguos.
 */
export function socialUrl(network: SocialNetwork, value: string): string {
  const trimmed = value.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `${SOCIAL_BASE[network]}${trimmed.replace(/^@/, "")}`;
}

/** Garantiza que un sitio web tenga protocolo y sea http(s). */
export function normalizeWebsite(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
