import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

/* Única familia tipográfica de la marca. next/font la sirve desde el propio
   dominio (sin petición a Google) y sin salto de layout. */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.eln1.mx"),
  title: "EL N1 México | El ranking de negocios",
  description:
    "El ranking público donde los negocios mexicanos compiten por visibilidad.",
};

/* Aplica el tema guardado antes de pintar para evitar el destello claro.
   Debe coincidir con la lógica de SiteExperience. */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("eln1-theme");var d=t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.dataset.theme="dark";}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`h-full antialiased ${archivo.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
