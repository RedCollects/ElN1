import type { ReactNode } from "react";
import { cn } from "./cn";

type EyebrowProps = {
  tone?: "brand" | "muted" | "light";
  size?: "sm" | "xs";
  className?: string;
  children: ReactNode;
};

const EYEBROW_TONES = {
  brand: "text-brand-500",
  muted: "text-neutral-400",
  light: "text-white/80",
};

/** Texto pequeño en mayúsculas sobre un título ("Ranking actual", "Posición #3"). */
export function Eyebrow({ tone = "brand", size = "sm", className, children }: EyebrowProps) {
  return (
    <p
      className={cn(
        "font-bold uppercase",
        size === "sm" ? "text-sm tracking-[0.25em]" : "text-xs tracking-wider",
        EYEBROW_TONES[tone],
        className
      )}
    >
      {children}
    </p>
  );
}

type HeadingSize = "display" | "xl" | "lg" | "md" | "sm";

const HEADING_SIZES: Record<HeadingSize, string> = {
  display: "text-5xl font-black tracking-tight sm:text-7xl",
  xl: "text-4xl font-black tracking-tight sm:text-5xl",
  lg: "text-3xl font-black",
  md: "text-2xl font-black",
  sm: "text-xl font-black",
};

type HeadingProps = {
  as?: "h1" | "h2" | "h3";
  size?: HeadingSize;
  className?: string;
  children: ReactNode;
};

/** Títulos. El nivel semántico (`as`) es independiente del tamaño. */
export function Heading({ as: Tag = "h2", size = "lg", className, children }: HeadingProps) {
  return (
    <Tag className={cn(HEADING_SIZES[size], "text-neutral-950", className)}>{children}</Tag>
  );
}

type TextProps = { className?: string; children: ReactNode };

/** Párrafo introductorio grande bajo un título. */
export function Lead({ className, children }: TextProps) {
  return <p className={cn("text-lg leading-8 text-neutral-500", className)}>{children}</p>;
}

/** Texto secundario pequeño. */
export function Muted({ className, children }: TextProps) {
  return <p className={cn("text-sm text-neutral-500", className)}>{children}</p>;
}
