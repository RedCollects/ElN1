"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "../auth/actions";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "../auth/AuthShell";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signIn,
    {}
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <label className={labelClassName}>
        Correo electrónico
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className={inputClassName}
        />
      </label>

      <label className={labelClassName}>
        Contraseña
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className={inputClassName}
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButtonClassName}>
        {pending ? "VALIDANDO..." : "ENTRAR"}
      </button>
    </form>
  );
}
