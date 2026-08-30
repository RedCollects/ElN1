import Link from "next/link";
import { Logo } from "@/app/ui";

export const metadata = {
  title: "Carta responsiva | EL N1",
  description: "Reconocimiento de riesgos para participar en EL N1.",
};

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Logo />
          <Link href="/" className="text-sm font-bold text-neutral-500">
            Volver al ranking
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <p className="text-accent-press text-sm font-bold tracking-[0.25em] uppercase">
          Antes de participar
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Carta responsiva
        </h1>
        <div className="mt-10 space-y-6 text-lg leading-8 text-neutral-600">
          <p>
            Entiendo que EL N1 es un experimento independiente y que pagar por
            una posición no equivale a contratar una campaña publicitaria ni un
            servicio de ventas.
          </p>
          <p>
            Acepto que no existe garantía de clientes, llamadas, mensajes,
            visitas, conversiones, alcance o ingresos. También entiendo que mi
            posición puede ser superada por otra oferta y que el importe pagado
            no asegura un tiempo fijo en el ranking.
          </p>
          <p>
            Confirmo que la información que proporcione sobre mi negocio es
            verdadera, que tengo autorización para usarla y que asumiré
            cualquier responsabilidad derivada de ella, incluidos sus productos,
            servicios, promociones y enlaces.
          </p>
          <p>
            Comprendo que EL N1 puede retirar información que incumpla la ley,
            estos términos o derechos de terceros. La plataforma tampoco
            verifica ni recomienda automáticamente los negocios que aparecen
            publicados.
          </p>
          <p>
            Al realizar una oferta acepto participar bajo mi propia
            responsabilidad y declaro que tuve oportunidad de leer los términos
            y condiciones.
          </p>
        </div>

        <div className="mt-10 border border-yellow-200 bg-yellow-50 p-5 text-base leading-7 text-yellow-950">
          Si buscas una estrategia de publicidad con resultados medibles, este
          proyecto no sustituye a una agencia o plataforma publicitaria
          profesional.
        </div>

        <Link
          href="/terminos"
          className="mt-10 inline-block border border-neutral-300 px-5 py-3 font-bold text-neutral-700 transition hover:bg-white"
        >
          Ver términos y condiciones
        </Link>
      </article>
    </main>
  );
}
