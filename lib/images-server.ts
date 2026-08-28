import "server-only";

import sharp from "sharp";
import { IMAGE_SPECS, type ImageKind } from "./image-specs";

/**
 * Normaliza una imagen subida: corrige la orientación EXIF, recorta al
 * tamaño de la especificación centrando en la zona más interesante
 * (recorte inteligente de sharp) y la convierte a WebP.
 */
export async function processImage(
  kind: ImageKind,
  input: Buffer,
): Promise<Buffer> {
  const spec = IMAGE_SPECS[kind];

  return sharp(input, { failOn: "error", limitInputPixels: 40_000_000 })
    .rotate()
    .resize(spec.width, spec.height, {
      fit: "cover",
      position: sharp.strategy.attention,
    })
    .webp({ quality: 82 })
    .toBuffer();
}
