import { Alert, Container, type Tone } from "@/app/ui";

type Props = {
  status: string | undefined;
};

const NOTICES: Record<string, { title: string; body: string; tone: Tone }> = {
  success: {
    title: "¡Pago recibido!",
    body: "Mercado Pago nos confirmará tu pago en unos segundos y tu negocio aparecerá en la posición que elegiste. Si aún no lo ves, recarga la página en un momento.",
    tone: "success",
  },
  pending: {
    title: "Tu pago está en proceso",
    body: "Mercado Pago todavía no confirma el pago (pasa con transferencias y pagos en efectivo). En cuanto se acredite, tu negocio ocupará la posición automáticamente.",
    tone: "warning",
  },
  failure: {
    title: "El pago no se completó",
    body: "No se realizó ningún cargo. Puedes intentarlo de nuevo cuando quieras.",
    tone: "error",
  },
};

export default function PaymentNotice({ status }: Props) {
  const notice = status ? NOTICES[status] : undefined;

  if (!notice) {
    return null;
  }

  return (
    <Container width="content" className="pt-8">
      <Alert tone={notice.tone} title={notice.title} closeHref="/">
        {notice.body}
      </Alert>
    </Container>
  );
}
