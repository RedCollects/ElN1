import { Card, Heading, Logo, Muted, PageShell } from "@/app/ui";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

/** Tarjeta centrada de las páginas de acceso (ingresar, registro, admin). */
export default function AuthShell({ title, subtitle, children }: Props) {
  return (
    <PageShell tone="muted" centered>
      <Card padding="lg" elevated className="w-full max-w-sm">
        <Logo size={28} />
        <Heading as="h1" className="mt-2">
          {title}
        </Heading>
        <Muted className="mt-2">{subtitle}</Muted>
        {children}
      </Card>
    </PageShell>
  );
}
