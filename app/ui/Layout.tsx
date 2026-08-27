import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";

type Width = "wide" | "content" | "narrow" | "form";

const WIDTHS: Record<Width, string> = {
  wide: "max-w-6xl",
  content: "max-w-4xl",
  narrow: "max-w-3xl",
  form: "max-w-sm",
};

type ContainerProps = { width?: Width; className?: string; children: ReactNode };

/** Centra el contenido con el ancho estándar y el padding lateral de la app. */
export function Container({ width = "wide", className, children }: ContainerProps) {
  return <div className={cn("mx-auto w-full px-6", WIDTHS[width], className)}>{children}</div>;
}

type PageShellProps = {
  /** Fondo blanco (portada) o gris (paneles, auth). */
  tone?: "white" | "muted";
  /** Centra vertical y horizontalmente (auth, errores). */
  centered?: boolean;
  className?: string;
  children: ReactNode;
};

/** `<main>` de cada página. */
export function PageShell({
  tone = "white",
  centered = false,
  className,
  children,
}: PageShellProps) {
  return (
    <main
      className={cn(
        "flex min-h-screen flex-1 flex-col text-neutral-900",
        tone === "white" ? "bg-white" : "bg-neutral-50",
        centered && "items-center justify-center px-6 py-12",
        className
      )}
    >
      {children}
    </main>
  );
}

/** Marca "EL N1". Con `href={null}` no es enlace. */
export function Logo({ href = "/", className }: { href?: string | null; className?: string }) {
  const classes = cn("text-2xl font-black tracking-tight text-neutral-950", className);
  const mark = (
    <>
      EL <span className="text-brand">N1</span>
    </>
  );

  return href ? (
    <Link href={href} className={classes}>
      {mark}
    </Link>
  ) : (
    <div className={classes}>{mark}</div>
  );
}

type SiteHeaderProps = {
  /** Contenido a la derecha del logo (navegación, sesión). */
  children?: ReactNode;
  /** Texto bajo el logo (p. ej. "Panel administrador"). */
  subtitle?: ReactNode;
};

/** Cabecera común: logo a la izquierda, acciones a la derecha. */
export function SiteHeader({ children, subtitle }: SiteHeaderProps) {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <Container className="flex items-center justify-between gap-4 py-5">
        <div>
          <Logo />
          {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
        </div>

        {children && (
          <nav className="flex items-center gap-2 text-sm font-medium">{children}</nav>
        )}
      </Container>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-neutral-200 py-8 text-center text-sm text-neutral-400">
      <p>EL N1 — México</p>
      <div className="mt-2 flex justify-center gap-4">
        <Link href="/terminos" className="underline hover:text-neutral-600">
          Términos y condiciones
        </Link>
        <Link href="/responsiva" className="underline hover:text-neutral-600">
          Carta responsiva
        </Link>
      </div>
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

/** Mensaje centrado para páginas vacías o con error. */
export function EmptyState({ title, tone = "neutral", action, children }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1
        className={cn(
          "text-3xl font-black",
          tone === "error" ? "text-red-600" : "text-neutral-950"
        )}
      >
        {title}
      </h1>
      {children && <div className="mt-3 text-sm leading-6 text-neutral-500">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
