"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

type SegmentedOption<T extends string | number> = {
  value: T;
  label: ReactNode;
};

type SegmentedProps<T extends string | number> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Nombre accesible del grupo. */
  label: string;
  className?: string;
};

/** Selector segmentado (duración 7 / 15 / 30 días). Opción activa en azul. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("border-rule flex border-2", className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 px-2 py-[13px] text-[13px] font-bold tracking-[0.06em] uppercase",
              "border-rule border-l-2 first:border-l-0",
              "transition-[background-color,color] duration-[120ms]",
              selected
                ? "bg-accent text-accent-fg"
                : "text-ink hover:bg-surface bg-transparent",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

/** Interruptor cuadrado 48×26. Encendido = fondo azul, botón a la derecha. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  className,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex h-[26px] w-12 shrink-0 items-center p-[3px] transition-colors duration-[120ms]",
        checked ? "bg-accent justify-end" : "justify-start bg-neutral-400",
        "disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
    >
      <span aria-hidden className="bg-accent-fg block h-5 w-5" />
    </button>
  );
}

type RadioProps = {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
};

/** Radio cuadrado de 20px con relleno azul de 10px. */
export function Radio({
  name,
  value,
  checked,
  onChange,
  children,
  className,
}: RadioProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 text-[15px]",
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "peer-focus-visible:outline-accent grid h-5 w-5 shrink-0 place-items-center border-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
          checked ? "border-rule" : "border-rule-soft",
        )}
      >
        {checked && <span className="bg-accent block h-2.5 w-2.5" />}
      </span>
      {children}
    </label>
  );
}
