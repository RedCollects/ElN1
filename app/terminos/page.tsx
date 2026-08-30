import {
  Button,
  Container,
  Eyebrow,
  Heading,
  Lead,
  PageShell,
  SiteFooter,
  SiteHeader,
} from "@/app/ui";

export const metadata = {
  title: "Términos y condiciones | EL N1",
  description: "Condiciones de uso y participación de EL N1.",
};

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
            Al participar en EL N1 aceptas las siguientes condiciones.
          </Lead>

          <div className="border-rule text-muted mt-10 border-t-2 leading-relaxed">
            <section className="border-rule-soft border-b py-5">
              <h2 className="text-ink text-lg font-extrabold tracking-[-0.01em]">
                1. Qué es EL N1
              </h2>
              <p className="mt-2">
                EL N1 es un proyecto experimental de exhibición comercial. No es
                una agencia, una red publicitaria ni una plataforma que prometa
                ventas o resultados de negocio.
              </p>
            </section>

            <section className="border-rule-soft border-b py-5">
              <h2 className="text-ink text-lg font-extrabold tracking-[-0.01em]">
                2. Qué compra el participante
              </h2>
              <p className="mt-2">
                El pago da derecho a que la información proporcionada se muestre
                en la posición correspondiente al importe aceptado, mientras
                otra persona no realice una oferta superior y válida.
              </p>
            </section>

            <section className="border-rule-soft border-b py-5">
              <h2 className="text-ink text-lg font-extrabold tracking-[-0.01em]">
                3. Sin promesa de resultados
              </h2>
              <p className="mt-2">
                No aseguramos visitas, contactos, clientes, ventas, alcance,
                tiempo de exposición ni una cantidad determinada de personas que
                vean el anuncio. La presencia en el ranking no constituye
                recomendación, certificación o aprobación de EL N1.
              </p>
            </section>

            <section className="border-rule-soft border-b py-5">
              <h2 className="text-ink text-lg font-extrabold tracking-[-0.01em]">
                4. Ofertas y posiciones
              </h2>
              <p className="mt-2">
                Las posiciones pueden cambiar cuando alguien supera una oferta.
                Una posición libre puede ocuparse y las posiciones existentes
                pueden desplazarse según las reglas visibles del sitio. La
                actualización depende de la confirmación del pago.
              </p>
            </section>

            <section className="border-rule-soft border-b py-5">
              <h2 className="text-ink text-lg font-extrabold tracking-[-0.01em]">
                5. Métricas de uso
              </h2>
              <p className="mt-2">
                Para mostrar visitas, actividad y negocios más vistos, EL N1
                utiliza un identificador aleatorio almacenado en tu dispositivo.
                No recopilamos tu nombre, correo ni ubicación para estas
                métricas, y las cifras se presentan de forma agregada.
              </p>
            </section>

            <section className="border-rule-soft border-b py-5">
              <h2 className="text-ink text-lg font-extrabold tracking-[-0.01em]">
                6. Responsabilidad del anunciante
              </h2>
              <p className="mt-2">
                Quien publica responde por la veracidad, legalidad y derechos de
                uso de su nombre, logotipo, descripción, enlaces y demás
                información. No se permite contenido ilegal, engañoso, ofensivo
                o que infrinja derechos de terceros.
              </p>
            </section>

            <section className="border-rule-soft border-b py-5">
              <h2 className="text-ink text-lg font-extrabold tracking-[-0.01em]">
                7. Pagos y cambios
              </h2>
              <p className="mt-2">
                Los pagos se procesan mediante Mercado Pago. La confirmación de
                una posición ocurre únicamente después de validar el pago.
                Cualquier aclaración o reembolso se revisará conforme al estado
                de la operación y a las políticas aplicables del procesador de
                pago.
              </p>
            </section>

            <section className="border-rule-soft border-b py-5">
              <h2 className="text-ink text-lg font-extrabold tracking-[-0.01em]">
                8. Aceptación
              </h2>
              <p className="mt-2">
                Al continuar con una oferta declaras que leíste estos términos,
                comprendes que se trata de un experimento y aceptas participar
                bajo tu propia decisión y responsabilidad.
              </p>
            </section>
          </div>

          <Button href="/responsiva" className="mt-10">
            Leer carta responsiva
          </Button>
        </article>
      </Container>

      <SiteFooter />
    </PageShell>
  );
}
