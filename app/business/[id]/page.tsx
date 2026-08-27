import Link from "next/link";
import { createPublicSupabaseClient } from "../../../lib/supabase-public";

type Business = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  position: number | null;
  current_price: number | null;
  phone: string | null;
  whatsapp: string | null;
  logo_url: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
};

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createPublicSupabaseClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .single();

  if (error || !business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-neutral-950">
            Negocio no encontrado
          </h1>

          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-sky-400 px-6 py-3 font-bold text-white"
          >
            Volver al ranking
          </Link>
        </div>
      </main>
    );
  }

  const item = business as Business;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            EL <span className="text-sky-400">N1</span>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
          >
            Ver ranking
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="bg-sky-400 px-6 py-10 text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white text-5xl shadow-lg">
              {item.logo_url ? (
                <img
                  src={item.logo_url}
                  alt={`Logo de ${item.name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                "🏪"
              )}
            </div>

            <p className="mt-5 text-sm font-bold uppercase tracking-[0.25em] text-white/80">
              Posición #{item.position ?? "-"}
            </p>

            <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">
              {item.name}
            </h1>

            {item.category && (
              <p className="mt-2 text-lg font-medium text-white/90">
                {item.category}
              </p>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {item.description && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-neutral-950">
                  Sobre el negocio
                </h2>

                <p className="mt-2 leading-7 text-neutral-500">
                  {item.description}
                </p>
              </div>
            )}

            <div className="rounded-2xl bg-sky-50 p-6">
              <p className="text-sm font-medium text-neutral-500">
                Oferta actual
              </p>

              <p className="mt-1 text-4xl font-black text-sky-500">
                $
                {Number(item.current_price ?? 0).toLocaleString(
                  "es-MX"
                )}{" "}
                MXN
              </p>

              <p className="mt-2 text-sm text-neutral-500">
                Esta es la oferta que actualmente mantiene esta
                posición.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {item.phone && (
                <a
                  href={`tel:${item.phone}`}
                  className="rounded-xl border border-neutral-200 px-5 py-4 text-center font-bold transition hover:bg-neutral-50"
                >
                  📞 Llamar
                </a>
              )}

              {item.whatsapp && (
                <a
                  href={`https://wa.me/${item.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-neutral-200 px-5 py-4 text-center font-bold transition hover:bg-neutral-50"
                >
                  💬 WhatsApp
                </a>
              )}

              {item.instagram && (
                <a
                  href={item.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-neutral-200 px-5 py-4 text-center font-bold transition hover:bg-neutral-50"
                >
                  📸 Instagram
                </a>
              )}

              {item.facebook && (
                <a
                  href={item.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-neutral-200 px-5 py-4 text-center font-bold transition hover:bg-neutral-50"
                >
                  👍 Facebook
                </a>
              )}

              {item.tiktok && (
                <a
                  href={item.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-neutral-200 px-5 py-4 text-center font-bold transition hover:bg-neutral-50"
                >
                  🎵 TikTok
                </a>
              )}
            </div>

            <div className="mt-8">
              <Link
                href={`/?position=${item.position ?? ""}`}
                className="block w-full rounded-xl bg-sky-400 px-5 py-4 text-center font-bold text-white transition hover:bg-sky-500"
              >
                INTENTAR SUBIR AL RANKING
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 py-8 text-center text-sm text-neutral-400">
        EL N1 — México
      </footer>
    </main>
  );
}