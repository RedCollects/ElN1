import Link from "next/link";

export const metadata = {
  title: "Términos y condiciones | EL N1",
  description: "Condiciones de uso y participación de EL N1.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-black tracking-tight">
            EL <span className="text-accent-press">N1</span>
          </Link>
          <Link href="/" className="text-sm font-bold text-neutral-500">
            Volver al ranking
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <p className="text-accent-press text-sm font-bold tracking-[0.25em] uppercase">
          Información importante
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Términos y condiciones
        </h1>
        <p className="mt-5 text-lg leading-8 text-neutral-600">
          Al participar en EL N1 aceptas las siguientes condiciones.
        </p>

        <div className="mt-10 space-y-8 leading-7 text-neutral-600">
          <section>
            <h2 className="text-xl font-black text-neutral-950">
              1. Qué es EL N1
            </h2>
            <p className="mt-2">
              EL N1 es un proyecto experimental de exhibición comercial. No es
              una agencia, una red publicitaria ni una plataforma que prometa
              ventas o resultados de negocio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-neutral-950">
              2. Qué compra el participante
            </h2>
            <p className="mt-2">
              El pago da derecho a que la información proporcionada se muestre
              en la posición correspondiente al importe aceptado, mientras otra
              persona no realice una oferta superior y válida.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-neutral-950">
              3. Sin promesa de resultados
            </h2>
            <p className="mt-2">
              No aseguramos visitas, contactos, clientes, ventas, alcance,
              tiempo de exposición ni una cantidad determinada de personas que
              vean el anuncio. La presencia en el ranking no constituye
              recomendación, certificación o aprobación de EL N1.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-neutral-950">
              4. Ofertas y posiciones
            </h2>
            <p className="mt-2">
              Las posiciones pueden cambiar cuando alguien supera una oferta.
              Una posición libre puede ocuparse y las posiciones existentes
              pueden desplazarse según las reglas visibles del sitio. La
              actualización depende de la confirmación del pago.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-neutral-950">
              5. Métricas de uso
            </h2>
            <p className="mt-2">
              Para mostrar visitas, actividad y negocios más vistos, EL N1
              utiliza un identificador aleatorio almacenado en tu dispositivo.
              No recopilamos tu nombre, correo ni ubicación para estas métricas,
              y las cifras se presentan de forma agregada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-neutral-950">
              6. Responsabilidad del anunciante
            </h2>
            <p className="mt-2">
              Quien publica responde por la veracidad, legalidad y derechos de
              uso de su nombre, logotipo, descripción, enlaces y demás
              información. No se permite contenido ilegal, engañoso, ofensivo o
              que infrinja derechos de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-neutral-950">
              7. Pagos y cambios
            </h2>
            <p className="mt-2">
              Los pagos se procesan mediante Mercado Pago. La confirmación de
              una posición ocurre únicamente después de validar el pago.
              Cualquier aclaración o reembolso se revisará conforme al estado de
              la operación y a las políticas aplicables del procesador de pago.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-neutral-950">
              8. Aceptación
            </h2>
            <p className="mt-2">
              Al continuar con una oferta declaras que leíste estos términos,
              comprendes que se trata de un experimento y aceptas participar
              bajo tu propia decisión y responsabilidad.
            </p>
          </section>
        </div>

        <Link
          href="/responsiva"
          className="bg-accent hover:bg-accent-hover mt-10 inline-block px-5 py-3 font-bold text-white transition"
        >
          Leer carta responsiva
        </Link>
      </article>
    </main>
  );
}
