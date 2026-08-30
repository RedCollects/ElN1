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
  aceptar solo ocupadas o `max+1`.
- Modal de posiciones (`app/Ranking.tsx`): mostrar ocupadas + una libre en
  vez de 50 casillas.
- `/como-funciona` y `/terminos`: reglas nuevas + nota de IVA/factura.
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

## 5. Decisiones que necesitamos de ti

1. ¿De acuerdo con **recorrer** (nadie sale salvo el #50) en vez de sacar al
   superado?
2. ¿De acuerdo con que el precio de superación sea **el máximo hacia abajo**
   (precios siempre ordenados) y no solo lo que pagó ese ocupante?
3. ¿Aceptas que la reserva sea sobre un **número** aunque el ranking se
   recorra durante los 5 minutos?
4. Con base plana de $100, ser #1 y entrar de último cuestan casi lo mismo
   al principio ($110 vs $100). ¿Está bien así (barrera baja) o quieres un
   escalón mayor para el top 3?
