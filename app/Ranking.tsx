"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RANKING_SIZE, isValidPosition, minimumOfferFor } from "../lib/prices";
import type { Business } from "../lib/business";
import { RESERVATION_MINUTES, type Reservation } from "../lib/payments";
import { RankingCard } from "./components/RankingCard";

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

function formatPrice(value: number) {
  return `$${value.toLocaleString("es-MX")} MXN`;
}

export default function Ranking({
  businesses,
  reservations: initialReservations,
  viewer,
  initialPosition = null,
}: Props) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(
    initialPosition && isValidPosition(initialPosition) ? initialPosition : null
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
        const response = await fetch("/api/reservations", { cache: "no-store" });
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

  const positions = Array.from({ length: RANKING_SIZE }, (_, index) => index + 1);
  const businessAt = (position: number) =>
    businesses.find((business) => business.position === position) ?? null;
  const reservationAt = (position: number) =>
    reservations.find(
      (reservation) =>
        reservation.position === position && new Date(reservation.expiresAt).getTime() > Date.now()
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

  const selectedBusiness = selectedPosition ? businessAt(selectedPosition) : null;
  const ownsSelected = Boolean(
    selectedBusiness && viewer.business && selectedBusiness.id === viewer.business.id
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
        body: JSON.stringify({ position: selectedPosition, expectedAmount: amount }),
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

  const nextParam = selectedPosition ? `?next=${encodeURIComponent(`/?position=${selectedPosition}`)}` : "";

  return (
    <>
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-sky-500">
            Ranking actual
          </p>

          <h2 className="mt-1 text-3xl font-black text-neutral-950">
            Los que están arriba
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Cada posición es un espacio disponible para competir. Pasa el
            cursor o toca un negocio para ver su anuncio.
          </p>
        </div>

        <div className="space-y-4">
          {positions.map((position) => {
            const business = businessAt(position);
            return (
              <RankingCard
                key={position}
                position={position}
                business={business}
                onBid={openPosition}
                reservation={reservationAt(position)}
                minimumOffer={minimumOfferAt(position)}
                isOwn={Boolean(business && viewer.business && business.id === viewer.business.id)}
              />
            );
          })}
        </div>
      </section>

      {selectedPosition !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 px-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-sky-500">
                  Posición #{selectedPosition}
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {ownsSelected
                    ? "Blinda tu posición"
                    : selectedBusiness
                      ? "Superar posición"
                      : "Ocupa esta posición"}
                </h2>
              </div>

              <button onClick={closeModal} aria-label="Cerrar" className="text-2xl text-neutral-400">
                ×
              </button>
            </div>

            {!viewer.loggedIn ? (
              <div className="mt-6">
                <p className="text-sm leading-6 text-neutral-600">
                  Para ofertar necesitas una cuenta de negocio. Es gratis: te
                  registras, completas tu perfil y pagas solo cuando quieras
                  publicarte.
                </p>
                <Link
                  href={`/registro${nextParam}`}
                  className="mt-5 block w-full rounded-xl bg-neutral-900 px-5 py-4 text-center font-bold text-white"
                >
                  REGISTRA TU NEGOCIO
                </Link>
                <Link
                  href={`/ingresar${nextParam}`}
                  className="mt-3 block w-full py-3 text-center text-sm font-bold text-neutral-500"
                >
                  Ya tengo cuenta
                </Link>
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
                <Link
                  href="/mi-negocio"
                  className="mt-5 block w-full rounded-xl bg-neutral-900 px-5 py-4 text-center font-bold text-white"
                >
                  COMPLETAR MI PERFIL
                </Link>
              </div>
            ) : viewer.business.position !== null &&
              selectedPosition > viewer.business.position ? (
              <p className="mt-6 text-sm leading-6 text-neutral-600">
                Ya ocupas la posición #{viewer.business.position}, que es mejor
                que la #{selectedPosition}. Elige una posición más alta.
              </p>
            ) : (
              <>
                <div className="mt-6 rounded-2xl bg-sky-50 p-5">
                  {selectedBusiness && (
                    <>
                      <p className="text-sm text-neutral-500">
                        {ownsSelected ? "Tu oferta actual" : "Oferta actual"}
                      </p>
                      <p className="mt-1 text-2xl font-black text-sky-500">
                        {formatPrice(Number(selectedBusiness.current_price ?? 0))}
                      </p>
                      <div className="my-4 h-px bg-sky-100" />
                    </>
                  )}

                  <p className="text-sm text-neutral-500">
                    {ownsSelected ? "Nueva oferta para blindarte" : "Tu oferta"}
                  </p>
                  <p className="mt-1 text-3xl font-black">{formatPrice(amount)}</p>

                  {reservationAt(selectedPosition) && (
                    <p className="mt-2 text-xs text-amber-700">
                      🔒 Hay una reserva activa sobre esta posición; tu oferta ya la supera.
                    </p>
                  )}
                </div>

                <div className="mt-5 space-y-2 text-sm text-neutral-500">
                  <p>
                    Negocio: <span className="font-bold text-neutral-800">{viewer.business.name}</span>
                  </p>
                  <p>
                    Al continuar reservamos la posición a este precio durante{" "}
                    {RESERVATION_MINUTES} minutos y te enviamos a Mercado Pago. La
                    posición se asigna al confirmarse el pago.
                  </p>
                </div>

                {notice && (
                  <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                    {notice}
                  </p>
                )}

                {error && (
                  <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  onClick={reserveAndPay}
                  disabled={loading}
                  className="mt-5 w-full rounded-xl bg-sky-400 px-5 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "RESERVANDO..."
                    : notice
                      ? `OFERTAR ${formatPrice(amount)}`
                      : "RESERVAR Y PAGAR"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
