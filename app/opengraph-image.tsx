import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
import { SealImage, loadBrandFonts } from "@/lib/brand-og";

export const alt = "EL N1 — El ranking de negocios de México";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imagen para enlaces compartidos (WhatsApp, redes). Misma retícula que la
 * interfaz: fondo bg, reglas de 2px, todo al ras izquierdo, azul solo en el sello.
 */
export default async function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "56px 64px",
        background: BRAND.bg,
        color: BRAND.ink,
        fontFamily: "Archivo",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <SealImage size={72} color={BRAND.ink} ring />
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          EL N1
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 0.92,
            maxWidth: 1000,
          }}
        >
          El ranking donde los negocios pagan por su lugar.
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderTop: `2px solid ${BRAND.ink}`,
            paddingTop: 22,
            fontSize: 26,
            fontWeight: 400,
            color: BRAND.muted,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 12,
              height: 12,
              background: BRAND.accent,
            }}
          />
          Quien paga más queda arriba. Tu lugar es tuyo mientras nadie pague
          más.
        </div>
      </div>
    </div>,
    { ...size, fonts: await loadBrandFonts() },
  );
}
