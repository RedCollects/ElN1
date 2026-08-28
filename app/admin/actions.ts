"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";
import { setBusinessActive } from "@/lib/admin";
import { adminProfileSchema, adminToggleSchema } from "@/lib/schemas";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { formDataToObject, parseInput } from "@/lib/validation";

/** Vuelve al panel con el aviso correspondiente. */
function finish(error?: string): never {
  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin?updated=1");
}

async function requireAdmin() {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }
}

export async function updateBusinessProfile(formData: FormData) {
  await requireAdmin();

  const parsed = parseInput(adminProfileSchema, formDataToObject(formData));

  if (!parsed.ok) {
    finish(parsed.error);
  }

  const { id, ...values } = parsed.data;
  const { error } = await createServerSupabaseClient()
    .from("businesses")
    .update(values)
    .eq("id", id);

  if (error) {
    console.error("Error al guardar el perfil desde /admin:", error);
    finish("No se pudo guardar.");
  }

  revalidatePath(`/business/${id}`);
  finish();
}

export async function toggleBusinessActive(formData: FormData) {
  await requireAdmin();

  const form = formDataToObject(formData);
  const parsed = parseInput(adminToggleSchema, {
    id: form.id,
    active: form.active === "true",
  });

  if (!parsed.ok) {
    finish("Datos inválidos.");
  }

  try {
    await setBusinessActive(parsed.data.id, parsed.data.active);
  } catch (error) {
    finish(error instanceof Error ? error.message : "No se pudo guardar.");
  }

  finish();
}
