"use client";

import { useState } from "react";
import { hasBigAd, type Business } from "@/lib/business";
import { INITIAL_PRICES } from "@/lib/prices";
import type { Reservation } from "@/lib/payments";
import { formatPrice } from "@/lib/format";
import { Avatar, Button, Figure, LiveDot, Tag, cn } from "@/app/ui";
import { BusinessAd } from "./BusinessAd";
import { Countdown } from "./Countdown";

type Props = {
  position: number;
  business: (Partial<Business> & { name: string }) | null;
  /** Botón Ocupar / Superar / Blindar; si no se pasa, la tarjeta es solo informativa. */
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

/**
 * Tarjeta de posición (`.n1-slot` del catálogo) en tres estados:
 * líder (#1, el único bloque de azul a sangre), ocupada y disponible (borde
 * discontinuo). En escritorio se acomoda como fila: rango · negocio · acción.
 */
export function SlotCard({
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

  const leader = position === 1 && business !== null;

  if (!business) {
    return (
      <article
        aria-label={`Posición ${position}, disponible`}
        className="border-rule bg-bg flex flex-col border-2 border-dashed sm:flex-row sm:items-stretch"
      >
        <div className="border-rule flex items-center gap-4 border-b-2 border-dashed px-[18px] py-[14px] sm:w-[120px] sm:shrink-0 sm:flex-col sm:items-start sm:justify-center sm:border-r-2 sm:border-b-0">
          <Figure size={34} className="text-faint">
            #{position}
          </Figure>
          <Tag tone="available">Disponible</Tag>
        </div>

        <div className="flex-1 px-[18px] py-5">
          <h3 className="text-xl leading-tight font-extrabold tracking-[-0.01em]">
            Posición disponible
          </h3>
          <p className="text-muted mt-2 text-[13px]">
            Haz que tu negocio aparezca aquí.
          </p>
          <p className="text-accent-press mt-[18px] text-[13px] font-bold tracking-[0.06em] uppercase">
            Desde {formatPrice(minimumOffer ?? INITIAL_PRICES[position])}
          </p>
          {reservation && (
            <ReservationRow
              reservation={reservation}
              minimumOffer={minimumOffer}
            />
          )}
        </div>

        {onBid && (
          <div className="border-rule border-t-2 border-dashed sm:w-[220px] sm:shrink-0 sm:border-t-0 sm:border-l-2">
            <Button
              block
              size="lg"
              className="h-full"
              onClick={() => onBid(position)}
            >
              Ocupar posición
            </Button>
          </div>
        )}
      </article>
    );
  }

  const expandable = hasBigAd(position);
  const expanded = forceExpanded || (expandable && (pinned || hovered));
  const profileHref =
    business.id && !forceExpanded ? `/business/${business.id}` : undefined;
  const subtitle = [business.category || "Sin categoría", business.city]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      aria-label={`Posición ${position}, ${business.name}`}
      className={cn(
        "border-rule flex flex-col border-2",
        leader
          ? "border-accent bg-accent text-accent-fg"
          : "bg-surface text-ink",
        isOwn && !leader && "border-accent",
      )}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setHovered(false);
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        <div
          className={cn(
            "flex items-center gap-4 border-b-2 px-[18px] py-[14px] sm:w-[120px] sm:shrink-0 sm:flex-col sm:items-start sm:justify-center sm:border-r-2 sm:border-b-0",
            leader ? "border-accent-fg" : "border-rule",
          )}
        >
          <Figure size={34} tone={leader ? "paper" : "ink"}>
            #{position}
          </Figure>
          {leader ? (
            <Tag tone="leader">EL N1</Tag>
          ) : isOwn ? (
            <Tag tone="first">Tu negocio</Tag>
          ) : (
            <Tag tone="taken">Ocupada</Tag>
          )}
        </div>

        <button
          type="button"
          onClick={() => expandable && setPinned((value) => !value)}
          aria-expanded={expandable ? expanded : undefined}
          aria-label={
            expandable
              ? `${expanded ? "Ocultar" : "Ver"} anuncio de ${business.name}`
              : undefined
          }
          className="flex min-w-0 flex-1 items-center gap-4 px-[18px] py-5 text-left"
        >
          <Avatar
            src={business.logo_url}
            alt={business.name}
            size="sm"
            tone={leader ? "paper" : "surface"}
          />
          <div className="min-w-0">
            <h3 className="truncate text-xl leading-tight font-extrabold tracking-[-0.01em]">
              {business.name}
            </h3>
            <p
              className={cn(
                "mt-1 truncate text-[13px]",
                leader ? "opacity-90" : "text-muted",
              )}
            >
              {subtitle}
            </p>
            <p className="mt-3 text-[13px] font-bold tracking-[0.06em] uppercase">
              Paga {formatPrice(business.current_price)} + IVA
            </p>
          </div>
        </button>

        {onBid && (
          <div
            className={cn(
              "border-t-2 sm:w-[220px] sm:shrink-0 sm:border-t-0 sm:border-l-2",
              leader ? "border-accent-fg" : "border-rule",
            )}
          >
            <Button
              block
              size="lg"
              variant={leader ? "paper" : "primary"}
              className="h-full"
              onClick={() => onBid(position)}
            >
              {isOwn
                ? "Blindar mi lugar"
                : `Superar por ${formatPrice(minimumOffer)}`}
            </Button>
          </div>
        )}
      </div>

      {reservation && (
        <div
          className={cn(
            "border-t-2 px-[18px] py-3",
            leader ? "border-accent-fg" : "border-rule",
          )}
        >
          <ReservationRow
            reservation={reservation}
            minimumOffer={minimumOffer}
            paper={leader}
          />
        </div>
      )}

      {expandable && (
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-out",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div
              className={cn(
                "border-t-2 p-[18px]",
                leader ? "border-accent-fg" : "border-rule",
              )}
            >
              <BusinessAd business={business} profileHref={profileHref} />
            </div>
          </div>
        </div>
      )}

      {!expandable && profileHref && (
        <div className="border-rule border-t-2 px-[18px] py-3">
          <Button href={profileHref} variant="link">
            Ver página completa
          </Button>
        </div>
      )}
    </article>
  );
}

function ReservationRow({
  reservation,
  minimumOffer,
  paper = false,
}: {
  reservation: Reservation;
  minimumOffer?: number;
  paper?: boolean;
}) {
  return (
    <div
      role="status"
      className={cn(
        "mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]",
        paper ? "text-accent-fg" : "text-ink",
      )}
    >
      <LiveDot className={cn(paper && "text-accent-fg")}>Reservada</LiveDot>
      <span>
        Alguien reservó por <strong>{formatPrice(reservation.amount)}</strong> ·
        vence en <Countdown until={reservation.expiresAt} />
      </span>
      {minimumOffer !== undefined && (
        <span className={cn("font-bold", paper ? "" : "text-accent-press")}>
          Supérala desde {formatPrice(minimumOffer)}
        </span>
      )}
    </div>
  );
}
