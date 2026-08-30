import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BRAND, SEAL, sealRingSvg } from "./brand";

/**
 * Piezas compartidas por los generadores de imagen (`app/icon.tsx`,
 * `app/apple-icon.tsx`, `app/opengraph-image.tsx`). Satori no carga fuentes
 * web, así que Archivo 400/800/900 va vendida en app/fonts/ y se lee una vez.
 */

const FONT_DIR = join(process.cwd(), "app", "fonts");

export async function loadBrandFonts() {
  const [w400, w800, w900] = await Promise.all([
    readFile(join(FONT_DIR, "Archivo-400.woff")),
    readFile(join(FONT_DIR, "Archivo-800.woff")),
    readFile(join(FONT_DIR, "Archivo-900.woff")),
  ]);

  return [
    {
      name: "Archivo",
      data: w400,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Archivo",
      data: w800,
      weight: 800 as const,
      style: "normal" as const,
    },
    {
      name: "Archivo",
      data: w900,
      weight: 900 as const,
      style: "normal" as const,
    },
  ];
}

function ringDataUri(stroke: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(sealRingSvg(stroke))}`;
}

type SealImageProps = {
  size: number;
  /** Color del anillo y del texto. */
  color: string;
  /** Con menos de 64px el anillo no se lee: solo el "N1". */
  ring?: boolean;
};

/** Sello "N1" en el subconjunto de CSS que entiende Satori (flex, sin grid). */
export function SealImage({ size, color, ring = size >= 64 }: SealImageProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
      }}
    >
      {ring && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ringDataUri(color)}
          width={size}
          height={size}
          alt=""
          style={{ position: "absolute", top: 0, left: 0 }}
        />
      )}
      <div
        style={{
          display: "flex",
          fontFamily: "Archivo",
          fontWeight: 900,
          fontSize: (size * SEAL.fontSize) / SEAL.viewBox,
          letterSpacing: SEAL.letterSpacing,
          color,
          lineHeight: 1,
        }}
      >
        N1
      </div>
    </div>
  );
}

/** Icono de app: cuadrado azul con el sello claro. Radio 0. */
export function AppIcon({ size }: { size: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: BRAND.accent,
      }}
    >
      <SealImage size={Math.round(size * 0.84)} color={BRAND.accentFg} />
    </div>
  );
}
