"use client";

import { useState } from "react";
import { hasBigAd, type Business } from "../../lib/business";
import { BASE_PRICE } from "../../lib/prices";
import type { Reservation } from "../../lib/payments";
import { formatPrice } from "../../lib/format";
import { Avatar, Button, Eyebrow, Price, cn } from "@/app/ui";
import { BusinessAd } from "./BusinessAd";
import { Countdown } from "./Countdown";

type Props = {
  position: number;
  business: (Partial<Business> & { name: string }) | null;
  /** Botón OCUPAR / SUPERAR; si no se pasa, la tarjeta es solo informativa. */
  onBid?: (position: number) => void;
  /** Muestra el anuncio grande siempre (vista previa del panel). */
  forceExpanded?: boolean;
  /** Reserva vigente sobre esta posición (alguien está pagando ahora). */
  reservation?: Reservation | null;
  /** Oferta mínima calculada por el padre (incluye la reserva). */
  minimumOffer?: number;
  /** El negocio del visitante ocupa esta posición. */
  isOwn?: boolean;
};

const POSITION_STYLES: Record<number, string> = {
  1: "border-yellow-300 bg-yellow-50",
  2: "border-neutral-300 bg-neutral-50",
  3: "border-orange-200 bg-orange-50",
};

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function ReservationNotice({
  reservation,
  minimumOffer,
}: {
  reservation: Reservation;
  minimumOffer?: number;
}) {
  return (
    <div
      role="status"
      className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
    >
      <span className="font-bold">
        🔒 Alguien reservó esta posición por {formatPrice(reservation.amount)}
      </span>
      <span>
        ⏱ <Countdown until={reservation.expiresAt} />
      </span>
      {minimumOffer !== undefined && (
        <span>Puedes superarla desde {formatPrice(minimumOffer)}</span>
      )}
    </div>
  );
}

export function RankingCard({
  position,
  business,
  onBid,
  forceExpanded = false,
  reservation = null,
  minimumOffer,
  isOwn = false,
}: Props) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);

  if (!business) {
    return (
      <div className="w-full rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-5">
        <div className="flex items-center gap-4">
          <Avatar src={null} alt="" size="sm" fallback={`#${position}`} className="text-neutral-500" />

          <div className="min-w-0 flex-1">
            <Eyebrow size="xs">Posición #{position}</Eyebrow>
            <h3 className="mt-1 text-lg font-black">SIGUIENTE LUGAR LIBRE</h3>
            <p className="mt-1 text-sm text-neutral-500">Entra al ranking aquí o supera a quien quieras.</p>
            <p className="mt-2 text-sm font-bold">
              Desde {formatPrice(minimumOffer ?? BASE_PRICE)}
            </p>
          </div>

          {onBid && (
            <Button size="sm" onClick={() => onBid(position)} className="shrink-0">
              ENTRAR
            </Button>
          )}
        </div>

        {reservation && (
          <ReservationNotice reservation={reservation} minimumOffer={minimumOffer} />
        )}
      </div>
    );
  }

  const expandable = hasBigAd(position);
  const expanded = forceExpanded || (expandable && (pinned || hovered));
  const profileHref = business.id && !forceExpanded ? `/business/${business.id}` : undefined;
  const subtitle = [business.category || "Sin categoría", business.city]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "w-full rounded-2xl border",
        POSITION_STYLES[position] ?? "border-neutral-200 bg-white",
        isOwn && "ring-2 ring-brand-300"
      )}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setHovered(false);
      }}
    >
      <div className="p-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => expandable && setPinned((value) => !value)}
            aria-expanded={expanded}
            aria-label={`${expanded ? "Ocultar" : "Ver"} anuncio de ${business.name}`}
            className="flex min-w-0 flex-1 items-center gap-4 text-left"
          >
            <Avatar
              src={business.logo_url}
              alt=""
              size="sm"
              fallback={MEDALS[position] ?? `#${position}`}
            />

            <div className="min-w-0">
              <Eyebrow size="xs" tone="muted">
                {MEDALS[position] ? `${MEDALS[position]} ` : ""}Posición #{position}
                {isOwn ? " · Tu negocio" : ""}
              </Eyebrow>
              <h3 className="truncate text-lg font-bold">{business.name}</h3>
              <p className="truncate text-sm text-neutral-500">{subtitle}</p>
            </div>
          </button>

          <div className="shrink-0 text-right">
            <p className="text-xs text-neutral-400">Oferta actual</p>
            <Price value={business.current_price} size="sm" />

            {onBid && (
              <div className="mt-2">
                <Button variant="accent" size="sm" onClick={() => onBid(position)}>
                  {isOwn ? "BLINDAR" : "SUPERAR"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {reservation && (
          <ReservationNotice reservation={reservation} minimumOffer={minimumOffer} />
        )}
      </div>

      {expandable && (
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-out",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4">
              <BusinessAd business={business} profileHref={profileHref} />
            </div>
          </div>
        </div>
      )}

      {!expandable && profileHref && (
        <div className="px-4 pb-4">
          <Button href={profileHref} variant="link">
            Ver página →
          </Button>
        </div>
      )}
    </div>
  );
}
