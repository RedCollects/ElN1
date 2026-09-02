import { describe, expect, it } from "vitest";
import { MEDIA_BUCKET, imageColumn, storagePathFromUrl } from "./image-specs";

const BASE = `https://abc.supabase.co/storage/v1/object/public/${MEDIA_BUCKET}/`;

describe("storagePathFromUrl", () => {
  it("devuelve la ruta dentro del bucket", () => {
    expect(storagePathFromUrl(`${BASE}negocio-1/logo.webp`)).toBe(
      "negocio-1/logo.webp",
    );
  });

  it("descarta la query string (cache busting)", () => {
    expect(storagePathFromUrl(`${BASE}negocio-1/logo.webp?t=123`)).toBe(
      "negocio-1/logo.webp",
    );
  });

  it("decodifica caracteres escapados", () => {
    expect(storagePathFromUrl(`${BASE}mi%20negocio/logo.webp`)).toBe(
      "mi negocio/logo.webp",
    );
  });

  it("devuelve null para URLs externas u otros buckets", () => {
    expect(storagePathFromUrl("https://cdn.example.com/logo.png")).toBeNull();
    expect(
      storagePathFromUrl(
        "https://abc.supabase.co/storage/v1/object/public/otro/logo.webp",
      ),
    ).toBeNull();
  });
});

describe("imageColumn", () => {
  it("mapea cada tipo a su columna", () => {
    expect(imageColumn("logo")).toBe("logo_url");
    expect(imageColumn("cover")).toBe("cover_url");
  });
});
