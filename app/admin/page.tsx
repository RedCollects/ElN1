import { redirect } from "next/navigation";
import { hasAdminSession } from "../../lib/admin-auth";
import { createServerSupabaseClient } from "../../lib/supabase-server";
import {
  Badge,
  Button,
  Card,
  Container,
  EmptyState,
  Heading,
  Muted,
  PageShell,
  Price,
  SiteHeader,
} from "@/app/ui";

export default async function AdminPage() {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }

  const supabase = createServerSupabaseClient();
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("*")
    .order("position", { ascending: true, nullsFirst: false });

  if (error) {
    return (
      <PageShell tone="muted" centered>
        <EmptyState tone="error" title="Error">
          {error.message}
        </EmptyState>
      </PageShell>
    );
  }

  return (
    <PageShell tone="muted">
      <SiteHeader subtitle="Panel administrador">
        <form action="/api/admin/logout" method="post">
          <Button variant="ghost" className="underline">
            Cerrar sesión
          </Button>
        </form>
      </SiteHeader>

      <Container className="py-10">
        <Heading as="h2">Negocios</Heading>

        <div className="mt-6 space-y-4">
          {(businesses ?? []).map((business) => (
            <Card key={business.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">{business.name}</h3>

                  <Muted className="mt-1">
                    {business.category || "Sin categoría"}
                    {business.city ? ` · ${business.city}` : ""}
                  </Muted>

                  <p className="mt-2 flex flex-wrap gap-2">
                    <Badge tone={business.status === "published" ? "success" : "warning"}>
                      {business.status === "published" ? "Publicado" : "Borrador"}
                    </Badge>
                    {business.position !== null && (
                      <Badge>Posición #{business.position}</Badge>
                    )}
                    {!business.owner_id && <Badge>Sin cuenta</Badge>}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-neutral-400">Oferta actual</p>
                  <Price value={business.current_price} />
                </div>

                <form action="/api/admin" method="post">
                  <input type="hidden" name="id" value={business.id} />
                  <input type="hidden" name="active" value={String(!business.active)} />
                  <Button variant="link" className="underline">
                    {business.active ? "Desactivar" : "Activar"}
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>

        {(!businesses || businesses.length === 0) && (
          <Card padding="lg" className="mt-6 text-center text-neutral-500">
            No hay negocios registrados.
          </Card>
        )}
      </Container>
    </PageShell>
  );
}
