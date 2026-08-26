import { createClient } from "@supabase/supabase-js";
import Ranking from "./Ranking";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ position?: string }>;
}) {
  const { position } = await searchParams;
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("active", true)
    .order("position", { ascending: true, nullsFirst: false });

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-black text-red-500">
            Error al cargar EL N1
          </h1>

          <p className="mt-3 text-sm text-neutral-500">
            {error.message}
          </p>
        </div>
      </main>
    );
  }

  const rankedBusinesses = (businesses ?? []).filter(
    (business) =>
      Number.isInteger(business.position) &&
      business.position >= 1 &&
      business.position <= 10
  );

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="text-2xl font-black tracking-tight">
            EL <span className="text-sky-400">N1</span>
          </div>

          <button className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100">
            ¿Cómo funciona?
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-14 pt-16 text-center">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-sky-400">
          El ranking de México
        </p>

        <h1 className="mx-auto max-w-3xl text-5xl font-black tracking-tight text-neutral-950 sm:text-7xl">
          ¿Quién merece ser
          <span className="block text-sky-400">EL N1?</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-neutral-500">
          Los negocios compiten por estar arriba.
          <br />
          ¿Hasta dónde estás dispuesto a llegar?
        </p>
      </section>

      <Ranking
        businesses={rankedBusinesses}
        initialPosition={Number(position) || null}
      />

      <footer className="border-t border-neutral-200 py-8 text-center text-sm text-neutral-400">
        EL N1 — México
      </footer>
    </main>
  );
}