import Image, { type ImageProps } from "next/image";

const STORAGE_PATH = "/storage/v1/object/public/";

/**
 * next/image que no rompe la página con orígenes inesperados:
 * - URLs locales del navegador (blob:/data:) para vistas previas aún no subidas.
 * - URLs externas (por ejemplo, un logo cargado por URL desde el admin) que no
 *   están en `images.remotePatterns`: se sirven sin optimizar en vez de lanzar
 *   un error en el servidor.
 * Solo las imágenes de nuestro Supabase Storage pasan por el optimizador.
 */
export function SmartImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const optimizable = src.includes(STORAGE_PATH);

  return (
    <Image
      {...props}
      alt={props.alt}
      unoptimized={!optimizable || props.unoptimized}
    />
  );
}
