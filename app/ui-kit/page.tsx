import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardSection,
  Container,
  EmptyState,
  Eyebrow,
  Field,
  Heading,
  Input,
  Lead,
  Muted,
  PageShell,
  PrefixedInput,
  Price,
  Select,
  SiteFooter,
  SiteHeader,
  Textarea,
} from "@/app/ui";

export const metadata: Metadata = {
  title: "UI kit | EL N1",
  robots: { index: false },
};

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <Heading as="h2" size="md">
        {title}
      </Heading>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** Catálogo visual de app/ui. Solo disponible en desarrollo. */
export default function UiKitPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <PageShell tone="muted">
      <SiteHeader subtitle="Catálogo de componentes">
        <Button href="/" variant="outline" size="sm">
          Ver ranking
        </Button>
      </SiteHeader>

      <Container className="py-10">
        <Eyebrow>app/ui</Eyebrow>
        <Heading as="h1" className="mt-1">
          UI kit
        </Heading>
        <Muted className="mt-2">
          Todas las primitivas con sus variantes. Ver `app/ui/README.md` para el uso.
        </Muted>

        <Block title="Tipografía">
          <Card>
            <Eyebrow>Eyebrow brand · sm</Eyebrow>
            <Eyebrow size="xs" tone="muted" className="mt-2">
              Eyebrow muted · xs
            </Eyebrow>
            <Heading as="h3" size="display" className="mt-4">
              Display
            </Heading>
            <Heading as="h3" size="xl">
              Heading xl
            </Heading>
            <Heading as="h3" size="lg">
              Heading lg
            </Heading>
            <Heading as="h3" size="md">
              Heading md
            </Heading>
            <Heading as="h3" size="sm">
              Heading sm
            </Heading>
            <Lead className="mt-4">Lead: párrafo introductorio grande bajo un título.</Lead>
            <Muted className="mt-2">Muted: texto secundario pequeño.</Muted>
            <p className="mt-4 flex flex-wrap items-baseline gap-4">
              <Price value={1500} size="sm" />
              <Price value={1500} />
              <Price value={1500} size="lg" />
              <Price value={1500} size="xl" tone="ink" />
            </p>
          </Card>
        </Block>

        <Block title="Botones">
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="accent">Accent</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="sm">Small (pill)</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="sm" shape="rounded" variant="accent">
                Small rounded
              </Button>
              <Button size="md" shape="pill" variant="outline">
                Medium pill
              </Button>
            </div>
            <div className="mt-4">
              <Button variant="accent" size="lg" block>
                CTA DE ANCHO COMPLETO
              </Button>
            </div>
          </Card>
        </Block>

        <Block title="Formularios">
          <CardSection title="CardSection" description="Descripción de la sección.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Input" hint="Texto de ayuda.">
                <Input placeholder="Escribe algo" />
              </Field>
              <Field label="Select">
                <Select defaultValue="">
                  <option value="">Elige</option>
                  <option>Opción A</option>
                  <option>Opción B</option>
                </Select>
              </Field>
              <Field label="PrefixedInput">
                <PrefixedInput prefix="@" placeholder="usuario" />
              </Field>
              <Field label="Input deshabilitado">
                <Input disabled defaultValue="No editable" />
              </Field>
              <Field label="Textarea" className="sm:col-span-2">
                <Textarea rows={3} />
              </Field>
            </div>
          </CardSection>
        </Block>

        <Block title="Avisos">
          <Alert tone="info" title="Info">
            Cuerpo del aviso informativo.
          </Alert>
          <Alert tone="success" title="Éxito" closeHref="/ui-kit">
            Con enlace para cerrar.
          </Alert>
          <Alert tone="warning" title="Advertencia">
            Algo requiere atención.
          </Alert>
          <Alert tone="error" title="Error">
            Algo salió mal.
          </Alert>
          <Alert tone="neutral">Sin título, tono neutro.</Alert>
          <div className="space-y-2">
            <Alert tone="error" compact>
              Compacto: error dentro de un formulario.
            </Alert>
            <Alert tone="success" compact>
              Compacto: guardado.
            </Alert>
          </div>
        </Block>

        <Block title="Badges">
          <Card>
            <div className="flex flex-wrap gap-2">
              <Badge>Neutral</Badge>
              <Badge tone="info">Info</Badge>
              <Badge tone="success">Publicado</Badge>
              <Badge tone="warning">Borrador</Badge>
              <Badge tone="error">Error</Badge>
            </div>
          </Card>
        </Block>

        <Block title="Tarjetas y avatares">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card padding="sm">Card padding sm</Card>
            <Card>Card padding md</Card>
            <Card padding="lg" elevated>
              Card padding lg · elevated
            </Card>
          </div>
          <Card>
            <div className="flex flex-wrap items-end gap-4">
              <Avatar src={null} alt="" size="sm" />
              <Avatar src={null} alt="" size="sm" fallback="🥇" />
              <Avatar src={null} alt="" size="sm" fallback="#4" />
              <Avatar src={null} alt="" size="md" className="bg-white" />
              <Avatar src={null} alt="" size="lg" className="bg-white" />
            </div>
          </Card>
        </Block>

        <Block title="Estados vacíos">
          <Card padding="lg">
            <EmptyState
              title="Negocio no encontrado"
              action={
                <Button href="/" variant="accent">
                  Volver al ranking
                </Button>
              }
            >
              Texto explicativo opcional.
            </EmptyState>
          </Card>
          <Card padding="lg">
            <EmptyState tone="error" title="Error al cargar">
              Mensaje del error.
            </EmptyState>
          </Card>
        </Block>
      </Container>

      <SiteFooter />
    </PageShell>
  );
}
