# EL N1

Ranking público de negocios donde cada participante puede competir por una posición mediante Mercado Pago.

## Desarrollo local

1. Instala dependencias con `npm install`.
2. Copia `.env.example` como `.env.local` y completa las variables.
3. Ejecuta en Supabase `supabase/migrations/001_ranking_and_payments.sql`.
4. Inicia la aplicación con `npm run dev`.

La aplicación estará en `http://localhost:3000`.

## Variables de entorno

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave pública para lecturas del sitio.
- `SUPABASE_SECRET_KEY`: clave secreta para APIs de servidor.
- `MERCADOPAGO_ACCESS_TOKEN`: token privado de Mercado Pago.
- `MERCADOPAGO_WEBHOOK_SECRET`: secreto de firma del webhook de Mercado Pago.
- `NEXT_PUBLIC_APP_URL`: URL pública de la aplicación; en producción debe ser HTTPS.
- `ADMIN_PASSWORD`: contraseña de administración de al menos 12 caracteres.

## Flujo de pago

El checkout crea una oferta pendiente, calcula el importe en el servidor y crea una preferencia de Mercado Pago con `external_reference`. Mercado Pago notifica en `/api/webhooks/mercadopago`.

El webhook consulta el pago directamente con Mercado Pago y solo un pago aprobado, con importe y moneda correctos, puede ejecutar la función transaccional `settle_bid`. Las notificaciones fuera de una ventana de cinco minutos se rechazan.

## Antes de producción

- Aplicar la migración en Supabase.
- Configurar las variables privadas en el proveedor de hosting, incluido `MERCADOPAGO_WEBHOOK_SECRET`.
- Configurar el webhook con la URL HTTPS de producción.
- Proteger `/admin` y `/api/admin` con autenticación y autorización.
- Configurar `ADMIN_PASSWORD` antes de abrir el panel.
- Configurar políticas RLS y probar pagos aprobados, rechazados, pendientes y repetidos.
- Sustituir el token de Mercado Pago si alguna vez fue compartido o expuesto.

## Comprobaciones

```bash
npx tsc --noEmit
npm run lint
npx next build --webpack
```
