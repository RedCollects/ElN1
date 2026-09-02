import "server-only";

import { createServerSupabaseClient } from "./supabase-server";

/**
 * Activa o desactiva un negocio. Al reactivar, si otro negocio ocupa ya su
 * posición, se reactiva sin posición para no violar el índice único.
 */
export async function setBusinessActive(id: string, active: boolean) {
  const supabase = createServerSupabaseClient();
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("position")
    .eq("id", id)
    .single();

  if (businessError || !business) throw new Error("Negocio no encontrado.");

  let position = business.position;

  if (active && position) {
    const { data: occupant, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("active", true)
      .eq("position", position)
      .neq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (occupant) position = null;
  }

  const { error } = await supabase
    .from("businesses")
    .update({ active, position })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
