import { formatPrice } from "@/lib/format";
import { cn } from "./cn";

type PriceSize = "sm" | "md" | "lg" | "xl";

/* Por debajo de 24px el azul de acento no tiene contraste de texto: se usa
   accent-press. A partir de 24px puede ir en accent. */
const SIZES: Record<PriceSize, { text: string; accent: string }> = {
  sm: { text: "text-base", accent: "text-accent-press" },
  md: { text: "text-2xl", accent: "text-accent" },
  lg: { text: "text-[30px]", accent: "text-accent" },
  xl: { text: "text-[40px]", accent: "text-accent" },
};

type PriceProps = {
  value: number | string | null | undefined;
  size?: PriceSize;
  /** Color: azul (por defecto) o tinta. `brand` es alias de `accent`. */
  tone?: "accent" | "ink" | "brand";
  className?: string;
};

/** Cantidad en MXN como cifra tabular. */
export function Price({
  value,
  size = "md",
  tone = "accent",
  className,
}: PriceProps) {
  return (
    <span
      className={cn(
        "figure",
        SIZES[size].text,
        tone === "ink" ? "text-ink" : SIZES[size].accent,
        className,
      )}
    >
      {formatPrice(value)}
    </span>
  );
}
