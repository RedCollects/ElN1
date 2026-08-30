import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";
import { Logo } from "./Logo";

type Width = "wide" | "content" | "narrow" | "form";

const WIDTHS: Record<Width, string> = {
  wide: "max-w-[1320px]",
  content: "max-w-[960px]",
  narrow: "max-w-[760px]",
  form: "max-w-[420px]",
};

type ContainerProps = {
  width?: Width;
  className?: string;
  children: ReactNode;
};

/** Centra el contenido con el ancho estándar y el padding lateral de la app. */
export function Container({
  width = "wide",
  className,
  children,
}: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-8", WIDTHS[width], className)}
    >
      {children}
    </div>
  );
}

type PageShellProps = {
  /** Se mantiene por compatibilidad: la app tiene un solo fondo (`bg`). */
  tone?: "white" | "muted";
  /** Centra vertical y horizontalmente el contenido (auth, errores). */
  centered?: boolean;
  className?: string;
  children: ReactNode;
};

/** `<main>` de cada página. */
export function PageShell({
  centered = false,
  className,
  children,
}: PageShellProps) {
  return (
    <main
      className={cn(
        "bg-bg text-ink flex min-h-screen flex-1 flex-col",
        centered && "items-center justify-center px-4 py-12 sm:px-8",
        className,
      )}
    >
      {children}
    </main>
  );
}

type SiteHeaderProps = {
  /** Contenido a la derecha del logo (navegación, sesión). */
  children?: ReactNode;
  /** Texto junto al logo (p. ej. "Panel administrador"). */
  subtitle?: ReactNode;
};

/** Nav de 68px a todo el ancho con regla inferior de 2px. */
export function SiteHeader({ children, subtitle }: SiteHeaderProps) {
  return (
    <header className="rule border-b">
      <Container className="flex h-[68px] items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <Logo />
          {subtitle && (
            <p className="label text-muted hidden truncate sm:block">
              {subtitle}
            </p>
          )}
        </div>

        {children && <nav className="flex items-center gap-2">{children}</nav>}
      </Container>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="rule mt-auto border-t">
      <Container className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-8">
        <p className="label text-faint">EL N1 — México</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/como-funciona" className="text-muted hover:text-ink">
            Cómo funciona
          </Link>
          <Link href="/terminos" className="text-muted hover:text-ink">
            Términos y condiciones
          </Link>
          <Link href="/responsiva" className="text-muted hover:text-ink">
            Carta responsiva
          </Link>
        </div>
      </Container>
    </footer>
  );
}

type EmptyStateProps = {
  title: ReactNode;
  tone?: "neutral" | "error";
  /** Botón o enlace bajo el texto. */
  action?: ReactNode;
  children?: ReactNode;
};

/** Mensaje para páginas vacías o con error, al ras izquierdo. */
export function EmptyState({
  title,
  tone = "neutral",
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="w-full max-w-[520px]">
      <h1
        className={cn(
          "text-[34px] leading-[1.1] font-extrabold tracking-[-0.02em]",
          tone === "error" ? "text-accent-press" : "text-ink",
        )}
      >
        {title}
      </h1>
      {children && (
        <div className="text-muted mt-3 text-base leading-relaxed">
          {children}
        </div>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
