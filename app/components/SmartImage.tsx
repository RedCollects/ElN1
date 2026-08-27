import Image, { type ImageProps } from "next/image";

/**
 * next/image que acepta también URLs locales del navegador (blob:/data:)
 * para las vistas previas de imágenes aún no subidas.
 */
export function SmartImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const isLocal = src.startsWith("blob:") || src.startsWith("data:");

  return <Image {...props} alt={props.alt} unoptimized={isLocal || props.unoptimized} />;
}
