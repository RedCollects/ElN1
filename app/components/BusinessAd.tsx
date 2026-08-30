"use client";

import { contactLinks, type Business } from "@/lib/business";
import { Avatar, Button, Icon, Muted } from "@/app/ui";
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
    <div className="border-rule bg-bg text-ink border-2">
      <div className="border-rule bg-surface relative aspect-[16/7] w-full border-b-2">
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

      <div className="flex items-start gap-4 p-5">
        <Avatar src={business.logo_url} alt={business.name} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="text-2xl leading-tight font-extrabold tracking-[-0.02em]">
            {business.name}
          </h3>
          {subtitle && <Muted className="mt-1">{subtitle}</Muted>}
        </div>
      </div>

      {business.tagline && (
        <p className="text-ink px-5 pb-5 text-base leading-relaxed">
          {business.tagline}
        </p>
      )}

      {links.length > 0 && (
        <div className="border-rule grid border-t-2 sm:grid-cols-2">
          {links.map((link, index) => (
            <Button
              key={link.label}
              href={link.href}
              variant={index === 0 ? "primary" : "ghost"}
              size="md"
              block
              className="border-rule border-b-2 px-5 last:border-b-0 sm:odd:border-r-2 sm:[&:nth-last-child(-n+2)]:border-b-0"
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
            >
              <Icon name={link.icon} size={16} />
              {link.label}
            </Button>
          ))}
        </div>
      )}

      {profileHref && (
        <div className="border-rule border-t-2 px-5 py-3">
          <span onClick={() => business.id && trackBusinessClick(business.id)}>
            <Button href={profileHref} variant="link">
              Ver página completa
            </Button>
          </span>
        </div>
      )}
    </div>
  );
}
