"use client";

import { useCallback, useState } from "react";
import { EDITABLE_FIELDS, type Business, type EditableField } from "../../lib/business";
import { RankingCard } from "../components/RankingCard";
import { CardSection, Eyebrow, Muted } from "@/app/ui";
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

        <CardSection
          title="Imágenes"
          description="Recortamos automáticamente al tamaño ideal. El logo es necesario para publicar."
        >
          <div className="grid gap-8 sm:grid-cols-[auto_1fr]">
            <ImageUploader kind="logo" currentUrl={business.logo_url} onPreview={setLogoPreview} />
            <ImageUploader
              kind="cover"
              currentUrl={business.cover_url}
              onPreview={setCoverPreview}
            />
          </div>
        </CardSection>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Eyebrow>Vista previa</Eyebrow>
        <Muted className="mt-1">Así se verá tu tarjeta en el ranking con el anuncio abierto.</Muted>

        <div className="mt-4">
          <RankingCard position={business.position ?? 1} business={preview} forceExpanded />
        </div>
      </aside>
    </div>
  );
}
