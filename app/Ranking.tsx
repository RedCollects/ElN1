"use client";

import { useState } from "react";
import {
  INITIAL_PRICES,
  RANKING_SIZE,
  isValidPosition,
  minimumOfferFor,
} from "../lib/prices";
import type { Business } from "../lib/business";
import { RankingCard } from "./components/RankingCard";

type Props = {
  businesses: Business[];
  initialPosition?: number | null;
};

export default function Ranking({ businesses, initialPosition = null }: Props) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(
    initialPosition && isValidPosition(initialPosition)
      ? initialPosition
      : null
  );

  const [businessName, setBusinessName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const positions = Array.from(
    { length: RANKING_SIZE },
    (_, index) => index + 1
  );

  const getBusinessForPosition = (position: number) => {
    return businesses.find((business) => business.position === position);
  };

  const selectedBusiness = selectedPosition
    ? getBusinessForPosition(selectedPosition)
    : null;

  const basePrice = selectedPosition
    ? INITIAL_PRICES[selectedPosition]
    : INITIAL_PRICES[RANKING_SIZE];

  const currentPrice = selectedBusiness?.current_price ?? basePrice;

  const minimumOffer = selectedPosition
    ? minimumOfferFor(selectedPosition, selectedBusiness?.current_price)
    : basePrice;

  function openPosition(position: number) {
    setSelectedPosition(position);
    setBusinessName("");
    setConfirmed(false);
    setLoading(false);
  }

  function closeModal() {
    setSelectedPosition(null);
    setBusinessName("");
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

          <p className="mt-2 text-sm text-neutral-500">
            Cada posición es un espacio disponible para competir. Pasa el
            cursor o toca un negocio para ver su anuncio.
          </p>
        </div>

        <div className="space-y-4">
          {positions.map((position) => (
            <RankingCard
              key={position}
              position={position}
              business={getBusinessForPosition(position) ?? null}
              onBid={openPosition}
            />
          ))}
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
