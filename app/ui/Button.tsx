import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

/**
 * `primary` azul (pagar, ocupar, subir), `secondary` con borde de 2px (ver,
 * volver, cancelar), `ghost` texto discreto (cerrar sesión), `link` enlace en
 * línea dentro de un párrafo.
 * `accent` y `outline` son alias de `primary` y `secondary`.
 */
export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "link" | "accent" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const ALIASES: Partial<Record<ButtonVariant, ButtonVariant>> = {
  accent: "primary",
  outline: "secondary",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-press",
  secondary:
    "rule border bg-transparent text-ink hover:bg-ink hover:text-bg hover:border-ink",
  ghost: "text-muted hover:text-accent",
  link: "text-accent-press hover:text-accent underline-offset-2 hover:underline",
  accent: "",
  outline: "",
};

/* El secundario lleva borde de 2px: se le restan 2px de padding para que mida
   lo mismo que el primario. */
const SIZES: Record<ButtonSize, { primary: string; secondary: string }> = {
  sm: {
    primary: "px-[18px] py-[11px] text-[12px]",
    secondary: "px-4 py-[9px] text-[12px]",
  },
  md: {
    primary: "px-[26px] py-[15px] text-[13px]",
    secondary: "px-6 py-[13px] text-[13px]",
  },
  lg: {
    primary: "px-7 py-[18px] text-[13px]",
    secondary: "px-[26px] py-4 text-[13px]",
  },
};

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ocupa todo el ancho disponible. El label sigue al ras izquierdo. */
  block?: boolean;
  className?: string;
  children: ReactNode;
};

type AsButton = BaseProps &
  Omit<ComponentProps<"button">, keyof BaseProps> & { href?: undefined };

type AsLink = BaseProps &
  Omit<ComponentProps<typeof Link>, keyof BaseProps> & { href: string };

export type ButtonProps = AsButton | AsLink;

/**
 * Botón o enlace con el mismo aspecto. Si recibe `href` renderiza un
 * `next/link`; si no, un `<button>` nativo (con el `type` por defecto del
 * navegador, así sirve como submit dentro de formularios).
 */
export function Button(props: ButtonProps) {
  const {
    variant: rawVariant = "primary",
    size = "md",
    block = false,
    className,
    children,
    ...rest
  } = props;

  const variant = ALIASES[rawVariant] ?? rawVariant;
  const isText = variant === "ghost" || variant === "link";

  const classes = cn(
    "inline-flex items-center justify-start gap-2 text-left font-bold uppercase tracking-[0.08em]",
    "transition-[background-color,color] duration-[120ms] ease-linear",
    "disabled:cursor-not-allowed disabled:bg-surface disabled:text-faint disabled:opacity-45",
    VARIANTS[variant],
    isText
      ? size === "sm"
        ? "text-[12px]"
        : "text-[13px]"
      : SIZES[size][variant === "secondary" ? "secondary" : "primary"],
    variant === "link" && "normal-case tracking-normal font-bold",
    block && "flex w-full",
    className,
  );

  if (rest.href !== undefined) {
    return (
      <Link {...(rest as Omit<AsLink, keyof BaseProps>)} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button {...(rest as Omit<AsButton, keyof BaseProps>)} className={classes}>
      {children}
    </button>
  );
}

type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  /** Nombre accesible obligatorio: el botón solo muestra un icono. */
  label: string;
  children: ReactNode;
};

/** Botón cuadrado de 46px con borde de 2px, solo icono. */
export function IconButton({
  label,
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cn(
        "rule text-ink grid h-[46px] w-[46px] shrink-0 place-items-center border bg-transparent",
        "hover:bg-ink hover:text-bg transition-[background-color,color] duration-[120ms] ease-linear",
        "disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
    >
      {children}
    </button>
  );
}
