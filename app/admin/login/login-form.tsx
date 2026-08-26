"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      router.push("/admin");
      return;
    }

    setError("Contraseña incorrecta.");
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Contraseña"
        autoComplete="current-password"
        required
        className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-sky-400"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-neutral-900 px-5 py-3 font-bold text-white disabled:opacity-50"
      >
        {loading ? "VALIDANDO..." : "ENTRAR"}
      </button>
    </form>
  );
}
