import { LoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-widest text-sky-500">
          EL N1
        </p>
        <h1 className="mt-2 text-3xl font-black">Administración</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Ingresa para gestionar el ranking.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
