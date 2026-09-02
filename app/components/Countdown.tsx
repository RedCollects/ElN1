"use client";

import { useEffect, useState } from "react";

function remainingSeconds(until: string) {
  return Math.max(
    0,
    Math.floor((new Date(until).getTime() - Date.now()) / 1000),
  );
}

export function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

/** Cuenta regresiva m:ss hasta `until` (ISO). Se actualiza cada segundo. */
export function Countdown({ until }: { until: string }) {
  const [seconds, setSeconds] = useState(() => remainingSeconds(until));

  useEffect(() => {
    const timer = setInterval(() => setSeconds(remainingSeconds(until)), 1000);
    return () => clearInterval(timer);
  }, [until]);

  return (
    <span suppressHydrationWarning className="tabular-nums">
      {formatCountdown(seconds)}
    </span>
  );
}
