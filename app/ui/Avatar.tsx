import type { ReactNode } from "react";
import { SmartImage } from "@/app/components/SmartImage";
import { cn } from "./cn";

type AvatarSize = "xs" | "sm" | "md" | "lg";

const SIZES: Record<AvatarSize, { box: string; px: number; text: string }> = {
  xs: { box: "h-8 w-8", px: 32, text: "text-[12px]" },
  sm: { box: "h-14 w-14", px: 56, text: "text-[16px]" },
  md: { box: "h-20 w-20", px: 80, text: "text-[22px]" },
  lg: { box: "h-[88px] w-[88px]", px: 88, text: "text-[26px]" },
};

/** "Tacos El Regio" → "TR". */
export function initials(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((word) => word.length > 1 || /\d/.test(word));
  const picked =
    words.length > 1 ? [words[0], words[words.length - 1]] : words.slice(0, 1);
  return picked
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

type AvatarProps = {
  src: string | null | undefined;
  alt: string;
  size?: AvatarSize;
  /** Qué mostrar sin imagen. Por defecto, las iniciales de `alt`. */
  fallback?: ReactNode;
  priority?: boolean;
  className?: string;
};

/** Logo de un negocio: cuadrado, sin borde ni sombra; sin imagen, iniciales sobre `surface`. */
export function Avatar({
  src,
  alt,
  size = "md",
  fallback,
  priority,
  className,
}: AvatarProps) {
  const spec = SIZES[size];

  return (
    <div
      className={cn(
        "bg-surface text-ink flex shrink-0 items-center justify-center overflow-hidden font-extrabold",
        spec.box,
        spec.text,
        className,
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
        (fallback ?? initials(alt))
      )}
    </div>
  );
}
