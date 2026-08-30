import { createPublicSupabaseClient } from "@/lib/supabase-public";
import { contactLinks } from "@/lib/business";
import { formatPrice } from "@/lib/format";
import { SmartImage } from "@/app/components/SmartImage";
import {
  Avatar,
  Button,
  Container,
  EmptyState,
  Eyebrow,
  Figure,
  Icon,
  Muted,
  PageShell,
  SiteFooter,
  SiteHeader,
  Tag,
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
          action={<Button href="/">Volver al ranking</Button>}
        />
      </PageShell>
    );
  }

  const item = business;
  const subtitle = [item.category, item.city].filter(Boolean).join(" · ");
  const links = contactLinks(item);

  return (
    <PageShell>
      <SiteHeader>
        <Button href="/" variant="secondary" size="sm">
          Ver ranking
        </Button>
      </SiteHeader>

      <Container width="content" className="py-12">
        <article className="border-rule bg-surface border-2">
          {item.cover_url && (
            <div className="border-rule bg-surface relative aspect-[16/6] w-full border-b-2">
              <SmartImage
                src={item.cover_url}
                alt=""
                fill
                priority
                sizes="(min-width: 960px) 960px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <header className="border-rule grid gap-6 border-b-2 p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-8">
            <Avatar
              src={item.logo_url}
              alt={item.name}
              size="lg"
              priority
              tone="paper"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                {item.position ? (
                  <Tag tone={item.position === 1 ? "first" : "taken"}>
                    Posición #{item.position}
                  </Tag>
                ) : (
                  <Tag tone="neutral">Fuera del ranking</Tag>
                )}
                {subtitle && <Eyebrow tone="muted">{subtitle}</Eyebrow>}
              </div>
              <h1 className="text-ink mt-4 text-[clamp(32px,5vw,52px)] leading-[0.95] font-extrabold tracking-[-0.03em]">
                {item.name}
              </h1>
              {item.tagline && (
                <p className="text-ink mt-4 max-w-[560px] text-base">
                  {item.tagline}
                </p>
              )}
            </div>
          </header>

          {item.position && (
            <div className="border-rule grid border-b-2 sm:grid-cols-2">
              <div className="border-rule border-b-2 px-6 py-5 sm:border-r-2 sm:border-b-0 sm:px-8">
                <p className="label text-faint">Paga ahora</p>
                <p className="mt-2">
                  <Figure size={40} tone="accent">
                    {formatPrice(item.current_price)}
                  </Figure>
                </p>
              </div>
              <div className="px-6 py-5 sm:px-8">
                <p className="label text-faint">Regla</p>
                <p className="text-ink mt-2 text-[15px] leading-relaxed">
                  Este lugar es suyo mientras nadie pague más. Cualquiera puede
                  superarlo.
                </p>
              </div>
            </div>
          )}

          {item.description && (
            <section className="border-rule border-b-2 px-6 py-6 sm:px-8">
              <h2 className="text-ink text-[22px] leading-tight font-extrabold tracking-[-0.01em]">
                Sobre el negocio
              </h2>
              <p className="text-muted mt-3 max-w-[640px] leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </section>
          )}

          {links.length > 0 && (
            <section className="border-rule border-b-2">
              <p className="label text-faint px-6 pt-5 sm:px-8">Contacto</p>
              <div className="mt-3 grid sm:grid-cols-2">
                {links.map((link) => (
                  <Button
                    key={link.label}
                    href={link.href}
                    variant="ghost"
                    size="lg"
                    block
                    className="border-rule-soft text-ink border-t px-6 py-4 sm:px-8 sm:odd:border-r"
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                  >
                    <Icon name={link.icon} size={18} />
                    {link.label}
                  </Button>
                ))}
              </div>
            </section>
          )}

          {item.hours && (
            <Muted className="border-rule flex items-center gap-2 border-b-2 px-6 py-4 sm:px-8">
              <Icon name="clock" size={16} /> {item.hours}
            </Muted>
          )}

          <Button
            href={`/?position=${item.position ?? ""}`}
            size="lg"
            block
            className="px-6 sm:px-8"
          >
            {item.position ? `Superar esta posición` : "Ver el ranking"}
          </Button>
        </article>
      </Container>

      <SiteFooter />
    </PageShell>
  );
}
