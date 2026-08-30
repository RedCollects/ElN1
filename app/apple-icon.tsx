import { ImageResponse } from "next/og";
import { AppIcon, loadBrandFonts } from "@/lib/brand-og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Icono para pantalla de inicio en iOS. */
export default async function AppleIcon() {
  return new ImageResponse(<AppIcon size={size.width} background="bg" />, {
    ...size,
    fonts: await loadBrandFonts(),
  });
}
