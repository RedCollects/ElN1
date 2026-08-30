import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";

export type Tone = "info" | "success" | "warning" | "error" | "neutral";

const TONES: Record<Tone, string> = {
  info: "border-accent-300 bg-accent-100 text-accent-press",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-900",
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
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

/** Aviso de estado. Usa `role="alert"` para errores y `role="status"` para el resto. */
export function Alert({
  tone = "info",
  title,
  compact = false,
  closeHref,
  className,
  children,
}: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start justify-between gap-4 border",
        compact ? "px-4 py-3 text-sm" : "p-5",
        TONES[tone],
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {title && (
          <p className={compact ? "font-bold" : "text-lg font-black"}>
            {title}
          </p>
        )}
        {children && (
          <div className={cn("text-sm leading-6", Boolean(title) && "mt-1")}>
            {children}
          </div>
        )}
      </div>

      {closeHref && (
        <Link
          href={closeHref}
          aria-label="Cerrar aviso"
          className="shrink-0 text-2xl leading-none opacity-60 hover:opacity-100"
        >
          ×
        </Link>
      )}
    </div>
  );
}
