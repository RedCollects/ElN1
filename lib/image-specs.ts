export type ImageKind = "logo" | "cover";

export const MEDIA_BUCKET = "business-media";

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const IMAGE_SPECS: Record<
  ImageKind,
  {
    label: string;
    width: number;
    height: number;
    maxBytes: number;
    hint: string;
  }
> = {
  logo: {
    label: "Logo",
    width: 1024,
    height: 1024,
    maxBytes: 2 * 1024 * 1024,
    hint: "Cuadrado, ideal 1024×1024 px. JPG, PNG o WebP de hasta 2 MB.",
  },
  cover: {
    label: "Portada",
    width: 1600,
    height: 900,
    maxBytes: 4 * 1024 * 1024,
    hint: "Horizontal 16:9, ideal 1600×900 px. JPG, PNG o WebP de hasta 4 MB.",
  },
};

export function imageColumn(kind: ImageKind): "logo_url" | "cover_url" {
  return kind === "logo" ? "logo_url" : "cover_url";
}

/** Ruta dentro del bucket a partir de una URL pública nuestra; null si es externa. */
export function storagePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
}
