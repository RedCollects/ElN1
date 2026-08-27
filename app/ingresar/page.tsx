import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "../auth/AuthShell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Ingresar | EL N1",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <AuthShell
      title="Ingresar"
      subtitle="Administra tu negocio y tu posición en el ranking."
    >
      {error === "confirmacion" && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          El enlace de confirmación no es válido o ya expiró. Intenta ingresar
          o regístrate de nuevo.
        </p>
      )}

      <LoginForm next={next} />

      <p className="mt-6 text-center text-sm text-neutral-500">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="font-bold text-sky-500">
          Registra tu negocio
        </Link>
      </p>
    </AuthShell>
  );
}
