import Ranking, { type Viewer } from "./Ranking";
import PaymentNotice from "./PaymentNotice";
import { createPublicSupabaseClient } from "../lib/supabase-public";
import { createServerSupabaseClient } from "../lib/supabase-server";
import { getCurrentUser } from "../lib/supabase-auth";
import { isValidPosition } from "../lib/prices";
import { missingForPublish, type Business } from "../lib/business";
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

  const business = data as Business;

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
  const { data } = await createServerSupabaseClient().rpc("active_reservations");

  return (data ?? []).map(
    (row: { ranking_position: number; amount: number | string; expires_at: string }) => ({
      position: row.ranking_position,
      amount: Number(row.amount),
      expiresAt: row.expires_at,
    })
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ position?: string; payment?: string }>;
}) {
  const { position, payment } = await searchParams;
  const user = await getCurrentUser();
  const supabase = createPublicSupabaseClient();
  const [{ data: businesses, error }, viewer, reservations] = await Promise.all([
    supabase
      .from("businesses")
      .select("*")
      .eq("active", true)
      .order("position", { ascending: true, nullsFirst: false }),
    loadViewer(user?.id),
    loadReservations(),
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
    isValidPosition(business.position)
  );

  return (
    <PageShell>
      <SiteHeader>
        <Button href="/como-funciona" variant="outline" size="sm">
          ¿Cómo funciona?
        </Button>

        {user ? (
          <Button href="/mi-negocio" size="sm">
            Mi negocio
          </Button>
        ) : (
          <>
            <Button href="/ingresar" variant="ghost" className="hidden sm:inline-flex">
              Ingresar
            </Button>
            <Button href="/registro" size="sm">
              Registra tu negocio
            </Button>
          </>
        )}
      </SiteHeader>

      <PaymentNotice status={payment} />

      <Container className="pb-14 pt-16 text-center">
        <Eyebrow className="mb-4">El ranking de México</Eyebrow>

        <Heading as="h1" size="display" className="mx-auto max-w-3xl">
          ¿Quién merece ser
          <span className="block text-brand">EL N1?</span>
        </Heading>

        <Lead className="mx-auto mt-6 max-w-xl">
          Los negocios compiten por estar arriba.
          <br />
          ¿Hasta dónde estás dispuesto a llegar?
        </Lead>
      </Container>

      <Ranking
        businesses={rankedBusinesses}
        reservations={reservations}
        viewer={viewer}
        initialPosition={Number(position) || null}
      />

      <SiteFooter />
    </PageShell>
  );
}
