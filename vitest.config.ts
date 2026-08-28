import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: [
        "lib/**/*.test.ts",
        // Envoltorios de sharp / Next / Supabase: se prueban en integración, no aquí.
        "lib/images-server.ts",
        "lib/supabase-auth.ts",
        "lib/supabase-public.ts",
        "lib/supabase-server.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // `server-only` lanza fuera de React Server Components; en tests es un no-op.
      "server-only": path.resolve(__dirname, "test/stubs/server-only.ts"),
    },
  },
});
