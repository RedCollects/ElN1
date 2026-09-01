import type { Metadata } from "next";
import {
  BASE_PRICE,
  FLOOR_FACTOR,
  MAX_OFFER,
  MAX_RANKING_POSITION,
} from "@/lib/prices";
import { RESERVATION_MINUTES } from "@/lib/payments";
import { BIG_AD_MAX_POSITION } from "@/lib/business";
import { formatPrice } from "@/lib/format";
import {
  Button,
  Container,
  Eyebrow,
  Figure,
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
    "Las reglas de EL N1: el ranking se ordena por lo que cada negocio ofrece; el que más paga está arriba, siempre.",
};

/*
 * Esta página es la referencia oficial de las reglas (los Términos remiten a
 * "las reglas visibles del sitio"). Todos los números salen del código
 * (lib/prices, lib/payments, lib/business) para que nunca queden desfasados.
 *
 * Regla del equipo: cada PR que cambie precios, posiciones, reservas o el
 * anuncio grande debe revisar esta página en el mismo PR.
 */

const FLOOR_PERCENT = Math.round((FLOOR_FACTOR - 1) * 100);
const BASE = formatPrice(BASE_PRICE);

/** Ejemplo: ranking ordenado por oferta y qué cuesta cada movimiento. */
const EXAMPLE = [
  { position: 1, paid: 400 },
  { position: 2, paid: 200 },
  { position: 3, paid: BASE_PRICE },
];
const EXAMPLE_FLOOR = Math.ceil(BASE_PRICE * FLOOR_FACTOR);

const STEPS = [
  {
    title: "Registra tu negocio",
    body: "Crea una cuenta con tu correo y completa el perfil de tu negocio: nombre, categoría, ciudad, logo y al menos un medio de contacto (WhatsApp, teléfono, correo o sitio web). Es gratis y no te compromete a nada.",
  },
  {
    title: "Elige tu monto",
    body: `Tú decides cuánto ofrecer y el sitio te dice en qué posición quedarías. El mínimo es ${BASE}, y toda oferta debe ser al menos ${FLOOR_PERCENT} % mayor que el precio más bajo del ranking. Para superar a un negocio concreto basta ofrecer más que él.`,
  },
  {
    title: "Paga con Mercado Pago",
    body: `Tienes ${RESERVATION_MINUTES} minutos para pagar con tarjeta, débito o saldo de Mercado Pago (el total es tu oferta más IVA). En cuanto el pago se confirma, el ranking se reordena y apareces en tu lugar.`,
  },
];

const RULES = [
  {
    title: "El que más paga está arriba. Siempre.",
    body: `El ranking se ordena por la última oferta pagada de cada negocio, de mayor a menor. No hay excepciones ni reglas ocultas: si ofreces más que alguien, quedas arriba de él. En un empate exacto queda arriba quien llegó primero a ese precio.`,
  },
  {
    title: "Tu oferta reemplaza a la anterior",
    body: "Ofertar de nuevo fija tu nuevo precio; los montos no se suman. Si ofreces $300 y luego $350, tu precio es $350 (no $650). Estando en el ranking, cada oferta nueva debe ser mayor que la anterior.",
  },
  {
    title: "El piso del ranking",
    body: `Entrar cuesta al menos ${BASE}, y toda oferta debe superar en ${FLOOR_PERCENT} % al precio más bajo del ranking en ese momento. Con ${MAX_RANKING_POSITION} lugares ocupados, entrar exige ofrecer más que el #${MAX_RANKING_POSITION}, que sale del ranking (conserva su perfil y puede volver cuando quiera).`,
  },
  {
    title: "La posición que ves es estimada",
    body: `Antes de pagar, el sitio te muestra dónde quedarías con tu monto. Es un estimado: si otro negocio confirma un pago mayor mientras pagas, quedas un lugar más abajo — tu dinero siempre cuenta donde caiga. Solo hay dos devoluciones automáticas: si con el ranking lleno tu oferta ya no alcanza para entrar, o si tu pago llega cuando ya no mejora tu propio precio.`,
  },
  {
    title: "Ofertas en curso, a la vista",
    body: `Cuando alguien inicia un pago, todos ven el monto que está ofertando con un contador de ${RESERVATION_MINUTES} minutos. Es informativo: no bloquea ni encarece nada; decide el orden en que se confirman los pagos.`,
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
      "Hasta que alguien ofrezca más que tú. Puede ser una hora o puede ser meses. La posición no caduca: pagas por competir con tu oferta, no por un tiempo garantizado.",
  },
  {
    question: "¿Me devuelven el dinero si me superan?",
    answer:
      "No. Es una subasta permanente: quien te supera paga más y tú bajas un lugar (o sales, si eras el último). Las únicas devoluciones automáticas son las dos de arriba: tu pago llega tarde y ya no alcanza para entrar al ranking lleno, o ya no mejora tu propio precio.",
  },
  {
    question: `¿Qué pasa si salgo del top ${MAX_RANKING_POSITION}?`,
    answer:
      "Tu negocio deja de aparecer en el ranking, pero tu cuenta, tu perfil y tu página siguen existiendo y son visibles por su enlace. Vuelves cuando quieras con una oferta nueva.",
  },
  {
    question: "¿Los precios incluyen IVA? ¿Dan factura?",
    answer:
      "Los montos del ranking son más IVA: antes de pagar ves el desglose y el total. Emitimos factura (CFDI) a quien la pida por correo dentro del mes en que pagó, con su RFC y uso de CFDI; pedirla no cambia el importe.",
  },
  {
    question: "¿Puedo cambiar mi perfil después de pagar?",
    answer:
      "Sí, cuando quieras y sin costo: nombre, descripción, fotos, contacto y redes se editan desde tu panel y se ven al instante.",
  },
  {
    question: "¿Puedo pagar en OXXO o por transferencia?",
    answer:
      "Por ahora no: esos pagos se confirman horas o días después, fuera de la ventana de pago. Aceptamos tarjeta de crédito, débito y saldo de Mercado Pago.",
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
  return (
    <PageShell>
      <SiteHeader>
        <Button href="/" variant="secondary" size="sm">
          Ver ranking
        </Button>
      </SiteHeader>

      <Container width="narrow" className="py-16">
        <article>
          <Eyebrow>¿Cómo funciona?</Eyebrow>

          <Heading as="h1" size="display" className="mt-3">
            ¿Qué es esto?
          </Heading>

          <Lead className="mt-6">
            EL N1 es un ranking público de negocios de México con{" "}
            {MAX_RANKING_POSITION} lugares. No se gana con votos ni con reseñas:
            el ranking se ordena por lo que cada negocio ofrece. El que más
            paga es EL N1, hasta que alguien ofrezca más.
          </Lead>

          <section className="mt-14">
            <Heading as="h2" size="h2">
              En tres pasos
            </Heading>

            <ol className="border-rule mt-6 border-t-2">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="border-rule-soft grid grid-cols-[48px_minmax(0,1fr)] gap-5 border-b py-5"
                >
                  <Figure size={30} tone="accent">
                    {index + 1}
                  </Figure>

                  <div>
                    <h3 className="text-lg font-extrabold tracking-[-0.01em]">
                      {step.title}
                    </h3>
                    <p className="text-muted mt-1 text-[15px] leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-14">
            <Heading as="h2" size="h2">
              Qué cuesta
            </Heading>

            <Muted className="mt-2">
              Ejemplo con tres negocios. El más bajo paga {BASE}, así que
              cualquier oferta nueva debe ser de al menos{" "}
              {formatPrice(EXAMPLE_FLOOR)} ({FLOOR_PERCENT} % arriba del más
              bajo). Para ser #1 basta ofrecer más que el #1:{" "}
              {formatPrice(EXAMPLE[0].paid + 1)}.
            </Muted>

            <div className="border-rule mt-6 overflow-x-auto border-2">
              <table className="w-full text-left text-sm">
                <thead className="label bg-band text-band-fg">
                  <tr>
                    <th className="px-5 py-3">Posición</th>
                    <th className="px-5 py-3 text-right">Su oferta</th>
                    <th className="px-5 py-3 text-right">Superarlo cuesta</th>
                  </tr>
                </thead>
                <tbody>
                  {EXAMPLE.map((row) => (
                    <tr key={row.position} className="border-rule-soft border-t">
                      <td className="figure px-5 py-3 text-base">
                        #{row.position}
                      </td>
                      <td className="figure px-5 py-3 text-right text-base">
                        {formatPrice(row.paid)}
                      </td>
                      <td className="figure text-accent-press px-5 py-3 text-right text-base">
                        {formatPrice(Math.max(row.paid + 1, EXAMPLE_FLOOR))}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-rule-soft border-t">
                    <td className="figure px-5 py-3 text-base">
                      Entrar al final
                    </td>
                    <td className="figure px-5 py-3 text-right text-base">—</td>
                    <td className="figure text-accent-press px-5 py-3 text-right text-base">
                      {formatPrice(EXAMPLE_FLOOR)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Muted className="mt-3">
              Tope por oferta: {formatPrice(MAX_OFFER)}. Todos los montos son
              más IVA.
            </Muted>
          </section>

          <section className="mt-14">
            <Heading as="h2" size="h2">
              Las reglas
            </Heading>

            <dl className="border-rule mt-6 border-t-2">
              {RULES.map((rule) => (
                <div
                  key={rule.title}
                  className="border-rule-soft border-b py-5"
                >
                  <dt className="text-lg font-extrabold tracking-[-0.01em]">
                    {rule.title}
                  </dt>
                  <dd className="text-muted mt-1 leading-relaxed">
                    {rule.body}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-14">
            <Heading as="h2" size="h2">
              Antes de pagar
            </Heading>

            <dl className="border-rule mt-6 border-t-2">
              {FAQ.map((item) => (
                <div
                  key={item.question}
                  className="border-rule-soft border-b py-5"
                >
                  <dt className="text-lg font-extrabold tracking-[-0.01em]">
                    {item.question}
                  </dt>
                  <dd className="text-muted mt-1 leading-relaxed">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>

            <Muted className="mt-8">
              Al ofertar aceptas los{" "}
              <Button href="/terminos" variant="link">
                términos y condiciones
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
