"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Input } from "@/app/ui";

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
      <Input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Contraseña"
        aria-label="Contraseña"
        autoComplete="current-password"
        required
        className="mt-0"
      />

      {error && (
        <Alert tone="error" compact>
          {error}
        </Alert>
      )}

      <Button type="submit" block disabled={loading}>
        {loading ? "VALIDANDO..." : "ENTRAR"}
      </Button>
    </form>
  );
}
