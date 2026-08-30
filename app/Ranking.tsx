"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BASE_PRICE,
  MAX_OFFER,
  isValidPosition,
  minimumOfferFor,
  nextFreePosition,
  normalizeOffer,
  priceFloor,
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

/** Foto de la posición elegida al abrir el modal, para detectar cambios. */
type Snapshot = {
  holderId: string | null;
  holderName: string | null;
  minimum: number;
};

const POLL_INTERVAL_MS = 5000;

function rankedOf(businesses: Business[]): Business[] {
  return businesses
    .filter((business) => isValidPosition(business.position))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

function reservationAtIn(
  reservations: Reservation[],
  position: number,
): Reservation | null {
  return (
    reservations.find(
      (reservation) =>
        reservation.position === position &&
        new Date(reservation.expiresAt).getTime() > Date.now(),
    ) ?? null
  );
}

function minimumAt(
  position: number,
  ranked: Business[],
  reservations: Reservation[],
  viewerId: string | null,
): number {
  const floor = priceFloor(
    position,
    ranked,
    reservationAtIn(reservations, position)?.amount ?? null,
    viewerId,
  );
  return minimumOfferFor(position, floor);
}

function snapshotAt(
  position: number,
  ranked: Business[],
  reservations: Reservation[],
  viewerId: string | null,
): Snapshot {
  const holder =
    ranked.find((business) => business.position === position) ?? null;
  return {
    holderId: holder?.id ?? null,
    holderName: holder?.name ?? null,
    minimum: minimumAt(position, ranked, reservations, viewerId),
  };
}

function describeChange(
  before: Snapshot,
  after: Snapshot,
  position: number,
): string | null {
  if (before.holderId !== after.holderId) {
    if (after.holderId === null) {
      return `El ranking cambió: la posición #${position} ahora está libre.`;
    }
    if (before.holderId === null) {
      return `Alguien acaba de entrar al ranking: la posición #${position} ahora es de ${after.holderName}.`;
    }
    return `El ranking cambió: la posición #${position} ahora es de ${after.holderName} y superarla cuesta ${formatPrice(after.minimum)}.`;
  }

  if (before.minimum !== after.minimum) {
    return `El precio cambió: superar la posición #${position} ahora cuesta ${formatPrice(after.minimum)}.`;
  }

  return null;
}

export default function Ranking({
  businesses: initialBusinesses,
  reservations: initialReservations,
  viewer,
  initialPosition = null,
}: Props) {
  const viewerId = viewer.business?.id ?? null;
  const startPosition =
    initialPosition && isValidPosition(initialPosition) ? initialPosition : null;

  const [live, setLive] = useState<LiveState>({
    businesses: initialBusinesses,
    reservations: initialReservations,
  });
  const [selectedPosition, setSelectedPosition] = useState<number | null>(
    startPosition,
  );
  const [snapshot, setSnapshot] = useState<Snapshot | null>(() =>
    startPosition === null
      ? null
      : snapshotAt(
          startPosition,
          rankedOf(initialBusinesses),
          initialReservations,
          viewerId,
        ),
  );
  const [offer, setOffer] = useState(() =>
    startPosition === null
      ? ""
      : String(
          minimumAt(
            startPosition,
            rankedOf(initialBusinesses),
            initialReservations,
            viewerId,
          ),
        ),
  );
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
  const nextFree = nextFreePosition(ranked);
  const viewerPosition =
    ranked.find((business) => business.id === viewerId)?.position ?? null;

  const categoryOptions = Array.from(
    new Set(
      ranked.flatMap((business) =>
        business.category ? [business.category] : [],
      ),
    ),
  );
  const businessAt = (position: number) =>
    ranked.find((business) => business.position === position) ?? null;
  const reservationAt = (position: number) =>
    reservationAtIn(reservations, position);
  const minimumOfferAt = (position: number) =>
    minimumAt(position, ranked, reservations, viewerId);
  const snapshotOf = (position: number) =>
    snapshotAt(position, ranked, reservations, viewerId);

  const selectedBusiness = selectedPosition
    ? businessAt(selectedPosition)
    : null;
  const ownsSelected = Boolean(
    selectedBusiness && viewerId && selectedBusiness.id === viewerId,
  );
  const liveMinimum = selectedPosition
    ? minimumOfferAt(selectedPosition)
    : BASE_PRICE;
  const offerAmount = normalizeOffer(offer, liveMinimum) ?? liveMinimum;
  const tax = taxBreakdown(offerAmount);
  const selectedIsFree = selectedPosition !== null && selectedBusiness === null;
  const freeMoved = selectedIsFree && selectedPosition !== nextFree;

  function openPosition(position: number) {
    setSelectedPosition(position);
    setSnapshot(snapshotOf(position));
    setOffer(String(minimumOfferAt(position)));
    setNotice(null);
    setError(null);
    setLoading(false);
  }

  // Con el modal abierto, avisar si la posición elegida cambió por debajo
  // (se compara la foto tomada al abrir con el estado en vivo).
  const changeNotice =
    selectedPosition === null || snapshot === null
      ? null
      : freeMoved
        ? nextFree === null
          ? "Alguien acaba de entrar y el ranking está lleno. Ahora solo puedes entrar superando a un negocio."
          : `Alguien acaba de entrar al ranking. El siguiente lugar libre ahora es el #${nextFree}.`
        : describeChange(snapshot, snapshotOf(selectedPosition), selectedPosition);

  function acceptChange() {
    if (selectedPosition === null) return;
    if (freeMoved) {
      if (nextFree === null) {
        closeModal();
        return;
      }
      openPosition(nextFree);
      return;
    }
    setSnapshot(snapshotOf(selectedPosition));
    if (offerAmount < liveMinimum) setOffer(String(liveMinimum));
  }

  function closeModal() {
    setSelectedPosition(null);
    setSnapshot(null);
    setOffer("");
    setNotice(null);
    setError(null);
    setLoading(false);
  }

  async function reserveAndPay() {
    if (!selectedPosition) return;

    const amount = normalizeOffer(offer, liveMinimum);

    if (amount === null) {
      setError("Escribe un monto válido en pesos.");
      return;
    }

    if (Number(offer) < liveMinimum) {
      setOffer(String(liveMinimum));
      setNotice(
        `La oferta mínima para esta posición es ${formatPrice(liveMinimum)}.`,
      );
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: selectedPosition, amount }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        amount?: number;
        nextFree?: number | null;
        init_point?: string;
      };

      if (response.status === 409) {
        await refresh();
        if (data.code === "price_changed" && typeof data.amount === "number") {
          setOffer(String(data.amount));
        }
        setNotice(
          data.error ?? "El ranking cambió. Revisa el precio antes de continuar.",
        );
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

  const nextParam = selectedPosition
    ? `?next=${encodeURIComponent(`/?position=${selectedPosition}`)}`
    : "";

  /* Qué muestra el diálogo según quién mira y qué posición eligió. */
  const canBid =
    viewer.loggedIn &&
    viewer.business !== null &&
    viewer.business.missing.length === 0 &&
    (viewerPosition === null ||
      selectedPosition === null ||
      selectedPosition <= viewerPosition);

  const visibleRanked =
    activeCategory === "Todas"
      ? ranked
      : ranked.filter((business) => business.category === activeCategory);

  return (
    <>
      <Container className="pb-20">
        <div className="border-rule border-t-2 pt-8">
          <LiveDot>Ranking en vivo</LiveDot>
          <Heading as="h2" size="title" className="mt-3">
            Las posiciones
          </Heading>
          <Muted className="mt-2 max-w-[640px]">
            Cada posición se mantiene mientras nadie pague más. Supera a quien
            quieras o entra al siguiente lugar libre. Pasa el cursor o toca un
            negocio para ver su anuncio.
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
                minimumOffer={minimumOfferAt(position)}
                isOwn={Boolean(viewerId && business.id === viewerId)}
              />
            );
          })}

          {activeCategory === "Todas" && nextFree !== null && (
            <SlotCard
              key={`free-${nextFree}`}
              position={nextFree}
              business={null}
              onBid={openPosition}
              reservation={reservationAt(nextFree)}
              minimumOffer={minimumOfferAt(nextFree)}
            />
          )}
        </div>
      </Container>

      {selectedPosition !== null && (
        <Modal
          onClose={closeModal}
          eyebrow={`Posición #${selectedPosition}`}
          title={
            ownsSelected
              ? "Blinda tu lugar"
              : selectedBusiness
                ? `Supera a ${selectedBusiness.name}`
                : "Entra al ranking"
          }
          actions={
            canBid ? (
              <>
                <Button
                  size="lg"
                  onClick={reserveAndPay}
                  disabled={loading || Boolean(changeNotice)}
                >
                  {loading
                    ? "Reservando…"
                    : `Reservar y pagar ${formatPrice(tax.total)}`}
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
          ) : viewerPosition !== null && selectedPosition > viewerPosition ? (
            <p className="text-ink text-[15px] leading-relaxed">
              Ya ocupas la posición #{viewerPosition}, que es mejor que la #
              {selectedPosition}. Elige una posición más alta.
            </p>
          ) : (
            <>
              {changeNotice && (
                <Alert tone="accent" title="El ranking cambió" className="mb-4">
                  <p>{changeNotice}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={acceptChange}>
                      {freeMoved
                        ? nextFree === null
                          ? "Entendido"
                          : `Ir al #${nextFree}`
                        : offerAmount < liveMinimum
                          ? `Ofertar ${formatPrice(liveMinimum)}`
                          : "Continuar"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={closeModal}>
                      Cancelar
                    </Button>
                  </div>
                </Alert>
              )}

              {selectedBusiness && (
                <div className="border-rule flex items-baseline justify-between gap-4 border-b-2 pb-4">
                  <Eyebrow tone="muted">
                    {ownsSelected ? "Tu oferta actual" : "Paga ahora"}
                  </Eyebrow>
                  <Figure size={22}>
                    {formatPrice(selectedBusiness.current_price)}
                  </Figure>
                </div>
              )}

              <div className="py-4">
                <Field
                  label={ownsSelected ? "Nueva oferta" : "Tu oferta"}
                  hint={`Mínimo ${formatPrice(liveMinimum)}. Puedes ofrecer más para que superarte cueste 10 % sobre lo que tú pagaste (máximo ${formatPrice(MAX_OFFER)}).`}
                >
                  <MoneyInput
                    min={liveMinimum}
                    max={MAX_OFFER}
                    step={1}
                    value={offer}
                    onChange={(event) => setOffer(event.target.value)}
                    disabled={loading || Boolean(changeNotice)}
                  />
                </Field>
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

              {reservationAt(selectedPosition) && (
                <p className="text-accent-press mt-4 flex items-center gap-2 text-[13px]">
                  <LiveDot />
                  Hay una reserva activa sobre esta posición; el mínimo ya la
                  supera.
                </p>
              )}

              <div className="text-muted mt-4 space-y-2 text-[13px] leading-relaxed">
                <p>
                  Negocio:{" "}
                  <strong className="text-ink">{viewer.business.name}</strong>
                </p>
                <p>
                  Reservamos la posición a este precio durante{" "}
                  {RESERVATION_MINUTES} minutos y te enviamos a Mercado Pago. Tu
                  lugar es tuyo mientras nadie pague más.
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
