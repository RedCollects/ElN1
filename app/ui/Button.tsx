import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "accent" | "outline" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonShape = "pill" | "rounded";

const VARIANTS: Record<ButtonVariant, string> = {
  /** Acción principal neutra (registro, entrar, guardar). */
  primary: "bg-neutral-900 text-white hover:bg-neutral-700",
  /** Acción de marca (ofertar, pagar, subir al ranking). */
  accent: "bg-brand text-white hover:bg-brand-500",
  /** Acción secundaria con borde. */
  outline: "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100",
  /** Texto discreto (cerrar sesión, ya tengo cuenta). */
  ghost: "text-neutral-500 hover:text-neutral-900",
  /** Enlace en color de marca. */
  link: "text-brand-500 hover:underline",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-5 py-3 text-sm",
  lg: "px-5 py-4 text-base",
};

/** Por convención los botones pequeños son píldora y los grandes rectangulares. */
const DEFAULT_SHAPE: Record<ButtonSize, ButtonShape> = {
  sm: "pill",
  md: "rounded",
  lg: "rounded",
};

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  /** Ocupa todo el ancho disponible. */
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
    variant = "primary",
    size = "md",
    shape = DEFAULT_SHAPE[size],
    block = false,
    className,
    children,
    ...rest
  } = props;

  const isText = variant === "ghost" || variant === "link";

  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-bold transition",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    isText ? (size === "sm" ? "text-xs" : "text-sm") : SIZES[size],
    !isText && (shape === "pill" ? "rounded-full" : "rounded-xl"),
    block && "flex w-full",
    className
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
