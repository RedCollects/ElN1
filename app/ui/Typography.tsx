import type { CSSProperties, ReactNode } from "react";
import { cn } from "./cn";

/** `light` es alias de `paper` (texto claro sobre azul o tinta). */
type EyebrowTone = "accent" | "muted" | "faint" | "paper" | "light";

type EyebrowProps = {
  tone?: EyebrowTone;
  /** Se mantiene por compatibilidad; la etiqueta tiene un solo tamaño (11px). */
  size?: "sm" | "xs";
  className?: string;
  children: ReactNode;
};

const EYEBROW_TONES: Record<EyebrowTone, string> = {
  accent: "text-accent-press",
  muted: "text-muted",
  faint: "text-faint",
  paper: "text-accent-fg",
  light: "text-accent-fg",
};

/** Kicker de 11px en mayúsculas sobre un título ("Tu posición ahora", "Ranking en vivo"). */
export function Eyebrow({
  tone = "accent",
  className,
  children,
}: EyebrowProps) {
  return (
    <p className={cn("label", EYEBROW_TONES[tone], className)}>{children}</p>
  );
}

/** `xl` es alias de `title`. */
type HeadingSize = "display" | "title" | "xl" | "h2" | "lg" | "md" | "sm";

const HEADING_SIZES: Record<HeadingSize, string> = {
  display:
    "text-[clamp(40px,5.5vw,68px)] font-extrabold tracking-[-0.03em] leading-[0.92]",
  title: "text-[34px] font-extrabold tracking-[-0.02em] leading-[1.1]",
  xl: "text-[34px] font-extrabold tracking-[-0.02em] leading-[1.1]",
  h2: "text-[22px] font-extrabold tracking-[-0.01em] leading-[1.2]",
  lg: "text-[28px] font-extrabold tracking-[-0.02em] leading-[1.1]",
  md: "text-[22px] font-extrabold tracking-[-0.01em] leading-[1.2]",
  sm: "text-[18px] font-extrabold tracking-[-0.01em] leading-[1.2]",
};

type HeadingProps = {
  as?: "h1" | "h2" | "h3";
  size?: HeadingSize;
  className?: string;
  children: ReactNode;
};

/** Títulos. El nivel semántico (`as`) es independiente del tamaño. */
export function Heading({
  as: Tag = "h2",
  size = "lg",
  className,
  children,
}: HeadingProps) {
  return (
    <Tag className={cn(HEADING_SIZES[size], "text-ink", className)}>
      {children}
    </Tag>
  );
}

type FigureProps = {
  /** Tamaño en px (30 métricas pequeñas, 40 métricas, 64–120 posición). */
  size?: number;
  tone?: "ink" | "accent" | "paper";
  as?: "span" | "p" | "div";
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

const FIGURE_TONES = {
  ink: "text-ink",
  accent: "text-accent",
  paper: "text-accent-fg",
};

/** Cifra: 900, -0.03em, `tabular-nums`. El azul solo en cifras ≥ 24px. */
export function Figure({
  size = 40,
  tone = "ink",
  as: Tag = "span",
  className,
  style,
  children,
}: FigureProps) {
  return (
    <Tag
      className={cn("figure", FIGURE_TONES[tone], className)}
      style={{ fontSize: size, ...style }}
    >
      {children}
    </Tag>
  );
}

type TextProps = { className?: string; children: ReactNode };

/** Párrafo introductorio bajo un título: 16px / 1.6, gris. */
export function Lead({ className, children }: TextProps) {
  return (
    <p className={cn("text-muted text-base leading-relaxed", className)}>
      {children}
    </p>
  );
}

/** Texto secundario pequeño: 14px. */
export function Muted({ className, children }: TextProps) {
  return <p className={cn("text-muted text-sm", className)}>{children}</p>;
}
