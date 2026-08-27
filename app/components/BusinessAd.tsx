import Link from "next/link";
import { contactLinks, type Business } from "../../lib/business";
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
  const subtitle = [business.category, business.city].filter(Boolean).join(" · ");

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="relative aspect-[16/7] w-full bg-gradient-to-br from-sky-400 to-sky-600">
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
        <div className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white text-3xl shadow-md">
          {business.logo_url ? (
            <SmartImage
              src={business.logo_url}
              alt={`Logo de ${business.name}`}
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            "🏪"
          )}
        </div>

        <h3 className="mt-3 text-2xl font-black leading-tight">{business.name}</h3>

        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}

        {business.tagline && (
          <p className="mt-3 text-base leading-6 text-neutral-700">{business.tagline}</p>
        )}

        {links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {links.map((link, index) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className={
                  index === 0
                    ? "rounded-full bg-neutral-900 px-4 py-2 text-sm font-bold text-white"
                    : "rounded-full border border-neutral-300 px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-50"
                }
              >
                {link.emoji} {link.label}
              </a>
            ))}
          </div>
        )}

        {profileHref && (
          <Link
            href={profileHref}
            className="mt-4 inline-block text-sm font-bold text-sky-500 hover:underline"
          >
            Ver página completa →
          </Link>
        )}
      </div>
    </div>
  );
}
