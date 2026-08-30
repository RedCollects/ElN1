import {
  Alert,
  Button,
  Container,
  Eyebrow,
  Heading,
  PageShell,
  SiteFooter,
  SiteHeader,
} from "@/app/ui";

export const metadata = {
  title: "Carta responsiva | EL N1",
  description: "Reconocimiento de riesgos para participar en EL N1.",
};

export default function DisclaimerPage() {
  return (
    <PageShell>
      <SiteHeader>
        <Button href="/" variant="secondary" size="sm">
          Volver al ranking
        </Button>
      </SiteHeader>

      <Container width="narrow" className="py-12 sm:py-16">
        <article>
          <Eyebrow>Antes de participar</Eyebrow>
          <Heading as="h1" size="display" className="mt-3">
            Carta responsiva
          </Heading>
          <div className="border-rule text-muted mt-10 space-y-5 border-t-2 pt-6 text-base leading-relaxed">
            <p>
              Entiendo que EL N1 es un experimento independiente y que pagar por
              una posición no equivale a contratar una campaña publicitaria ni
              un servicio de ventas.
            </p>
            <p>
              Acepto que no existe garantía de clientes, llamadas, mensajes,
              visitas, conversiones, alcance o ingresos. También entiendo que mi
              posición puede ser superada por otra oferta y que el importe
              pagado no asegura un tiempo fijo en el ranking.
            </p>
            <p>
              Confirmo que la información que proporcione sobre mi negocio es
              verdadera, que tengo autorización para usarla y que asumiré
              cualquier responsabilidad derivada de ella, incluidos sus
              productos, servicios, promociones y enlaces.
            </p>
            <p>
              Comprendo que EL N1 puede retirar información que incumpla la ley,
              estos términos o derechos de terceros. La plataforma tampoco
              verifica ni recomienda automáticamente los negocios que aparecen
              publicados.
            </p>
            <p>
              Al realizar una oferta acepto participar bajo mi propia
              responsabilidad y declaro que tuve oportunidad de leer los
              términos y condiciones.
            </p>
          </div>

          <Alert tone="accent" className="mt-10">
            Si buscas una estrategia de publicidad con resultados medibles, este
            proyecto no sustituye a una agencia o plataforma publicitaria
            profesional.
          </Alert>

          <Button href="/terminos" variant="secondary" className="mt-10">
            Ver términos y condiciones
          </Button>
        </article>
      </Container>

      <SiteFooter />
    </PageShell>
  );
}
