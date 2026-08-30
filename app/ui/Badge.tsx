import type { ReactNode } from "react";
import type { Tone } from "./Alert";
import { cn } from "./cn";

const TONES: Record<Tone, string> = {
  info: "bg-accent-200 text-accent-press",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
  neutral: "bg-neutral-100 text-neutral-600",
};

type BadgeProps = {
  tone?: Tone;
  className?: string;
  children: ReactNode;
};

/** Etiqueta pequeña de estado (Publicado, Borrador, Posición #3). */
export function Badge({ tone = "neutral", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-1 text-xs font-bold tracking-wider uppercase",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
