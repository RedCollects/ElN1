import { z } from "zod";
import {
  CATEGORIES,
  EDITABLE_FIELDS,
  FIELD_LIMITS,
  normalizeWebsite,
} from "./business";
import { isValidBusinessCategory } from "./categories";
import { MAX_RANKING_POSITION } from "./prices";

// --- Piezas reutilizables ---------------------------------------------------

export const uuidSchema = z.uuid("Identificador inválido.");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Escribe un correo válido."));

/** Texto opcional: recorta espacios y convierte el vacío en `null`. */
function optionalText(maxLength: number, label: string) {
  return z.preprocess(
    absentToEmpty,
    z
      .string()
      .trim()
      .max(maxLength, `El campo "${label}" supera los ${maxLength} caracteres.`)
      .transform((value) => value || null),
  );
}

/** Un campo que no viene en el formulario equivale a vacío. */
function absentToEmpty(value: unknown) {
  return value === undefined || value === null ? "" : value;
}

/** URL http(s) opcional: vacía → `null`; con protocolo añadido si falta. */
const optionalHttpUrl = z.preprocess(
  absentToEmpty,
  z
    .string()
    .trim()
    .max(500, "Los enlaces no pueden superar los 500 caracteres.")
    .transform((value, ctx) => {
      if (!value) return null;
      const normalized = normalizeWebsite(value);
      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message: "Revisa que los enlaces usen http:// o https://.",
        });
        return z.NEVER;
      }
      return normalized;
    }),
);

// --- Checkout ---------------------------------------------------------------

const POSITION_ERROR = "Posición inválida.";

export const checkoutSchema = z.object({
  position: z.coerce
    .number(POSITION_ERROR)
    .int(POSITION_ERROR)
    .min(1, POSITION_ERROR)
    .max(MAX_RANKING_POSITION, POSITION_ERROR),
  expectedAmount: z.coerce
    .number("Importe inválido.")
    .positive("Importe inválido.")
    .nullish()
    .transform((value) => value ?? null),
});

// --- Admin ------------------------------------------------------------------

export const adminLoginSchema = z.object({
  password: z
    .string()
    .min(1, "Escribe la contraseña.")
    .max(200, "Contraseña demasiado larga."),
});

export const adminToggleSchema = z.object({
  id: uuidSchema,
  active: z.boolean("Datos inválidos."),
});

/** Formulario de edición de perfil desde /admin (URLs completas, texto libre). */
export const adminProfileSchema = z.object({
  id: uuidSchema,
  name: z
    .string()
    .trim()
    .min(1, "Nombre y categoría son obligatorios.")
    .max(120, 'El campo "nombre" supera los 120 caracteres.'),
  category: z
    .string()
    .trim()
    .refine(isValidBusinessCategory, "Nombre y categoría son obligatorios."),
  description: optionalText(1_500, "descripción"),
  phone: optionalText(30, "teléfono"),
  whatsapp: optionalText(30, "WhatsApp"),
  logo_url: optionalHttpUrl,
  website: optionalHttpUrl,
  instagram: optionalHttpUrl,
  facebook: optionalHttpUrl,
  tiktok: optionalHttpUrl,
});

// --- Analítica --------------------------------------------------------------

/** Un evento o negocio inválido no invalida la petición: solo se ignora el clic. */
export const analyticsSchema = z.object({
  sessionId: z.uuid("Sesión inválida."),
  event: z.literal("business_click").optional().catch(undefined),
  businessId: uuidSchema.optional().catch(undefined),
});

// --- Cuentas ----------------------------------------------------------------

export const MIN_PASSWORD_LENGTH = 8;

export const signUpSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    ),
  businessName: z
    .string()
    .trim()
    .min(2, "El nombre del negocio debe tener entre 2 y 60 caracteres.")
    .max(60, "El nombre del negocio debe tener entre 2 y 60 caracteres."),
  /** Casilla del registro; un checkbox HTML manda "on" solo si está marcado. */
  acceptTerms: z.literal("on", {
    error: "Para crear tu cuenta acepta los Términos y el Aviso de privacidad.",
  }),
});

const CREDENTIALS_ERROR = "Escribe tu correo y tu contraseña.";

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, CREDENTIALS_ERROR),
  password: z.string().min(1, CREDENTIALS_ERROR),
});

// --- Perfil del dueño (/mi-negocio) -----------------------------------------

const HANDLE_PATTERN = /^[A-Za-z0-9._-]{1,50}$/;

const profileFields = Object.fromEntries(
  EDITABLE_FIELDS.map((field) => [
    field,
    optionalText(FIELD_LIMITS[field], field),
  ]),
) as {
  [K in (typeof EDITABLE_FIELDS)[number]]: ReturnType<typeof optionalText>;
};

/**
 * Valida y normaliza el formulario de /mi-negocio: WhatsApp a dígitos,
 * redes sociales a usuario sin @, sitio web y mapa con protocolo.
 */
export const profileSchema = z
  .object(profileFields)
  .transform((values, ctx) => {
    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (!values.name || values.name.length < 2) {
      fail("name", "El nombre del negocio debe tener al menos 2 caracteres.");
    }

    if (
      values.category &&
      !(CATEGORIES as readonly string[]).includes(values.category)
    ) {
      fail("category", "Elige una categoría de la lista.");
    }

    if (values.whatsapp) {
      const digits = values.whatsapp.replace(/\D/g, "");
      if (
        digits.length !== 10 &&
        !(digits.length === 12 && digits.startsWith("52"))
      ) {
        fail(
          "whatsapp",
          "El WhatsApp debe tener 10 dígitos (por ejemplo, 5512345678).",
        );
      }
      values.whatsapp = digits;
    }

    if (values.phone) {
      const digits = values.phone.replace(/[^\d+]/g, "");
      if (digits.replace(/\D/g, "").length < 8) {
        fail("phone", "El teléfono no parece válido.");
      }
      values.phone = digits;
    }

    if (
      values.email_public &&
      !z.email().safeParse(values.email_public).success
    ) {
      fail("email_public", "El email público no es válido.");
    }

    if (values.website) {
      const normalized = normalizeWebsite(values.website);
      if (!normalized) {
        fail("website", "El sitio web debe ser una dirección http(s) válida.");
      }
      values.website = normalized;
    }

    for (const network of ["instagram", "facebook", "tiktok"] as const) {
      const value = values[network];
      if (!value) continue;
      const handle = value.replace(/^@/, "");
      if (!HANDLE_PATTERN.test(handle)) {
        fail(
          network,
          `El usuario de ${network} solo puede tener letras, números, puntos, guiones y guiones bajos.`,
        );
      }
      values[network] = handle;
    }

    if (values.maps_url) {
      const normalized = normalizeWebsite(values.maps_url);
      if (!normalized) {
        fail("maps_url", "El enlace de Google Maps no es válido.");
      }
      values.maps_url = normalized;
    }

    // `name` ya se validó arriba; la columna es NOT NULL.
    return { ...values, name: values.name ?? "" };
  });

export type ProfileValues = z.output<typeof profileSchema>;
