# Propuesta: página de empresa y nuevo flujo de pago — EL N1

> Especificación redactada por el segundo desarrollador (con Claude Code) para revisión del primero. Es la continuación de `PROPUESTA-MEJORAS.md` (rama `propuesta-mejoras`) y asume que la Fase 1 (rama `fase-1-estabilizar`) se mergea antes. Nada de esto está implementado: buscamos tu acuerdo antes de empezar.

## ⚡ Resumen rápido — en 30 segundos

Hoy un negocio paga y aparece en el ranking con una tarjeta vacía (solo nombre), porque no hay forma de capturar su información. Proponemos:

1. **Cuenta de negocio** (email + contraseña + nombre): el negocio se registra, completa su perfil, sube logo y portada, y **ve una vista previa** de su anuncio. **Para publicarse, paga.**
2. **Reservas de 5 minutos con alertas en vivo**: al iniciar un pago, la posición queda "reservada" a ese precio y todos lo ven en el ranking con un contador. Otros pueden superar la reserva. Al confirmarse el pago se revalida el precio: si alguien pagó más mientras tanto, **reembolso automático**.
3. Esto **resuelve de paso los hallazgos 2 y 6** de la propuesta anterior (negocios duplicados y datos de contacto inalcanzables) y **cierra tres huecos de seguridad del pago** que encontramos al analizar a fondo (ver sección 5).

Entrega en 3 PRs revisables por separado. Al final hay 4 decisiones que necesitamos de ti.

---

## 1. Decisiones ya tomadas (entre los dos desarrolladores del lado nuestro)

| Tema | Decisión | Por qué |
|---|---|---|
| Identidad | **Email + contraseña** (Supabase Auth) | Recuperar contraseña, enviar confirmaciones y avisos ("te superaron"); Supabase lo soporta nativo. El email **identifica al negocio**: adiós duplicados. |
| Flujos | **Uno solo**: registrarse → completar → pagar | Dos caminos duplican lógica; el "rápido" produce las tarjetas vacías que queremos evitar. |
| Contacto mínimo | **Al menos un canal**: WhatsApp, teléfono, email público o sitio web | No todos los negocios usan WhatsApp. |
| Reserva | **5 minutos**, visible para todos, superable | Un checkout de Mercado Pago tarda 1-4 min; menos tiempo produce reembolsos innecesarios. |

## 2. El flujo

```
Ranking → "OCUPAR / SUPERAR" ─┐
                              ├─→ Registro (3 campos) → Mi negocio → Pagar → Publicado
Botón "Registra tu negocio" ──┘         │                  │
                                        │    completar perfil, subir fotos,
                                        │    ver vista previa del anuncio
                                        └──────────────────┘
```

1. **Registro**: email, contraseña, nombre del negocio. Cae directo en su panel.
2. **Mi negocio** (panel privado `/mi-negocio`): formulario del perfil, subida de logo/portada, y **vista previa en vivo** de la tarjeta del ranking, del anuncio grande y de la página pública. Ve lo que va a comprar.
3. **Publicar**: "Elegir posición y pagar" → selector de posiciones (el modal actual) → Mercado Pago → al confirmarse, aparece en el ranking. Si venía del ranking con una posición elegida, se recuerda (`?position=N`).
4. **Después**: edita su perfil cuando quiera (sin volver a pagar) y "sube de posición" con un clic. Si lo sacan del top 10, su perfil sigue existiendo y puede volver a ofertar.

## 3. Información del negocio

**Obligatorio para publicar:** nombre (máx. 60), categoría (lista cerrada), ciudad, logo, y **al menos un canal de contacto**.

**Opcional:** eslogan (máx. 80, se ve en la tarjeta y el anuncio), descripción (máx. 300, solo perfil), WhatsApp, teléfono, email público, sitio web, Instagram / Facebook / TikTok (**se pide el usuario, no la URL**; nosotros armamos el enlace — más fácil y evita enlaces maliciosos), imagen de portada, dirección o enlace de Google Maps, horario.

**Categorías propuestas:** Restaurante · Cafetería · Barbería y belleza · Tienda · Servicios · Salud · Fitness · Entretenimiento · Otro. Hoy es texto libre (todo sale "General").

**WhatsApp:** 10 dígitos MX; el enlace `wa.me/52…` lleva un mensaje prellenado ("Hola, los vi en EL N1") para que el negocio sepa de dónde vino el cliente.

### Imágenes

| Imagen | Proporción | Recomendado | Mínimo | Formato / peso | Se usa en |
|---|---|---|---|---|---|
| Logo | 1:1 | 1024×1024 | 512×512 | PNG/JPG/WebP · máx. 2 MB | Tarjeta (56 px), anuncio (80 px), perfil (112 px) |
| Portada | 16:9 | 1600×900 | 1200×675 | JPG/WebP · máx. 4 MB | Anuncio grande (~400 px) y cabecera del perfil |

Subida a **Supabase Storage** (bucket `business-media`, carpeta por negocio, RLS por dueño) mediante URL firmada que genera el servidor; validación de tipo y tamaño; **recorte guiado** en el formulario (el usuario ve el cuadrado / 16:9 resultante); servido con `next/image` (elimina el warning de lint actual).

### Dónde se ve cada cosa

- **Tarjeta del ranking**: medalla/posición · logo · nombre · categoría + ciudad · oferta actual · reserva activa (si hay) · botón.
- **Anuncio grande**: al pasar el mouse (escritorio) o tocar la tarjeta (móvil, acordeón): portada, logo, nombre, eslogan, botón de WhatsApp/contacto, iconos de redes, enlace al perfil.
- **Perfil público** `/business/[id]` (existe): portada como cabecera + todo lo demás.

## 4. Reservas y alertas en vivo

Al iniciar un pago, la oferta pendiente queda registrada con `expires_at = ahora + 5 min` y el precio queda **fijado** para ese usuario. **No bloquea a nadie**: solo sube el piso — quien quiera esa posición mientras la reserva esté viva debe ofertar el 110 % de la reserva, no del precio publicado.

En el ranking, todos ven la reserva con contador (Supabase Realtime sobre las ofertas pendientes; el contador se calcula en el navegador desde `expires_at`):

```
┌──────────────────────────────────────────────────────────────┐
│ 🥇  Tacos Doña Lupita                         Oferta actual │
│     Restaurante · CDMX                          $100 MXN     │
│  🔒 Alguien reservó esta posición por $110 · ⏱ 4:12         │
│     Puedes superarla desde $121                  [ SUPERAR ] │
└──────────────────────────────────────────────────────────────┘
```

Si otro supera, la alerta cambia a "$121 · ⏱ 4:58" para todos. Si nadie paga, la reserva caduca y la posición vuelve a su precio anterior. La preferencia de Mercado Pago **vence en el mismo instante** que la reserva, para que MP no acepte pagos fuera de la ventana.

## 5. Seguridad del pago: los huecos que cierra

Analizando a fondo `settle_bid` y el webhook encontramos tres escenarios que hoy fallan (además de lo ya cubierto: importe server-side, firma HMAC, idempotencia por `payment_id`):

| Escenario | Qué pasa hoy | Solución |
|---|---|---|
| **Pago lento**: Ana inicia por $110 en OXXO; dos días después el #1 vale $200; al confirmarse su pago, el webhook solo compara contra *su* oferta → **Ana es #1 por $110** y desplaza a quien pagó $200 | Se asigna a precio viejo | `settle_bid` **revalida** contra el precio real en el momento de asignar; si no alcanza, no asigna, marca la oferta `outbid` y el servidor **reembolsa automáticamente** vía API de MP y avisa por email |
| **Empate**: dos personas abren el modal a la vez, ambas pagan $110; el último en confirmarse gana sin haber pagado más | Orden arbitrario, doble desplazamiento | La **reserva** fija el piso: el segundo debe ofertar $121 |
| **Dos webhooks simultáneos** para la misma posición: `settle_bid` bloquea la fila de cada oferta pero no la posición; ambos leen "$100", ambos desplazan | Estado inconsistente | **Cerrojo por posición** (`pg_advisory_xact_lock`) dentro de `settle_bid`: las confirmaciones se procesan una tras otra |
| **Precio mostrado ≠ cobrado**: el modal muestra $110, alguien paga, das clic y el servidor cobra $121 sin avisar | Pagas a ciegas | El checkout responde `409 { newAmount }` y el modal muestra "el precio subió a $121 — ¿ofertar $121?" |

Regla resultante: **siempre gana quien pagó más, sin importar quién dio clic primero.** Reservas encadenadas se resuelven por orden de confirmación (si Beto $121 paga antes que Ana $110, Ana recibe reembolso; si Ana paga primero, entra y luego Beto la supera).

**Pagos instantáneos:** la preferencia excluye efectivo (OXXO) y transferencias lentas (`excluded_payment_types`), para que casi todo se confirme dentro de la ventana y los reembolsos sean la excepción.

**Subir de posición** (el #3 compra el #1): `settle_bid` **mueve** el negocio (los que están entre la posición nueva y la vieja bajan uno; el resto no se toca) en vez de insertar un duplicado y dejar un hueco. **Ofertar contra tu propio negocio** está permitido: solo sube tu precio (blindaje), sin desplazamientos.

## 6. Cambios en la base de datos (borrador)

- `businesses`: `+ owner_id uuid → auth.users`, `+ status ('draft' | 'published')`, `+ slug`, `+ city`, `+ tagline`, `+ email_public`, `+ website`, `+ cover_url`, `+ maps_url`, `+ hours`; `position` pasa a `null` cuando cae del top 10.
- `bids`: `business_id` (existe, sin uso) pasa a **obligatorio**; `+ expires_at`; `status` gana `expired`, `outbid`, `refunded`.
- `settle_bid`: cerrojo por posición, revalidación de precio, **update** del negocio existente (mover) en vez de insert.
- Nueva función `current_floor(position)`: máximo entre precio publicado y reserva viva más alta.
- RLS: dueño lee/edita solo su negocio; público lee solo `published`; Storage por dueño.
- Job de limpieza: reservas caducadas → `expired` (cron de Supabase o al consultar).

## 7. Plan de entrega (3 PRs)

| PR | Contenido | Depende de |
|---|---|---|
| **A. Cuenta y perfil** | Supabase Auth, registro/login, `/mi-negocio` con formulario, migración de columnas y RLS, admin ve borradores | Fase 1 mergeada |
| **B. Imágenes y anuncio** | Storage, subida con recorte, vista previa en vivo, tarjeta con logo, anuncio grande (hover/acordeón), `next/image` | A |
| **C. Pago ligado al negocio** | Reservas + Realtime + contador, checkout con `409`, `settle_bid` nuevo (cerrojo, revalidación, mover), reembolso automático, emails, exclusión de OXXO | A (B no es necesario) |

## Decisiones que necesitamos de ti

1. **Anuncio grande**: ¿para todos los del ranking, solo el **top 3**, o solo **EL N1**? Hacerlo privilegio del top es un incentivo real para pagar más, y es la mecánica que el sitio vende.
2. **Reembolso automático** cuando una oferta llega tarde — ¿de acuerdo? La alternativa ("te asigno la mejor posición que alcance tu dinero") es confusa: eligió #1 y aparece #4.
3. **Excluir OXXO / efectivo** como método de pago. Sin esto la ventana de 5 minutos no funciona.
4. **Qué pasa con el perfil público de un negocio que cae del top 10**: ¿sigue accesible por URL directa (propuesta) o se oculta hasta que vuelva a pagar?

---

*Relacionado: `PROPUESTA-MEJORAS.md` (rama `propuesta-mejoras`) y código de la Fase 1 (rama `fase-1-estabilizar`).*
