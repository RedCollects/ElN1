import { ImageResponse } from "next/og";
import { AppIcon, loadBrandFonts } from "@/lib/brand-og";

/* Favicon y iconos de app generados desde el sello de la marca.
   Sustituye al favicon.ico del scaffold. */

const SIZES = [32, 192, 512];

export function generateImageMetadata() {
  return SIZES.map((size) => ({
    id: String(size),
    contentType: "image/png",
    size: { width: size, height: size },
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const size = Number(await id);

  return new ImageResponse(<AppIcon size={size} />, {
    width: size,
    height: size,
    fonts: await loadBrandFonts(),
  });
}
