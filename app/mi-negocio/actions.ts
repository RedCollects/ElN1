"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../../lib/supabase-auth";
import { createServerSupabaseClient } from "../../lib/supabase-server";
import {
  CATEGORIES,
  EDITABLE_FIELDS,
  FIELD_LIMITS,
  normalizeWebsite,
  type EditableField,
} from "../../lib/business";

export type ProfileState = {
  error?: string;
  success?: boolean;
};

const HANDLE_PATTERN = /^[A-Za-z0-9._-]{1,50}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readField(formData: FormData, field: EditableField): string {
  return String(formData.get(field) ?? "").trim();
}

/** Devuelve los valores limpios a guardar o un mensaje de error. */
function validateProfile(
  formData: FormData
): { values: Record<EditableField, string | null> } | { error: string } {
  const values = {} as Record<EditableField, string | null>;

  for (const field of EDITABLE_FIELDS) {
    const raw = readField(formData, field);

    if (raw.length > FIELD_LIMITS[field]) {
      return { error: `El campo "${field}" supera los ${FIELD_LIMITS[field]} caracteres.` };
    }

    values[field] = raw || null;
  }

  if (!values.name || values.name.length < 2) {
    return { error: "El nombre del negocio debe tener al menos 2 caracteres." };
  }

  if (values.category && !(CATEGORIES as readonly string[]).includes(values.category)) {
    return { error: "Elige una categoría de la lista." };
  }

  if (values.whatsapp) {
    const digits = values.whatsapp.replace(/\D/g, "");
    if (digits.length !== 10 && !(digits.length === 12 && digits.startsWith("52"))) {
      return { error: "El WhatsApp debe tener 10 dígitos (por ejemplo, 5512345678)." };
    }
    values.whatsapp = digits;
  }

  if (values.phone) {
    const digits = values.phone.replace(/[^\d+]/g, "");
    if (digits.replace(/\D/g, "").length < 8) {
      return { error: "El teléfono no parece válido." };
    }
    values.phone = digits;
  }

  if (values.email_public && !EMAIL_PATTERN.test(values.email_public)) {
    return { error: "El email público no es válido." };
  }

  if (values.website) {
    const normalized = normalizeWebsite(values.website);
    if (!normalized) {
      return { error: "El sitio web debe ser una dirección http(s) válida." };
    }
    values.website = normalized;
  }

  for (const network of ["instagram", "facebook", "tiktok"] as const) {
    const value = values[network];
    if (!value) continue;
    const handle = value.replace(/^@/, "");
    if (!HANDLE_PATTERN.test(handle)) {
      return { error: `El usuario de ${network} solo puede tener letras, números, puntos, guiones y guiones bajos.` };
    }
    values[network] = handle;
  }

  if (values.maps_url) {
    const normalized = normalizeWebsite(values.maps_url);
    if (!normalized) {
      return { error: "El enlace de Google Maps no es válido." };
    }
    values.maps_url = normalized;
  }

  return { values };
}

export async function updateProfile(
  _previous: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Tu sesión expiró. Vuelve a ingresar." };
  }

  const validation = validateProfile(formData);

  if ("error" in validation) {
    return { error: validation.error };
  }

  const supabase = createServerSupabaseClient();
  const { data: updated, error } = await supabase
    .from("businesses")
    .update(validation.values)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Error al guardar el perfil:", error);
    return { error: "No se pudo guardar. Inténtalo de nuevo." };
  }

  if (!updated) {
    return { error: "No encontramos un negocio ligado a tu cuenta." };
  }

  revalidatePath("/mi-negocio");
  revalidatePath("/");
  revalidatePath(`/business/${updated.id}`);

  return { success: true };
}
