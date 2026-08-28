"use client";

import { useActionState } from "react";
import { CATEGORIES, FIELD_LIMITS, type Business } from "@/lib/business";
import { updateProfile, type ProfileState } from "./actions";
import {
  Alert,
  Button,
  CardSection,
  Field,
  Input,
  PrefixedInput,
  Select,
  Textarea,
} from "@/app/ui";

const gridClassName = "grid gap-5 sm:grid-cols-2";

type Props = {
  business: Business;
  /** Se llama con el formulario en cada cambio, para la vista previa en vivo. */
  onChange?: (form: HTMLFormElement) => void;
};

export function ProfileForm({ business, onChange }: Props) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    {},
  );

  return (
    <form
      action={action}
      onChange={(event) => onChange?.(event.currentTarget)}
      className="space-y-6"
    >
      <CardSection
        title="Lo básico"
        description="Lo que se ve en la tarjeta del ranking."
      >
        <div className={gridClassName}>
          <Field label="Nombre del negocio *">
            <Input
              name="name"
              required
              maxLength={FIELD_LIMITS.name}
              defaultValue={business.name}
            />
          </Field>

          <Field label="Categoría *">
            <Select name="category" defaultValue={business.category ?? ""}>
              <option value="">Elige una categoría</option>
              {business.category && !CATEGORIES.includes(business.category) && (
                <option value={business.category}>{business.category}</option>
              )}
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Ciudad *">
            <Input
              name="city"
              maxLength={FIELD_LIMITS.city}
              defaultValue={business.city ?? ""}
              placeholder="Ej. Monterrey"
            />
          </Field>

          <Field
            label="Eslogan"
            hint={`Máximo ${FIELD_LIMITS.tagline} caracteres. Se ve en tu anuncio.`}
          >
            <Input
              name="tagline"
              maxLength={FIELD_LIMITS.tagline}
              defaultValue={business.tagline ?? ""}
              placeholder="Ej. Los mejores tacos al pastor de la colonia"
            />
          </Field>

          <Field
            label="Descripción"
            hint={`Máximo ${FIELD_LIMITS.description} caracteres. Solo en tu página.`}
            className="sm:col-span-2"
          >
            <Textarea
              name="description"
              rows={4}
              maxLength={FIELD_LIMITS.description}
              defaultValue={business.description ?? ""}
            />
          </Field>
        </div>
      </CardSection>

      <CardSection
        title="Contacto"
        description="Necesitas al menos uno para publicar. Los clientes te contactarán por aquí."
      >
        <div className={gridClassName}>
          <Field label="WhatsApp">
            <Input
              name="whatsapp"
              inputMode="numeric"
              maxLength={FIELD_LIMITS.whatsapp}
              defaultValue={business.whatsapp ?? ""}
              placeholder="10 dígitos, ej. 5512345678"
            />
          </Field>

          <Field label="Teléfono">
            <Input
              name="phone"
              inputMode="tel"
              maxLength={FIELD_LIMITS.phone}
              defaultValue={business.phone ?? ""}
            />
          </Field>

          <Field label="Email público">
            <Input
              type="email"
              name="email_public"
              maxLength={FIELD_LIMITS.email_public}
              defaultValue={business.email_public ?? ""}
            />
          </Field>

          <Field label="Sitio web">
            <Input
              name="website"
              maxLength={FIELD_LIMITS.website}
              defaultValue={business.website ?? ""}
              placeholder="minegocio.com"
            />
          </Field>
        </div>
      </CardSection>

      <CardSection
        title="Redes sociales"
        description="Solo el nombre de usuario, sin la dirección completa."
      >
        <div className={gridClassName}>
          {(["instagram", "facebook", "tiktok"] as const).map((network) => (
            <Field
              key={network}
              label={network[0].toUpperCase() + network.slice(1)}
            >
              <PrefixedInput
                prefix="@"
                name={network}
                maxLength={FIELD_LIMITS[network]}
                defaultValue={
                  business[network]?.replace(/^https?:\/\/[^/]+\/@?/, "") ?? ""
                }
                placeholder="usuario"
              />
            </Field>
          ))}
        </div>
      </CardSection>

      <CardSection title="Ubicación y horario">
        <div className={gridClassName}>
          <Field label="Enlace de Google Maps">
            <Input
              name="maps_url"
              maxLength={FIELD_LIMITS.maps_url}
              defaultValue={business.maps_url ?? ""}
              placeholder="https://maps.app.goo.gl/..."
            />
          </Field>

          <Field label="Horario">
            <Input
              name="hours"
              maxLength={FIELD_LIMITS.hours}
              defaultValue={business.hours ?? ""}
              placeholder="Ej. Lun-Sáb 9:00-20:00"
            />
          </Field>
        </div>
      </CardSection>

      {state.error && (
        <Alert tone="error" compact>
          {state.error}
        </Alert>
      )}

      {state.success && !state.error && (
        <Alert tone="success" compact>
          Perfil guardado.
        </Alert>
      )}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        disabled={pending}
        className="w-full sm:w-auto sm:px-10"
      >
        {pending ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
      </Button>
    </form>
  );
}
