import Ranking, { type Viewer } from "./Ranking";
import PaymentNotice from "./PaymentNotice";
import SiteExperience from "./SiteExperience";
import { createPublicSupabaseClient } from "@/lib/supabase-public";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/supabase-auth";
import { isValidPosition, MAX_RANKING_POSITION } from "@/lib/prices";
import { missingForPublish } from "@/lib/business";
import type { Reservation } from "@/lib/payments";
import {
  Button,
  Container,
  EmptyState,
  Eyebrow,
  Figure,
  Heading,
  Lead,
  LiveDot,
  NavLink,
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
  const leader =
    rankedBusinesses.find((business) => business.position === 1) ?? null;
  const occupied = rankedBusinesses.length;

  return (
    <PageShell>
      <SiteHeader>
        <div className="hidden md:block">
          <SiteExperience initialStats={stats} />
        </div>
        <NavLink href="/como-funciona" className="hidden sm:inline-block">
          Cómo funciona
        </NavLink>
        {user ? (
          <NavLink href="/mi-negocio" prefix>
            Mi negocio
          </NavLink>
        ) : (
          <>
            <NavLink href="/ingresar" className="hidden sm:inline-block">
              Ingresar
            </NavLink>
            <Button href="/registro" size="sm">
              <span className="sm:hidden">Registrarme</span>
              <span className="hidden sm:inline">Registra tu negocio</span>
            </Button>
          </>
        )}
      </SiteHeader>

      <PaymentNotice status={payment} />

      <Container className="pt-12 pb-12 sm:pt-16">
        <Eyebrow>Ranking público de negocios en México</Eyebrow>
        <Heading as="h1" size="display" className="mt-4 max-w-[900px]">
          Quien paga más queda arriba.
        </Heading>
        <Lead className="mt-6 max-w-[640px]">
          {MAX_RANKING_POSITION} posiciones. Cada lugar es de quien lo paga,
          mientras nadie pague más. Tú decides hasta dónde subir.
        </Lead>

        <div className="border-rule mt-10 grid border-2 sm:grid-cols-3">
          <div className="border-rule border-b-2 px-5 py-4 sm:border-r-2 sm:border-b-0">
            <p className="label text-faint">El N1 ahora</p>
            <p className="mt-2 truncate text-xl leading-tight font-extrabold tracking-[-0.01em]">
              {leader ? leader.name : "Posición libre"}
            </p>
          </div>
          <div className="border-rule border-b-2 px-5 py-4 sm:border-r-2 sm:border-b-0">
            <p className="label text-faint">Posiciones ocupadas</p>
            <p className="mt-2">
              <Figure size={22}>
                {occupied} / {MAX_RANKING_POSITION}
              </Figure>
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="label text-faint">Estado</p>
            <p className="mt-2">
              <LiveDot className="text-ink">
                En vivo · se actualiza al pagar
              </LiveDot>
            </p>
          </div>
        </div>
      </Container>

      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Ranking
          businesses={rankedBusinesses}
          reservations={reservations}
          viewer={viewer}
          initialPosition={Number(position) || null}
        />

        <aside className="border-rule bg-surface mx-4 mb-14 h-fit border-2 sm:mx-8 lg:sticky lg:top-6 lg:mr-8 lg:ml-0">
          <div className="border-rule border-b-2 px-5 py-4">
            <Eyebrow tone="muted">Más visitados</Eyebrow>
            <h2 className="mt-1 text-[22px] leading-tight font-extrabold tracking-[-0.01em]">
              La atención también cuenta
            </h2>
          </div>
          <ol className="divide-rule-soft divide-y">
            {attentionLeaderboard.length > 0 ? (
              attentionLeaderboard.map((business, index) => (
                <li
                  key={business.id}
                  className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 px-5 py-4"
                >
                  <Figure size={20} tone={index === 0 ? "accent" : "ink"}>
                    {index + 1}
                  </Figure>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold">
                      {business.name}
                    </p>
                    <p className="text-muted text-[13px] tabular-nums">
                      #{business.position ?? "–"} ·{" "}
                      {business.visits.toLocaleString("es-MX")} visitas
                    </p>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-muted px-5 py-4 text-sm leading-relaxed">
                Aún no hay visitas suficientes. Sé de los primeros en descubrir
                negocios.
              </li>
            )}
          </ol>
          <div className="border-rule text-muted border-t-2 px-5 py-4 text-[13px] leading-relaxed">
            <p className="text-ink font-bold">Transparencia de métricas</p>
            <p className="mt-1">
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
