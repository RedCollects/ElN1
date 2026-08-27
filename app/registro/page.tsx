import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "../auth/AuthShell";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Registra tu negocio | EL N1",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthShell
      title="Registra tu negocio"
      subtitle="Crea tu cuenta, completa tu perfil y elige tu posición en el ranking."
    >
      <RegisterForm next={next} />

      <p className="mt-6 text-center text-sm text-neutral-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/ingresar" className="font-bold text-sky-500">
          Ingresar
        </Link>
      </p>
    </AuthShell>
  );
}
