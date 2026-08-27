import Link from "next/link";
import Ranking, { type Viewer } from "./Ranking";
import PaymentNotice from "./PaymentNotice";
import { createPublicSupabaseClient } from "../lib/supabase-public";
import { createServerSupabaseClient } from "../lib/supabase-server";
import { getCurrentUser } from "../lib/supabase-auth";
import { isValidPosition } from "../lib/prices";
import { missingForPublish, type Business } from "../lib/business";
import type { Reservation } from "../lib/payments";

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

  const rankedBusinesses = (businesses ?? []).filter((business) =>
    isValidPosition(business.position)
  );

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="text-2xl font-black tracking-tight">
            EL <span className="text-sky-400">N1</span>
          </div>

          <nav className="flex items-center gap-2 text-sm font-medium">
            <Link
              href="/como-funciona"
              className="rounded-full border border-neutral-300 px-4 py-2 text-neutral-700 transition hover:bg-neutral-100"
            >
              ¿Cómo funciona?
            </Link>

            {user ? (
              <Link
                href="/mi-negocio"
                className="rounded-full bg-neutral-900 px-4 py-2 text-white transition hover:bg-neutral-700"
              >
                Mi negocio
              </Link>
            ) : (
              <>
                <Link
                  href="/ingresar"
                  className="hidden px-3 py-2 text-neutral-700 hover:underline sm:inline"
                >
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="rounded-full bg-neutral-900 px-4 py-2 text-white transition hover:bg-neutral-700"
                >
                  Registra tu negocio
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <PaymentNotice status={payment} />

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
        reservations={reservations}
        viewer={viewer}
        initialPosition={Number(position) || null}
      />

      <footer className="border-t border-neutral-200 py-8 text-center text-sm text-neutral-400">
        EL N1 — México
      </footer>
    </main>
  );
}
