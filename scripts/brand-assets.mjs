// Genera los logos de public/ a partir del sello de la marca.
//   node scripts/brand-assets.mjs
// SVG: el "N1" va en texto con Archivo 900 embebida (@font-face en base64) para
// que el archivo sea autónomo. PNG: renderizados con next/og (Satori + resvg).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";

const root = process.cwd();
const out = join(root, "public");
await mkdir(out, { recursive: true });

const ACCENT = "#1746d4";
const ACCENT_FG = "#f2f3f6";
const INK = "#1b1d22";
const BG = "#f2f3f6";
const DASH = "150 9 44 9 150 9 44 9";

const font900 = await readFile(join(root, "app/fonts/Archivo-900.woff"));
const font900b64 = font900.toString("base64");

const VARIANTS = {
  /** Tinta sobre fondo claro. */
  ink: { stroke: INK, text: INK, bg: null },
  /** Claro sobre tinta. */
  paper: { stroke: ACCENT_FG, text: ACCENT_FG, bg: INK },
  /** Claro sobre azul. */
  accent: { stroke: ACCENT_FG, text: ACCENT_FG, bg: ACCENT },
};

function sealSvg({ stroke, text, bg }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <style>
      @font-face { font-family: "Archivo"; font-weight: 900; src: url(data:font/woff;base64,${font900b64}) format("woff"); }
    </style>
  </defs>
  ${bg ? `<rect width="200" height="200" fill="${bg}"/>` : ""}
  <circle cx="100" cy="100" r="88" fill="none" stroke="${stroke}" stroke-width="5" stroke-dasharray="${DASH}" stroke-linecap="butt"/>
  <text x="100" y="100" text-anchor="middle" dominant-baseline="central" fill="${text}" font-family="Archivo, sans-serif" font-weight="900" font-size="92" letter-spacing="-0.04em">N1</text>
</svg>
`;
}

function ringUri(stroke) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" fill="none" stroke="${stroke}" stroke-width="5" stroke-dasharray="${DASH}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function sealPng({ stroke, text, bg }, size) {
  const element = h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: bg ?? "transparent",
        position: "relative",
      },
    },
    h("img", {
      src: ringUri(stroke),
      width: size,
      height: size,
      style: { position: "absolute", top: 0, left: 0 },
    }),
    h(
      "div",
      {
        style: {
          display: "flex",
          fontFamily: "Archivo",
          fontWeight: 900,
          fontSize: (size * 92) / 200,
          letterSpacing: "-0.04em",
          color: text,
          lineHeight: 1,
        },
      },
      "N1",
    ),
  );

  const response = new ImageResponse(element, {
    width: size,
    height: size,
    fonts: [{ name: "Archivo", data: font900, weight: 900, style: "normal" }],
  });
  return Buffer.from(await response.arrayBuffer());
}

for (const [name, variant] of Object.entries(VARIANTS)) {
  await writeFile(join(out, `logo-${name}.svg`), sealSvg(variant));
  await writeFile(
    join(out, `logo-${name}-512.png`),
    await sealPng(variant, 512),
  );
  console.log(`public/logo-${name}.svg + .png`);
}

// Alias sin sufijo = versión tinta sobre claro (la de uso general).
await writeFile(join(out, "logo.svg"), sealSvg({ ...VARIANTS.ink, bg: BG }));
console.log("public/logo.svg");
