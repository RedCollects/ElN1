import type { Metadata } from "next";
import {
  INITIAL_PRICES,
  MAX_RANKING_POSITION,
  OUTBID_FACTOR,
} from "@/lib/prices";
import { RESERVATION_MINUTES } from "@/lib/payments";
import { BIG_AD_MAX_POSITION } from "@/lib/business";
import { formatPrice } from "@/lib/format";
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
    "Las reglas de EL N1: cómo se compite por una posición, qué cuesta, qué pasa cuando te superan y qué necesitas para participar.",
};

/*
 * Esta página es la referencia oficial de las reglas (los Términos remiten a
 * "las reglas visibles del sitio"). Todos los números salen del código
 * (lib/prices, lib/payments, lib/business) para que nunca queden desfasados.
 */

/** Posiciones con precio de salida escalonado; de ahí en adelante todas cuestan lo mismo. */
const PRICED_POSITIONS = 10;
const OUTBID_PERCENT = Math.round((OUTBID_FACTOR - 1) * 100);

const STEPS = [
  {
    title: "Registra tu negocio",
    body: "Crea una cuenta con tu correo y completa el perfil de tu negocio: nombre, categoría, ciudad, logo y al menos un medio de contacto (WhatsApp, teléfono, correo o sitio web). Es gratis y no te compromete a nada.",
  },
  {
    title: "Elige una posición y haz tu oferta",
    body: `El ranking tiene ${MAX_RANKING_POSITION} lugares. Si el lugar está libre, pagas su precio de salida. Si está ocupado, tu oferta debe superar en al menos ${OUTBID_PERCENT} % la oferta que lo sostiene. El sitio te muestra siempre el mínimo exacto.`,
  },
  {
    title: "Reserva y paga con Mercado Pago",
    body: `Al confirmar, la posición queda reservada a ese precio durante ${RESERVATION_MINUTES} minutos mientras pagas con tarjeta, débito o saldo de Mercado Pago. En cuanto el pago se confirma, tu negocio aparece en la posición que elegiste.`,
  },
];

const RULES = [
  {
    title: "Precios de salida",
    body: `De la #1 a la #${PRICED_POSITIONS} el precio de salida baja de ${formatPrice(INITIAL_PRICES[1])} a ${formatPrice(INITIAL_PRICES[PRICED_POSITIONS])}. De la #${PRICED_POSITIONS + 1} a la #${MAX_RANKING_POSITION} todas cuestan ${formatPrice(INITIAL_PRICES[MAX_RANKING_POSITION])}. Solo aplican cuando el lugar está libre.`,
  },
  {
    title: "Superar a un negocio",
    body: `Para quitarle el lugar a alguien pagas al menos ${OUTBID_PERCENT} % más que su oferta actual. Ese negocio y todos los que están debajo bajan un lugar; el que estaba en la #${MAX_RANKING_POSITION} sale del ranking.`,
  },
  {
    title: "Reservas visibles",
    body: `Cuando alguien inicia un pago, todos ven un aviso con el monto reservado y un contador de ${RESERVATION_MINUTES} minutos. La reserva no bloquea a nadie: puedes superarla ofreciendo ${OUTBID_PERCENT} % más. Si el pago no llega a tiempo, la reserva desaparece.`,
  },
  {
    title: "Gana quien paga más, no quien da clic primero",
    body: "Si tu pago se confirma cuando otro negocio ya pagó más por esa posición, no te asignamos el lugar y te devolvemos el importe completo de forma automática. Nunca cobramos por una posición que no te damos.",
  },
  {
    title: "Subir y blindar",
    body: "Si ya estás en el ranking, puedes comprar una posición más alta (te mueves y los de en medio bajan un lugar) o pagar por tu propia posición para subir tu oferta y hacerla más difícil de superar. No puedes comprar una posición peor que la que ya tienes.",
  },
  {
    title: "El anuncio grande",
    body: `Del #1 al #${BIG_AD_MAX_POSITION}, tu tarjeta se despliega al pasar el cursor o tocarla y muestra tu portada, eslogan y botones de contacto. Del #${BIG_AD_MAX_POSITION + 1} en adelante, la tarjeta enlaza a tu página completa.`,
  },
];

const FAQ = [
  {
    question: "¿Cuánto dura mi posición?",
    answer:
      "Hasta que alguien pague más que tú. Puede ser una hora o puede ser meses. Pagas por ocupar la posición en ese momento, no por un tiempo garantizado.",
  },
  {
    question: "¿Me devuelven el dinero si me superan?",
    answer:
      "No. Es como una subasta: quien te supera paga más y tú bajas un lugar. La única devolución automática es cuando tu pago se confirma tarde y la posición ya no alcanzaba (ver arriba).",
  },
  {
    question: `¿Qué pasa si salgo del top ${MAX_RANKING_POSITION}?`,
    answer:
      "Tu negocio deja de aparecer en el ranking, pero tu cuenta, tu perfil y tu página siguen existiendo. Puedes volver a ofertar cuando quieras desde tu panel.",
  },
  {
    question: "¿Puedo cambiar mi perfil después de pagar?",
    answer:
      "Sí, cuando quieras y sin costo: nombre, descripción, fotos, contacto y redes se editan desde tu panel y se ven al instante.",
  },
  {
    question: "¿Puedo pagar en OXXO o por transferencia?",
    answer:
      "Por ahora no: esos pagos se confirman horas o días después, fuera de la ventana de reserva. Aceptamos tarjeta de crédito, débito y saldo de Mercado Pago.",
  },
  {
    question: '¿Y el leaderboard de "Más visitados"?',
    answer:
      "Es informativo: cuenta cuántas personas abren cada negocio. No cambia posiciones ni se compra. La única forma de subir en el ranking es ofertar.",
  },
  {
    question: "¿Esto me garantiza clientes o ventas?",
    answer:
      "No garantizamos ningún resultado: ni ventas, ni clientes, ni visitas. EL N1 es un ranking público y un juego de competencia entre negocios, no un servicio de publicidad.",
  },
];

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
            EL N1 es un ranking público de negocios de México con{" "}
            {MAX_RANKING_POSITION} lugares. No se gana con votos ni con reseñas:
            se gana pagando más que el que está arriba. El que más ofrece es EL
            N1, hasta que alguien lo supere.
          </Lead>

          <section className="mt-14">
            <Heading as="h2" size="md">
              En tres pasos
            </Heading>

            <ol className="mt-6 space-y-5">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-5 border border-neutral-200 p-5"
                >
                  <div className="bg-accent flex h-10 w-10 shrink-0 items-center justify-center font-black text-white">
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
            <Heading as="h2" size="md">
              Precios de salida
            </Heading>

            <Muted className="mt-2">
              Lo que cuesta cada posición cuando está libre. Si está ocupada, la
              oferta mínima es un {OUTBID_PERCENT} % más que la oferta actual.
            </Muted>

            <div className="mt-6 overflow-x-auto border border-neutral-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-bold tracking-wider text-neutral-400 uppercase">
                  <tr>
                    <th className="px-5 py-3">Posición</th>
                    <th className="px-5 py-3 text-right">Precio de salida</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => (
                    <tr key={position} className="border-t border-neutral-100">
                      <td className="px-5 py-3 font-bold">#{position}</td>
                      <td className="text-accent-press px-5 py-3 text-right font-bold">
                        {formatPrice(INITIAL_PRICES[position])}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-neutral-100">
                    <td className="px-5 py-3 font-bold">
                      #{PRICED_POSITIONS + 1} a #{MAX_RANKING_POSITION}
                    </td>
                    <td className="text-accent-press px-5 py-3 text-right font-bold">
                      {formatPrice(INITIAL_PRICES[MAX_RANKING_POSITION])}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-14">
            <Heading as="h2" size="md">
              Las reglas
            </Heading>

            <dl className="mt-6 space-y-6">
              {RULES.map((rule) => (
                <div key={rule.title}>
                  <dt className="font-bold">{rule.title}</dt>
                  <dd className="mt-1 leading-7 text-neutral-600">
                    {rule.body}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-14">
            <Heading as="h2" size="md">
              Antes de pagar
            </Heading>

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

            <Muted className="mt-8">
              Al ofertar aceptas los{" "}
              <Button href="/terminos" variant="link">
                términos y condiciones
              </Button>{" "}
              y la{" "}
              <Button href="/responsiva" variant="link">
                carta responsiva
              </Button>
              .
            </Muted>
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
