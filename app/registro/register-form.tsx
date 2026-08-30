"use client";

import { useActionState } from "react";
import { signUp, type AuthState } from "@/app/auth/actions";
import Link from "next/link";
import { Alert, Button, Field, Input } from "@/app/ui";

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signUp,
    {},
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <Field label="Nombre de tu negocio">
        <Input
          name="businessName"
          required
          minLength={2}
          maxLength={60}
          placeholder="Ej. Tacos Doña Lupita"
        />
      </Field>

      <Field label="Correo electrónico">
        <Input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
        />
      </Field>

      <Field label="Contraseña">
        <Input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
        />
      </Field>

      <label className="text-ink flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="acceptTerms"
          required
          className="border-rule bg-bg checked:bg-accent focus-visible:outline-accent mt-1 h-4 w-4 shrink-0 appearance-none border-2 checked:shadow-[inset_0_0_0_3px_var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        <span>
          Acepto los{" "}
          <Link
            href="/terminos"
            target="_blank"
            className="text-accent-press underline"
          >
            Términos y condiciones
          </Link>{" "}
          y el{" "}
          <Link
            href="/privacidad"
            target="_blank"
            className="text-accent-press underline"
          >
            Aviso de privacidad
          </Link>
          .
        </span>
      </label>

      {state.error && (
        <Alert tone="error" compact>
          {state.error}
        </Alert>
      )}

      {state.notice && (
        <Alert tone="info" compact>
          {state.notice}
        </Alert>
      )}

      <Button type="submit" block disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
