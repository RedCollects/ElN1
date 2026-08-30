"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { removeImage, uploadImage, type ImageState } from "./image-actions";
import {
  ACCEPTED_IMAGE_TYPES,
  IMAGE_SPECS,
  type ImageKind,
} from "@/lib/image-specs";
import { SmartImage } from "@/app/components/SmartImage";
import { Alert, Button, Icon, cn } from "@/app/ui";

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

  const [uploadState, uploadAction, uploading] = useActionState<
    ImageState,
    FormData
  >(async (previous, formData) => {
    const result = await uploadImage(kind, previous, formData);

    if (result.success) {
      setLocalPreview(null);
      onPreview?.(null);
      if (inputRef.current) inputRef.current.value = "";
    }

    return result;
  }, {});
  const [removeState, removeAction, removing] = useActionState<
    ImageState,
    FormData
  >(async () => removeImage(kind), {});

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
  const aspectClassName =
    kind === "logo" ? "aspect-square w-40" : "aspect-video w-full";
  const error = uploadState.error ?? removeState.error;

  return (
    <div>
      <p className="label text-neutral-800">{spec.label}</p>
      <p className="text-muted mt-1 text-[13px]">{spec.hint}</p>

      <div
        className={cn(
          "border-rule bg-surface relative mt-3 overflow-hidden border-2",
          aspectClassName,
        )}
      >
        {shown ? (
          <SmartImage
            src={shown}
            alt={spec.label}
            fill
            sizes={
              kind === "logo" ? "160px" : "(min-width: 640px) 600px, 100vw"
            }
            className="object-cover"
          />
        ) : (
          <div className="text-faint flex h-full w-full items-center justify-center">
            <Icon name={kind === "logo" ? "store" : "image"} size={24} />
          </div>
        )}
      </div>

      {localPreview && (
        <p className="text-accent-press mt-2 text-xs">
          Así se recortará. Pulsa «Subir» para guardarla.
        </p>
      )}

      <form
        action={uploadAction}
        className="mt-3 flex flex-wrap items-center gap-3"
      >
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={handleFileChange}
          className="text-muted file:border-rule file:text-ink block text-sm file:mr-3 file:border-2 file:bg-transparent file:px-4 file:py-2 file:text-[12px] file:font-bold file:tracking-[0.08em] file:uppercase"
        />

        <Button type="submit" size="sm" disabled={uploading || !localPreview}>
          {uploading ? "Subiendo…" : "Subir"}
        </Button>
      </form>

      {currentUrl && !localPreview && (
        <form action={removeAction} className="mt-2">
          <Button type="submit" variant="ghost" size="sm" disabled={removing}>
            {removing ? "Quitando..." : "Quitar imagen"}
          </Button>
        </form>
      )}

      {error && (
        <Alert tone="error" compact className="mt-2">
          {error}
        </Alert>
      )}
    </div>
  );
}
