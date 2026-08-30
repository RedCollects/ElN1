import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { BUSINESS_CATEGORIES } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import { toggleBusinessActive, updateBusinessProfile } from "./actions";
import {
  Alert,
  Button,
  Container,
  EmptyState,
  Eyebrow,
  Field,
  Figure,
  Heading,
  Input,
  Muted,
  PageShell,
  SiteHeader,
  Tag,
  Textarea,
} from "@/app/ui";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  if (!(await hasAdminSession())) redirect("/admin/login");

  const { updated, error: updateError } = await searchParams;
  const supabase = createServerSupabaseClient();
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("*")
    .order("position", { ascending: true, nullsFirst: false });

  if (error) {
    return (
      <PageShell centered>
        <EmptyState tone="error" title="Error">
          {error.message}
        </EmptyState>
      </PageShell>
    );
  }

  const FIELDS = [
    { name: "phone", label: "Teléfono", maxLength: 30 },
    {
      name: "whatsapp",
      label: "WhatsApp (con lada)",
      maxLength: 30,
      placeholder: "5216621234567",
    },
    {
      name: "website",
      label: "Sitio web",
      type: "url",
      placeholder: "https://ejemplo.mx",
    },
    {
      name: "logo_url",
      label: "URL del logo",
      type: "url",
      placeholder: "https://...",
    },
    {
      name: "instagram",
      label: "Instagram",
      type: "url",
      placeholder: "https://instagram.com/...",
    },
    {
      name: "facebook",
      label: "Facebook",
      type: "url",
      placeholder: "https://facebook.com/...",
    },
    {
      name: "tiktok",
      label: "TikTok",
      type: "url",
      placeholder: "https://tiktok.com/@...",
    },
  ] as const;

  return (
    <PageShell>
      <SiteHeader subtitle="Panel administrador">
        <form action="/api/admin/logout" method="post">
          <Button variant="ghost">Cerrar sesión</Button>
        </form>
      </SiteHeader>

      <Container className="py-10">
        <Eyebrow>Administración</Eyebrow>
        <Heading as="h1" size="title" className="mt-2">
          Negocios
        </Heading>
        <Muted className="mt-2">
          Edita la información que verán las personas en el ranking.
        </Muted>

        {updated && (
          <Alert tone="neutral" compact className="mt-6">
            Cambios guardados.
          </Alert>
        )}
        {updateError && (
          <Alert tone="error" compact className="mt-6">
            {updateError}
          </Alert>
        )}

        <datalist id="admin-business-categories">
          {BUSINESS_CATEGORIES.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>

        <div className="border-rule mt-8 border-t-2">
          {(businesses ?? []).map((business) => (
            <details
              key={business.id}
              className="group border-rule bg-surface border-b-2"
            >
              <summary className="hover:bg-surface-2 grid cursor-pointer list-none grid-cols-[64px_minmax(0,1fr)] items-center gap-4 px-4 py-4 sm:grid-cols-[80px_minmax(0,1fr)_160px] sm:px-6">
                <Figure
                  size={26}
                  tone={business.position === 1 ? "accent" : "ink"}
                >
                  {business.position ? `#${business.position}` : "—"}
                </Figure>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-extrabold tracking-[-0.01em]">
                    {business.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Tag
                      tone={
                        business.status === "published" ? "taken" : "neutral"
                      }
                    >
                      {business.status === "published"
                        ? "Publicado"
                        : "Borrador"}
                    </Tag>
                    <Tag tone={business.active ? "neutral" : "down"}>
                      {business.active ? "Activo" : "Inactivo"}
                    </Tag>
                    <span className="text-muted text-[13px]">
                      {business.category || "Sin categoría"}
                      {business.owner_id ? "" : " · Sin cuenta"}
                    </span>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="label text-faint">Paga ahora</p>
                  <Figure size={22} tone="accent" as="p" className="mt-1">
                    {formatPrice(business.current_price)}
                  </Figure>
                </div>
              </summary>

              <div className="border-rule-soft bg-bg border-t px-4 py-6 sm:px-6">
                <form
                  action={updateBusinessProfile}
                  className="grid gap-5 sm:grid-cols-2"
                >
                  <input type="hidden" name="id" value={business.id} />

                  <Field label="Nombre">
                    <Input
                      required
                      name="name"
                      maxLength={120}
                      defaultValue={business.name}
                    />
                  </Field>
                  <Field label="Categoría">
                    <Input
                      required
                      name="category"
                      list="admin-business-categories"
                      maxLength={60}
                      defaultValue={business.category ?? ""}
                      placeholder="Elige o escribe una nueva"
                    />
                  </Field>
                  <Field label="Descripción" className="sm:col-span-2">
                    <Textarea
                      name="description"
                      maxLength={1500}
                      defaultValue={business.description ?? ""}
                      rows={4}
                    />
                  </Field>
                  {FIELDS.map((field) => (
                    <Field key={field.name} label={field.label}>
                      <Input
                        name={field.name}
                        type={"type" in field ? field.type : "text"}
                        maxLength={
                          "maxLength" in field ? field.maxLength : undefined
                        }
                        placeholder={
                          "placeholder" in field ? field.placeholder : undefined
                        }
                        defaultValue={business[field.name] ?? ""}
                      />
                    </Field>
                  ))}
                  <div className="flex items-end">
                    <Button block>Guardar perfil</Button>
                  </div>
                </form>

                <form action={toggleBusinessActive} className="mt-5">
                  <input type="hidden" name="id" value={business.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={String(!business.active)}
                  />
                  <Button variant="ghost" size="sm">
                    {business.active ? "Desactivar negocio" : "Activar negocio"}
                  </Button>
                </form>
              </div>
            </details>
          ))}
        </div>

        {(!businesses || businesses.length === 0) && (
          <Muted className="mt-6">No hay negocios registrados.</Muted>
        )}
      </Container>
    </PageShell>
  );
}
