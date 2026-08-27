"use client";

import { useActionState } from "react";
import { CATEGORIES, FIELD_LIMITS, type Business } from "../../lib/business";
import { updateProfile, type ProfileState } from "./actions";

const inputClassName =
  "mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-sky-400";
const labelClassName = "block text-sm font-bold";
const hintClassName = "mt-1 text-xs text-neutral-400";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-xl font-black">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      )}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function ProfileForm({ business }: { business: Business }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    {}
  );

  return (
    <form action={action} className="mt-8 space-y-6">
      <Section title="Lo básico" description="Lo que se ve en la tarjeta del ranking.">
        <label className={labelClassName}>
          Nombre del negocio *
          <input
            name="name"
            required
            maxLength={FIELD_LIMITS.name}
            defaultValue={business.name}
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          Categoría *
          <select
            name="category"
            defaultValue={business.category ?? ""}
            className={inputClassName}
          >
            <option value="">Elige una categoría</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          Ciudad *
          <input
            name="city"
            maxLength={FIELD_LIMITS.city}
            defaultValue={business.city ?? ""}
            placeholder="Ej. Monterrey"
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          Eslogan
          <input
            name="tagline"
            maxLength={FIELD_LIMITS.tagline}
            defaultValue={business.tagline ?? ""}
            placeholder="Ej. Los mejores tacos al pastor de la colonia"
            className={inputClassName}
          />
          <span className={hintClassName}>
            Máximo {FIELD_LIMITS.tagline} caracteres. Se ve en tu anuncio.
          </span>
        </label>

        <label className={`${labelClassName} sm:col-span-2`}>
          Descripción
          <textarea
            name="description"
            rows={4}
            maxLength={FIELD_LIMITS.description}
            defaultValue={business.description ?? ""}
            className={inputClassName}
          />
          <span className={hintClassName}>
            Máximo {FIELD_LIMITS.description} caracteres. Solo en tu página.
          </span>
        </label>
      </Section>

      <Section
        title="Contacto"
        description="Necesitas al menos uno para publicar. Los clientes te contactarán por aquí."
      >
        <label className={labelClassName}>
          WhatsApp
          <input
            name="whatsapp"
            inputMode="numeric"
            maxLength={FIELD_LIMITS.whatsapp}
            defaultValue={business.whatsapp ?? ""}
            placeholder="10 dígitos, ej. 5512345678"
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          Teléfono
          <input
            name="phone"
            inputMode="tel"
            maxLength={FIELD_LIMITS.phone}
            defaultValue={business.phone ?? ""}
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          Email público
          <input
            type="email"
            name="email_public"
            maxLength={FIELD_LIMITS.email_public}
            defaultValue={business.email_public ?? ""}
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          Sitio web
          <input
            name="website"
            maxLength={FIELD_LIMITS.website}
            defaultValue={business.website ?? ""}
            placeholder="minegocio.com"
            className={inputClassName}
          />
        </label>
      </Section>

      <Section title="Redes sociales" description="Solo el nombre de usuario, sin la dirección completa.">
        {(["instagram", "facebook", "tiktok"] as const).map((network) => (
          <label key={network} className={labelClassName}>
            {network[0].toUpperCase() + network.slice(1)}
            <div className="mt-1 flex items-center rounded-xl border border-neutral-300 bg-white focus-within:border-sky-400">
              <span className="pl-4 text-neutral-400">@</span>
              <input
                name={network}
                maxLength={FIELD_LIMITS[network]}
                defaultValue={business[network]?.replace(/^https?:\/\/[^/]+\/@?/, "") ?? ""}
                placeholder="usuario"
                className="w-full rounded-xl bg-transparent px-2 py-3 outline-none"
              />
            </div>
          </label>
        ))}
      </Section>

      <Section title="Ubicación y horario">
        <label className={labelClassName}>
          Enlace de Google Maps
          <input
            name="maps_url"
            maxLength={FIELD_LIMITS.maps_url}
            defaultValue={business.maps_url ?? ""}
            placeholder="https://maps.app.goo.gl/..."
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          Horario
          <input
            name="hours"
            maxLength={FIELD_LIMITS.hours}
            defaultValue={business.hours ?? ""}
            placeholder="Ej. Lun-Sáb 9:00-20:00"
            className={inputClassName}
          />
        </label>
      </Section>

      <Section title="Imágenes" description="Logo (cuadrado, 1024×1024) y portada (16:9, 1600×900).">
        <p className="text-sm text-neutral-500 sm:col-span-2">
          La subida de imágenes llega en la siguiente entrega. Mientras tanto,
          el logo es necesario para publicar.
        </p>
      </Section>

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {state.success && !state.error && (
        <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          Perfil guardado.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-sky-400 px-5 py-4 font-bold text-white disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {pending ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
      </button>
    </form>
  );
}
