import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EL N1 | El ranking de México",
  description: "Compite por estar en la posición número uno.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
