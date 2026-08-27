"use client";

import { useEffect, useId, type ReactNode } from "react";
import { Eyebrow } from "./Typography";

type ModalProps = {
  onClose: () => void;
  eyebrow?: ReactNode;
  title: ReactNode;
  children: ReactNode;
};

/** Diálogo centrado sobre un fondo oscuro. Se cierra con ×, Escape o clic fuera. */
export function Modal({ onClose, eyebrow, title, children }: ModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 px-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {eyebrow && <Eyebrow className="tracking-widest">{eyebrow}</Eyebrow>}
            <h2 id={titleId} className="mt-2 text-3xl font-black text-neutral-950">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-2xl leading-none text-neutral-400 hover:text-neutral-900"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
