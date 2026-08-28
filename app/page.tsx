import Ranking, { type Viewer } from "./Ranking";
import PaymentNotice from "./PaymentNotice";
import SiteExperience from "./SiteExperience";
import { createPublicSupabaseClient } from "../lib/supabase-public";
import { createServerSupabaseClient } from "../lib/supabase-server";
import { getCurrentUser } from "../lib/supabase-auth";
import { isValidPosition, MAX_RANKING_POSITION } from "../lib/prices";
import { missingForPublish } from "../lib/business";
import type { Reservation } from "../lib/payments";
import {
  Button,
  Container,
  EmptyState,
  Eyebrow,
  Heading,
  Lead,
  PageShell,
  SiteFooter,
  SiteHeader,
} from "@/app/ui";

export const dynamic = "force-dynamic";

type LeaderboardBusiness = {
  id: string;
  name: string;
  position: number | null;
  visits: number;
};

async function loadViewer(userId: string | undefined): Promise<Viewer> {
  if (!userId) {
    return { loggedIn: false, business: null };
  }

  const { data } = await createServerSupabaseClient()
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  if (!data) {
    return { loggedIn: true, business: null };
  }

  const business = data;

  return {
    loggedIn: true,
    business: {
      id: business.id,
      name: business.name,
      position: business.position,
      missing: missingForPublish(business),
    },
  };
}

async function loadReservations(): Promise<Reservation[]> {
  const { data } = await createServerSupabaseClient().rpc(
    "active_reservations",
  );

  return (data ?? []).map(
    (row: {
      ranking_position: number;
      amount: number | string;
      expires_at: string;
    }) => ({
      position: row.ranking_position,
      amount: Number(row.amount),
      expiresAt: row.expires_at,
    }),
  );
}

async function getSiteStats() {
  const supabase = createServerSupabaseClient();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
  }).format(new Date());
  const onlineSince = new Date(Date.now() - 90_000).toISOString();

  const [{ count: todayCount }, { count: totalCount }, { count: onlineCount }] =
    await Promise.all([
      supabase
        .from("site_visits")
        .select("*", { count: "exact", head: true })
        .eq("visit_date", today),
      supabase.from("site_visits").select("*", { count: "exact", head: true }),
      supabase
        .from("online_sessions")
        .select("*", { count: "exact", head: true })
        .gte("last_seen_at", onlineSince),
    ]);

  return {
    today: todayCount ?? 0,
    total: totalCount ?? 0,
    online: onlineCount ?? 0,
  };
}

async function getAttentionLeaderboard(): Promise<LeaderboardBusiness[]> {
  const supabase = createServerSupabaseClient();
  const { data: totals } = await supabase
    .from("business_click_totals")
    .select("business_id, visits")
    .order("visits", { ascending: false })
    .limit(3);

  const ids = (totals ?? []).flatMap((total) =>
    total.business_id ? [total.business_id] : [],
  );
  if (ids.length === 0) return [];

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, position")
    .in("id", ids)
    .eq("active", true)
    .eq("status", "published");

  return (totals ?? []).flatMap((total) => {
    const business = (businesses ?? []).find(
      (item) => item.id === total.business_id,
    );
    return business ? [{ ...business, visits: Number(total.visits) }] : [];
  });
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ position?: string; payment?: string }>;
}) {
  const { position, payment } = await searchParams;
  const user = await getCurrentUser();
  const supabase = createPublicSupabaseClient();
  const [
    { data: businesses, error },
    viewer,
    reservations,
    stats,
    attentionLeaderboard,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("*")
      .eq("active", true)
      .eq("status", "published")
      .order("position", { ascending: true, nullsFirst: false }),
    loadViewer(user?.id),
    loadReservations(),
    getSiteStats().catch(() => ({ today: 0, total: 0, online: 0 })),
    getAttentionLeaderboard().catch(() => [] as LeaderboardBusiness[]),
  ]);

  if (error) {
    return (
      <PageShell centered>
        <EmptyState tone="error" title="Error al cargar EL N1">
          {error.message}
        </EmptyState>
      </PageShell>
    );
  }

  const rankedBusinesses = (businesses ?? []).filter((business) =>
    isValidPosition(business.position),
  );

  return (
    <PageShell>
      <SiteHeader>
        <SiteExperience initialStats={stats} />

        <Button href="/como-funciona" variant="outline" size="sm">
          ¿Cómo funciona?
        </Button>

        {user ? (
          <Button href="/mi-negocio" size="sm">
            Mi negocio
          </Button>
        ) : (
          <>
            <Button
              href="/ingresar"
              variant="ghost"
              className="hidden sm:inline-flex"
            >
              Ingresar
            </Button>
            <Button href="/registro" size="sm">
              Registra tu negocio
            </Button>
          </>
        )}
      </SiteHeader>

      <PaymentNotice status={payment} />

      <Container className="pt-14 pb-12 text-center sm:pt-20">
        <Eyebrow className="mb-4">Atención para negocios mexicanos</Eyebrow>

        <Heading as="h1" size="display" className="mx-auto max-w-4xl">
          Tu negocio merece
          <span className="text-brand block">estar arriba.</span>
        </Heading>

        <Lead className="mx-auto mt-6 max-w-2xl">
          El ranking público donde los negocios compiten por visibilidad. Tú
          decides hasta dónde subir.
        </Lead>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-3 divide-x divide-neutral-200 rounded-2xl border border-neutral-200 bg-neutral-50 py-4 text-left">
          <div className="px-5">
            <p className="text-xs tracking-wider text-neutral-400 uppercase">
              Ranking
            </p>
            <p className="mt-1 font-black">Top {MAX_RANKING_POSITION}</p>
          </div>
          <div className="px-5">
            <p className="text-xs tracking-wider text-neutral-400 uppercase">
              Moneda
            </p>
            <p className="mt-1 font-black">MXN</p>
          </div>
          <div className="px-5">
            <p className="text-xs tracking-wider text-neutral-400 uppercase">
              Estado
            </p>
            <p className="mt-1 font-black text-emerald-500">● En vivo</p>
          </div>
        </div>
      </Container>

      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Ranking
          businesses={rankedBusinesses}
          reservations={reservations}
          viewer={viewer}
          initialPosition={Number(position) || null}
        />

        <aside className="mx-6 mb-14 h-fit rounded-3xl border border-neutral-200 bg-neutral-50 p-6 lg:sticky lg:top-6">
          <Eyebrow size="xs">Leaderboard</Eyebrow>
          <h2 className="mt-2 text-xl font-black">Más visitados</h2>
          <p className="mt-1 text-sm text-neutral-500">
            La atención también cuenta.
          </p>
          <ol className="mt-5 space-y-4">
            {attentionLeaderboard.length > 0 ? (
              attentionLeaderboard.map((business, index) => (
                <li key={business.id} className="flex items-center gap-3">
                  <span className="text-brand-500 w-5 text-sm font-black">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {business.name}
                    </p>
                    <p className="text-xs text-neutral-400">
                      #{business.position ?? "–"} ·{" "}
                      {business.visits.toLocaleString("es-MX")} visitas
                    </p>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-sm leading-6 text-neutral-500">
                Aún no hay visitas suficientes. Sé de los primeros en descubrir
                negocios.
              </li>
            )}
          </ol>
          <div className="mt-6 border-t border-neutral-200 pt-5 text-sm">
            <p className="font-bold">Transparencia de métricas</p>
            <p className="mt-1 leading-5 text-neutral-500">
              Contamos una visita anónima por dispositivo al día. No vendemos ni
              mostramos datos personales.
            </p>
          </div>
        </aside>
      </div>

      <SiteFooter />
    </PageShell>
  );
}
