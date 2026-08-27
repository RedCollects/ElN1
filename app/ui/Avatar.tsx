import type { ReactNode } from "react";
import { SmartImage } from "../components/SmartImage";
import { cn } from "./cn";

type AvatarSize = "sm" | "md" | "lg";

const SIZES: Record<AvatarSize, { box: string; px: number; fallback: string }> = {
  sm: { box: "h-14 w-14 rounded-xl", px: 56, fallback: "text-lg" },
  md: { box: "h-20 w-20 rounded-2xl border-4 border-white shadow-md", px: 80, fallback: "text-3xl" },
  lg: { box: "h-28 w-28 rounded-3xl border-4 border-white shadow-lg", px: 112, fallback: "text-5xl" },
};

type AvatarProps = {
  src: string | null | undefined;
  alt: string;
  size?: AvatarSize;
  /** Qué mostrar sin imagen (por defecto 🏪). */
  fallback?: ReactNode;
  priority?: boolean;
  className?: string;
};

/** Logo de un negocio con fallback. */
export function Avatar({
  src,
  alt,
  size = "md",
  fallback = "🏪",
  priority,
  className,
}: AvatarProps) {
  const spec = SIZES[size];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-neutral-100 font-black",
        spec.box,
        spec.fallback,
        className
      )}
    >
      {src ? (
        <SmartImage
          src={src}
          alt={alt}
          width={spec.px}
          height={spec.px}
          priority={priority}
          className="h-full w-full object-cover"
        />
      ) : (
        fallback
      )}
    </div>
  );
}
