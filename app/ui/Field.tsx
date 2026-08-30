import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

/** Clases base de cualquier control de formulario. */
export const controlClassName =
  "mt-1 w-full border border-neutral-300 bg-white px-4 py-3 outline-none transition focus:border-accent disabled:opacity-50";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(controlClassName, className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(controlClassName, className)} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cn(controlClassName, className)} />;
}

type PrefixedInputProps = ComponentProps<"input"> & {
  /** Texto fijo antes del valor, p. ej. "@". */
  prefix: ReactNode;
};

/** Input con un prefijo visual dentro del mismo borde (usuario de redes). */
export function PrefixedInput({
  prefix,
  className,
  ...props
}: PrefixedInputProps) {
  return (
    <div
      className={cn(
        "focus-within:border-accent mt-1 flex items-center border border-neutral-300 bg-white transition",
        className,
      )}
    >
      <span className="pl-4 text-neutral-400">{prefix}</span>
      <input
        {...props}
        className="w-full bg-transparent px-2 py-3 outline-none"
      />
    </div>
  );
}

type FieldProps = {
  label: ReactNode;
  /** Texto de ayuda debajo del control. */
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Etiqueta + control + ayuda. El control va como hijo (Input, Select, …). */
export function Field({ label, hint, className, children }: FieldProps) {
  return (
    <label className={cn("block text-sm font-bold", className)}>
      {label}
      {children}
      {hint && (
        <span className="mt-1 block text-xs font-normal text-neutral-400">
          {hint}
        </span>
      )}
    </label>
  );
}
