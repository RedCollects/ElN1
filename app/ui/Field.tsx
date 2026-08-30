import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

/** Clases base de cualquier control de formulario: borde de 2px, sin radio. */
export const controlClassName =
  "rule mt-2 w-full min-w-0 border bg-bg px-[14px] py-[13px] text-base text-ink outline-none placeholder:text-faint transition-colors duration-[120ms] focus:border-accent disabled:cursor-not-allowed disabled:opacity-45 aria-[invalid=true]:border-accent";

/** Variante de borde suave para campos opcionales. */
export const optionalControlClassName = "border-rule-soft";

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
        "rule bg-bg focus-within:border-accent mt-2 flex items-stretch border transition-colors duration-[120ms]",
        className,
      )}
    >
      <span className="text-faint grid place-items-center pl-[14px]">
        {prefix}
      </span>
      <input
        {...props}
        className="text-ink placeholder:text-faint w-full min-w-0 bg-transparent px-2 py-[13px] text-base outline-none"
      />
    </div>
  );
}

type MoneyInputProps = Omit<ComponentProps<"input">, "type" | "prefix"> & {
  /** Moneda mostrada como sufijo. */
  currency?: string;
};

/** Campo de monto: prefijo "$" en banda de tinta, cifra tabular, sufijo "MXN". */
export function MoneyInput({
  currency = "MXN",
  className,
  ...props
}: MoneyInputProps) {
  return (
    <div
      className={cn(
        "rule bg-bg focus-within:border-accent mt-2 flex items-stretch border transition-colors duration-[120ms]",
        className,
      )}
    >
      <span className="bg-band text-band-fg grid place-items-center px-[14px] text-[15px] font-bold">
        $
      </span>
      <input
        type="number"
        inputMode="numeric"
        {...props}
        className="figure text-ink placeholder:text-faint w-full min-w-0 flex-1 bg-transparent px-[14px] py-[13px] text-2xl outline-none"
      />
      <span className="text-faint grid place-items-center px-[14px] text-[11px] font-bold tracking-[0.14em]">
        {currency}
      </span>
    </div>
  );
}

type FieldProps = {
  label: ReactNode;
  /** Texto de ayuda debajo del control (azul de párrafo). */
  hint?: ReactNode;
  /** Error de validación: texto bajo el campo, sin icono. */
  error?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Etiqueta + control + ayuda o error. El control va como hijo (Input, Select, …). */
export function Field({ label, hint, error, className, children }: FieldProps) {
  return (
    <label className={cn("label block text-neutral-800", className)}>
      {label}
      {children}
      {error ? (
        <span
          role="alert"
          className="text-accent-press mt-2 block text-[13px] font-normal tracking-normal normal-case"
        >
          {error}
        </span>
      ) : (
        hint && (
          <span className="text-accent-press mt-2 block text-[13px] font-normal tracking-normal normal-case">
            {hint}
          </span>
        )
      )}
    </label>
  );
}
