"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../../lib/supabase-auth";
import { createServerSupabaseClient } from "../../lib/supabase-server";
import { profileSchema } from "../../lib/schemas";
import { formDataToObject, parseInput } from "../../lib/validation";

export type ProfileState = {
  error?: string;
  success?: boolean;
};

export async function updateProfile(
  _previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Tu sesión expiró. Vuelve a ingresar." };
  }

  const validation = parseInput(profileSchema, formDataToObject(formData));

  if (!validation.ok) {
    return { error: validation.error };
  }

  const supabase = createServerSupabaseClient();
  const { data: updated, error } = await supabase
    .from("businesses")
    .update(validation.data)
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
