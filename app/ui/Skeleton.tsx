import { cn } from "./cn";

type SkeletonProps = {
  /** Clases de tamaño del bloque final (`h-10 w-40`). */
  className?: string;
};

/** Estado de carga: bloque rectangular en `surface` del tamaño final. Sin spinners. */
export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden className={cn("bg-surface", className)} />;
}
