"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RANKING_SIZE, isValidPosition, minimumOfferFor } from "@/lib/prices";
import type { Business } from "@/lib/business";
import { RESERVATION_MINUTES, type Reservation } from "@/lib/payments";
import { formatPrice } from "@/lib/format";
import { RankingCard } from "./components/RankingCard";
import {
  Alert,
  Button,
  Container,
  Eyebrow,
  Heading,
  Modal,
  Muted,
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

const POLL_INTERVAL_MS = 5000;

export default function Ranking({
  businesses,
  reservations: initialReservations,
  viewer,
  initialPosition = null,
}: Props) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(
    initialPosition && isValidPosition(initialPosition)
      ? initialPosition
      : null,
  );
  const [reservations, setReservations] = useState(initialReservations);
  const [quotedAmount, setQuotedAmount] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const timer = setInterval(async () => {
      try {
        const response = await fetch("/api/reservations", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as { reservations: Reservation[] };
        if (!cancelled) setReservations(data.reservations);
      } catch {
        // Sin red: se reintenta en el siguiente ciclo.
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const [activeCategory, setActiveCategory] = useState("Todas");

  const positions = Array.from(
    { length: RANKING_SIZE },
    (_, index) => index + 1,
  );
  const categoryOptions = Array.from(
    new Set(
      businesses.flatMap((business) =>
        business.category ? [business.category] : [],
      ),
    ),
  );
  const businessAt = (position: number) =>
    businesses.find((business) => business.position === position) ?? null;
  const reservationAt = (position: number) =>
    reservations.find(
      (reservation) =>
        reservation.position === position &&
        new Date(reservation.expiresAt).getTime() > Date.now(),
    ) ?? null;

  function minimumOfferAt(position: number) {
    const holderPrice = businessAt(position)?.current_price ?? null;
    const reserved = reservationAt(position)?.amount ?? null;
    const floor =
      holderPrice === null && reserved === null
        ? null
        : Math.max(Number(holderPrice ?? 0), reserved ?? 0);
    return minimumOfferFor(position, floor);
  }

  const selectedBusiness = selectedPosition
    ? businessAt(selectedPosition)
    : null;
  const ownsSelected = Boolean(
    selectedBusiness &&
    viewer.business &&
    selectedBusiness.id === viewer.business.id,
  );
  const liveMinimum = selectedPosition ? minimumOfferAt(selectedPosition) : 0;
  const amount = quotedAmount ?? liveMinimum;

  function openPosition(position: number) {
    setSelectedPosition(position);
    setQuotedAmount(null);
    setNotice(null);
    setError(null);
    setLoading(false);
  }

  function closeModal() {
    setSelectedPosition(null);
    setQuotedAmount(null);
    setNotice(null);
    setError(null);
    setLoading(false);
  }

  async function reserveAndPay() {
    if (!selectedPosition) return;

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: selectedPosition,
          expectedAmount: amount,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        amount?: number;
        init_point?: string;
      };

      if (response.status === 409 && typeof data.amount === "number") {
        setQuotedAmount(data.amount);
        setNotice(data.error ?? "El precio cambió.");
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

  return (
    <>
      <Container width="content" className="pb-20">
        <div className="mb-6">
          <Eyebrow>Ranking actual</Eyebrow>
          <Heading as="h2" className="mt-1">
            Los que están arriba
          </Heading>
          <Muted className="mt-2">
            Cada posición es un espacio disponible para competir. Pasa el cursor
            o toca un negocio para ver su anuncio.
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
                  : "hover:border-brand-300 shrink-0 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-600 transition"
              }
            >
              {category}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {positions.map((position) => {
            const business = businessAt(position);

            if (
              activeCategory !== "Todas" &&
              (!business || business.category !== activeCategory)
            ) {
              return null;
            }

            return (
              <RankingCard
                key={position}
                position={position}
                business={business}
                onBid={openPosition}
                reservation={reservationAt(position)}
                minimumOffer={minimumOfferAt(position)}
                isOwn={Boolean(
                  business &&
                  viewer.business &&
                  business.id === viewer.business.id,
                )}
              />
            );
          })}
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
                : "Ocupa esta posición"
          }
        >
          {!viewer.loggedIn ? (
            <div className="mt-6">
              <p className="text-sm leading-6 text-neutral-600">
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
                REGISTRA TU NEGOCIO
              </Button>
              <Button
                href={`/ingresar${nextParam}`}
                variant="ghost"
                block
                className="mt-3 py-3"
              >
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
          ) : viewer.business.position !== null &&
            selectedPosition > viewer.business.position ? (
            <p className="mt-6 text-sm leading-6 text-neutral-600">
              Ya ocupas la posición #{viewer.business.position}, que es mejor
              que la #{selectedPosition}. Elige una posición más alta.
            </p>
          ) : (
            <>
              <div className="bg-brand-50 mt-6 rounded-2xl p-5">
                {selectedBusiness && (
                  <>
                    <Muted>
                      {ownsSelected ? "Tu oferta actual" : "Oferta actual"}
                    </Muted>
                    <p className="mt-1">
                      <Price value={selectedBusiness.current_price} />
                    </p>
                    <div className="bg-brand-100 my-4 h-px" />
                  </>
                )}

                <Muted>
                  {ownsSelected ? "Nueva oferta para blindarte" : "Tu oferta"}
                </Muted>
                <p className="mt-1">
                  <Price value={amount} size="lg" tone="ink" />
                </p>

                {reservationAt(selectedPosition) && (
                  <p className="mt-2 text-xs text-amber-700">
                    🔒 Hay una reserva activa sobre esta posición; tu oferta ya
                    la supera.
                  </p>
                )}
              </div>

              <div className="mt-5 space-y-2 text-sm text-neutral-500">
                <p>
                  Negocio:{" "}
                  <span className="font-bold text-neutral-800">
                    {viewer.business.name}
                  </span>
                </p>
                <p>
                  Al continuar reservamos la posición a este precio durante{" "}
                  {RESERVATION_MINUTES} minutos y te enviamos a Mercado Pago. La
                  posición se asigna al confirmarse el pago.
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
                disabled={loading}
                className="mt-5"
              >
                {loading
                  ? "RESERVANDO..."
                  : notice
                    ? `OFERTAR ${formatPrice(amount)}`
                    : "RESERVAR Y PAGAR"}
              </Button>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
