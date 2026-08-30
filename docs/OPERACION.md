# Operación de EL N1

Guía de referencia para operar producción. Complementa el `README.md` (cómo correr el proyecto) y `PROPUESTA-PAGINA-EMPRESA.md` (cómo funciona el producto). Mantenerla al día es parte de cada PR que cambie infraestructura.

## 1. Piezas y accesos

| Pieza | Dónde | Cuenta dueña | Cómo se opera |
|---|---|---|---|
| Código | GitHub `RedCollects/ElN1`, rama `main` | `RedCollects` | PRs desde ramas; **los merges los hace `RedCollects`** (ver §3) |
| Hosting | Vercel, equipo `el-n1`, proyecto `el-n1` → https://www.eln1.mx | `redcollects` | Panel de Vercel o CLI (`npx vercel`) con sesión de esa cuenta |
| Base de datos, Auth, Storage | Supabase, proyecto `exltmtzhxfwcqrjxwnzo` (us-east-1) | cuenta de Eduardo | Dashboard, CLI (`npx supabase`) o Management API con token personal |
| Pagos | Mercado Pago, aplicación de EL N1 | cuenta de Eduardo | Panel de desarrolladores: credenciales y webhook |
| Dominio | `eln1.mx` / `www.eln1.mx` apuntando a Vercel | — | DNS del registrador |

Variables de entorno (todas en Vercel → Settings → Environment Variables; plantilla en `.env.example`):

| Variable | Para qué | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Lecturas públicas y Auth | Pueden ir al navegador |
| `SUPABASE_SECRET_KEY` | Escrituras desde el servidor (checkout, webhook, admin, perfil) | **Nunca** al navegador |
| `MERCADOPAGO_ACCESS_TOKEN` | Crear preferencias, consultar pagos, reembolsar | Prueba: credenciales del vendedor de prueba; producción: las reales |
| `MERCADOPAGO_WEBHOOK_SECRET` | Verificar la firma de las notificaciones | Se copia del panel de MP al registrar el webhook |
| `NEXT_PUBLIC_APP_URL` | URL pública (webhook, back_urls, correos) | `https://www.eln1.mx` |
| `ADMIN_PASSWORD` | Panel `/admin` | ≥ 12 caracteres |
| `ALLOW_CASH_PAYMENTS` | `true` permite OXXO/transferencia (sin reserva) | Por defecto `false` |
| `AUTO_REFUND_OUTBID` | `false` desactiva el reembolso automático de pagos tardíos | Por defecto `true` |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting compartido entre instancias | **Obligatorias** cuando entre el PR de rate limiting; sin ellas el límite es solo por instancia |

## 2. Cómo llega un cambio a producción

```
rama → PR → revisión → merge a main por RedCollects → Vercel despliega solo (~1 min)
                                   ↑
                    si el PR trae migraciones: aplicarlas ANTES (o inmediatamente después)
```

- Vercel está conectado a GitHub: **cada push a `main` es un despliegue a producción**. No hay entorno intermedio; los PRs generan *previews* en URLs `*.vercel.app` con las variables de *Preview*.
- **Regla de identidad**: el plan Hobby de Vercel solo acepta despliegues cuyo commit esté firmado por la cuenta dueña (`RedCollects`). Un merge hecho por otra cuenta queda en estado `BLOCKED` y no despliega. Por eso los merges los hace `RedCollects`.
- Salida de emergencia si un despliegue queda bloqueado: desplegar desde la CLI **sin metadatos de git**:
  ```bash
  git archive origin/main | tar -x -C /tmp/eln1-deploy
  cp .vercel/project.json /tmp/eln1-deploy/.vercel/
  cd /tmp/eln1-deploy && npx vercel deploy --prod --scope el-n1 --yes
  ```
  Producción queda actualizada, pero `main` debe mergearse igual para no divergir.
- **Rollback**: Vercel → Deployments → despliegue anterior → *Instant Rollback*. Solo sirve si el esquema de la base sigue siendo compatible con ese código.

## 3. Migraciones de base de datos

- Viven en `supabase/migrations/NNN_*.sql`, numeradas en orden. **Nunca se edita una migración ya aplicada**; los cambios van en una migración nueva.
- Hoy no hay un mecanismo automático que las aplique en producción: hay que hacerlo a mano, **antes** de mergear el PR que las trae (el código nuevo contra el esquema viejo tumba el sitio; pasó el 2026-08-27 con la columna `status`).
- Opciones para aplicarlas:
  1. Supabase Dashboard → SQL Editor → pegar el archivo completo → Run.
  2. CLI enlazada al proyecto: `npx supabase link --project-ref exltmtzhxfwcqrjxwnzo` y `npx supabase db push` (requiere la contraseña de la base).
  3. Management API con token personal (sin contraseña de base):
     ```bash
     curl -X POST https://api.supabase.com/v1/projects/exltmtzhxfwcqrjxwnzo/database/query \
       -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
       -d "{\"query\": $(node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(process.argv[1],"utf8")))' supabase/migrations/008_x.sql)}"
     ```
- Todas las migraciones son idempotentes (`if not exists`, `create or replace`): repetir una no rompe nada.
- Extensiones necesarias en producción: `pgcrypto`, `unaccent` (migración 005) y `pg_cron` (habilitada el 2026-08-30 para la migración de caducidad de reservas).
- Para probar migraciones en limpio: `npx supabase db reset` en local aplica todas desde cero (ver README, sección Docker).

## 4. Checklist de despliegue

Antes de mergear un PR:
- [ ] CI en verde (`typecheck`, `lint`, `test`, `build`).
- [ ] ¿Trae migraciones? → aplicarlas en producción primero.
- [ ] ¿Trae variables nuevas? → cargarlas en Vercel (Production **y** Preview) primero.
- [ ] ¿Toca `settle_bid`, checkout o webhook? → correr la batería SQL de escenarios en local (ocupar libre, pago tardío, subir, blindar, caída del #50, reservas, idempotencia).

Después del despliegue:
- [ ] `https://www.eln1.mx/` responde 200 y muestra el ranking.
- [ ] `https://www.eln1.mx/api/health` responde OK.
- [ ] Registro de prueba → correo → `/mi-negocio` carga.

## 5. Incidentes: qué mirar y qué hacer

| Síntoma | Causa probable | Acción |
|---|---|---|
| Portada: "Error al cargar EL N1 — column X does not exist" | Código nuevo sin su migración | Aplicar la migración pendiente (§3). Si tardará, *Instant Rollback* en Vercel |
| Despliegue en estado `BLOCKED` | Merge firmado por una cuenta ajena al equipo Vercel | Desplegar sin git desde la CLI (§2) o volver a mergear como `RedCollects` |
| Registro dice "Te enviamos un correo" pero no llega | Límite del correo integrado de Supabase (~3/hora) | Configurar SMTP propio (Resend) en Supabase → Auth → SMTP. Mientras tanto, confirmar al usuario a mano en Auth → Users |
| Pagó y no aparece en el ranking | El webhook no llegó, falló la firma, o `settle_bid` lo marcó `outbid`/`rejected` | 1) `select * from bids where payment_id = '<id>' or preference_id = '<id>'` y mirar `status`/`failure_reason`. 2) Logs de la función en Vercel → filtrar `webhook`. 3) Si el webhook nunca llegó: en MP → Webhooks → reenviar la notificación, o llamar a `verifyAndSettlePayment` con el id del pago. 4) Si es `outbid` y `refund_id` está vacío con `AUTO_REFUND_OUTBID=true`: reembolsar a mano en MP y anotar el `refund_id` en la oferta |
| Webhook responde 401 "Firma inválida" a notificaciones reales | `MERCADOPAGO_WEBHOOK_SECRET` no coincide con el del panel de MP | Copiar el secreto del panel a Vercel y redesplegar |
| Reservas que no caducan (aviso 🔒 se queda) | `expire_bids` no corre (pg_cron no activo o job ausente) | `select cron.job` en la base; si no existe el job, correr `select public.expire_bids();` y revisar la migración de pg_cron |
| Muchos 429 en analítica o login | Rate limiting por IP con usuarios tras CGNAT | Subir umbrales en `lib/rate-limit.ts`; verificar que Upstash esté configurado |
| Imagen externa rompe una página | Host no permitido en `next/image` | `SmartImage` sirve sin optimizar cualquier host fuera de Storage; si reaparece, revisar `next.config.ts` |

Consultas útiles (SQL Editor):

```sql
-- Ranking actual
select position, name, current_price, status, active from businesses where position is not null order by position;
-- Ofertas de las últimas 24 h con su desenlace
select created_at, business_name, position, amount, status, failure_reason, payment_id, refund_id
from bids where created_at > now() - interval '1 day' order by created_at desc;
-- Reservas vivas
select * from active_reservations();
```

## 6. Claves y rotación

- **Token de Mercado Pago**: si se expone, regenerarlo en el panel de MP y actualizar `MERCADOPAGO_ACCESS_TOKEN` en Vercel; redesplegar.
- **Secreto del webhook**: regenerar en MP → Webhooks; actualizar `MERCADOPAGO_WEBHOOK_SECRET`.
- **Claves de Supabase**: Dashboard → Settings → API keys → rotar; actualizar las tres variables en Vercel.
- **Tokens personales** (Supabase Access Tokens, GitHub PAT, Vercel): revocarlos en cuanto dejen de usarse; nunca pegarlos en chats ni en archivos del repo.
- `ADMIN_PASSWORD`: cambiarla invalida las sesiones del admin (están firmadas con ella).

## 7. Pendientes de infraestructura antes del lanzamiento comercial

1. **Vercel Pro**: el plan Hobby no permite uso comercial y bloquea despliegues de otros miembros.
2. **Supabase Pro**: backups diarios, sin pausas por inactividad, sin límite de correo.
3. **SMTP propio** (Resend u otro) en Supabase Auth: plantillas en español y sin el límite de ~3 correos/hora.
4. **Upstash Redis** y sus variables (rate limiting real).
5. **Webhook de Mercado Pago** registrado con la URL de producción y probado de punta a punta con credenciales de prueba antes de poner las reales.
6. Alertas: correo cuando el webhook falle o haya un `outbid` sin `refund_id`.
