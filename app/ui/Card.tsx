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
  /** Sombra suave (paneles de auth, página pública). */
  elevated?: boolean;
  className?: string;
  children: ReactNode;
};

/** Superficie blanca con borde y esquinas redondeadas. */
export function Card({ padding = "md", elevated = false, className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200 bg-white",
        PADDING[padding],
        elevated && "shadow-sm",
        className
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

/** Tarjeta con título: bloques de un formulario largo. */
export function CardSection({ title, description, className, children }: CardSectionProps) {
  return (
    <section className={cn("rounded-2xl border border-neutral-200 bg-white p-6", className)}>
      <h2 className="text-xl font-black">{title}</h2>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
