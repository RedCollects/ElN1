import Link from "next/link";
import { createPublicSupabaseClient } from "../../../lib/supabase-public";
import { contactLinks, type Business } from "../../../lib/business";
import { SmartImage } from "../../components/SmartImage";

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
  const subtitle = [item.category, item.city].filter(Boolean).join(" · ");
  const links = contactLinks(item);

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
          <div className="relative bg-sky-400 px-6 py-10 text-center">
            {item.cover_url && (
              <>
                <SmartImage
                  src={item.cover_url}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 896px) 896px, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
              </>
            )}

            <div className="relative">
              <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white text-5xl shadow-lg">
                {item.logo_url ? (
                  <SmartImage
                    src={item.logo_url}
                    alt={`Logo de ${item.name}`}
                    width={112}
                    height={112}
                    priority
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "🏪"
                )}
              </div>

              <p className="mt-5 text-sm font-bold uppercase tracking-[0.25em] text-white/80">
                {item.position ? `Posición #${item.position}` : "Fuera del ranking"}
              </p>

              <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">
                {item.name}
              </h1>

              {subtitle && (
                <p className="mt-2 text-lg font-medium text-white/90">
                  {subtitle}
                </p>
              )}

              {item.tagline && (
                <p className="mx-auto mt-4 max-w-xl text-base text-white/90">
                  {item.tagline}
                </p>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {item.description && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-neutral-950">
                  Sobre el negocio
                </h2>

                <p className="mt-2 whitespace-pre-line leading-7 text-neutral-500">
                  {item.description}
                </p>
              </div>
            )}

            {item.position && (
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
            )}

            {links.length > 0 && (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="rounded-xl border border-neutral-200 px-5 py-4 text-center font-bold transition hover:bg-neutral-50"
                  >
                    {link.emoji} {link.label}
                  </a>
                ))}
              </div>
            )}

            {item.hours && (
              <p className="mt-6 text-center text-sm text-neutral-500">
                🕒 {item.hours}
              </p>
            )}

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
