import Link from "next/link";

type Props = {
  status: string | undefined;
};

const NOTICES: Record<
  string,
  { title: string; body: string; className: string }
> = {
  success: {
    title: "¡Pago recibido!",
    body: "Mercado Pago nos confirmará tu pago en unos segundos y tu negocio aparecerá en la posición que elegiste. Si aún no lo ves, recarga la página en un momento.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  pending: {
    title: "Tu pago está en proceso",
    body: "Mercado Pago todavía no confirma el pago (pasa con transferencias y pagos en efectivo). En cuanto se acredite, tu negocio ocupará la posición automáticamente.",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  failure: {
    title: "El pago no se completó",
    body: "No se realizó ningún cargo. Puedes intentarlo de nuevo cuando quieras.",
    className: "border-red-200 bg-red-50 text-red-900",
  },
};

export default function PaymentNotice({ status }: Props) {
  const notice = status ? NOTICES[status] : undefined;

  if (!notice) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 pt-8">
      <div
        role="status"
        className={`flex items-start justify-between gap-4 rounded-2xl border p-5 ${notice.className}`}
      >
        <div>
          <p className="text-lg font-black">{notice.title}</p>
          <p className="mt-1 text-sm leading-6">{notice.body}</p>
        </div>

        <Link
          href="/"
          aria-label="Cerrar aviso"
          className="shrink-0 text-2xl leading-none opacity-60 hover:opacity-100"
        >
          ×
        </Link>
      </div>
    </div>
  );
}
