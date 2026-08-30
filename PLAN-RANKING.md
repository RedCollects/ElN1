# Plan: modelo secuencial del ranking — EL N1

*Borrador del 2026-08-30 para aprobación del primer dev antes de tocar código.*

## ⚡ Resumen en 30 segundos

Hoy las 50 posiciones se venden desde el inicio con precios decrecientes
(#1 $100 … #10 $10, y $10 hasta el #50), con huecos permitidos. Proponemos
un **ranking secuencial**: solo se vende **el siguiente lugar libre a $100**
o **superar a uno ocupado al 110 %**. Sin huecos, precios siempre
ordenados, y las compras de entrada nunca chocan entre sí. Las reservas de
5 minutos, la revalidación de precio y el reembolso automático siguen igual.

**Lo que te pedimos:** tu OK a las reglas de la sección 2 y a las 4 decisiones
del final.

---

## 1. Decisiones ya tomadas (2026-08-30)

| Tema | Decisión |
|---|---|
| Anuncio grande (tarjeta expandible) | Solo **top 3** (rama `ranking/anuncio-top-3`, un cambio de constante) |
| Quien cae del #50 | Queda **publicado sin posición**, accesible por URL (ya implementado) |
| Historial en `/admin` | **Sí**: tabla de ofertas (pagadas, pendientes, superadas, reembolsadas) |
| Caducidad de la posición | **No caduca**: se conserva hasta que alguien la supere |
| IVA | El precio mostrado y cobrado es el total ($100). Si el negocio pide factura, se agrega el IVA aparte, fuera de la plataforma |

## 2. Reglas del modelo secuencial

1. **Entrada.** Con N negocios en el ranking, la única posición libre que se
   vende es la **#N+1**, a precio base **$100**. No hay huecos: el ranking
   siempre es 1..N.
2. **Superar.** Cualquier posición ocupada #k se puede comprar pagando al
   menos `ceil(1.1 × P(k))`, donde **P(k) = el máximo pagado del #k hacia
   abajo** (no solo lo que pagó el #k). Con esto subir siempre cuesta más
   que quedarse abajo y los precios quedan ordenados.
3. **Recorrer, no sacar.** Quien compra #k entra ahí; el ocupante y todos
   los de abajo bajan **un** lugar. Nadie pierde su lugar en el ranking
   salvo el #50, que sale con su perfil visible.
4. **Subir de posición.** Si un negocio en #j compra #k (k < j), se recorren
   solo #k..#j-1 y la #j queda libre → los de abajo **suben un lugar**
   (compactar). Hoy no se compacta; es lo que hay que añadir.
5. **Blindar.** Comprar la posición propia solo sube su precio (ya existe).
6. **Se compra un número, no un rival.** Si durante una reserva de 5 min
   otro pago recorre el ranking, la reserva sigue apuntando al mismo
   **número**; al confirmar se revalida el precio contra el ocupante actual.
7. **Reservas.** Igual que hoy: la reserva fija el piso (quien quiera esa
   posición mientras esté viva debe ofrecer 110 % de la reserva); al
   confirmar se revalida; si no alcanza → reembolso automático.
8. **Sin caducidad.** Una posición pagada no vence.
9. **Monto libre.** El mínimo es el piso; el comprador puede pagar más
   (hasta un tope, p. ej. $50,000 por límites de Mercado Pago). Pagar más
   encarece superarlo: quien pone $1,000 por el #1 solo sale cuando alguien
   pague $1,100.
10. **Ranking en vivo.** Portada y modal se actualizan solos (Supabase
    Realtime sobre `businesses` y `bids`, polling de 5 s como respaldo). Si
    durante una reserva cambia el ocupante o el precio de la posición
    reservada, el modal muestra una alerta con el ranking nuevo y botones
    **Continuar** / **Cancelar** / **Reservar de nuevo a $Z** (si el monto
    ya no alcanza).

### Tablas de ejemplo

**Pagó** = lo que pagó el ocupante. **Superar** = `ceil(1.1 × máximo pagado
desde esa posición hacia abajo)`.

Arranque secuencial:

| Paso | #1 | #2 | #3 | Libre |
|---|---|---|---|---|
| Vacío | — | — | — | #1 a $100 |
| A compra #1 por $100 | A 100 · superar 110 | — | — | #2 a $100 |
| B compra #2 por $100 | A 100 · superar 110 | B 100 · superar 110 | — | #3 a $100 |
| C compra #3 por $100 | A 100 · superar 110 | B 100 · superar 110 | C 100 · superar 110 | #4 a $100 |

Superar al #1 y al #2 cuesta lo mismo: es intencional. A precio igual todos
escogen la de arriba, y eso empuja el #1 solo. (Alternativa descartada:
escalón fijo de $10 entre posiciones — más "bonito", más difícil de explicar.)

Monto libre — alguien pone $1,000:

| Paso | #1 | #2 | #3 | #4 |
|---|---|---|---|---|
| Inicio | A 100 · sup 110 | B 100 · sup 110 | C 100 · sup 110 | libre $100 |
| D paga $1,000 por #1 | D 1000 · sup 1100 | A 100 · sup 110 | B 100 · sup 110 | C 100 · sup 110 |
| E paga $110 por #2 | D 1000 · sup 1100 | E 110 · sup 121 | A 100 · sup 110 | B 100 · sup 110 |

Por qué "máximo hacia abajo" y no "lo que pagó el ocupante":

| Paso | #1 | #2 | #3 |
|---|---|---|---|
| Inicio | A 100 | B 100 | — |
| C paga $500 por #2 | A 100 | C 500 | B 100 |
| Superar al #1 con "lo que pagó" | $110 — absurdo: C pagó $500 por estar debajo de alguien que se quita con $110 | | |
| Superar al #1 con "máximo hacia abajo" | $550 ✅ | sup 550 | sup 110 |

### Ejemplo

```
Ranking: #1 $121 · #2 $100 · #3 $100 · #4 $100          (libre: #5 a $100)
Ana supera al #2 pagando $110:
Ranking: #1 $121 · #2 Ana $110 · #3 $100 · #4 $100 · #5 $100 (libre: #6)
Superar a Ana cuesta $121; superar al #1 cuesta ceil(121×1.1) = $134.
```

## 3. Casos límite (todos cubiertos por las reglas)

| Caso | Qué pasa |
|---|---|
| Dos personas pagan por "entrar" a la vez | No compiten: la primera en confirmarse es #N+1, la segunda #N+2. Sin reembolso |
| Dos superan al mismo #k a la vez | La reserva del primero sube el piso del segundo; el que confirme sin alcanzar el precio se reembolsa (ya funciona) |
| Reserva sobre #k y el ranking se recorre antes de confirmar | Se conserva el número; se revalida el precio contra quien esté en #k (regla 6) |
| Dueño compra su propia posición | Solo sube su precio (regla 5) |
| Dueño sube de #7 a #3 | Se recorren #3–#6; #7 se compacta (regla 4) |
| Cae del #50 | Perfil publicado sin posición; vuelve comprando #N+1 o superando a alguien |
| Ranking vacío | Solo se vende el #1 a $100 |
| Ranking lleno (50) | Solo se vende superando; el #50 sale |

## 4. Cambios técnicos

### 4.1 Base de datos — migración `009_sequential_ranking.sql`

- `settle_bid`: (a) si la posición pedida está libre, exigir que sea
  exactamente `max(position)+1` (si no, asignar `max+1`: es una entrada y no
  importa el número); (b) `required = ceil(1.1 × max(current_price) where
  position >= target)`; (c) compactar tras mover un negocio hacia arriba.
- `position_state` (la vista/función que alimenta el modal y las reservas):
  devolver solo posiciones ocupadas + la siguiente libre, con el precio
  mínimo según la regla 2.
- Nada cambia en `bids`, reservas, `expire_bids` ni el webhook.

### 4.2 Código

- `lib/prices.ts`: `getInitialPrice` → $100 plano; `getMinimumOffer(position,
  prices[])` con el máximo hacia abajo. Tests actualizados.
- `app/api/checkout/route.ts`: validar contra `position_state` (ya lo hace);
  aceptar solo ocupadas o `max+1`; aceptar `amount` libre `>= mínimo` y
  `<= tope` (hoy cobra exactamente el mínimo).
- Modal de posiciones (`app/Ranking.tsx`): mostrar ocupadas + una libre en
  vez de 50 casillas; campo de monto con el mínimo prellenado.
- Ranking en vivo: suscripción Realtime (`lib/supabase-public.ts` en el
  cliente, tablas `businesses` y `bids` con RLS de solo lectura) + polling
  de respaldo; alerta en el modal cuando cambia la posición reservada.
- `/como-funciona` y `/terminos`: reglas nuevas + nota de IVA/factura.
  **Regla permanente:** cada PR que cambie precios, posiciones, reservas o
  anuncio grande debe actualizar `/como-funciona` en el mismo PR (los textos
  leen las constantes de `lib/prices.ts` y `lib/business.ts`, pero las
  reglas escritas hay que revisarlas a mano).
- `/admin`: tabla de historial de ofertas (Server Action, sin endpoint).

### 4.3 Verificación

- Vitest para `prices.ts` (monotonía, base plana, máximo hacia abajo).
- Escenarios SQL en local (los 7 actuales + entrada simultánea, subir con
  compactación, ranking lleno).
- Prueba manual del modal y del checkout con reserva viva.

### 4.4 Orden

1. `ranking/anuncio-top-3` (ya subida, independiente).
2. `ranking/modelo-secuencial` (migración 009 + prices + checkout + modal +
   textos) — un solo PR, ~1 día.
3. `ranking/historial-admin` — PR aparte, pequeño.

Si las ramas `calidad/*` entran antes, el PR 2 se apila sobre ellas para
aprovechar los tests y CI.

## 5. Decisiones (respondidas por el segundo dev el 2026-08-30)

1. Recorrer, no sacar → **sí**.
2. Precio de superación = máximo hacia abajo, empates permitidos → **sí**,
   y además **monto libre** (regla 9).
3. Reserva sobre un número → **sí**, con **ranking en vivo y alerta** en el
   modal (regla 10).
4. Base plana $100 sin escalón para el top → **sí**: para que se abra el
   último puesto ya se compraron todos los demás.

Plan **aprobado por el segundo dev el 2026-08-30**; se implementa en `ranking/modelo-secuencial`.
