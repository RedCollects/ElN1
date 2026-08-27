"use client";

import { useActionState } from "react";
import { signUp, type AuthState } from "../auth/actions";
import { Alert, Button, Field, Input } from "@/app/ui";

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});

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
        {pending ? "CREANDO CUENTA..." : "CREAR CUENTA"}
      </Button>
    </form>
  );
}
