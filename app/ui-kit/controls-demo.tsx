"use client";

import { useState } from "react";
import { Button, Modal, Radio, Segmented, Switch } from "@/app/ui";

/** Controles con estado y el diálogo de puja, para el catálogo. */
export function ControlsDemo() {
  const [days, setDays] = useState<7 | 15 | 30>(15);
  const [autoRenew, setAutoRenew] = useState(true);
  const [method, setMethod] = useState("card");
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2">
      <div>
        <p className="label text-neutral-800">Segmented</p>
        <Segmented
          className="mt-2"
          label="Duración"
          value={days}
          onChange={setDays}
          options={[
            { value: 7, label: "7 días" },
            { value: 15, label: "15 días" },
            { value: 30, label: "30 días" },
          ]}
        />
      </div>

      <div>
        <p className="label text-neutral-800">Switch</p>
        <div className="mt-2 flex items-center gap-3">
          <Switch
            checked={autoRenew}
            onChange={setAutoRenew}
            label="Renovación automática"
          />
          <span className="text-[15px]">Renovar automáticamente</span>
        </div>
      </div>

      <div>
        <p className="label text-neutral-800">Radio</p>
        <div className="mt-2 space-y-2">
          <Radio
            name="method"
            value="card"
            checked={method === "card"}
            onChange={setMethod}
          >
            Tarjeta
          </Radio>
          <Radio
            name="method"
            value="balance"
            checked={method === "balance"}
            onChange={setMethod}
          >
            Saldo de Mercado Pago
          </Radio>
        </div>
      </div>

      <div>
        <p className="label text-neutral-800">Diálogo</p>
        <Button
          className="mt-2"
          variant="secondary"
          onClick={() => setOpen(true)}
        >
          Abrir diálogo de puja
        </Button>
      </div>

      {open && (
        <Modal
          onClose={() => setOpen(false)}
          eyebrow="Confirmar"
          title="Pagar $330 por el #5"
          actions={
            <>
              <Button size="lg" onClick={() => setOpen(false)}>
                Pagar y ocupar
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="px-6"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
            </>
          }
        >
          <p className="text-[15px] leading-relaxed">
            Pasas del <strong>#6</strong> al <strong>#5</strong> por {days}{" "}
            días. Tu lugar es tuyo mientras nadie pague más.
          </p>
        </Modal>
      )}
    </div>
  );
}
