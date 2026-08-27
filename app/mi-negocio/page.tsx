import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/supabase-auth";
import { createServerSupabaseClient } from "../../lib/supabase-server";
import { missingForPublish, type Business } from "../../lib/business";
import { signOut } from "../auth/actions";
import { BusinessEditor } from "./business-editor";

export const metadata: Metadata = {
  title: "Mi negocio | EL N1",
};

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
      <main className="min-h-screen bg-neutral-50 p-8">
        <h1 className="text-3xl font-black text-red-600">Error</h1>
        <p className="mt-3 text-neutral-600">{error.message}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-black">No encontramos tu negocio</h1>
          <p className="mt-3 text-neutral-500">
            Tu cuenta existe pero no tiene un negocio ligado. Escríbenos para
            resolverlo.
          </p>
        </div>
      </main>
    );
  }

  const business = data as Business;
  const missing = missingForPublish(business);
  const isPublished = business.status === "published" && business.position !== null;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-black tracking-tight">
            EL <span className="text-sky-400">N1</span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-neutral-500 sm:inline">{user.email}</span>
            <form action={signOut}>
              <button className="font-bold text-neutral-500 underline">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-sky-500">
          Mi negocio
        </p>
        <h1 className="mt-1 text-3xl font-black">{business.name}</h1>

        {isPublished ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <p className="text-lg font-black">
              Publicado en la posición #{business.position}
            </p>
            <p className="mt-1 text-sm">
              Oferta actual: $
              {Number(business.current_price ?? 0).toLocaleString("es-MX")} MXN.
              Los cambios que hagas en tu perfil se ven al instante.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/business/${business.id}`}
                className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold"
              >
                Ver mi página pública
              </Link>
              <Link
                href="/"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
              >
                Subir de posición
              </Link>
            </div>
          </div>
        ) : missing.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <p className="text-lg font-black">Tu negocio aún no está publicado</p>
            <p className="mt-1 text-sm">Para poder publicarlo falta:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sky-900">
            <p className="text-lg font-black">¡Tu perfil está completo!</p>
            <p className="mt-1 text-sm">
              Elige una posición en el ranking y paga para publicarlo.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-xl bg-sky-500 px-5 py-3 text-sm font-bold text-white"
            >
              Elegir posición y pagar
            </Link>
          </div>
        )}

        <BusinessEditor key={business.updated_at} business={business} />
      </section>
    </main>
  );
}
