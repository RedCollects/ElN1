import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const isLocalSupabase =
  supabaseHost === "127.0.0.1" || supabaseHost === "localhost";

const nextConfig: NextConfig = {
  images: {
    // Solo en desarrollo con Supabase local: next/image bloquea IPs privadas.
    dangerouslyAllowLocalIP:
      process.env.NODE_ENV !== "production" && isLocalSupabase,
    remotePatterns: [
      // Supabase Storage del proyecto configurado (local o nube).
      ...(supabaseUrl
        ? [
            {
              protocol: supabaseUrl.startsWith("https") ? ("https" as const) : ("http" as const),
              hostname: supabaseHost!,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Portada de hasta 4 MB + cabeceras multipart.
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
