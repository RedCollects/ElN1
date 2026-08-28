"use server";

import { redirect } from "next/navigation";
import { createAuthSupabaseClient } from "../../lib/supabase-auth";
import { signInSchema, signUpSchema } from "../../lib/schemas";
import { formDataToObject, parseInput } from "../../lib/validation";

export type AuthState = {
  error?: string;
  notice?: string;
};

function safeNextPath(value: FormDataEntryValue | null): string {
  const path = String(value ?? "");
  return path.startsWith("/") && !path.startsWith("//") ? path : "/mi-negocio";
}

function describeAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirma tu correo antes de ingresar: revisa tu bandeja de entrada.";
  }
  if (lower.includes("already registered")) {
    return "Ese correo ya tiene una cuenta. Inicia sesión.";
  }
  if (lower.includes("rate limit")) {
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  }

  return "No se pudo completar la operación. Inténtalo de nuevo.";
}

export async function signUp(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = parseInput(signUpSchema, formDataToObject(formData));

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const { email, password, businessName } = parsed.data;

  const supabase = await createAuthSupabaseClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { business_name: businessName },
      emailRedirectTo: appUrl ? `${appUrl}/auth/confirm` : undefined,
    },
  });

  if (error) {
    return { error: describeAuthError(error.message) };
  }

  // Con confirmación de correo activa, Supabase devuelve un usuario sin
  // identidades cuando el correo ya existía (para no revelar cuentas).
  if (!data.session) {
    return {
      notice:
        "Te enviamos un correo para confirmar tu cuenta. Si ya tenías cuenta con ese correo, inicia sesión.",
    };
  }

  redirect(safeNextPath(formData.get("next")));
}

export async function signIn(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = parseInput(signInSchema, formDataToObject(formData));

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const { email, password } = parsed.data;

  const supabase = await createAuthSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: describeAuthError(error.message) };
  }

  redirect(safeNextPath(formData.get("next")));
}

export async function signOut() {
  const supabase = await createAuthSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}
