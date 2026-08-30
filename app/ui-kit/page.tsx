import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Alert,
  Avatar,
  Button,
  Card,
  CardSection,
  Container,
  EmptyState,
  Eyebrow,
  Field,
  Figure,
  Heading,
  Icon,
  IconButton,
  Input,
  Lead,
  LiveDot,
  MoneyInput,
  Muted,
  PageShell,
  PrefixedInput,
  Price,
  Seal,
  Select,
  SiteFooter,
  SiteHeader,
  Skeleton,
  Tag,
  Textarea,
} from "@/app/ui";
import { ControlsDemo } from "./controls-demo";

export const metadata: Metadata = {
  title: "UI kit | EL N1",
  robots: { index: false },
};

/* Mismo orden que el catálogo de marca (EL N1 - Marca y Componentes v2 Azul):
   logo, paleta, tipografía, botones, tags, campos, tarjetas, avisos, diálogo. */

function Block({
  index,
  title,
  note,
  children,
}: {
  index: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rule mt-14 border-t pt-8">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span className="text-accent text-[12px] font-bold tracking-[0.14em]">
          {index}
        </span>
        <Heading as="h2" size="title">
          {title}
        </Heading>
        {note && <Muted>{note}</Muted>}
      </div>
      <div className="mt-8 space-y-6">{children}</div>
    </section>
  );
}

const SWATCHES = [
  ["accent", "bg-accent", "#1746D4"],
  ["accent-hover", "bg-accent-hover", "#1239B0"],
  ["accent-press", "bg-accent-press", "#0E2F8F"],
  ["accent-200", "bg-accent-200", "#DBE4FE"],
  ["bg", "bg-bg", "#F2F3F6"],
  ["surface", "bg-surface", "#E7E9EF"],
  ["surface-2", "bg-surface-2", "#F5F7FA"],
  ["ink", "bg-ink", "#1B1D22"],
  ["muted", "bg-muted", "#5B6069"],
  ["faint", "bg-faint", "#95999F"],
] as const;

/** Catálogo visual de app/ui. Solo disponible en desarrollo. */
export default function UiKitPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <PageShell>
      <SiteHeader subtitle="Catálogo de componentes">
        <Button href="/" variant="secondary" size="sm">
          Ver ranking
        </Button>
      </SiteHeader>

      <Container className="py-12">
        <Eyebrow>app/ui</Eyebrow>
        <Heading as="h1" size="display" className="mt-3">
          UI kit
        </Heading>
        <Lead className="mt-4 max-w-[640px]">
          Todas las primitivas con sus variantes, en el orden del catálogo de
          marca. Ver app/ui/README.md para el uso.
        </Lead>

        <Block
          index="01"
          title="Logo"
          note="Sello troquelado. Un solo peso, sin efectos."
        >
          <div className="rule grid border sm:grid-cols-4">
            <div className="rule bg-bg grid aspect-square place-items-center border-b p-9 sm:border-r sm:border-b-0">
              <Seal size={120} tone="ink" />
            </div>
            <div className="rule bg-ink grid aspect-square place-items-center border-b p-9 sm:border-r sm:border-b-0">
              <Seal size={120} tone="paper" />
            </div>
            <div className="rule bg-accent grid aspect-square place-items-center border-b p-9 sm:border-r sm:border-b-0">
              <Seal size={120} tone="paper" />
            </div>
            <div className="bg-surface flex aspect-square flex-col items-start justify-center gap-4 p-6">
              <Seal size={34} tone="accent" />
              <Muted className="label">Marca de la nav</Muted>
            </div>
          </div>
        </Block>

        <Block
          index="02"
          title="Paleta"
          note="El azul con moderación; todo lo demás es tinta y gris."
        >
          <div className="rule grid grid-cols-2 border sm:grid-cols-5">
            {SWATCHES.map(([name, cls, hex]) => (
              <div
                key={name}
                className="rule border-r border-b p-3 last:border-r-0"
              >
                <div className={`h-16 ${cls}`} />
                <p className="mt-2 text-[13px] font-bold">{name}</p>
                <p className="figure text-muted text-[12px]">{hex}</p>
              </div>
            ))}
          </div>
        </Block>

        <Block index="03" title="Tipografía" note="Archivo, una sola familia.">
          <Card tone="bg">
            <Eyebrow>Eyebrow accent</Eyebrow>
            <Eyebrow tone="muted" className="mt-2">
              Eyebrow muted
            </Eyebrow>
            <Eyebrow tone="faint" className="mt-2">
              Eyebrow faint
            </Eyebrow>
            <Heading as="h3" size="display" className="mt-6">
              Display
            </Heading>
            <Heading as="h3" size="title" className="mt-4">
              Título 34
            </Heading>
            <Heading as="h3" size="h2" className="mt-4">
              H2 de sección 22
            </Heading>
            <Lead className="mt-4">
              Lead: párrafo introductorio, 16px / 1.6, gris.
            </Lead>
            <Muted className="mt-2">Muted: texto secundario, 14px.</Muted>
            <p className="mt-6 flex flex-wrap items-baseline gap-6">
              <Figure size={30}>1,482</Figure>
              <Figure size={40} tone="accent">
                #6
              </Figure>
              <Figure size={64} tone="accent">
                #1
              </Figure>
            </p>
            <p className="mt-6 flex flex-wrap items-baseline gap-6">
              <Price value={1500} size="sm" />
              <Price value={1500} />
              <Price value={1500} size="lg" />
              <Price value={1500} size="xl" tone="ink" />
            </p>
          </Card>
        </Block>

        <Block
          index="04"
          title="Botones"
          note="Label siempre al ras izquierdo, también en los anchos."
        >
          <Card tone="bg">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Ocupar posición</Button>
              <Button variant="secondary">Ver a mi competencia</Button>
              <Button variant="ghost">Cerrar sesión</Button>
              <Button variant="link">Registra tu negocio</Button>
              <Button disabled>Deshabilitado</Button>
              <IconButton label="Cerrar">
                <Icon name="x" />
              </IconButton>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="sm" variant="secondary">
                Small secondary
              </Button>
            </div>
            <div className="mt-4">
              <Button size="lg" block>
                Pagar y subir al #5
              </Button>
            </div>
          </Card>
        </Block>

        <Block index="05" title="Tags de estado">
          <Card tone="bg">
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="first">Posición #1</Tag>
              <Tag tone="available">Disponible</Tag>
              <Tag tone="taken">Ocupada</Tag>
              <Tag tone="verified">
                <Icon name="check" size={12} /> Verificado
              </Tag>
              <Tag tone="neutral">Neutral</Tag>
              <Tag tone="up">
                <Icon name="arrow-up" size={12} /> Subió 2
              </Tag>
              <Tag tone="down">
                <Icon name="arrow-down" size={12} /> Bajó 1
              </Tag>
              <LiveDot>En vivo</LiveDot>
            </div>
          </Card>
        </Block>

        <Block index="06" title="Campos y controles">
          <CardSection
            title="CardSection"
            description="Descripción de la sección."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Input" hint="Texto de ayuda.">
                <Input placeholder="Escribe algo" />
              </Field>
              <Field label="Con error" error="Este campo es obligatorio.">
                <Input
                  aria-invalid
                  defaultValue=""
                  placeholder="Nombre del negocio"
                />
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
              <Field
                label="Monto"
                hint="Con $330 quedas en el #5, arriba de Estética Marisol."
              >
                <MoneyInput defaultValue={330} min={0} />
              </Field>
              <Field label="Input deshabilitado">
                <Input disabled defaultValue="No editable" />
              </Field>
              <Field label="Textarea" className="sm:col-span-2">
                <Textarea rows={3} />
              </Field>
            </div>
            <ControlsDemo />
          </CardSection>
        </Block>

        <Block index="07" title="Tarjetas, avatares y carga">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card padding="sm">Card padding sm</Card>
            <Card>Card padding md</Card>
            <Card padding="lg" tone="bg">
              Card padding lg · fondo bg
            </Card>
          </div>
          <Card tone="bg">
            <div className="flex flex-wrap items-end gap-4">
              <Avatar src={null} alt="Tacos El Regio" size="xs" />
              <Avatar src={null} alt="Tacos El Regio" size="sm" />
              <Avatar src={null} alt="Estética Marisol" size="md" />
              <Avatar src={null} alt="Café Único" size="lg" />
              <Avatar src={null} alt="" size="sm" fallback="#4" />
            </div>
          </Card>
          <Card tone="bg">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-4 w-full max-w-[420px]" />
              <Skeleton className="h-4 w-2/3 max-w-[300px]" />
            </div>
          </Card>
        </Block>

        <Block
          index="08"
          title="Avisos"
          note="Sin verde, ámbar ni rojo: borde azul o de tinta."
        >
          <Alert tone="accent" title="Estética Marisol te superó">
            Pagó $310 hace 3 horas. Recupera el #5 por $330.
          </Alert>
          <Alert tone="neutral" title="Cambios guardados" closeHref="/ui-kit">
            Con enlace para cerrar.
          </Alert>
          <Alert tone="neutral">Sin título, tono neutro.</Alert>
          <div className="space-y-2">
            <Alert tone="error" compact>
              Compacto: error dentro de un formulario (role=alert).
            </Alert>
            <Alert tone="success" compact>
              Compacto: guardado.
            </Alert>
          </div>
        </Block>

        <Block index="09" title="Estados vacíos">
          <Card padding="lg" tone="bg">
            <EmptyState
              title="Negocio no encontrado"
              action={<Button href="/">Volver al ranking</Button>}
            >
              Texto explicativo opcional.
            </EmptyState>
          </Card>
          <Card padding="lg" tone="bg">
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
