import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/supabase-auth";
import { createServerSupabaseClient } from "../../lib/supabase-server";
import { missingForPublish } from "../../lib/business";
import { formatPrice } from "../../lib/format";
import { signOut } from "../auth/actions";
import { BusinessEditor } from "./business-editor";
import {
  Alert,
  Button,
  Container,
  EmptyState,
  Eyebrow,
  Heading,
  PageShell,
  SiteHeader,
} from "@/app/ui";

export const metadata: Metadata = {
  title: "Mi negocio | EL N1",
};

export const dynamic = "force-dynamic";

export default async function MyBusinessPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/ingresar?next=/mi-negocio");
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <PageShell tone="muted" centered>
        <EmptyState tone="error" title="Error">
          {error.message}
        </EmptyState>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell tone="muted" centered>
        <EmptyState title="No encontramos tu negocio">
          Tu cuenta existe pero no tiene un negocio ligado. Escríbenos para
          resolverlo.
        </EmptyState>
      </PageShell>
    );
  }

  const business = data;
  const missing = missingForPublish(business);
  const isPublished =
    business.status === "published" && business.position !== null;

  return (
    <PageShell tone="muted">
      <SiteHeader>
        <span className="hidden text-neutral-500 sm:inline">{user.email}</span>
        <form action={signOut}>
          <Button variant="ghost" className="underline">
            Cerrar sesión
          </Button>
        </form>
      </SiteHeader>

      <Container className="py-10">
        <Eyebrow>Mi negocio</Eyebrow>
        <Heading as="h1" className="mt-1">
          {business.name}
        </Heading>

        {isPublished ? (
          <Alert
            tone="success"
            title={`Publicado en la posición #${business.position}`}
            className="mt-6"
          >
            <p>
              Oferta actual: {formatPrice(business.current_price)}. Los cambios
              que hagas en tu perfil se ven al instante.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                href={`/business/${business.id}`}
                variant="outline"
                size="sm"
                shape="rounded"
              >
                Ver mi página pública
              </Button>
              <Button href="/" variant="accent" size="sm" shape="rounded">
                Subir de posición
              </Button>
            </div>
          </Alert>
        ) : missing.length > 0 ? (
          <Alert
            tone="warning"
            title="Tu negocio aún no está publicado"
            className="mt-6"
          >
            <p>Para poder publicarlo falta:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Alert>
        ) : (
          <Alert tone="info" title="¡Tu perfil está completo!" className="mt-6">
            <p>Elige una posición en el ranking y paga para publicarlo.</p>
            <Button href="/" variant="accent" className="mt-4">
              Elegir posición y pagar
            </Button>
          </Alert>
        )}

        <BusinessEditor key={business.updated_at} business={business} />
      </Container>
    </PageShell>
  );
}
