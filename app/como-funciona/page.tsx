import type { Metadata } from "next";
import { INITIAL_PRICES, RANKING_SIZE } from "../../lib/prices";
import { formatPrice } from "../../lib/format";
import {
  Button,
  Container,
  Eyebrow,
  Heading,
  Lead,
  Muted,
  PageShell,
  SiteFooter,
  SiteHeader,
} from "@/app/ui";

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
    body: `El ranking tiene ${RANKING_SIZE} lugares. Los libres tienen un precio de salida; los ocupados muestran la oferta que los sostiene.`,
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
      `Bajas un lugar. Si te sacan del top ${RANKING_SIZE}, desapareces del ranking, pero tu perfil sigue existiendo y puedes volver a ofertar cuando quieras.`,
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

/** Posiciones con precio escalonado; de ahí en adelante todas cuestan lo mismo. */
const PRICED_POSITIONS = 10;

export default function ComoFuncionaPage() {
  const positions = Array.from({ length: PRICED_POSITIONS }, (_, i) => i + 1);

  return (
    <PageShell>
      <SiteHeader>
        <Button href="/" variant="outline" size="sm">
          Ver ranking
        </Button>
      </SiteHeader>

      <Container width="narrow" className="py-16">
        <article>
          <Eyebrow>¿Cómo funciona?</Eyebrow>

          <Heading as="h1" size="xl" className="mt-3">
            ¿Qué es esto?
          </Heading>

          <Lead className="mt-6 text-neutral-600">
            EL N1 es un ranking público de negocios de México con {RANKING_SIZE} lugares. No se gana
            con votos ni con reseñas: se gana pagando más que el que está arriba. El que más
            ofrece es EL N1, hasta que alguien lo supere.
          </Lead>

          <section className="mt-14">
            <Heading as="h2" size="md">
              En tres pasos
            </Heading>

            <ol className="mt-6 space-y-5">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-5 rounded-2xl border border-neutral-200 p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand font-black text-white">
                    {index + 1}
                  </div>

                  <div>
                    <h3 className="font-bold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-neutral-500">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-14">
            <Heading as="h2" size="md">
              Precios de salida
            </Heading>

            <Muted className="mt-2">
              Lo que cuesta cada posición cuando está libre. Si está ocupada, la oferta mínima
              es un 10 % más que la oferta actual.
            </Muted>

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
                    <tr key={position} className="border-t border-neutral-100">
                      <td className="px-5 py-3 font-bold">#{position}</td>
                      <td className="px-5 py-3 text-right font-bold text-brand-500">
                        {formatPrice(INITIAL_PRICES[position])}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-neutral-100">
                    <td className="px-5 py-3 font-bold">
                      #{PRICED_POSITIONS + 1} a #{RANKING_SIZE}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-brand-500">
                      {formatPrice(INITIAL_PRICES[RANKING_SIZE])}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-14">
            <Heading as="h2" size="md">
              Antes de pagar
            </Heading>

            <dl className="mt-6 space-y-6">
              {FAQ.map((item) => (
                <div key={item.question}>
                  <dt className="font-bold">{item.question}</dt>
                  <dd className="mt-1 leading-7 text-neutral-600">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="mt-14">
            <Button href="/" variant="accent" size="lg" block>
              VER EL RANKING
            </Button>
          </div>
        </article>
      </Container>

      <SiteFooter />
    </PageShell>
  );
}
