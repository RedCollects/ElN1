import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EL N1 México | El ranking de negocios",
  description: "El ranking público donde los negocios mexicanos compiten por visibilidad.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
