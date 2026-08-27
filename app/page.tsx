import Ranking from "./Ranking";
import { createServerSupabaseClient } from "../lib/supabase-server";
import { MAX_RANKING_POSITION } from "../lib/prices";
import SiteExperience from "./SiteExperience";

export const dynamic = "force-dynamic";

type LeaderboardBusiness = {
  id: string;
  name: string;
  position: number | null;
  visits: number;
};

async function getSiteStats() {
  const supabase = createServerSupabaseClient();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
  }).format(new Date());
  const onlineSince = new Date(Date.now() - 90_000).toISOString();

  const [{ count: todayCount }, { count: totalCount }, { count: onlineCount }] =
    await Promise.all([
      supabase.from("site_visits").select("*", { count: "exact", head: true }).eq("visit_date", today),
      supabase.from("site_visits").select("*", { count: "exact", head: true }),
      supabase.from("online_sessions").select("*", { count: "exact", head: true }).gte("last_seen_at", onlineSince),
    ]);

  return { today: todayCount ?? 0, total: totalCount ?? 0, online: onlineCount ?? 0 };
}

async function getAttentionLeaderboard() {
  const supabase = createServerSupabaseClient();
  const { data: totals } = await supabase
    .from("business_click_totals")
    .select("business_id, visits")
    .order("visits", { ascending: false })
    .limit(3);

  const ids = (totals ?? []).map((total) => total.business_id);
  if (ids.length === 0) return [] as LeaderboardBusiness[];

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, position")
    .in("id", ids);

  return (totals ?? []).flatMap((total) => {
    const business = (businesses ?? []).find((item) => item.id === total.business_id);
    return business
      ? [{ ...business, visits: Number(total.visits) }]
      : [];
  }) as LeaderboardBusiness[];
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ position?: string; payment?: string }>;
}) {
  const { position, payment } = await searchParams;
  const supabase = createServerSupabaseClient();
  const [{ data: businesses, error }, stats, attentionLeaderboard] = await Promise.all([
    supabase
      .from("businesses")
      .select("*")
      .eq("active", true)
      .order("position", { ascending: true, nullsFirst: false }),
    getSiteStats().catch(() => ({ today: 0, total: 0, online: 0 })),
    getAttentionLeaderboard().catch(() => [] as LeaderboardBusiness[]),
  ]);

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
      business.position <= MAX_RANKING_POSITION
  );

  const paymentMessage =
    payment === "success"
      ? "Recibimos tu pago. Tu posición se actualizará cuando Mercado Pago lo confirme."
      : payment === "pending"
        ? "Tu pago está pendiente de confirmación. Actualizaremos la posición cuando se apruebe."
        : payment === "failure"
          ? "No se completó el pago. Puedes intentar de nuevo cuando quieras."
          : null;

  return (
    <main className="min-h-screen bg-white text-neutral-900 transition-colors dark:bg-neutral-950 dark:text-white">
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="text-2xl font-black tracking-tight">
            EL <span className="text-sky-400">N1</span>
            <span className="ml-2 text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">México</span>
          </div>
          <SiteExperience initialStats={stats} />
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-12 pt-14 text-center sm:pt-20">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-sky-400">
          Atención para negocios mexicanos
        </p>

        <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-7xl">
          Tu negocio merece
          <span className="block text-sky-400">estar arriba.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-neutral-500 dark:text-neutral-400">
          El ranking público donde los negocios compiten por visibilidad.
          Tú decides hasta dónde subir.
        </p>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-3 divide-x divide-neutral-200 rounded-2xl border border-neutral-200 bg-neutral-50 py-4 text-left dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="px-5"><p className="text-xs uppercase tracking-wider text-neutral-400">Ranking</p><p className="mt-1 font-black">Top 50</p></div>
          <div className="px-5"><p className="text-xs uppercase tracking-wider text-neutral-400">Moneda</p><p className="mt-1 font-black">MXN</p></div>
          <div className="px-5"><p className="text-xs uppercase tracking-wider text-neutral-400">Estado</p><p className="mt-1 font-black text-emerald-500">● En vivo</p></div>
        </div>
      </section>

      {paymentMessage && (
        <div
          className={`mx-auto mb-8 max-w-4xl rounded-2xl px-6 py-4 text-center text-sm font-medium ${
            payment === "failure"
              ? "bg-red-50 text-red-700"
              : "bg-sky-50 text-sky-800"
          }`}
        >
          {paymentMessage}
        </div>
      )}

      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Ranking businesses={rankedBusinesses} initialPosition={Number(position) || null} />

        <aside className="mx-6 mb-14 h-fit rounded-3xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900 lg:sticky lg:top-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">Leaderboard</p>
          <h2 className="mt-2 text-xl font-black">Más visitados</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">La atención también cuenta.</p>
          <ol className="mt-5 space-y-4">
            {attentionLeaderboard.length > 0 ? attentionLeaderboard.map((business, index) => (
              <li key={business.id} className="flex items-center gap-3">
                <span className="w-5 text-sm font-black text-sky-500">{index + 1}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{business.name}</p><p className="text-xs text-neutral-400">#{business.position ?? "–"} · {business.visits.toLocaleString("es-MX")} visitas</p></div>
              </li>
            )) : <li className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">Aún no hay visitas suficientes. Sé de los primeros en descubrir negocios.</li>}
          </ol>
          <div className="mt-6 border-t border-neutral-200 pt-5 text-sm dark:border-neutral-800">
            <p className="font-bold">Transparencia de métricas</p>
            <p className="mt-1 leading-5 text-neutral-500 dark:text-neutral-400">Contamos una visita anónima por dispositivo al día. No vendemos ni mostramos datos personales.</p>
          </div>
        </aside>
      </div>

      <footer className="border-t border-neutral-200 py-8 text-center text-sm text-neutral-400">
        <p>EL N1 — México</p>
        <div className="mt-2 flex justify-center gap-4">
          <a href="/terminos" className="underline hover:text-neutral-600">
            Términos y condiciones
          </a>
          <a href="/responsiva" className="underline hover:text-neutral-600">
            Carta responsiva
          </a>
        </div>
      </footer>
    </main>
  );
}
