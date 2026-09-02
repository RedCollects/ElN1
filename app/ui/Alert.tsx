import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";
import { Icon } from "./Icon";

/**
 * La marca no tiene colores semánticos. `accent` (borde azul, título en azul
 * de párrafo) para lo que pide atención o acción; `neutral` (borde de tinta)
 * para lo informativo. Los tonos viejos se traducen: `error`/`warning`/`info`
 * → `accent`, `success` → `neutral`.
 */
export type Tone =
  "accent" | "neutral" | "info" | "success" | "warning" | "error";

const TONES: Record<Tone, { box: string; title: string }> = {
  accent: { box: "border-accent", title: "text-accent-press" },
  neutral: { box: "border-rule", title: "text-ink" },
  info: { box: "border-accent", title: "text-accent-press" },
  warning: { box: "border-accent", title: "text-accent-press" },
  error: { box: "border-accent", title: "text-accent-press" },
  success: { box: "border-rule", title: "text-ink" },
};

type AlertProps = {
  tone?: Tone;
  title?: ReactNode;
  /** Versión pequeña para mensajes dentro de formularios. */
  compact?: boolean;
  /** Enlace que cierra el aviso (p. ej. la misma página sin query). */
  closeHref?: string;
  className?: string;
  children?: ReactNode;
};

/** Aviso con borde de 2px. `role="alert"` para errores y `role="status"` para el resto. */
export function Alert({
  tone = "accent",
  title,
  compact = false,
  closeHref,
  className,
  children,
}: AlertProps) {
  const styles = TONES[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "bg-bg flex items-start justify-between gap-4 border-2",
        compact ? "px-4 py-3 text-sm" : "p-5",
        styles.box,
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {title && (
          <p
            className={cn(
              compact
                ? "font-bold"
                : "text-[22px] leading-tight font-extrabold tracking-[-0.01em]",
              styles.title,
            )}
          >
            {title}
          </p>
        )}
        {children && (
          <div
            className={cn(
              "text-ink text-sm leading-6",
              Boolean(title) && "mt-1",
            )}
          >
            {children}
          </div>
        )}
      </div>

      {closeHref && (
        <Link
          href={closeHref}
          aria-label="Cerrar aviso"
          className="text-muted hover:text-ink shrink-0"
        >
          <Icon name="x" size={18} />
        </Link>
      )}
    </div>
  );
}
