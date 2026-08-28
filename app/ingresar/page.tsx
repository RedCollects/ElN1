import type { Metadata } from "next";
import AuthShell from "@/app/auth/AuthShell";
import { LoginForm } from "./login-form";
import { Alert, Button, Muted } from "@/app/ui";

export const metadata: Metadata = {
  title: "Ingresar | EL N1",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; confirmado?: string }>;
}) {
  const { next, error, confirmado } = await searchParams;

  return (
    <AuthShell
      title="Ingresar"
      subtitle="Administra tu negocio y tu posición en el ranking."
    >
      {confirmado && !error && (
        <Alert tone="success" compact className="mt-4">
          Tu correo quedó confirmado. Ingresa con tu contraseña para entrar a tu
          panel.
        </Alert>
      )}

      {error === "confirmacion" && (
        <Alert tone="error" compact className="mt-4">
          El enlace de confirmación no es válido o ya expiró. Intenta ingresar o
          regístrate de nuevo.
        </Alert>
      )}

      <LoginForm next={next} />

      <Muted className="mt-6 text-center">
        ¿Aún no tienes cuenta?{" "}
        <Button href="/registro" variant="link">
          Registra tu negocio
        </Button>
      </Muted>
    </AuthShell>
  );
}
