import type { Metadata } from "next";
import AuthShell from "@/app/auth/AuthShell";
import { RegisterForm } from "./register-form";
import { Button, Muted } from "@/app/ui";

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

      <Muted className="mt-6">
        ¿Ya tienes cuenta?{" "}
        <Button href="/ingresar" variant="link">
          Ingresar
        </Button>
      </Muted>
    </AuthShell>
  );
}
