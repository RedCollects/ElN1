"use client";

import { useEffect, useState } from "react";
import { Icon, LiveDot } from "@/app/ui";

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

const fmt = (value: number) => value.toLocaleString("es-MX");

/* Los tokens de color se redefinen bajo [data-theme="dark"] en globals.css. */
function applyTheme(dark: boolean) {
  if (dark) document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
}

export default function SiteExperience({
  initialStats,
}: {
  initialStats: Stats;
}) {
  const [stats, setStats] = useState(initialStats);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("eln1-theme");
    const useDark =
      savedTheme === "dark" ||
      (!savedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    applyTheme(useDark);
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
    applyTheme(nextTheme);
    window.localStorage.setItem("eln1-theme", nextTheme ? "dark" : "light");
  }

  return (
    <div className="flex items-center gap-4">
      <LiveDot>
        <span className="tabular-nums">{fmt(stats.online)}</span>
        <span className="hidden lg:inline">en línea</span>
      </LiveDot>
      <span className="label text-faint hidden tabular-nums xl:inline">
        {fmt(stats.today)} hoy · {fmt(stats.total)} en total
      </span>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={dark ? "Activar modo claro" : "Activar modo nocturno"}
        className="border-rule text-ink hover:bg-ink hover:text-bg grid h-9 w-9 place-items-center border-2 transition-colors duration-[120ms]"
      >
        <Icon name={dark ? "sun" : "moon"} size={16} />
      </button>
    </div>
  );
}
