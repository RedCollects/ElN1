"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "./cn";

type NavLinkProps = {
  href: string;
  /** Activo también en rutas hijas (`/mi-negocio/...`). */
  prefix?: boolean;
  className?: string;
  children: ReactNode;
};

/** Enlace de la nav: 12px en mayúsculas; el activo va en azul a sangre. */
export function NavLink({
  href,
  prefix = false,
  className,
  children,
}: NavLinkProps) {
  const pathname = usePathname();
  const active = prefix ? pathname.startsWith(href) : pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "px-[14px] py-2 text-[12px] font-bold tracking-[0.08em] uppercase transition-colors duration-[120ms]",
        active ? "bg-accent text-accent-fg" : "text-muted hover:text-ink",
        className,
      )}
    >
      {children}
    </Link>
  );
}
