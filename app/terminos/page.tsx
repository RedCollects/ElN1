import type { Metadata } from "next";
import Link from "next/link";
import { MAX_RANKING_POSITION, OUTBID_FACTOR } from "@/lib/prices";
import { RESERVATION_MINUTES } from "@/lib/payments";
import { RESPONSABLE, TERMS_DATE, TERMS_VERSION } from "@/lib/legal";
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
  title: "Términos y condiciones | EL N1",
  description: "Condiciones de uso y participación en EL N1.",
};

const OUTBID_PERCENT = Math.round((OUTBID_FACTOR - 1) * 100);

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-rule-soft scroll-mt-24 border-b py-6">
      <h2 className="text-ink text-[22px] leading-tight font-extrabold tracking-[-0.01em]">
        <span className="text-accent mr-3 tabular-nums">{number}.</span>
        {title}
      </h2>
      <div className="text-muted [&_strong]:text-ink mt-3 space-y-3 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function List({
  items,
  ordered = false,
}: {
  items: React.ReactNode[];
  ordered?: boolean;
}) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      className={
        ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"
      }
    >
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </Tag>
  );
}

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-accent-press underline underline-offset-2">
    {children}
  </Link>
);

export default function TermsPage() {
  return (
    <PageShell>
      <SiteHeader>
        <Button href="/" variant="secondary" size="sm">
          Volver al ranking
        </Button>
      </SiteHeader>

      <Container width="narrow" className="py-12 sm:py-16">
        <article>
          <Eyebrow>Información importante</Eyebrow>
          <Heading as="h1" size="display" className="mt-3">
            Términos y condiciones
          </Heading>
          <Lead className="mt-5">
            Al crear una cuenta o pagar por una posición en EL N1 aceptas estas
            condiciones. Están escritas para leerse completas en cinco minutos.
            Si algo no queda claro, escríbenos antes de pagar:{" "}
            {RESPONSABLE.correo}.
          </Lead>
          <Muted className="mt-3">
            Versión {TERMS_VERSION} · vigente desde el {TERMS_DATE}
          </Muted>

          <div className="border-rule mt-10 border-t-2">
            <Section
              id="responsable"
              number={1}
              title="Quién ofrece el servicio"
            >
              <p>
                EL N1 (eln1.mx) es operado por{" "}
                <strong>{RESPONSABLE.nombre}</strong>, {RESPONSABLE.regimen},
                RFC <strong>{RESPONSABLE.rfc}</strong>, con domicilio en{" "}
                {RESPONSABLE.domicilio}, {RESPONSABLE.ciudad}. Contacto:{" "}
                <strong>{RESPONSABLE.correo}</strong>.
              </p>
              <p>
                En este documento &laquo;EL N1&raquo;, &laquo;nosotros&raquo; o
                &laquo;el sitio&raquo; se refieren a esa persona y al servicio
                que opera. &laquo;Tú&raquo; o &laquo;el anunciante&raquo; es
                quien crea una cuenta o paga una posición.
              </p>
            </Section>

            <Section id="que-es" number={2} title="Qué es EL N1">
              <p>
                EL N1 es un ranking público de negocios de México con{" "}
                {MAX_RANKING_POSITION} posiciones. Cada posición la ocupa el
                negocio que más ha pagado por ella, y la conserva mientras nadie
                pague más. Es un juego de competencia entre negocios, a la vista
                de todos.
              </p>
              <p>
                No es una agencia de publicidad, una red de anuncios, un
                directorio verificado ni un servicio de generación de clientes.
              </p>
            </Section>

            <Section id="naturaleza" number={3} title="Qué compras y qué no">
              <p>
                Al pagar una posición compras{" "}
                <strong>
                  que la información de tu negocio se muestre en esa posición
                  del ranking mientras nadie ofrezca más
                </strong>
                . Eso es todo.
              </p>
              <p>No compras, y nosotros no prometemos:</p>
              <List
                items={[
                  "visitas, contactos, llamadas, mensajes, clientes, ventas ni ingresos;",
                  "un tiempo mínimo en la posición: puedes ser superado en cualquier momento, incluso minutos después de pagar;",
                  "que EL N1 te recomiende, verifique o avale ante nadie;",
                  "exclusividad frente a tu competencia.",
                ]}
              />
              <p>
                Si buscas una campaña con resultados medibles, EL N1 no
                sustituye a una agencia ni a una plataforma de publicidad
                profesional.
              </p>
            </Section>

            <Section id="participar" number={4} title="Quién puede participar">
              <List
                items={[
                  "Personas mayores de 18 años con facultades para obligar al negocio que registran.",
                  "Negocios reales, con actividad lícita en México y al menos un medio de contacto público (WhatsApp, teléfono, correo o sitio web).",
                  "Una cuenta por negocio. Cada negocio ocupa como máximo una posición.",
                ]}
              />
              <p>
                No se aceptan negocios ni contenido relacionados con: armas;
                drogas y sustancias controladas; apuestas y juegos con dinero;
                servicios financieros, de inversión o préstamos sin
                autorización; contenido sexual; productos que requieran registro
                sanitario y no lo tengan; esquemas piramidales o multinivel; y,
                en general, cualquier actividad ilegal, engañosa o que infrinja
                derechos de terceros. Podemos negar o retirar la publicación de
                cualquier negocio que a nuestro juicio encaje en esta lista.
              </p>
            </Section>

            <Section id="reglas" number={5} title="Reglas del ranking">
              <p>
                Las reglas completas, con los números vigentes, están siempre en{" "}
                <A href="/como-funciona">eln1.mx/como-funciona</A> y forman
                parte de estos Términos. Lo esencial:
              </p>
              <List
                ordered
                items={[
                  `El ranking tiene ${MAX_RANKING_POSITION} posiciones. Una posición libre cuesta su precio de salida; una ocupada requiere ofrecer al menos ${OUTBID_PERCENT} % más que la oferta que la sostiene. El sitio muestra siempre el mínimo exacto.`,
                  <>
                    Al confirmar, la posición queda{" "}
                    <strong>
                      reservada a ese precio durante {RESERVATION_MINUTES}{" "}
                      minutos
                    </strong>{" "}
                    mientras pagas. La reserva es visible para todos y puede ser
                    superada por una oferta mayor.
                  </>,
                  <>
                    Gana quien paga más, no quien da clic primero. Si tu pago se
                    confirma cuando otro negocio ya pagó más por esa posición,{" "}
                    <strong>
                      no te asignamos el lugar y te devolvemos el importe
                      completo de forma automática
                    </strong>{" "}
                    por el mismo medio de pago.
                  </>,
                  `Cuando alguien te supera, tu negocio y los que están debajo bajan un lugar. Quien estaba en la posición ${MAX_RANKING_POSITION} sale del ranking; su cuenta, perfil y página siguen existiendo y puede volver a ofertar.`,
                  "Si ya estás en el ranking puedes comprar una posición más alta o pagar por tu propia posición para subir tu oferta. No puedes comprar una posición peor que la que tienes.",
                  "Las posiciones no caducan por tiempo: se pierden solo cuando alguien paga más.",
                ]}
              />
              <p>
                Podemos cambiar los números (precios de salida, porcentaje
                mínimo, duración de la reserva, número de posiciones) avisando
                con al menos 7 días en el sitio. Los cambios no afectan
                posiciones ya pagadas ni reservas en curso.
              </p>
            </Section>

            <Section
              id="precios"
              number={6}
              title="Precios, impuestos y factura"
            >
              <List
                items={[
                  <>
                    Los montos del ranking se expresan en pesos mexicanos (MXN){" "}
                    <strong>más IVA</strong>. Antes de pagar verás el total con
                    IVA desglosado.
                  </>,
                  "Los pagos se procesan a través de Mercado Pago. Aceptamos tarjeta de crédito, débito y saldo de Mercado Pago. No aceptamos efectivo ni transferencia porque se confirman fuera de la ventana de reserva.",
                  "Emitimos factura (CFDI) a quien la solicite por correo dentro del mes en que pagó, indicando RFC, razón social, código postal, régimen y uso de CFDI. Pedir factura no cambia el importe.",
                ]}
              />
            </Section>

            <Section id="reembolsos" number={7} title="Reembolsos">
              <p>
                Pagas por ocupar una posición en el momento en que se confirma
                el pago. Por eso:
              </p>
              <List
                items={[
                  <>
                    <strong>No hay reembolso</strong> cuando otro negocio te
                    supera, cuando decides dejar de participar o cuando tu
                    negocio es retirado por incumplir estos Términos.
                  </>,
                  <>
                    <strong>Sí hay reembolso, automático y completo</strong>,
                    cuando tu pago se confirma tarde y la posición ya no
                    alcanzaba (punto 5.3).
                  </>,
                  <>
                    <strong>Sí hay restitución</strong> (posición o dinero, a tu
                    elección) si por una falla nuestra tu pago se confirmó y no
                    se te asignó la posición que correspondía.
                  </>,
                ]}
              />
              <p>
                Cualquier aclaración se atiende en {RESPONSABLE.correo}. Los
                tiempos de devolución dependen de Mercado Pago y de tu banco.
              </p>
            </Section>

            <Section id="contenido" number={8} title="Tu contenido">
              <p>
                Tú conservas la propiedad de tu nombre, logotipo, fotografías,
                textos y enlaces. Al publicarlos nos otorgas una licencia
                gratuita, no exclusiva y revocable para mostrarlos en el sitio,
                en las imágenes que se generan al compartir enlaces y en las
                redes sociales de EL N1, mientras tu negocio esté publicado. La
                licencia termina cuando eliminas el contenido o tu cuenta, salvo
                por copias de respaldo o registros ya compartidos por terceros.
              </p>
              <p>
                Respondes por la veracidad, legalidad y derechos de uso de todo
                lo que publicas, incluidos tus productos, servicios, promociones
                y enlaces. Debes tener autorización para usar el nombre,
                logotipo e imágenes que subes.
              </p>
            </Section>

            <Section id="moderacion" number={9} title="Moderación y baja">
              <p>
                Podemos editar, ocultar o retirar contenido, y suspender o
                cancelar cuentas, cuando detectemos o nos reporten
                incumplimientos a estos Términos, a la ley o a derechos de
                terceros. Te avisaremos por correo salvo que la situación exija
                actuar de inmediato. Un negocio retirado por incumplimiento
                pierde su posición sin reembolso.
              </p>
              <p>
                Puedes cerrar tu cuenta cuando quieras escribiéndonos. Al
                cerrarla, tu negocio sale del ranking y no hay reembolso por la
                posición que ocupaba.
              </p>
            </Section>

            <Section
              id="disponibilidad"
              number={10}
              title="Disponibilidad y fallas"
            >
              <p>
                Hacemos lo razonable para que el sitio funcione de forma
                continua, pero no garantizamos disponibilidad ininterrumpida:
                puede haber mantenimiento, fallas de proveedores o del
                procesador de pago. Si una falla nuestra te impide ocupar una
                posición que ya pagaste, aplica el punto 7. Fuera de ese caso,
                nuestra responsabilidad frente a ti se limita al importe que
                pagaste en los últimos 30 días, sin perjuicio de los derechos
                que la ley te reconoce y que no pueden renunciarse.
              </p>
            </Section>

            <Section id="datos" number={11} title="Datos personales">
              <p>
                Tratamos tus datos conforme a nuestro{" "}
                <A href="/privacidad">Aviso de privacidad</A>, que forma parte
                de estos Términos.
              </p>
            </Section>

            <Section id="cambios" number={12} title="Cambios a estos Términos">
              <p>
                Podemos actualizar estos Términos. Publicaremos la nueva versión
                con su fecha y te avisaremos por correo al menos 7 días antes de
                que aplique. Los cambios no afectan posiciones ya pagadas. Si no
                estás de acuerdo, puedes cerrar tu cuenta antes de que entren en
                vigor; seguir usando el sitio después de esa fecha significa que
                los aceptas.
              </p>
            </Section>

            <Section id="ley" number={13} title="Ley aplicable">
              <p>
                Estos Términos se rigen por las leyes de los Estados Unidos
                Mexicanos. Para cualquier controversia, las partes se someten a
                los tribunales competentes de Nogales, Sonora, sin perjuicio de
                que puedas acudir a la Procuraduría Federal del Consumidor
                cuando la ley te lo permita.
              </p>
            </Section>

            <Section id="aceptacion" number={14} title="Aceptación">
              <p>
                Aceptas estos Términos al marcar la casilla al crear tu cuenta
                y, de nuevo, cada vez que confirmas una oferta. Guardamos la
                fecha y la versión que aceptaste.
              </p>
            </Section>
          </div>

          <Button href="/privacidad" variant="secondary" className="mt-10">
            Leer aviso de privacidad
          </Button>
        </article>
      </Container>

      <SiteFooter />
    </PageShell>
  );
}
