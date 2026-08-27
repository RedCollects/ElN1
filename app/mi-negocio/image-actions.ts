"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../../lib/supabase-auth";
import { createServerSupabaseClient } from "../../lib/supabase-server";
import { processImage } from "../../lib/images-server";
import {
  ACCEPTED_IMAGE_TYPES,
  IMAGE_SPECS,
  MEDIA_BUCKET,
  imageColumn,
  storagePathFromUrl,
  type ImageKind,
} from "../../lib/image-specs";

export type ImageState = {
  error?: string;
  success?: boolean;
};

async function loadOwnBusiness(userId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id, logo_url, cover_url")
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return { supabase, business: data };
}

async function removeStoredObject(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  url: string | null
) {
  const path = url ? storagePathFromUrl(url) : null;

  if (path) {
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  }
}

function revalidateBusiness(businessId: string) {
  revalidatePath("/mi-negocio");
  revalidatePath("/");
  revalidatePath(`/business/${businessId}`);
}

export async function uploadImage(
  kind: ImageKind,
  _previous: ImageState,
  formData: FormData
): Promise<ImageState> {
  const spec = IMAGE_SPECS[kind];

  if (!spec) {
    return { error: "Tipo de imagen no válido." };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { error: "Tu sesión expiró. Vuelve a ingresar." };
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elige una imagen." };
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { error: "Solo se aceptan imágenes JPG, PNG o WebP." };
  }

  if (file.size > spec.maxBytes) {
    return { error: `La imagen supera los ${spec.maxBytes / 1024 / 1024} MB permitidos.` };
  }

  const { supabase, business } = await loadOwnBusiness(user.id);

  if (!business) {
    return { error: "No encontramos un negocio ligado a tu cuenta." };
  }

  let processed: Buffer;

  try {
    processed = await processImage(kind, Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    console.error("Error al procesar imagen:", error);
    return { error: "No pudimos procesar la imagen. Prueba con otro archivo." };
  }

  const path = `${business.id}/${kind}-${Date.now()}.webp`;
  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, processed, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    console.error("Error al subir imagen:", uploadError);
    return { error: "No se pudo subir la imagen. Inténtalo de nuevo." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

  const column = imageColumn(kind);
  const { error: updateError } = await supabase
    .from("businesses")
    .update({ [column]: publicUrl })
    .eq("id", business.id)
    .eq("owner_id", user.id);

  if (updateError) {
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    console.error("Error al guardar la URL de la imagen:", updateError);
    return { error: "No se pudo guardar la imagen. Inténtalo de nuevo." };
  }

  await removeStoredObject(supabase, business[column]);
  revalidateBusiness(business.id);

  return { success: true };
}

export async function removeImage(kind: ImageKind): Promise<ImageState> {
  if (!IMAGE_SPECS[kind]) {
    return { error: "Tipo de imagen no válido." };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { error: "Tu sesión expiró. Vuelve a ingresar." };
  }

  const { supabase, business } = await loadOwnBusiness(user.id);

  if (!business) {
    return { error: "No encontramos un negocio ligado a tu cuenta." };
  }

  const column = imageColumn(kind);
  const { error } = await supabase
    .from("businesses")
    .update({ [column]: null })
    .eq("id", business.id)
    .eq("owner_id", user.id);

  if (error) {
    console.error("Error al quitar imagen:", error);
    return { error: "No se pudo quitar la imagen." };
  }

  await removeStoredObject(supabase, business[column]);
  revalidateBusiness(business.id);

  return { success: true };
}
