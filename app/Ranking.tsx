"use client";

import Link from "next/link";
import { useState } from "react";
import {
  getInitialPrice,
  getMinimumOffer,
  MAX_RANKING_POSITION,
} from "../lib/prices";
import { BUSINESS_CATEGORIES } from "../lib/categories";
import { trackBusinessClick } from "./SiteExperience";

type Business = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  position: number | null;
  current_price: number | null;
  active: boolean;
};

type Props = {
  businesses: Business[];
  initialPosition?: number | null;
};

export default function Ranking({ businesses, initialPosition = null }: Props) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(
    initialPosition &&
    initialPosition >= 1 &&
    initialPosition <= MAX_RANKING_POSITION
      ? initialPosition
      : null
  );

  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState(BUSINESS_CATEGORIES[0]);
  const [activeCategory, setActiveCategory] = useState<string>("Todas");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const positions = Array.from(
    { length: MAX_RANKING_POSITION },
    (_, index) => index + 1
  );
  const categoryOptions = Array.from(
    new Set([
      ...BUSINESS_CATEGORIES,
      ...businesses.flatMap((business) => business.category ? [business.category] : []),
    ])
  );

  const getBusinessForPosition = (position: number) => {
    return businesses.find((business) => business.position === position);
  };

  const selectedBusiness = selectedPosition
    ? getBusinessForPosition(selectedPosition)
    : null;

  const basePrice = selectedPosition ? getInitialPrice(selectedPosition) : 10;
  const currentPrice = selectedBusiness?.current_price ?? basePrice;
  const minimumOffer = selectedPosition
    ? getMinimumOffer(selectedPosition, selectedBusiness?.current_price)
    : basePrice;

  function openPosition(position: number) {
    setSelectedPosition(position);
    setBusinessName("");
    setBusinessCategory(BUSINESS_CATEGORIES[0]);
    setConfirmed(false);
    setLoading(false);
  }

  function closeModal() {
    setSelectedPosition(null);
    setBusinessName("");
    setBusinessCategory(BUSINESS_CATEGORIES[0]);
    setConfirmed(false);
    setLoading(false);
  }

  function continueToConfirmation() {
    if (!businessName.trim()) return;

    setConfirmed(true);
  }

  async function continueToPayment() {
    if (!selectedPosition || !businessName.trim()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: businessName.trim(),
          category: businessCategory,
          position: selectedPosition,
          amount: minimumOffer,
        }),
      });

      const responseText = await response.text();
      let data: { error?: string; init_point?: string } = {};

      try {
        data = JSON.parse(responseText);
      } catch {
        data = { error: "El servidor devolvió una respuesta no válida." };
      }

      if (!response.ok) {
        alert(data.error || "No se pudo iniciar el pago.");
        setLoading(false);
        return;
      }

      if (!data.init_point) {
        alert("Mercado Pago no devolvió la dirección de pago.");
        setLoading(false);
        return;
      }

      window.location.assign(data.init_point);
    } catch (error) {
      console.error("Error al conectar con Mercado Pago:", error);
      alert("No se pudo conectar con Mercado Pago.");
      setLoading(false);
    }
  }

  return (
    <>
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-sky-500">
            Ranking actual
          </p>

          <h2 className="mt-1 text-3xl font-black text-neutral-950">
            Los que están arriba
          </h2>

          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Negocios reales compitiendo por atención en México.
          </p>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {["Todas", ...categoryOptions].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                activeCategory === category
                  ? "bg-neutral-950 text-white dark:bg-sky-400 dark:text-neutral-950"
                  : "border border-neutral-200 bg-white text-neutral-600 hover:border-sky-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {positions.map((position) => {
            const business = getBusinessForPosition(position);
            if (
              activeCategory !== "Todas" &&
              (!business || business.category !== activeCategory)
            ) {
              return null;
            }

            if (business) {
              return (
                <div
                  key={position}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 ${
                    position === 1
                      ? "border-yellow-300 bg-yellow-50"
                      : position === 2
                        ? "border-neutral-300 bg-neutral-50"
                        : position === 3
                          ? "border-orange-200 bg-orange-50"
                          : "border-neutral-200 bg-white"
                  }`}
                >
                  <Link
                    href={`/business/${business.id}`}
                    onClick={() => trackBusinessClick(business.id)}
                    className="flex min-w-0 flex-1 items-center gap-4"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-lg font-black">
                      {position === 1
                        ? "🥇"
                        : position === 2
                          ? "🥈"
                          : position === 3
                            ? "🥉"
                            : `#${position}`}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        Posición #{position}
                      </p>

                      <h3 className="truncate text-lg font-bold">
                        {business.name}
                      </h3>

                      <p className="text-sm text-neutral-500">
                        {business.category || "Sin categoría"}
                      </p>
                    </div>
                  </Link>

                  <div className="text-right">
                    <p className="text-xs text-neutral-400">
                      Oferta actual
                    </p>

                    <p className="font-black text-sky-500">
                      $
                      {Number(
                        business.current_price ?? 0
                      ).toLocaleString("es-MX")}{" "}
                      MXN
                    </p>

                    <button
                      onClick={() => openPosition(position)}
                      className="mt-2 rounded-full bg-sky-400 px-4 py-2 text-xs font-bold text-white"
                    >
                      SUPERAR
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={position}
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-5"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-lg font-black text-neutral-500">
                  #{position}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-500">
                    Posición #{position}
                  </p>

                  <h3 className="mt-1 text-lg font-black">
                    POSICIÓN DISPONIBLE
                  </h3>

                  <p className="mt-1 text-sm text-neutral-500">
                    Haz que tu negocio aparezca aquí.
                  </p>

                  <p className="mt-2 text-sm font-bold">
                    Desde $
                    {getInitialPrice(position).toLocaleString(
                      "es-MX"
                    )}{" "}
                    MXN
                  </p>
                </div>

                <button
                  onClick={() => openPosition(position)}
                  className="shrink-0 rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white"
                >
                  OCUPAR
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {selectedPosition !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 px-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">

            {!confirmed ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-sky-500">
                      Posición #{selectedPosition}
                    </p>

                    <h2 className="mt-2 text-3xl font-black">
                      {selectedBusiness
                        ? "Superar posición"
                        : "Ocupa esta posición"}
                    </h2>
                  </div>

                  <button
                    onClick={closeModal}
                    className="text-2xl text-neutral-400"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-6 rounded-2xl bg-sky-50 p-5">
                  <p className="text-sm text-neutral-500">
                    {selectedBusiness
                      ? "Oferta actual"
                      : "Precio de esta posición"}
                  </p>

                  <p className="mt-1 text-3xl font-black text-sky-500">
                    $
                    {Number(currentPrice).toLocaleString(
                      "es-MX"
                    )}{" "}
                    MXN
                  </p>

                  <div className="my-4 h-px bg-sky-100" />

                  <p className="text-sm text-neutral-500">
                    Tu oferta mínima
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    $
                    {minimumOffer.toLocaleString(
                      "es-MX"
                    )}{" "}
                    MXN
                  </p>
                </div>

                <label className="mt-6 block text-sm font-bold">
                  Nombre de tu negocio
                </label>

                <input
                  value={businessName}
                  onChange={(event) =>
                    setBusinessName(event.target.value)
                  }
                  placeholder="Ej. Restaurante El N1"
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-sky-400"
                />

                <label className="mt-5 block text-sm font-bold">
                  Categoría
                </label>

                <input
                  value={businessCategory}
                  onChange={(event) => setBusinessCategory(event.target.value)}
                  list="business-categories"
                  placeholder="Elige o escribe una categoría"
                  maxLength={60}
                  required
                  className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-sky-400 dark:bg-neutral-900"
                />
                <datalist id="business-categories">
                  {BUSINESS_CATEGORIES.map((category) => <option key={category} value={category} />)}
                </datalist>

                <button
                  onClick={continueToConfirmation}
                  disabled={!businessName.trim()}
                  className="mt-5 w-full rounded-xl bg-sky-400 px-5 py-4 font-bold text-white disabled:opacity-40"
                >
                  CONTINUAR
                </button>

                <p className="mt-4 text-center text-xs text-neutral-400">
                  Siguiente paso: confirmar y pagar.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold uppercase tracking-widest text-sky-500">
                  Confirmar oferta
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  Estás por ocupar la posición #{selectedPosition}
                </h2>

                <div className="mt-6 space-y-4 rounded-2xl bg-neutral-50 p-5">
                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-500">
                      Negocio
                    </span>

                    <span className="text-right font-bold">
                      {businessName}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-500">Categoría</span>
                    <span className="text-right font-bold">{businessCategory}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-neutral-500">
                      Posición
                    </span>

                    <span className="font-bold">
                      #{selectedPosition}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-neutral-500">
                      Tu oferta
                    </span>

                    <span className="text-xl font-black text-sky-500">
                      $
                      {minimumOffer.toLocaleString(
                        "es-MX"
                      )}{" "}
                      MXN
                    </span>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-neutral-500">
                  Al continuar serás enviado a Mercado Pago.
                  Tu posición se asignará una vez confirmado el pago.
                </p>

                <p className="mt-3 text-xs leading-5 text-neutral-400">
                  Al continuar aceptas los{" "}
                  <Link href="/terminos" className="underline">
                    términos y condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link href="/responsiva" className="underline">
                    carta responsiva
                  </Link>
                  .
                </p>

                <button
                  onClick={continueToPayment}
                  disabled={loading}
                  className="mt-5 w-full rounded-xl bg-sky-400 px-5 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "CONECTANDO CON MERCADO PAGO..."
                    : "CONTINUAR AL PAGO"}
                </button>

                <button
                  onClick={() => setConfirmed(false)}
                  disabled={loading}
                  className="mt-3 w-full py-3 text-sm font-bold text-neutral-500"
                >
                  REGRESAR
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
