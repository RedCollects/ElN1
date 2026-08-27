import { redirect } from "next/navigation";
import { hasAdminSession } from "../../lib/admin-auth";
import { createServerSupabaseClient } from "../../lib/supabase-server";

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
      <main className="min-h-screen bg-neutral-50 p-8">
        <h1 className="text-3xl font-black text-red-600">
          Error
        </h1>

        <p className="mt-3 text-neutral-600">
          {error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <h1 className="text-2xl font-black">
            EL <span className="text-sky-400">N1</span>
          </h1>

          <p className="text-sm text-neutral-500">
            Panel administrador
          </p>

          <form action="/api/admin/logout" method="post" className="mt-3">
            <button className="text-sm font-bold text-neutral-500 underline">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-3xl font-black">
          Negocios
        </h2>

        <div className="mt-6 space-y-4">
          {(businesses ?? []).map((business) => (
            <div
              key={business.id}
              className="rounded-2xl border border-neutral-200 bg-white p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    {business.name}
                  </h3>

                  <p className="mt-1 text-sm text-neutral-500">
                    {business.category || "Sin categoría"}
                    {business.city ? ` · ${business.city}` : ""}
                  </p>

                  <p className="mt-2 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider">
                    <span
                      className={
                        business.status === "published"
                          ? "rounded-full bg-emerald-100 px-2 py-1 text-emerald-800"
                          : "rounded-full bg-amber-100 px-2 py-1 text-amber-800"
                      }
                    >
                      {business.status === "published" ? "Publicado" : "Borrador"}
                    </span>
                    {business.position !== null && (
                      <span className="rounded-full bg-neutral-100 px-2 py-1 text-neutral-600">
                        Posición #{business.position}
                      </span>
                    )}
                    {!business.owner_id && (
                      <span className="rounded-full bg-neutral-100 px-2 py-1 text-neutral-500">
                        Sin cuenta
                      </span>
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-neutral-400">
                    Oferta actual
                  </p>

                  <p className="text-2xl font-black text-sky-500">
                    $
                    {Number(
                      business.current_price ?? 0
                    ).toLocaleString("es-MX")}{" "}
                    MXN
                  </p>
                </div>

                <form action="/api/admin" method="post">
                  <input type="hidden" name="id" value={business.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={String(!business.active)}
                  />
                  <button className="text-sm font-bold text-sky-600 underline">
                    {business.active ? "Desactivar" : "Activar"}
                  </button>
                </form>
              </div>
            </div>
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