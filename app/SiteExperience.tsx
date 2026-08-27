"use client";

import { useEffect, useState } from "react";

type Stats = { today: number; total: number; online: number };

function getSessionId() {
  const key = "eln1-session-id";
  const existing = window.localStorage.getItem(key);

  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  window.localStorage.setItem(key, sessionId);
  return sessionId;
}

export function trackBusinessClick(businessId: string) {
  const sessionId = getSessionId();
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, businessId, event: "business_click" }),
    keepalive: true,
  }).catch(() => undefined);
}

export default function SiteExperience({ initialStats }: { initialStats: Stats }) {
  const [stats, setStats] = useState(initialStats);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("eln1-theme");
    const useDark =
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", useDark);
    const themeFrame = window.requestAnimationFrame(() => setDark(useDark));

    const sessionId = getSessionId();
    const heartbeat = async () => {
      try {
        const response = await fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (response.ok) setStats(await response.json());
      } catch {
        // Las métricas no deben bloquear el uso del ranking.
      }
    };

    void heartbeat();
    const timer = window.setInterval(() => void heartbeat(), 45_000);
    return () => {
      window.cancelAnimationFrame(themeFrame);
      window.clearInterval(timer);
    };
  }, []);

  function toggleTheme() {
    const nextTheme = !dark;
    setDark(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme);
    window.localStorage.setItem("eln1-theme", nextTheme ? "dark" : "light");
  }

  return (
    <div className="flex items-center gap-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">
      <span className="lg:hidden"><b className="text-emerald-500">●</b> {stats.online.toLocaleString("es-MX")}</span>
      <div className="hidden items-center gap-3 lg:flex">
        <span><b className="text-emerald-500">●</b> {stats.online.toLocaleString("es-MX")} en línea</span>
        <span>{stats.today.toLocaleString("es-MX")} visitas hoy</span>
        <span>{stats.total.toLocaleString("es-MX")} históricas</span>
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={dark ? "Activar modo claro" : "Activar modo nocturno"}
        className="rounded-full border border-neutral-200 px-3 py-2 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        {dark ? "☀️" : "🌙"}
      </button>
    </div>
  );
}
