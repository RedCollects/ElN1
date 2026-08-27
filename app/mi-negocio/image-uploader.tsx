"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { removeImage, uploadImage, type ImageState } from "./image-actions";
import {
  ACCEPTED_IMAGE_TYPES,
  IMAGE_SPECS,
  type ImageKind,
} from "../../lib/image-specs";
import { SmartImage } from "../components/SmartImage";

type Props = {
  kind: ImageKind;
  currentUrl: string | null;
  /** Avisa al padre de la imagen elegida (aún sin subir) para la vista previa. */
  onPreview?: (objectUrl: string | null) => void;
};

export function ImageUploader({ kind, currentUrl, onPreview }: Props) {
  const spec = IMAGE_SPECS[kind];
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploadState, uploadAction, uploading] = useActionState<ImageState, FormData>(
    async (previous, formData) => {
      const result = await uploadImage(kind, previous, formData);

      if (result.success) {
        setLocalPreview(null);
        onPreview?.(null);
        if (inputRef.current) inputRef.current.value = "";
      }

      return result;
    },
    {}
  );
  const [removeState, removeAction, removing] = useActionState<ImageState, FormData>(
    async () => removeImage(kind),
    {}
  );

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (localPreview) URL.revokeObjectURL(localPreview);

    if (!file) {
      setLocalPreview(null);
      onPreview?.(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    onPreview?.(objectUrl);
  }

  const shown = localPreview ?? currentUrl;
  const aspectClassName = kind === "logo" ? "aspect-square w-40" : "aspect-video w-full";
  const error = uploadState.error ?? removeState.error;

  return (
    <div>
      <p className="text-sm font-bold">{spec.label}</p>
      <p className="mt-1 text-xs text-neutral-400">{spec.hint}</p>

      <div
        className={`relative mt-3 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 ${aspectClassName}`}
      >
        {shown ? (
          <SmartImage
            src={shown}
            alt={spec.label}
            fill
            sizes={kind === "logo" ? "160px" : "(min-width: 640px) 600px, 100vw"}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-neutral-300">
            {kind === "logo" ? "🏪" : "🖼️"}
          </div>
        )}
      </div>

      {localPreview && (
        <p className="mt-2 text-xs text-sky-600">
          Así se recortará. Pulsa «Subir» para guardarla.
        </p>
      )}

      <form action={uploadAction} className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={handleFileChange}
          className="block text-sm text-neutral-500 file:mr-3 file:rounded-full file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white"
        />

        <button
          type="submit"
          disabled={uploading || !localPreview}
          className="rounded-full bg-sky-400 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
        >
          {uploading ? "SUBIENDO..." : "SUBIR"}
        </button>
      </form>

      {currentUrl && !localPreview && (
        <form action={removeAction} className="mt-2">
          <button
            type="submit"
            disabled={removing}
            className="text-xs font-bold text-neutral-400 underline disabled:opacity-40"
          >
            {removing ? "Quitando..." : "Quitar imagen"}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
