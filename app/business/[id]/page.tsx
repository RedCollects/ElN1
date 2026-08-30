import { createPublicSupabaseClient } from "@/lib/supabase-public";
import { contactLinks } from "@/lib/business";
import { SmartImage } from "@/app/components/SmartImage";
import {
  Avatar,
  Button,
  Container,
  EmptyState,
  Eyebrow,
  Muted,
  PageShell,
  Price,
  SiteFooter,
  SiteHeader,
} from "@/app/ui";

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createPublicSupabaseClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .single();

  if (error || !business) {
    return (
      <PageShell centered>
        <EmptyState
          title="Negocio no encontrado"
          action={
            <Button href="/" variant="accent">
              Volver al ranking
            </Button>
          }
        />
      </PageShell>
    );
  }

  const item = business;
  const subtitle = [item.category, item.city].filter(Boolean).join(" · ");
  const links = contactLinks(item);

  return (
    <PageShell tone="muted">
      <SiteHeader>
        <Button href="/" variant="outline" size="sm">
          Ver ranking
        </Button>
      </SiteHeader>

      <Container width="content" className="py-12">
        <div className="overflow-hidden border border-neutral-200 bg-white shadow-sm">
          <div className="bg-accent relative px-6 py-10 text-center">
            {item.cover_url && (
              <>
                <SmartImage
                  src={item.cover_url}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 896px) 896px, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
              </>
            )}

            <div className="relative">
              <Avatar
                src={item.logo_url}
                alt={`Logo de ${item.name}`}
                size="lg"
                priority
                className="mx-auto bg-white"
              />

              <Eyebrow tone="light" className="mt-5">
                {item.position
                  ? `Posición #${item.position}`
                  : "Fuera del ranking"}
              </Eyebrow>

              <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">
                {item.name}
              </h1>

              {subtitle && (
                <p className="mt-2 text-lg font-medium text-white/90">
                  {subtitle}
                </p>
              )}

              {item.tagline && (
                <p className="mx-auto mt-4 max-w-xl text-base text-white/90">
                  {item.tagline}
                </p>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {item.description && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-neutral-950">
                  Sobre el negocio
                </h2>
                <p className="mt-2 leading-7 whitespace-pre-line text-neutral-500">
                  {item.description}
                </p>
              </div>
            )}

            {item.position && (
              <div className="bg-accent-100 p-6">
                <Muted className="font-medium">Oferta actual</Muted>
                <p className="mt-1">
                  <Price value={item.current_price} size="xl" />
                </p>
                <Muted className="mt-2">
                  Esta es la oferta que actualmente mantiene esta posición.
                </Muted>
              </div>
            )}

            {links.length > 0 && (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {links.map((link) => (
                  <Button
                    key={link.label}
                    href={link.href}
                    variant="outline"
                    size="lg"
                    className="border-neutral-200 text-neutral-900 hover:bg-neutral-50"
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                  >
                    {link.emoji} {link.label}
                  </Button>
                ))}
              </div>
            )}

            {item.hours && (
              <Muted className="mt-6 text-center">🕒 {item.hours}</Muted>
            )}

            <div className="mt-8">
              <Button
                href={`/?position=${item.position ?? ""}`}
                variant="accent"
                size="lg"
                block
              >
                INTENTAR SUBIR AL RANKING
              </Button>
            </div>
          </div>
        </div>
      </Container>

      <SiteFooter />
    </PageShell>
  );
}
