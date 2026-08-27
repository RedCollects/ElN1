# EL N1

Ranking público de negocios donde cada participante puede competir por una posición mediante Mercado Pago.

## Desarrollo local

1. Instala dependencias con `npm install`.
2. Copia `.env.example` como `.env.local` y completa las variables.
3. Ejecuta en Supabase, en orden, los archivos de `supabase/migrations/`.
4. Inicia la aplicación con `npm run dev`.

La aplicación estará en `http://localhost:3000`.

### Supabase local con Docker (opcional)

Si tienes Docker, puedes levantar una copia local de Supabase en vez de usar un proyecto en la nube:

```bash
npx supabase init   # solo la primera vez
npx supabase start  # aplica las migraciones automáticamente
npx supabase status # muestra la URL y las claves locales para .env.local
```

## Variables de entorno

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave pública para lecturas del sitio.
- `SUPABASE_SECRET_KEY`: clave secreta para APIs de servidor.
- `MERCADOPAGO_ACCESS_TOKEN`: token privado de Mercado Pago.
- `MERCADOPAGO_WEBHOOK_SECRET`: secreto de firma del webhook de Mercado Pago.
- `NEXT_PUBLIC_APP_URL`: URL pública de la aplicación; en producción debe ser HTTPS.
- `ADMIN_PASSWORD`: contraseña de administración de al menos 12 caracteres.

## Ranking y precios

El ranking tiene `MAX_RANKING_POSITION` (50) posiciones. El precio de salida baja de 100 a 10 MXN entre la #1 y la #10 y se mantiene en 10 de ahí en adelante (`lib/prices.ts`); superar una oferta cuesta el 110 %. Las categorías viven en `lib/categories.ts` y alimentan el filtro del ranking, el panel del negocio y el admin.

La portada muestra métricas anónimas (visitas del día, históricas y sesiones en línea) y un leaderboard de negocios más visitados (`/api/analytics`, migración 003), además de un modo nocturno.

## Cuentas de negocio

Los negocios se registran en `/registro` (email, contraseña y nombre) con Supabase Auth. Al crearse el usuario, un trigger (`handle_new_user`, migración 005) crea su negocio en estado `draft`. En `/mi-negocio` el dueño completa su perfil; el negocio solo es visible públicamente cuando `status = 'published'` y `active = true`.

Las sesiones viven en cookies (`@supabase/ssr`); `proxy.ts` las refresca en cada request y protege `/mi-negocio`. Las escrituras al perfil pasan por Server Actions con la clave de servidor tras verificar que el usuario es el dueño.

En producción, Supabase envía un correo de confirmación al registrarse; el enlace apunta a `/auth/confirm`, así que `NEXT_PUBLIC_APP_URL` debe estar en la lista de URLs de redirección del proyecto.

## Imágenes

Logo (1:1, 1024×1024, hasta 2 MB) y portada (16:9, 1600×900, hasta 4 MB) se suben desde `/mi-negocio` mediante Server Actions: el servidor valida tipo y tamaño, recorta con `sharp` (recorte inteligente) y guarda WebP en el bucket público `business-media` de Supabase Storage (migración 006). `next.config.ts` permite las URLs del Storage en `next/image` y eleva `serverActions.bodySizeLimit` a 5 MB.

En el ranking, cada tarjeta se expande (hover en escritorio, toque en móvil) para mostrar el anuncio grande; `BIG_AD_MAX_POSITION` en `lib/business.ts` controla hasta qué posición se ofrece.

## Flujo de pago

Solo un negocio con cuenta y perfil completo puede ofertar. El checkout calcula el importe en el servidor contra el estado real de la posición (`position_state`: precio publicado y reserva vigente más alta), registra una **reserva de 5 minutos** (`bids.expires_at`) y crea una preferencia de Mercado Pago con `external_reference` que vence en el mismo instante. Si el cliente manda `expectedAmount` y el precio cambió, responde `409` con el importe nuevo. Las reservas se muestran en el ranking con un contador (`/api/reservations`, sondeo cada 5 s) y no bloquean a nadie: solo suben el piso de la siguiente oferta. Mercado Pago notifica en `/api/webhooks/mercadopago`.

`settle_bid` toma un cerrojo global, **revalida** el importe contra el precio publicado en ese instante y, si ya no alcanza, marca la oferta `outbid`; el servidor emite entonces un reembolso total (`AUTO_REFUND_OUTBID`). Si el negocio ya estaba en el ranking lo mueve (los intermedios bajan uno); comprar la propia posición solo sube el precio. Quien cae fuera del top 50 conserva su perfil con `position = null` (migración 007).

Efectivo y transferencias lentas se excluyen de la preferencia salvo `ALLOW_CASH_PAYMENTS=true`, porque se confirman fuera de la ventana de reserva.

El webhook consulta el pago directamente con Mercado Pago y solo un pago aprobado, con importe y moneda correctos, puede ejecutar la función transaccional `settle_bid`. Las notificaciones fuera de una ventana de cinco minutos se rechazan.

Un pago con importe o moneda incorrectos marca la oferta como `rejected` y responde 200 para que Mercado Pago no reintente; solo los errores transitorios (Mercado Pago o la base de datos no responden) devuelven 500.

Al volver de Mercado Pago, la portada muestra un aviso según `?payment=success|pending|failure`.

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
npx next typegen   # genera los tipos globales de Next (LayoutProps, PageProps) que tsc necesita
npx tsc --noEmit
npm run lint
npx next build --webpack
```

El build no requiere variables de entorno: los clientes de Supabase se crean por request, no al importar los módulos.
