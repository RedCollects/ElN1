"use client";

import { useEffect, useId, type ReactNode } from "react";
import { cn } from "./cn";
import { Icon } from "./Icon";
import { Eyebrow } from "./Typography";

type ModalProps = {
  onClose: () => void;
  eyebrow?: ReactNode;
  title: ReactNode;
  /**
   * Pie de acciones: el primer botón ocupa el ancho (`flex-1`) y los demás van
   * separados por una regla vertical de 2px. Pasar `Button`s.
   */
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * Diálogo: máximo 420px, borde de 2px, única sombra de la marca. Se cierra con
 * el icono, Escape o clic fuera.
 */
export function Modal({
  onClose,
  eyebrow,
  title,
  actions,
  children,
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="bg-ink/55 fixed inset-0 z-50 grid place-items-center p-6 sm:p-11"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="rule bg-bg shadow-modal flex max-h-[90vh] w-full max-w-[420px] flex-col border"
      >
        <div className="rule flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <h2
              id={titleId}
              className={cn(
                "text-ink text-[26px] leading-[1.1] font-extrabold tracking-[-0.02em]",
                Boolean(eyebrow) && "mt-1",
              )}
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted hover:text-ink shrink-0"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-6">{children}</div>

        {actions && (
          <div className="rule [&>*+*]:border-rule flex border-t [&>*+*]:border-l-2 [&>*:first-child]:flex-1">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
