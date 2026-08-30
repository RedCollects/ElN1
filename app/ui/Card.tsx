import type { ReactNode } from "react";
import { cn } from "./cn";

type Padding = "none" | "sm" | "md" | "lg";

const PADDING: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

type CardProps = {
  padding?: Padding;
  /** Fondo `surface` (por defecto) o el fondo de página. */
  tone?: "surface" | "bg";
  /** Se mantiene por compatibilidad; la marca no usa sombras fuera del diálogo. */
  elevated?: boolean;
  className?: string;
  children: ReactNode;
};

/** Superficie con borde de 2px, sin radio ni sombra. */
export function Card({
  padding = "md",
  tone = "surface",
  className,
  children,
}: CardProps) {
  return (
    <div
      className={cn(
        "rule border",
        tone === "surface" ? "bg-surface" : "bg-bg",
        PADDING[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

type CardSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Tarjeta con título separado por una regla de 2px: bloques de un formulario largo. */
export function CardSection({
  title,
  description,
  className,
  children,
}: CardSectionProps) {
  return (
    <section className={cn("rule bg-surface border", className)}>
      <header className="rule border-b px-6 py-5">
        <h2 className="text-[22px] leading-tight font-extrabold tracking-[-0.01em]">
          {title}
        </h2>
        {description && (
          <p className="text-muted mt-1 text-sm">{description}</p>
        )}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}
