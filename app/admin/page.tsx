import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { BUSINESS_CATEGORIES } from "@/lib/categories";
import { toggleBusinessActive, updateBusinessProfile } from "./actions";

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
      <main className="min-h-screen bg-neutral-50 p-8">
        <h1 className="text-3xl font-black text-red-600">Error</h1>
        <p className="mt-3 text-neutral-600">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-2xl font-black">
              EL <span className="text-sky-400">N1</span>
            </h1>
            <p className="text-sm text-neutral-500">Panel administrador</p>
          </div>
          <form action="/api/admin/logout" method="post">
            <button className="text-sm font-bold text-neutral-500 underline">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-3xl font-black">Negocios</h2>
        <p className="mt-2 text-neutral-500">
          Edita la información que verán las personas en el ranking.
        </p>

        {updated && (
          <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 font-medium text-emerald-700">
            Cambios guardados.
          </p>
        )}
        {updateError && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 font-medium text-red-700">
            {updateError}
          </p>
        )}

        <datalist id="admin-business-categories">
          {BUSINESS_CATEGORIES.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>

        <div className="mt-6 space-y-4">
          {(businesses ?? []).map((business) => (
            <details
              key={business.id}
              className="rounded-2xl border border-neutral-200 bg-white p-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5">
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-bold">
                    {business.name}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    #{business.position ?? "Sin posición"} ·{" "}
                    {business.category || "Sin categoría"} ·{" "}
                    {business.active ? "Activo" : "Inactivo"} ·{" "}
                    {business.status === "published" ? "Publicado" : "Borrador"}
                    {business.owner_id ? "" : " · Sin cuenta"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm text-neutral-400">Oferta actual</p>
                  <p className="text-xl font-black text-sky-500">
                    $
                    {Number(business.current_price ?? 0).toLocaleString(
                      "es-MX",
                    )}{" "}
                    MXN
                  </p>
                </div>
              </summary>

              <div className="mt-6 border-t border-neutral-100 pt-6">
                <form
                  action={updateBusinessProfile}
                  className="grid gap-5 sm:grid-cols-2"
                >
                  <input type="hidden" name="id" value={business.id} />

                  <label className="text-sm font-bold">
                    Nombre
                    <input
                      required
                      name="name"
                      maxLength={120}
                      defaultValue={business.name}
                      className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5 font-normal"
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Categoría
                    <input
                      required
                      name="category"
                      list="admin-business-categories"
                      maxLength={60}
                      defaultValue={business.category ?? ""}
                      placeholder="Elige o escribe una nueva"
                      className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5 font-normal"
                    />
                  </label>
                  <label className="text-sm font-bold sm:col-span-2">
                    Descripción
                    <textarea
                      name="description"
                      maxLength={1500}
                      defaultValue={business.description ?? ""}
                      rows={4}
                      className="mt-2 w-full resize-y rounded-xl border border-neutral-300 px-3 py-2.5 font-normal"
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Teléfono
                    <input
                      name="phone"
                      maxLength={30}
                      defaultValue={business.phone ?? ""}
                      className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5 font-normal"
                    />
                  </label>
                  <label className="text-sm font-bold">
                    WhatsApp (con lada)
                    <input
                      name="whatsapp"
                      maxLength={30}
                      defaultValue={business.whatsapp ?? ""}
                      placeholder="5216621234567"
                      className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5 font-normal"
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Sitio web
                    <input
                      name="website"
                      type="url"
                      defaultValue={business.website ?? ""}
                      placeholder="https://ejemplo.mx"
                      className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5 font-normal"
                    />
                  </label>
                  <label className="text-sm font-bold">
                    URL del logo
                    <input
                      name="logo_url"
                      type="url"
                      defaultValue={business.logo_url ?? ""}
                      placeholder="https://..."
                      className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5 font-normal"
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Instagram
                    <input
                      name="instagram"
                      type="url"
                      defaultValue={business.instagram ?? ""}
                      placeholder="https://instagram.com/..."
                      className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5 font-normal"
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Facebook
                    <input
                      name="facebook"
                      type="url"
                      defaultValue={business.facebook ?? ""}
                      placeholder="https://facebook.com/..."
                      className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5 font-normal"
                    />
                  </label>
                  <label className="text-sm font-bold">
                    TikTok
                    <input
                      name="tiktok"
                      type="url"
                      defaultValue={business.tiktok ?? ""}
                      placeholder="https://tiktok.com/@..."
                      className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5 font-normal"
                    />
                  </label>
                  <div className="flex items-end">
                    <button className="w-full rounded-xl bg-sky-400 px-5 py-3 font-bold text-white transition hover:bg-sky-500">
                      Guardar perfil
                    </button>
                  </div>
                </form>

                <form action={toggleBusinessActive} className="mt-5">
                  <input type="hidden" name="id" value={business.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={String(!business.active)}
                  />
                  <button className="text-sm font-bold text-sky-600 underline">
                    {business.active ? "Desactivar negocio" : "Activar negocio"}
                  </button>
                </form>
              </div>
            </details>
          ))}
        </div>

        {(!businesses || businesses.length === 0) && (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
            No hay negocios registrados.
          </div>
        )}
      </section>
    </main>
  );
}
