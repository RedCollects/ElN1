"use client";

import { contactLinks, type Business } from "@/lib/business";
import { Avatar, Button, Muted } from "@/app/ui";
import { trackBusinessClick } from "@/app/SiteExperience";
import { SmartImage } from "./SmartImage";

type Props = {
  business: Partial<Business> & { name: string };
  /** Enlace a la página pública (solo si el negocio existe y es visible). */
  profileHref?: string;
};

/**
 * El "anuncio grande": lo que se ve al expandir una tarjeta del ranking y
 * en la vista previa del panel del negocio.
 */
export function BusinessAd({ business, profileHref }: Props) {
  const links = contactLinks(business);
  const subtitle = [business.category, business.city]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="from-brand to-brand-600 relative aspect-[16/7] w-full bg-gradient-to-br">
        {business.cover_url && (
          <SmartImage
            src={business.cover_url}
            alt={`Portada de ${business.name}`}
            fill
            sizes="(min-width: 896px) 800px, 100vw"
            className="object-cover"
          />
        )}
      </div>

      <div className="relative px-5 pb-5">
        <Avatar
          src={business.logo_url}
          alt={`Logo de ${business.name}`}
          size="md"
          className="-mt-10 bg-white"
        />

        <h3 className="mt-3 text-2xl leading-tight font-black">
          {business.name}
        </h3>

        {subtitle && <Muted className="mt-1">{subtitle}</Muted>}

        {business.tagline && (
          <p className="mt-3 text-base leading-6 text-neutral-700">
            {business.tagline}
          </p>
        )}

        {links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {links.map((link, index) => (
              <Button
                key={link.label}
                href={link.href}
                variant={index === 0 ? "primary" : "outline"}
                size="sm"
                className="text-sm"
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
              >
                {link.emoji} {link.label}
              </Button>
            ))}
          </div>
        )}

        {profileHref && (
          <span onClick={() => business.id && trackBusinessClick(business.id)}>
            <Button href={profileHref} variant="link" className="mt-4">
              Ver página completa →
            </Button>
          </span>
        )}
      </div>
    </div>
  );
}
