import type { Metadata } from "next";
import { BASE_PRICE, MAX_OFFER, MAX_RANKING_POSITION, OUTBID_FACTOR } from "../../lib/prices";
import { RESERVATION_MINUTES } from "../../lib/payments";
import { BIG_AD_MAX_POSITION } from "../../lib/business";
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
    "Las reglas de EL N1: cómo se compite por una posición, qué cuesta, qué pasa cuando te superan y qué necesitas para participar.",
};

/*
 * Esta página es la referencia oficial de las reglas (los Términos remiten a
 * "las reglas visibles del sitio"). Todos los números salen del código
 * (lib/prices, lib/payments, lib/business) para que nunca queden desfasados.
 *
 * Regla del equipo: cada PR que cambie precios, posiciones, reservas o el
 * anuncio grande debe revisar esta página en el mismo PR.
 */

const OUTBID_PERCENT = Math.round((OUTBID_FACTOR - 1) * 100);
const BASE = formatPrice(BASE_PRICE);
const BASE_OUTBID = formatPrice(Math.ceil(BASE_PRICE * OUTBID_FACTOR));

const STEPS = [
  {
    title: "Registra tu negocio",
    body: "Crea una cuenta con tu correo y completa el perfil de tu negocio: nombre, categoría, ciudad, logo y al menos un medio de contacto (WhatsApp, teléfono, correo o sitio web). Es gratis y no te compromete a nada.",
  },
  {
    title: "Entra al ranking o supera a alguien",
    body: `Siempre hay exactamente un lugar libre: el siguiente al último ocupado, y cuesta ${BASE}. Si prefieres una posición ocupada, tu oferta debe superar en al menos ${OUTBID_PERCENT} % lo que se ha pagado desde esa posición hacia abajo. El sitio te muestra siempre el mínimo exacto, y puedes ofrecer más.`,
  },
  {
    title: "Reserva y paga con Mercado Pago",
    body: `Al confirmar, la posición queda reservada a ese precio durante ${RESERVATION_MINUTES} minutos mientras pagas con tarjeta, débito o saldo de Mercado Pago. En cuanto el pago se confirma, tu negocio aparece en la posición que elegiste.`,
  },
];

/** Ejemplo de la regla "máximo hacia abajo" con números reales del código. */
const EXAMPLE = [
  { position: 1, paid: BASE_PRICE, floor: 500 },
  { position: 2, paid: 500, floor: 500 },
  { position: 3, paid: BASE_PRICE, floor: BASE_PRICE },
].map((row) => ({
  ...row,
  toBeat: Math.ceil(row.floor * OUTBID_FACTOR),
}));

const RULES = [
  {
    title: "Un solo lugar libre",
    body: `El ranking tiene ${MAX_RANKING_POSITION} lugares y se llena en orden: nadie puede saltarse al #${MAX_RANKING_POSITION} si el #2 está vacío. El siguiente lugar libre siempre cuesta ${BASE}. Si dos negocios entran al mismo tiempo, el primero en confirmar su pago queda arriba y el segundo justo debajo: nadie pierde su dinero.`,
  },
  {
    title: "Superar a un negocio",
    body: `Para quitarle el lugar a alguien pagas al menos ${OUTBID_PERCENT} % más que la oferta más alta desde esa posición hacia abajo (no solo la de ese negocio). Así subir siempre cuesta más que quedarse abajo. Ese negocio y todos los que están debajo bajan un lugar; el que estaba en la #${MAX_RANKING_POSITION} sale del ranking.`,
  },
  {
    title: "Ofrece lo que quieras",
    body: `El mínimo es el piso, no el precio. Puedes ofrecer más (hasta ${formatPrice(MAX_OFFER)}) para que superarte cueste ${OUTBID_PERCENT} % más que lo que tú pagaste. Quien pone ${formatPrice(1000)} por el #1 solo sale cuando alguien pague ${formatPrice(Math.ceil(1000 * OUTBID_FACTOR))}.`,
  },
  {
    title: "Reservas visibles y ranking en vivo",
    body: `Cuando alguien inicia un pago, todos ven un aviso con el monto reservado y un contador de ${RESERVATION_MINUTES} minutos. La reserva no bloquea a nadie: puedes superarla ofreciendo ${OUTBID_PERCENT} % más. El ranking se actualiza solo; si la posición que estás viendo cambia antes de que pagues, te avisamos en pantalla.`,
  },
  {
    title: "Gana quien paga más, no quien da clic primero",
    body: "Si tu pago se confirma cuando otro negocio ya pagó más por esa posición, no te asignamos el lugar y te devolvemos el importe completo de forma automática. Nunca cobramos por una posición que no te damos.",
  },
  {
    title: "Subir y blindar",
    body: "Si ya estás en el ranking, puedes comprar una posición más alta (te mueves y los de en medio bajan un lugar; el hueco que dejas se cierra) o pagar por tu propia posición para subir tu oferta y hacerla más difícil de superar. No puedes comprar una posición peor que la que ya tienes.",
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
      "Hasta que alguien pague más que tú. Puede ser una hora o puede ser meses. La posición no caduca: pagas por ocuparla, no por un tiempo garantizado.",
  },
  {
    question: "¿Me devuelven el dinero si me superan?",
    answer:
      "No. Es como una subasta: quien te supera paga más y tú bajas un lugar. La única devolución automática es cuando tu pago se confirma tarde y la posición ya no alcanzaba (ver arriba).",
  },
  {
    question: `¿Qué pasa si salgo del top ${MAX_RANKING_POSITION}?`,
    answer:
      "Tu negocio deja de aparecer en el ranking, pero tu cuenta, tu perfil y tu página siguen existiendo y son visibles por su enlace. Puedes volver a ofertar cuando quieras desde tu panel.",
  },
  {
    question: "¿Los precios incluyen IVA? ¿Dan factura?",
    answer:
      "El precio que ves es el importe total que se cobra. Si necesitas factura, el IVA se agrega sobre lo pagado; pídela por correo después del pago.",
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
    question: "¿Y el leaderboard de \"Más visitados\"?",
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
            EL N1 es un ranking público de negocios de México con {MAX_RANKING_POSITION}{" "}
            lugares. No se gana con votos ni con reseñas: se gana pagando más que el que está
            arriba. El que más ofrece es EL N1, hasta que alguien lo supere.
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
              Qué cuesta
            </Heading>

            <Muted className="mt-2">
              Entrar al ranking cuesta {BASE}. Superar a alguien cuesta un {OUTBID_PERCENT} %
              más que la oferta más alta desde esa posición hacia abajo. Por ejemplo, si el #2
              pagó {formatPrice(500)}, quitarle el #1 a quien pagó {BASE} cuesta{" "}
              {formatPrice(EXAMPLE[0].toBeat)}, no {BASE_OUTBID}.
            </Muted>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-bold uppercase tracking-wider text-neutral-400">
                  <tr>
                    <th className="px-5 py-3">Posición</th>
                    <th className="px-5 py-3 text-right">Pagó</th>
                    <th className="px-5 py-3 text-right">Superarla cuesta</th>
                  </tr>
                </thead>
                <tbody>
                  {EXAMPLE.map((row) => (
                    <tr key={row.position} className="border-t border-neutral-100">
                      <td className="px-5 py-3 font-bold">#{row.position}</td>
                      <td className="px-5 py-3 text-right">{formatPrice(row.paid)}</td>
                      <td className="px-5 py-3 text-right font-bold text-brand-500">
                        {formatPrice(row.toBeat)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-neutral-100">
                    <td className="px-5 py-3 font-bold">#{EXAMPLE.length + 1} (libre)</td>
                    <td className="px-5 py-3 text-right">—</td>
                    <td className="px-5 py-3 text-right font-bold text-brand-500">{BASE}</td>
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
                  <dd className="mt-1 leading-7 text-neutral-600">{rule.body}</dd>
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
                  <dd className="mt-1 leading-7 text-neutral-600">{item.answer}</dd>
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
