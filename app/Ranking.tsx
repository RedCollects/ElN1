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
} from "../lib/prices";
import type { Business } from "../lib/business";
import { RESERVATION_MINUTES, type Reservation } from "../lib/payments";
import { formatPrice } from "../lib/format";
import { RankingCard } from "./components/RankingCard";
import {
  Alert,
  Button,
  Container,
  Eyebrow,
  Field,
  Heading,
  Modal,
  Muted,
  PrefixedInput,
  Price,
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
type Snapshot = { holderId: string | null; holderName: string | null; minimum: number };

const POLL_INTERVAL_MS = 5000;

function rankedOf(businesses: Business[]): Business[] {
  return businesses
    .filter((business) => isValidPosition(business.position))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

function reservationAtIn(reservations: Reservation[], position: number): Reservation | null {
  return (
    reservations.find(
      (reservation) =>
        reservation.position === position && new Date(reservation.expiresAt).getTime() > Date.now()
    ) ?? null
  );
}

function minimumAt(
  position: number,
  ranked: Business[],
  reservations: Reservation[],
  viewerId: string | null
): number {
  const floor = priceFloor(
    position,
    ranked,
    reservationAtIn(reservations, position)?.amount ?? null,
    viewerId
  );
  return minimumOfferFor(position, floor);
}

function snapshotAt(
  position: number,
  ranked: Business[],
  reservations: Reservation[],
  viewerId: string | null
): Snapshot {
  const holder = ranked.find((business) => business.position === position) ?? null;
  return {
    holderId: holder?.id ?? null,
    holderName: holder?.name ?? null,
    minimum: minimumAt(position, ranked, reservations, viewerId),
  };
}

function describeChange(before: Snapshot, after: Snapshot, position: number): string | null {
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
  const [live, setLive] = useState<LiveState>({
    businesses: initialBusinesses,
    reservations: initialReservations,
  });
  const startPosition =
    initialPosition && isValidPosition(initialPosition) ? initialPosition : null;
  const [selectedPosition, setSelectedPosition] = useState<number | null>(startPosition);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(() =>
    startPosition === null
      ? null
      : snapshotAt(
          startPosition,
          rankedOf(initialBusinesses),
          initialReservations,
          viewer.business?.id ?? null
        )
  );
  const [offer, setOffer] = useState(() =>
    startPosition === null
      ? ""
      : String(
          minimumAt(
            startPosition,
            rankedOf(initialBusinesses),
            initialReservations,
            viewer.business?.id ?? null
          )
        )
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
        .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, () => {
          void refresh();
        })
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
  const viewerId = viewer.business?.id ?? null;
  const nextFree = nextFreePosition(ranked);
  const viewerBusiness = viewer.business
    ? (ranked.find((business) => business.id === viewer.business?.id) ?? null)
    : null;
  const viewerPosition = viewerBusiness?.position ?? null;

  const categoryOptions = Array.from(
    new Set(ranked.flatMap((business) => (business.category ? [business.category] : [])))
  );
  const businessAt = (position: number) =>
    ranked.find((business) => business.position === position) ?? null;
  const reservationAt = (position: number) => reservationAtIn(reservations, position);
  const minimumOfferAt = (position: number) => minimumAt(position, ranked, reservations, viewerId);
  const snapshotOf = (position: number) => snapshotAt(position, ranked, reservations, viewerId);

  const selectedBusiness = selectedPosition ? businessAt(selectedPosition) : null;
  const ownsSelected = Boolean(
    selectedBusiness && viewer.business && selectedBusiness.id === viewer.business.id
  );
  const liveMinimum = selectedPosition ? minimumOfferAt(selectedPosition) : BASE_PRICE;
  const offerAmount = normalizeOffer(offer, liveMinimum) ?? liveMinimum;
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
      setNotice(`La oferta mínima para esta posición es ${formatPrice(liveMinimum)}.`);
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
        setNotice(data.error ?? "El ranking cambió. Revisa el precio antes de continuar.");
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

  const visibleRanked =
    activeCategory === "Todas"
      ? ranked
      : ranked.filter((business) => business.category === activeCategory);

  return (
    <>
      <Container width="content" className="pb-20">
        <div className="mb-6">
          <Eyebrow>Ranking actual</Eyebrow>
          <Heading as="h2" className="mt-1">
            Los que están arriba
          </Heading>
          <Muted className="mt-2">
            Supera a quien quieras o entra al siguiente lugar libre. Pasa el cursor o toca un
            negocio para ver su anuncio.
          </Muted>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {["Todas", ...categoryOptions].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={
                activeCategory === category
                  ? "shrink-0 rounded-full bg-neutral-950 px-4 py-2 text-sm font-bold text-white"
                  : "shrink-0 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-600 transition hover:border-brand-300"
              }
            >
              {category}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {visibleRanked.map((business) => {
            const position = business.position as number;

            return (
              <RankingCard
                key={business.id}
                position={position}
                business={business}
                onBid={openPosition}
                reservation={reservationAt(position)}
                minimumOffer={minimumOfferAt(position)}
                isOwn={Boolean(viewer.business && business.id === viewer.business.id)}
              />
            );
          })}

          {activeCategory === "Todas" && nextFree !== null && (
            <RankingCard
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
              ? "Blinda tu posición"
              : selectedBusiness
                ? "Superar posición"
                : "Entra al ranking"
          }
        >
          {!viewer.loggedIn ? (
            <div className="mt-6">
              <p className="text-sm leading-6 text-neutral-600">
                Para ofertar necesitas una cuenta de negocio. Es gratis: te registras,
                completas tu perfil y pagas solo cuando quieras publicarte.
              </p>
              <Button href={`/registro${nextParam}`} size="lg" block className="mt-5">
                REGISTRA TU NEGOCIO
              </Button>
              <Button href={`/ingresar${nextParam}`} variant="ghost" block className="mt-3 py-3">
                Ya tengo cuenta
              </Button>
            </div>
          ) : !viewer.business ? (
            <p className="mt-6 text-sm text-neutral-600">
              No encontramos un negocio ligado a tu cuenta.
            </p>
          ) : viewer.business.missing.length > 0 ? (
            <div className="mt-6">
              <p className="text-sm leading-6 text-neutral-600">
                Antes de publicar, completa tu perfil. Falta:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-600">
                {viewer.business.missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Button href="/mi-negocio" size="lg" block className="mt-5">
                COMPLETAR MI PERFIL
              </Button>
            </div>
          ) : viewerPosition !== null && selectedPosition > viewerPosition ? (
            <p className="mt-6 text-sm leading-6 text-neutral-600">
              Ya ocupas la posición #{viewerPosition}, que es mejor que la #{selectedPosition}.
              Elige una posición más alta.
            </p>
          ) : (
            <>
              {changeNotice && (
                <Alert tone="warning" title="El ranking cambió" className="mt-6">
                  <p>{changeNotice}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={acceptChange}>
                      {freeMoved
                        ? nextFree === null
                          ? "ENTENDIDO"
                          : `IR AL #${nextFree}`
                        : offerAmount < liveMinimum
                          ? `OFERTAR ${formatPrice(liveMinimum)}`
                          : "CONTINUAR"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={closeModal}>
                      Cancelar
                    </Button>
                  </div>
                </Alert>
              )}

              <div className="mt-6 rounded-2xl bg-brand-50 p-5">
                {selectedBusiness && (
                  <>
                    <Muted>{ownsSelected ? "Tu oferta actual" : "Oferta actual"}</Muted>
                    <p className="mt-1">
                      <Price value={selectedBusiness.current_price} />
                    </p>
                    <div className="my-4 h-px bg-brand-100" />
                  </>
                )}

                <Muted>
                  {ownsSelected
                    ? "Nueva oferta para blindarte"
                    : selectedBusiness
                      ? "Oferta mínima para superar"
                      : "Precio de entrada"}
                </Muted>
                <p className="mt-1">
                  <Price value={liveMinimum} size="lg" tone="ink" />
                </p>

                {reservationAt(selectedPosition) && (
                  <p className="mt-2 text-xs text-amber-700">
                    🔒 Hay una reserva activa sobre esta posición; el mínimo ya la supera.
                  </p>
                )}

                <Field
                  label="Tu oferta (MXN)"
                  hint={`Puedes ofrecer más que el mínimo para que sea más difícil superarte. Máximo ${formatPrice(MAX_OFFER)}.`}
                  className="mt-4"
                >
                  <PrefixedInput
                    prefix="$"
                    type="number"
                    inputMode="numeric"
                    min={liveMinimum}
                    max={MAX_OFFER}
                    step={1}
                    value={offer}
                    onChange={(event) => setOffer(event.target.value)}
                    disabled={loading || Boolean(changeNotice)}
                  />
                </Field>
              </div>

              <div className="mt-5 space-y-2 text-sm text-neutral-500">
                <p>
                  Negocio:{" "}
                  <span className="font-bold text-neutral-800">{viewer.business.name}</span>
                </p>
                <p>
                  Al continuar reservamos la posición a este precio durante {RESERVATION_MINUTES}{" "}
                  minutos y te enviamos a Mercado Pago. La posición se asigna al confirmarse el
                  pago.
                </p>
                <p className="text-xs leading-5 text-neutral-400">
                  Al continuar aceptas los{" "}
                  <Link href="/terminos" className="underline">
                    términos y condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link href="/responsiva" className="underline">
                    carta responsiva
                  </Link>
                  .
                </p>
              </div>

              {notice && (
                <Alert tone="warning" compact className="mt-4">
                  {notice}
                </Alert>
              )}

              {error && (
                <Alert tone="error" compact className="mt-4">
                  {error}
                </Alert>
              )}

              <Button
                variant="accent"
                size="lg"
                block
                onClick={reserveAndPay}
                disabled={loading || Boolean(changeNotice)}
                className="mt-5"
              >
                {loading ? "RESERVANDO..." : `RESERVAR Y PAGAR ${formatPrice(offerAmount)}`}
              </Button>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
