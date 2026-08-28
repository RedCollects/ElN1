"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "@/app/auth/actions";
import { Alert, Button, Field, Input } from "@/app/ui";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signIn,
    {},
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <Field label="Correo electrónico">
        <Input type="email" name="email" required autoComplete="email" />
      </Field>

      <Field label="Contraseña">
        <Input
          type="password"
          name="password"
          required
          autoComplete="current-password"
        />
      </Field>

      {state.error && (
        <Alert tone="error" compact>
          {state.error}
        </Alert>
      )}

      <Button type="submit" block disabled={pending}>
        {pending ? "VALIDANDO..." : "ENTRAR"}
      </Button>
    </form>
  );
}
