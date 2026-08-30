import { formatPrice } from "@/lib/format";
import { cn } from "./cn";

type PriceSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<PriceSize, string> = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

type PriceProps = {
  value: number | string | null | undefined;
  size?: PriceSize;
  /** Color: marca (por defecto) o tinta neutra. */
  tone?: "accent" | "ink";
  className?: string;
};

/** Cantidad en MXN con la tipografía de la app. */
export function Price({
  value,
  size = "md",
  tone = "accent",
  className,
}: PriceProps) {
  return (
    <span
      className={cn(
        "font-black",
        SIZES[size],
        tone === "accent" ? "text-accent-press" : "text-neutral-950",
        className,
      )}
    >
      {formatPrice(value)}
    </span>
  );
}
