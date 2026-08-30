"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RANKING_SIZE, isValidPosition, minimumOfferFor } from "@/lib/prices";
import type { Business } from "@/lib/business";
import { RESERVATION_MINUTES, type Reservation } from "@/lib/payments";
import { formatPrice } from "@/lib/format";
import { SlotCard } from "./components/SlotCard";
import {
  Alert,
  Button,
  Container,
  Eyebrow,
  Figure,
  Heading,
  LiveDot,
  Modal,
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

  /* Qué muestra el diálogo según quién mira y qué posición eligió. */
  const canBid =
    viewer.loggedIn &&
    viewer.business !== null &&
    viewer.business.missing.length === 0 &&
    (viewer.business.position === null ||
      selectedPosition === null ||
      selectedPosition <= viewer.business.position);

  return (
    <>
      <Container className="pb-20">
        <div className="border-rule border-t-2 pt-8">
          <LiveDot>Ranking en vivo</LiveDot>
          <Heading as="h2" size="title" className="mt-3">
            Las {RANKING_SIZE} posiciones
          </Heading>
          <Muted className="mt-2 max-w-[640px]">
            Cada posición se mantiene mientras nadie pague más. Pasa el cursor o
            toca un negocio para ver su anuncio.
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
          {positions.map((position) => {
            const business = businessAt(position);

            if (
              activeCategory !== "Todas" &&
              (!business || business.category !== activeCategory)
            ) {
              return null;
            }

            return (
              <SlotCard
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
              ? "Blinda tu lugar"
              : selectedBusiness
                ? `Supera a ${selectedBusiness.name}`
                : "Ocupa esta posición"
          }
          actions={
            canBid ? (
              <>
                <Button size="lg" onClick={reserveAndPay} disabled={loading}>
                  {loading
                    ? "Reservando…"
                    : notice
                      ? `Ofertar ${formatPrice(amount)}`
                      : "Reservar y pagar"}
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
          ) : viewer.business.position !== null &&
            selectedPosition > viewer.business.position ? (
            <p className="text-ink text-[15px] leading-relaxed">
              Ya ocupas la posición #{viewer.business.position}, que es mejor
              que la #{selectedPosition}. Elige una posición más alta.
            </p>
          ) : (
            <>
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

              <div className="border-rule flex items-baseline justify-between gap-4 border-b-2 py-4">
                <Eyebrow>{ownsSelected ? "Nueva oferta" : "Tu oferta"}</Eyebrow>
                <Figure size={30} tone="accent">
                  {formatPrice(amount)}
                </Figure>
              </div>

              {reservationAt(selectedPosition) && (
                <p className="text-accent-press mt-4 flex items-center gap-2 text-[13px]">
                  <LiveDot />
                  Hay una reserva activa sobre esta posición; tu oferta ya la
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
                  Al continuar aceptas los{" "}
                  <Link
                    href="/terminos"
                    className="text-accent-press underline"
                  >
                    términos y condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link
                    href="/responsiva"
                    className="text-accent-press underline"
                  >
                    carta responsiva
                  </Link>
                  .
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
