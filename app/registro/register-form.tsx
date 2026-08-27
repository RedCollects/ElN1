"use client";

import { useActionState } from "react";
import { signUp, type AuthState } from "../auth/actions";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "../auth/AuthShell";

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signUp,
    {}
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <label className={labelClassName}>
        Nombre de tu negocio
        <input
          name="businessName"
          required
          minLength={2}
          maxLength={60}
          placeholder="Ej. Tacos Doña Lupita"
          className={inputClassName}
        />
      </label>

      <label className={labelClassName}>
        Correo electrónico
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
          className={inputClassName}
        />
      </label>

      <label className={labelClassName}>
        Contraseña
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          className={inputClassName}
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      {state.notice && (
        <p role="status" className="rounded-xl bg-sky-50 p-3 text-sm text-sky-900">
          {state.notice}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButtonClassName}>
        {pending ? "CREANDO CUENTA..." : "CREAR CUENTA"}
      </button>
    </form>
  );
}
