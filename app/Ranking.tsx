"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  MAX_OFFER,
  isValidPosition,
  minimumOffer,
  normalizeOffer,
  projectedPosition,
} from "@/lib/prices";
import type { Business } from "@/lib/business";
import { RESERVATION_MINUTES, type Reservation } from "@/lib/payments";
import { formatPrice } from "@/lib/format";
import { taxBreakdown } from "@/lib/legal";
import { SlotCard } from "./components/SlotCard";
import {
  Alert,
  Button,
  Container,
  Eyebrow,
  Field,
  Figure,
  Heading,
  LiveDot,
  Modal,
  MoneyInput,
  Muted,
  cn,
} from "@/app/ui";

/** Lo que la portada sabe del visitante para decidir qué mostrar en el modal. */
export type Viewer = {
  loggedIn: boolean;
  business: {
    id: string;
    name: string;
    position: number | null;
    missing: string[];
  } | null;
};

type Props = {
  businesses: Business[];
  reservations: Reservation[];
  viewer: Viewer;
  initialPosition?: number | null;
};

type LiveState = { businesses: Business[]; reservations: Reservation[] };

const POLL_INTERVAL_MS = 5000;

function reservationAtIn(
  reservations: Reservation[],
  position: number,
): Reservation | null {
  const now = Date.now();
  return (
    reservations.find(
      (reservation) =>
        reservation.position === position &&
        new Date(reservation.expiresAt).getTime() > now,
    ) ?? null
  );
}

function competingIn(
  reservations: Reservation[],
  amount: number,
): Reservation | null {
  const now = Date.now();
  return (
    reservations.find(
      (reservation) =>
        reservation.amount >= amount &&
        new Date(reservation.expiresAt).getTime() > now,
    ) ?? null
  );
}

function rankedOf(businesses: Business[]): Business[] {
  return businesses
    .filter((business) => isValidPosition(business.position))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export default function Ranking({
  businesses: initialBusinesses,
  reservations: initialReservations,
  viewer,
  initialPosition = null,
}: Props) {
  const viewerId = viewer.business?.id ?? null;

  const [live, setLive] = useState<LiveState>({
    businesses: initialBusinesses,
    reservations: initialReservations,
  });
  const [open, setOpen] = useState(
    Boolean(initialPosition && isValidPosition(initialPosition)),
  );
  const [targetName, setTargetName] = useState<string | null>(null);
  const [offer, setOffer] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todas");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/ranking", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as LiveState;
      setLive({ businesses: data.businesses, reservations: data.reservations });
    } catch {
      // Sin red: se reintenta en el siguiente ciclo.
    }
  }, []);

  // Ranking en vivo: polling de respaldo + Realtime cuando cambia `businesses`.
  useEffect(() => {
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    let cleanup = () => {};

    if (url && key) {
      const client = createClient(url, key, { auth: { persistSession: false } });
      const channel = client
        .channel("ranking-live")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "businesses" },
          () => {
            void refresh();
          },
        )
        .subscribe();

      cleanup = () => {
        void client.removeChannel(channel);
      };
    }

    return () => {
      clearInterval(timer);
      cleanup();
    };
  }, [refresh]);

  const { businesses, reservations } = live;

  const ranked = useMemo(() => rankedOf(businesses), [businesses]);
  const viewerRanked =
    (viewerId && ranked.find((business) => business.id === viewerId)) || null;

  const liveMinimum = minimumOffer(ranked, viewerRanked);
  const offerAmount = normalizeOffer(offer) ?? liveMinimum;
  const projected = projectedPosition(offerAmount, ranked, viewerId);
  const tax = taxBreakdown(offerAmount);

  const competingReservation = competingIn(reservations, offerAmount);
  const reservationAt = (position: number) => reservationAtIn(reservations, position);

  const categoryOptions = Array.from(
    new Set(
      ranked.flatMap((business) =>
        business.category ? [business.category] : [],
      ),
    ),
  );

  /** Abre el modal con el monto prellenado para superar a `business` (o entrar). */
  function openOffer(business: Business | null) {
    const beatPrice =
      business && business.id !== viewerId
        ? Math.floor(Number(business.current_price)) + 1
        : null;

    setTargetName(business && business.id !== viewerId ? business.name : null);
    setOffer(String(Math.max(liveMinimum, beatPrice ?? 0)));
    setNotice(null);
    setError(null);
    setLoading(false);
    setOpen(true);
  }

  function openPosition(position: number) {
    openOffer(ranked.find((business) => business.position === position) ?? null);
  }

  function closeModal() {
    setOpen(false);
    setTargetName(null);
    setOffer("");
    setNotice(null);
    setError(null);
    setLoading(false);
  }

  async function reserveAndPay() {
    const amount = normalizeOffer(offer);

    if (amount === null) {
      setError("Escribe un monto válido en pesos.");
      return;
    }

    if (amount < liveMinimum) {
      setOffer(String(liveMinimum));
      setNotice(`La oferta mínima ahora mismo es ${formatPrice(liveMinimum)}.`);
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        minimum?: number;
        init_point?: string;
      };

      if (data.code === "below_minimum" && typeof data.minimum === "number") {
        await refresh();
        setOffer(String(data.minimum));
        setNotice(data.error ?? "El mínimo cambió. Revisa tu oferta.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || "No se pudo iniciar el pago.");
        setLoading(false);
        return;
      }

      if (!data.init_point) {
        setError("Mercado Pago no devolvió la dirección de pago.");
        setLoading(false);
        return;
      }

      window.location.assign(data.init_point);
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  const nextParam = `?next=${encodeURIComponent("/?position=1")}`;

  const canBid =
    viewer.loggedIn &&
    viewer.business !== null &&
    viewer.business.missing.length === 0;

  const visibleRanked =
    activeCategory === "Todas"
      ? ranked
      : ranked.filter((business) => business.category === activeCategory);

  const nextFree =
    ranked.length < 50 ? (ranked[ranked.length - 1]?.position ?? 0) + 1 : null;

  return (
    <>
      <Container className="pb-20">
        <div className="border-rule border-t-2 pt-8">
          <LiveDot>Ranking en vivo</LiveDot>
          <Heading as="h2" size="title" className="mt-3">
            Las posiciones
          </Heading>
          <Muted className="mt-2 max-w-[640px]">
            El ranking se ordena por lo que cada negocio ofrece: el que más
            paga está arriba, siempre. Elige tu monto y el sitio te dice dónde
            quedarías. Pasa el cursor o toca un negocio para ver su anuncio.
          </Muted>
        </div>

        <div
          role="group"
          aria-label="Filtrar por categoría"
          className="mt-6 flex gap-2 overflow-x-auto pb-2"
        >
          {["Todas", ...categoryOptions].map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "border-rule shrink-0 border-2 px-4 py-2 text-[12px] font-bold tracking-[0.08em] uppercase transition-colors duration-[120ms]",
                  active
                    ? "bg-ink text-bg"
                    : "text-ink hover:bg-surface bg-transparent",
                )}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-3">
          {visibleRanked.map((business) => {
            const position = business.position as number;

            return (
              <SlotCard
                key={business.id}
                position={position}
                business={business}
                onBid={openPosition}
                reservation={reservationAt(position)}
                minimumOffer={Math.max(
                  liveMinimum,
                  business.id === viewerId
                    ? liveMinimum
                    : Math.floor(Number(business.current_price)) + 1,
                )}
                isOwn={Boolean(viewerId && business.id === viewerId)}
              />
            );
          })}

          {activeCategory === "Todas" && nextFree !== null && (
            <SlotCard
              key={`free-${nextFree}`}
              position={nextFree}
              business={null}
              onBid={() => openOffer(null)}
              reservation={reservationAt(nextFree)}
              minimumOffer={liveMinimum}
            />
          )}
        </div>
      </Container>

      {open && (
        <Modal
          onClose={closeModal}
          eyebrow="Tu oferta"
          title={
            targetName
              ? `Supera a ${targetName}`
              : viewerRanked
                ? "Sube tu oferta"
                : "Entra al ranking"
          }
          actions={
            canBid ? (
              <>
                <Button size="lg" onClick={reserveAndPay} disabled={loading}>
                  {loading
                    ? "Reservando…"
                    : `Ofertar y pagar ${formatPrice(tax.total)}`}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="px-6"
                  onClick={closeModal}
                >
                  Cancelar
                </Button>
              </>
            ) : undefined
          }
        >
          {!viewer.loggedIn ? (
            <div>
              <p className="text-ink text-[15px] leading-relaxed">
                Para ofertar necesitas una cuenta de negocio. Es gratis: te
                registras, completas tu perfil y pagas solo cuando quieras
                publicarte.
              </p>
              <Button
                href={`/registro${nextParam}`}
                size="lg"
                block
                className="mt-5"
              >
                Registra tu negocio
              </Button>
              <Button
                href={`/ingresar${nextParam}`}
                variant="link"
                className="mt-4"
              >
                Ya tengo cuenta
              </Button>
            </div>
          ) : !viewer.business ? (
            <p className="text-ink text-[15px] leading-relaxed">
              No encontramos un negocio ligado a tu cuenta.
            </p>
          ) : viewer.business.missing.length > 0 ? (
            <div>
              <p className="text-ink text-[15px] leading-relaxed">
                Antes de publicar, completa tu perfil. Falta:
              </p>
              <ul className="text-ink mt-2 list-disc space-y-1 pl-5 text-[15px]">
                {viewer.business.missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Button href="/mi-negocio" size="lg" block className="mt-5">
                Completar mi perfil
              </Button>
            </div>
          ) : (
            <>
              {viewerRanked && (
                <div className="border-rule flex items-baseline justify-between gap-4 border-b-2 pb-4">
                  <Eyebrow tone="muted">
                    Tu oferta actual (#{viewerRanked.position})
                  </Eyebrow>
                  <Figure size={22}>
                    {formatPrice(viewerRanked.current_price)}
                  </Figure>
                </div>
              )}

              <div className="py-4">
                <Field
                  label="Tu oferta (MXN, sin IVA)"
                  hint={`Mínimo ${formatPrice(liveMinimum)} (al menos 10 % arriba del precio más bajo del ranking${viewerRanked ? " y mayor que tu oferta actual" : ""}). Máximo ${formatPrice(MAX_OFFER)}.`}
                >
                  <MoneyInput
                    min={liveMinimum}
                    max={MAX_OFFER}
                    step={1}
                    value={offer}
                    onChange={(event) => setOffer(event.target.value)}
                    disabled={loading}
                  />
                </Field>
              </div>

              <div className="border-rule flex items-baseline justify-between gap-4 border-t-2 py-4">
                <div>
                  <Eyebrow>Quedarías en</Eyebrow>
                  <p className="text-muted mt-1 text-[12px]">
                    Estimado: la posición se asigna al confirmarse el pago.
                  </p>
                </div>
                <Figure size={30} tone="accent">
                  {projected === null ? "—" : `#${projected}`}
                </Figure>
              </div>

              <dl className="border-rule-soft text-muted grid grid-cols-[minmax(0,1fr)_auto] gap-y-1 border-t py-3 text-[13px] tabular-nums">
                <dt>Subtotal</dt>
                <dd className="text-right">{formatPrice(tax.subtotal)}</dd>
                <dt>IVA 16 %</dt>
                <dd className="text-right">{formatPrice(tax.iva)}</dd>
                <dt className="text-ink font-bold">Total a pagar</dt>
                <dd className="text-ink text-right font-bold">
                  {formatPrice(tax.total)}
                </dd>
              </dl>
              <div className="border-rule border-b-2" />

              {competingReservation && (
                <p className="text-accent-press mt-4 flex items-center gap-2 text-[13px]">
                  <LiveDot />
                  Alguien está ofertando {formatPrice(competingReservation.amount)}{" "}
                  ahora mismo; si confirma antes que tú, tu posición estimada
                  puede bajar.
                </p>
              )}

              <div className="text-muted mt-4 space-y-2 text-[13px] leading-relaxed">
                <p>
                  Negocio:{" "}
                  <strong className="text-ink">{viewer.business.name}</strong>
                </p>
                <p>
                  Tu oferta reemplaza a la anterior (no se acumulan). Tienes{" "}
                  {RESERVATION_MINUTES} minutos para pagar en Mercado Pago; al
                  confirmarse, el ranking se reordena y tu lugar es tuyo
                  mientras nadie ofrezca más.
                </p>
                <p>
                  Al pagar aceptas los{" "}
                  <Link
                    href="/terminos"
                    className="text-accent-press underline"
                  >
                    términos y condiciones
                  </Link>
                  , incluidas las reglas del ranking y la política de
                  reembolsos.
                </p>
              </div>

              {notice && (
                <Alert tone="accent" compact className="mt-4">
                  {notice}
                </Alert>
              )}

              {error && (
                <Alert tone="error" compact className="mt-4">
                  {error}
                </Alert>
              )}
            </>
          )}
        </Modal>
      )}
    </>
  );
}
