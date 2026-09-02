import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Tonos del catálogo: `first` posición #1, `available` disponible, `taken`
 * ocupada, `verified` verificado, `neutral`, `up` / `down` cambio de posición.
 * Los tonos semánticos viejos (`info`, `success`, `warning`, `error`) se
 * traducen: la marca no usa verde/ámbar/rojo.
 */
export type TagTone =
  | "first"
  | "leader"
  | "available"
  | "taken"
  | "verified"
  | "neutral"
  | "up"
  | "down"
  | "info"
  | "success"
  | "warning"
  | "error";

const TONES: Record<TagTone, string> = {
  first: "bg-accent text-accent-fg",
  leader: "bg-accent-fg text-accent",
  available: "bg-accent-200 text-accent-press",
  taken: "bg-ink text-bg",
  verified: "text-ink shadow-[inset_0_0_0_2px_var(--color-rule)]",
  neutral: "bg-neutral-200 text-neutral-800",
  up: "bg-accent-200 text-accent-press",
  down: "bg-neutral-200 text-muted",
  info: "bg-accent-200 text-accent-press",
  success: "bg-ink text-bg",
  warning: "bg-neutral-200 text-neutral-800",
  error: "bg-accent-press text-accent-fg",
};

type TagProps = {
  tone?: TagTone;
  className?: string;
  children: ReactNode;
};

/** Etiqueta de estado: 11px, mayúsculas, sin radio. */
export function Tag({ tone = "neutral", className, children }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-[7px] text-[11px] font-bold tracking-[0.1em] uppercase",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Alias histórico. Usar `Tag`. */
export const Badge = Tag;

type LiveDotProps = { className?: string; children?: ReactNode };

/** Cuadro azul de 8px + etiqueta: "en vivo", "ahora", "reservada". */
export function LiveDot({ className, children }: LiveDotProps) {
  return (
    <span
      className={cn(
        "label text-muted inline-flex items-center gap-[7px]",
        className,
      )}
    >
      <span aria-hidden className="bg-accent block h-2 w-2" />
      {children}
    </span>
  );
}
