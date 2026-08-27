"use client";

import { useCallback, useState } from "react";
import { EDITABLE_FIELDS, type Business, type EditableField } from "../../lib/business";
import { RankingCard } from "../components/RankingCard";
import { ImageUploader } from "./image-uploader";
import { ProfileForm } from "./profile-form";

type Props = {
  business: Business;
};

/**
 * Formulario + imágenes + vista previa en vivo. La vista previa refleja lo
 * que el dueño escribe antes de guardar y la imagen elegida antes de subir.
 * El padre lo remonta (key) cuando el negocio cambia en la base de datos.
 */
export function BusinessEditor({ business }: Props) {
  const [draft, setDraft] = useState<Business>(business);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const handleFormChange = useCallback((form: HTMLFormElement) => {
    const data = new FormData(form);
    const next: Partial<Record<EditableField, string | null>> = {};

    for (const field of EDITABLE_FIELDS) {
      const value = String(data.get(field) ?? "").trim();
      next[field] = value ? value.replace(/^@/, "") : null;
    }

    setDraft((current) => ({
      ...current,
      ...next,
      name: next.name || current.name,
    }));
  }, []);

  const preview: Business = {
    ...draft,
    logo_url: logoPreview ?? business.logo_url,
    cover_url: coverPreview ?? business.cover_url,
  };

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div className="space-y-6">
        <ProfileForm business={business} onChange={handleFormChange} />

        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-black">Imágenes</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Recortamos automáticamente al tamaño ideal. El logo es necesario
            para publicar.
          </p>

          <div className="mt-5 grid gap-8 sm:grid-cols-[auto_1fr]">
            <ImageUploader
              kind="logo"
              currentUrl={business.logo_url}
              onPreview={setLogoPreview}
            />
            <ImageUploader
              kind="cover"
              currentUrl={business.cover_url}
              onPreview={setCoverPreview}
            />
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-sky-500">
          Vista previa
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Así se verá tu tarjeta en el ranking con el anuncio abierto.
        </p>

        <div className="mt-4">
          <RankingCard
            position={business.position ?? 1}
            business={preview}
            forceExpanded
          />
        </div>
      </aside>
    </div>
  );
}
