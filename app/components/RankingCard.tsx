"use client";

import Link from "next/link";
import { useState } from "react";
import { hasBigAd, type Business } from "../../lib/business";
import { INITIAL_PRICES } from "../../lib/prices";
import { BusinessAd } from "./BusinessAd";
import { SmartImage } from "./SmartImage";

type Props = {
  position: number;
  business: (Partial<Business> & { name: string }) | null;
  /** Botón OCUPAR / SUPERAR; si no se pasa, la tarjeta es solo informativa. */
  onBid?: (position: number) => void;
  /** Muestra el anuncio grande siempre (vista previa del panel). */
  forceExpanded?: boolean;
};

const POSITION_STYLES: Record<number, string> = {
  1: "border-yellow-300 bg-yellow-50",
  2: "border-neutral-300 bg-neutral-50",
  3: "border-orange-200 bg-orange-50",
};

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function formatPrice(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString("es-MX")} MXN`;
}

export function RankingCard({ position, business, onBid, forceExpanded = false }: Props) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);

  if (!business) {
    return (
      <div className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-lg font-black text-neutral-500">
          #{position}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-500">
            Posición #{position}
          </p>
          <h3 className="mt-1 text-lg font-black">POSICIÓN DISPONIBLE</h3>
          <p className="mt-1 text-sm text-neutral-500">Haz que tu negocio aparezca aquí.</p>
          <p className="mt-2 text-sm font-bold">
            Desde ${INITIAL_PRICES[position].toLocaleString("es-MX")} MXN
          </p>
        </div>

        {onBid && (
          <button
            onClick={() => onBid(position)}
            className="shrink-0 rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white"
          >
            OCUPAR
          </button>
        )}
      </div>
    );
  }

  const expandable = hasBigAd(position);
  const expanded = forceExpanded || (expandable && (pinned || hovered));
  const profileHref = business.id && !forceExpanded ? `/business/${business.id}` : undefined;
  const subtitle = [business.category || "Sin categoría", business.city].filter(Boolean).join(" · ");

  return (
    <div
      className={`w-full rounded-2xl border ${POSITION_STYLES[position] ?? "border-neutral-200 bg-white"}`}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setHovered(false);
      }}
    >
      <div className="flex items-center gap-4 p-4">
        <button
          type="button"
          onClick={() => expandable && setPinned((value) => !value)}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Ocultar" : "Ver"} anuncio de ${business.name}`}
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 text-lg font-black">
            {business.logo_url ? (
              <SmartImage
                src={business.logo_url}
                alt=""
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              MEDALS[position] ?? `#${position}`
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              {MEDALS[position] ? `${MEDALS[position]} ` : ""}Posición #{position}
            </p>
            <h3 className="truncate text-lg font-bold">{business.name}</h3>
            <p className="truncate text-sm text-neutral-500">{subtitle}</p>
          </div>
        </button>

        <div className="shrink-0 text-right">
          <p className="text-xs text-neutral-400">Oferta actual</p>
          <p className="font-black text-sky-500">{formatPrice(business.current_price)}</p>

          {onBid && (
            <button
              onClick={() => onBid(position)}
              className="mt-2 rounded-full bg-sky-400 px-4 py-2 text-xs font-bold text-white"
            >
              SUPERAR
            </button>
          )}
        </div>
      </div>

      {expandable && (
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
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
          <Link href={profileHref} className="text-sm font-bold text-sky-500 hover:underline">
            Ver página →
          </Link>
        </div>
      )}
    </div>
  );
}
