import { Card, Heading, Logo, Muted, PageShell } from "@/app/ui";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

/** Tarjeta de las páginas de acceso (ingresar, registro, admin), al ras izquierdo. */
export default function AuthShell({ title, subtitle, children }: Props) {
  return (
    <PageShell centered>
      <Card padding="lg" tone="bg" className="w-full max-w-[440px]">
        <Logo size={28} />
        <Heading as="h1" size="title" className="mt-8">
          {title}
        </Heading>
        <Muted className="mt-2">{subtitle}</Muted>
        {children}
      </Card>
    </PageShell>
  );
}
