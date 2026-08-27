import type { Metadata } from "next";
import Link from "next/link";
import { INITIAL_PRICES, RANKING_SIZE } from "../../lib/prices";

export const metadata: Metadata = {
  title: "¿Cómo funciona? | EL N1",
  description:
    "Qué es EL N1, cómo se compite por una posición y qué debes saber antes de pagar.",
};

// BORRADOR: el contenido de esta página se está definiendo entre los dos
// desarrolladores. Los textos son una propuesta inicial.

const STEPS = [
  {
    title: "Elige una posición",
    body: "El ranking tiene 10 lugares. Los libres tienen un precio de salida; los ocupados muestran la oferta que los sostiene.",
  },
  {
    title: "Haz tu oferta",
    body: "Para ocupar un lugar libre pagas el precio de salida. Para superar a un negocio pagas al menos un 10 % más que su oferta actual.",
  },
  {
    title: "Paga con Mercado Pago",
    body: "Te enviamos a Mercado Pago. En cuanto confirman el pago, tu negocio aparece en la posición que elegiste y los demás bajan un lugar.",
  },
];

const FAQ = [
  {
    question: "¿Qué pasa si alguien me supera?",
    answer:
      "Bajas un lugar. Si te sacan del top 10, desapareces del ranking. Puedes volver a ofertar cuando quieras.",
  },
  {
    question: "¿Me devuelven el dinero si me superan?",
    answer:
      "No. Pagas por ocupar la posición en ese momento, no por un tiempo garantizado. Igual que en una subasta.",
  },
  {
    question: "¿Cuánto tiempo dura mi posición?",
    answer:
      "Hasta que alguien pague más que tú. Puede ser una hora o puede ser meses.",
  },
  {
    question: "¿Esto me garantiza clientes o ventas?",
    answer:
      "No garantizamos ningún resultado: ni ventas, ni clientes, ni visitas. EL N1 es un ranking público y un juego de competencia entre negocios, no un servicio de publicidad.",
  },
];

export default function ComoFuncionaPage() {
  const positions = Array.from({ length: RANKING_SIZE }, (_, i) => i + 1);

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-black tracking-tight">
            EL <span className="text-sky-400">N1</span>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Ver ranking
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-sky-400">
          ¿Cómo funciona?
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">
          ¿Qué es esto?
        </h1>

        <p className="mt-6 text-lg leading-8 text-neutral-600">
          EL N1 es un ranking público de negocios de México con solo 10
          lugares. No se gana con votos ni con reseñas: se gana pagando más
          que el que está arriba. El que más ofrece es EL N1, hasta que
          alguien lo supere.
        </p>

        <section className="mt-14">
          <h2 className="text-2xl font-black text-neutral-950">
            En tres pasos
          </h2>

          <ol className="mt-6 space-y-5">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-5 rounded-2xl border border-neutral-200 p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-400 font-black text-white">
                  {index + 1}
                </div>

                <div>
                  <h3 className="font-bold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-neutral-500">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-black text-neutral-950">
            Precios de salida
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Lo que cuesta cada posición cuando está libre. Si está ocupada,
            la oferta mínima es un 10 % más que la oferta actual.
          </p>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-bold uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="px-5 py-3">Posición</th>
                  <th className="px-5 py-3 text-right">Precio de salida</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => (
                  <tr
                    key={position}
                    className="border-t border-neutral-100"
                  >
                    <td className="px-5 py-3 font-bold">#{position}</td>
                    <td className="px-5 py-3 text-right font-bold text-sky-500">
                      ${INITIAL_PRICES[position].toLocaleString("es-MX")} MXN
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-black text-neutral-950">
            Antes de pagar
          </h2>

          <dl className="mt-6 space-y-6">
            {FAQ.map((item) => (
              <div key={item.question}>
                <dt className="font-bold">{item.question}</dt>
                <dd className="mt-1 leading-7 text-neutral-600">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-14">
          <Link
            href="/"
            className="block w-full rounded-xl bg-sky-400 px-5 py-4 text-center font-bold text-white transition hover:bg-sky-500"
          >
            VER EL RANKING
          </Link>
        </div>
      </article>

      <footer className="border-t border-neutral-200 py-8 text-center text-sm text-neutral-400">
        EL N1 — México
      </footer>
    </main>
  );
}
