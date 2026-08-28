import AuthShell from "@/app/auth/AuthShell";
import { LoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <AuthShell
      title="Administración"
      subtitle="Ingresa para gestionar el ranking."
    >
      <LoginForm />
    </AuthShell>
  );
}
