import Link from "next/link";
import { SEAL } from "@/lib/brand";
import { cn } from "./cn";

export type SealTone = "ink" | "paper" | "accent";

const SEAL_TONES: Record<
  SealTone,
  { ring: string; text: string; fill?: string }
> = {
  /** Tinta sobre fondo claro (uso por defecto). */
  ink: { ring: "var(--color-ink)", text: "var(--color-ink)" },
  /** Claro sobre fondo de tinta o de acento. */
  paper: { ring: "var(--color-accent-fg)", text: "var(--color-accent-fg)" },
  /** Disco azul relleno con "N1" claro (marca de la nav). */
  accent: {
    ring: "none",
    text: "var(--color-accent-fg)",
    fill: "var(--color-accent)",
  },
};

type SealProps = {
  /** Lado en px. Mínimo 24. */
  size?: number;
  tone?: SealTone;
  className?: string;
};

/**
 * Sello circular "N1" — anillo troquelado con el nombre en Archivo 900.
 * Es la única forma redonda permitida en la interfaz. Nunca lleva degradado,
 * sombra ni rotación, y no se pone en azul sobre fondo azul.
 */
export function Seal({ size = 34, tone = "ink", className }: SealProps) {
  const { ring, text, fill } = SEAL_TONES[tone];
  const c = SEAL.viewBox / 2;
  const px = Math.max(size, SEAL.minSize);
  // En tamaños chicos el anillo se engrosa (como el lockup del catálogo: 7 a 44px).
  const strokeWidth = px <= 48 ? 7 : SEAL.strokeWidth;

  return (
    <svg
      viewBox={`0 0 ${SEAL.viewBox} ${SEAL.viewBox}`}
      width={px}
      height={px}
      role="img"
      aria-label="EL N1"
      className={cn("block shrink-0", className)}
    >
      {fill ? (
        <circle cx={c} cy={c} r={c} fill={fill} />
      ) : (
        <circle
          cx={c}
          cy={c}
          r={SEAL.radius}
          fill="none"
          stroke={ring}
          strokeWidth={strokeWidth}
          strokeDasharray={SEAL.dash}
          strokeLinecap="butt"
        />
      )}
      <text
        x={c}
        y={c}
        textAnchor="middle"
        dominantBaseline="central"
        fill={text}
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 900,
          fontSize: SEAL.fontSize,
          letterSpacing: SEAL.letterSpacing,
        }}
      >
        N1
      </text>
    </svg>
  );
}

type LogoProps = {
  /** `null` para que no sea enlace (p. ej. dentro de un `<h1>`). */
  href?: string | null;
  /** Alto del sello en px; el wordmark escala con él. */
  size?: number;
  tone?: SealTone;
  /** Solo el sello, sin "EL N1" al lado. */
  compact?: boolean;
  className?: string;
};

/** Lockup horizontal: sello + wordmark "EL N1", alineados al centro, gap 10px. */
export function Logo({
  href = "/",
  size = 34,
  tone = "ink",
  compact = false,
  className,
}: LogoProps) {
  const wordmarkColor = tone === "ink" ? "text-ink" : "text-accent-fg";
  const classes = cn(
    "inline-flex items-center gap-2.5 whitespace-nowrap",
    wordmarkColor,
    className,
  );

  const content = (
    <>
      <Seal size={size} tone={tone} />
      {!compact && (
        <span
          className="leading-none font-extrabold tracking-[-0.02em]"
          style={{ fontSize: Math.round(size * 0.5) }}
        >
          EL N1
        </span>
      )}
    </>
  );

  return href ? (
    <Link href={href} aria-label="EL N1, ir al inicio" className={classes}>
      {content}
    </Link>
  ) : (
    <span className={classes}>{content}</span>
  );
}
