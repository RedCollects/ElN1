import type { Metadata } from "next";
import { PRIVACY_DATE, PRIVACY_VERSION, RESPONSABLE } from "@/lib/legal";
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
  title: "Aviso de privacidad | EL N1",
  description:
    "Qué datos recaba EL N1, para qué los usa y cómo ejercer tus derechos.",
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-rule-soft border-b py-6">
      <h2 className="text-ink text-[22px] leading-tight font-extrabold tracking-[-0.01em]">
        {title}
      </h2>
      <div className="text-muted [&_strong]:text-ink mt-3 space-y-3 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <PageShell>
      <SiteHeader>
        <Button href="/" variant="secondary" size="sm">
          Volver al ranking
        </Button>
      </SiteHeader>

      <Container width="narrow" className="py-12 sm:py-16">
        <article>
          <Eyebrow>Tus datos</Eyebrow>
          <Heading as="h1" size="display" className="mt-3">
            Aviso de privacidad
          </Heading>
          <Lead className="mt-5">
            Qué datos recabamos en EL N1, para qué los usamos, con quién los
            compartimos y cómo ejercer tus derechos.
          </Lead>
          <Muted className="mt-3">
            Versión {PRIVACY_VERSION} · vigente desde el {PRIVACY_DATE}
          </Muted>

          <div className="border-rule mt-10 border-t-2">
            <Section id="responsable" title="Responsable">
              <p>
                <strong>{RESPONSABLE.nombre}</strong>, {RESPONSABLE.regimen},
                con domicilio en {RESPONSABLE.domicilio}, {RESPONSABLE.ciudad},
                es responsable del tratamiento de tus datos personales en EL N1
                (eln1.mx). Contacto para todo lo relacionado con este aviso:{" "}
                <strong>{RESPONSABLE.correo}</strong>.
              </p>
            </Section>

            <Section id="datos" title="Qué datos recabamos">
              <p>
                <strong>Cuando creas una cuenta:</strong> correo electrónico y
                contraseña (almacenada cifrada; no la conocemos).
              </p>
              <p>
                <strong>Cuando registras tu negocio:</strong> nombre del
                negocio, categoría, ciudad, descripción, eslogan, horario,
                teléfono, WhatsApp, correo público, sitio web, redes sociales,
                ubicación en mapas, logotipo y portada.{" "}
                <strong>Estos datos son públicos por diseño:</strong> se
                muestran en el ranking y en la página de tu negocio.
              </p>
              <p>
                <strong>Cuando pagas:</strong> posición, monto, fecha y estado
                del pago, e identificador de la operación en Mercado Pago.{" "}
                <strong>
                  No recibimos ni almacenamos tu número de tarjeta;
                </strong>{" "}
                lo procesa Mercado Pago bajo su propio aviso de privacidad.
              </p>
              <p>
                <strong>Si pides factura:</strong> RFC, razón social, código
                postal, régimen fiscal y uso de CFDI.
              </p>
              <p>
                <strong>Cuando visitas el sitio:</strong> un identificador
                aleatorio guardado en tu navegador, fecha de visita y clics en
                negocios, para contar visitas y negocios más vistos. Este
                identificador no está ligado a tu nombre ni a tu correo. Los
                registros de nuestros servidores guardan además dirección IP y
                navegador por seguridad y por un tiempo limitado.
              </p>
              <p>
                No recabamos datos sensibles (salud, origen étnico, creencias,
                orientación sexual, etc.). No los pidas ni los publiques en tu
                perfil.
              </p>
            </Section>

            <Section id="finalidades" title="Para qué los usamos">
              <p>
                <strong>Finalidades necesarias</strong> (sin ellas no podemos
                prestarte el servicio):
              </p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Crear y administrar tu cuenta y tu negocio.</li>
                <li>
                  Mostrar tu negocio en el ranking y en su página pública.
                </li>
                <li>
                  Procesar pagos, reservas, asignación de posiciones y
                  reembolsos.
                </li>
                <li>
                  Avisarte por correo (y por WhatsApp, si lo activas) cuando te
                  superan, cuando tu pago se confirma o cuando hay cambios que
                  te afectan.
                </li>
                <li>Emitir facturas cuando las solicitas.</li>
                <li>Prevenir fraude y abusos, y atender aclaraciones.</li>
                <li>Cumplir obligaciones legales y fiscales.</li>
              </ol>
              <p>
                <strong>Finalidades voluntarias</strong> (puedes negarte sin que
                afecte el servicio):
              </p>
              <ol className="list-decimal space-y-1 pl-5" start={8}>
                <li>Enviarte novedades de EL N1 por correo.</li>
                <li>Elaborar estadísticas agregadas de uso del sitio.</li>
              </ol>
              <p>
                Para negarte a las voluntarias, escríbenos a{" "}
                {RESPONSABLE.correo} o usa el enlace de baja que incluyen los
                correos.
              </p>
            </Section>

            <Section id="transferencias" title="Con quién los compartimos">
              <p>
                Solo con proveedores que necesitamos para operar, y únicamente
                lo indispensable:
              </p>
              <List
                items={[
                  <>
                    <strong>Mercado Pago</strong> (MercadoLibre, S. de R.L. de
                    C.V.): procesamiento de pagos y reembolsos.
                  </>,
                  <>
                    <strong>Supabase</strong>: base de datos, autenticación y
                    almacenamiento de imágenes.
                  </>,
                  <>
                    <strong>Vercel</strong>: alojamiento del sitio.
                  </>,
                  <>
                    <strong>[Proveedor de correo y mensajería]</strong>: envío
                    de notificaciones.
                  </>,
                  <>
                    <strong>[Proveedor de facturación (PAC)]</strong>: timbrado
                    de CFDI.
                  </>,
                ]}
              />
              <p>
                Estos proveedores pueden estar fuera de México; tratan los datos
                por cuenta nuestra y bajo contratos que exigen su protección. No
                vendemos tus datos ni los compartimos con anunciantes. Podemos
                entregar datos a autoridades cuando una ley o resolución nos
                obligue.
              </p>
            </Section>

            <Section id="derechos" title="Tus derechos (ARCO)">
              <p>
                Puedes <strong>acceder</strong> a tus datos,{" "}
                <strong>rectificarlos</strong>, <strong>cancelarlos</strong> y{" "}
                <strong>oponerte</strong> a su tratamiento, así como revocar tu
                consentimiento y limitar su uso. Casi todo lo puedes hacer tú
                desde tu panel (editar o borrar tu negocio, cerrar tu cuenta).
                Para lo demás, escribe a {RESPONSABLE.correo} con tu nombre, el
                correo de tu cuenta y qué derecho quieres ejercer. Te
                respondemos en un máximo de 20 días hábiles.
              </p>
              <p>
                Cerrar tu cuenta elimina tu negocio del ranking y tus datos de
                perfil; conservamos los registros de pagos y facturas el tiempo
                que la ley fiscal exige (5 años).
              </p>
            </Section>

            <Section id="cookies" title="Cookies e identificadores">
              <p>
                No usamos cookies de publicidad ni de rastreo entre sitios.
                Usamos:
              </p>
              <List
                items={[
                  "una cookie de sesión para mantenerte conectado;",
                  "un identificador aleatorio en el almacenamiento de tu navegador para contar visitas y negocios más vistos, y para recordar tu preferencia de tema claro u oscuro.",
                ]}
              />
              <p>
                Puedes borrarlos desde tu navegador; al hacerlo cerrarás tu
                sesión.
              </p>
            </Section>

            <Section id="cambios" title="Cambios a este aviso">
              <p>
                Publicaremos cualquier cambio en esta página con su fecha de
                versión y, si afecta finalidades o transferencias, te lo
                avisaremos por correo antes de que aplique.
              </p>
            </Section>
          </div>

          <Button href="/terminos" variant="secondary" className="mt-10">
            Ver términos y condiciones
          </Button>
        </article>
      </Container>

      <SiteFooter />
    </PageShell>
  );
}
