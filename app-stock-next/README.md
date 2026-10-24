# App de stock de Native: versión Next.js

Versión paralela de `../app-stock` hecha con **Next.js**, una herramienta para armar aplicaciones web con código propio.
Hace lo mismo que la versión de Google (Stock, Cargar, Últimos), pero se publica en **Vercel** y guarda
los datos en una base de datos **Neon** (Postgres) en internet.

El stock se lleva **por depósito** (Benavidez, Pilar y Goya) y, dentro de cada uno, por **especie**,
**presentación** (Envasado, Maceta o Raíz desnuda) y **tamaño** (la lista de la planilla de cotizaciones del
vivero: 6-8, 12-14, 3Lts, Ejemplar, etc.). El stock se mueve con **Movimientos** (de un punto de partida a
uno de llegada) y **Ajustes**. Palma Sola, proveedores y clientes no llevan stock: son puntos de partida o de
llegada.

> **El stock arranca en cero** (2026-10-23). Las especies son reales: 179 en total (ver `lib/especies.ts`):
> 130 árboles y arbustos nativos de Argentina, 21 palmeras (7 nativas, 13 exóticas y la cica) y 28 frutales
> (olivo, cítricos, carozo, pepita y otros). No es un listado oficial: SENASA no publica uno de especies nativas.
>
> **Palmeras, frutales y SENASA:** la Resolución SENASA 64/2026 incluye a todas las palmeras (y a la cica) y a
> varios frutales (cítricos, carozo, pepita, palta, banano, vid, olivo, kiwi) en su listado de especies
> priorizadas. Se pueden comerciar, pero el vivero tiene que estar inscripto en el RENFO y cumplir los
> requisitos sanitarios de esa resolución. En la app aparecen con la etiqueta **Palmera** o **Frutal**.

> **Atención: la app no tiene contraseña.** Cualquiera que tenga el link de Vercel puede ver el stock
> y cargar movimientos. No compartas el link hasta que sumemos el inicio de sesión.

## Qué hace falta

- **Node.js** (versión LTS) instalado: https://nodejs.org (en esta compu ya está: versión 24.20.0)
- El archivo **`.env.local`** en esta carpeta, con la conexión a la base (`DATABASE_URL=...`).
  Tiene la contraseña de la base: **nunca se sube a GitHub** (Git lo ignora).

## Cómo abrirla

En una terminal, dentro de esta carpeta:

```bash
npm.cmd install
```

(solo la primera vez: descarga las librerías en `node_modules/`)

```bash
npm.cmd run dev
```

y abrí http://localhost:3000 en el navegador. Para cortarla: `Ctrl+C` en la terminal.

**Ojo:** en la compu la app usa la misma base que la publicada en Vercel. Lo que cargues probando
queda en los datos reales.

> **¿Por qué `npm.cmd` y no `npm`?** En Windows, PowerShell bloquea `npm` porque es un script
> ("la ejecución de scripts está deshabilitada"). `npm.cmd` hace lo mismo sin ese bloqueo.
>
> **¿Aparece "404" o la página sin colores?** Cortá la app, borrá la carpeta `.next` y volvé a abrirla.
> Pasa cuando quedaron restos de una compilación (`npm.cmd run build`).

## Estética

Usa la identidad de la marca Native (de nativetrees.com.ar y de los presupuestos):

- **Colores:** verde oliva `#646945` (principal), `#505437` (oscuro), `#7f8463` (encabezados de tabla,
  como en los presupuestos), salvia `#b8bca6`, y crema `#f9f1d9` (el color del logo).
- **Tipografías:** Montserrat para títulos, botones y números; Raleway para el texto. Se cargan desde
  Google Fonts al compilar.
- **Logo:** `public/logo-native.png` (el de la web, en crema, sobre el encabezado verde) y
  `public/icono-native.png` (el árbol solo). El ícono de la pestaña del navegador es `app/icon.svg`.
- En la compu, el encabezado muestra el lema "Movemos naturaleza. Creamos paisaje".

Los colores están todos juntos al principio de `app/globals.css`: para cambiar uno, se cambia ahí.

## Cómo se usa

- **Stock:** arriba se elige qué ver: **Todos** (los tres depósitos sumados) o un depósito. Cada especie
  muestra su total y el detalle por presentación y tamaño (ej. "Raíz desnuda · 12-14: 7"); con "Todos",
  también cuánto hay en cada depósito ("Pilar: −2 · Goya: 6"). Los números en negativo salen en rojo.
  Hay tres números: total de plantas, especies con stock y especies bajo el mínimo (tocándolo se ven solo
  esas). De entrada se ven solo las especies **con stock**; con los filtros se elige una **región** o se ven
  **todas**, y se puede ver **solo árboles**, **solo palmeras** o **solo frutales**. Al buscar por nombre
  aparecen también las que no tienen stock.
- **Cargar** (en formato **remito**):
  1. **Datos del remito:** tipo (**Movimiento** o **Ajuste**), los lugares, fecha, responsable,
     **destinatario** (opcional: persona o contacto que recibe) y observaciones.

     | Tipo | Punto de partida | Punto de llegada | Qué hace con el stock |
     |---|---|---|---|
     | **Movimiento** | Palma Sola, Goya, Pilar, Benavidez o Proveedor | Palma Sola, Goya, Pilar, Benavidez, Proveedor o Cliente | Resta en el depósito de partida y suma en el de llegada |
     | **Ajuste** | — | Depósito (Goya, Pilar o Benavidez) | Suma o resta (cantidad con signo) |

     Solo Goya, Pilar y Benavidez llevan stock. Por ejemplo: Proveedor → Goya suma en Goya; Goya → Pilar resta
     en Goya y suma en Pilar; Pilar → Cliente o Pilar → Palma Sola resta en Pilar. El punto de partida o el de
     llegada tiene que ser un depósito, y no pueden ser el mismo depósito.

     Si se elige Proveedor o Cliente, aparece un renglón para escribir cuál (se sugieren los ya usados).
     Los depósitos y lugares están en `lib/stock.ts` (`DEPOSITOS`, `PARTIDAS`, `LLEGADAS`).
  2. **Sumar plantas:** especie, presentación (botones), tamaño (desplegable) y cantidad, y el botón
     **+ Sumar** (o Enter). Cada planta sumada aparece en el remito, al costado en la compu y abajo en el celu.
     Si se suma algo que ya está (misma especie, presentación y tamaño), se juntan las cantidades.
     Con la ✕ se quita una línea.
  3. **Guardar movimiento:** guarda todo el remito junto y le pone un número (000001, 000002…).
     **No se limita por el stock:** se puede sacar más de lo que hay; el depósito queda en negativo y el remito
     solo avisa ("Pilar queda en −2").

  El tamaño no viene elegido de entrada, para que no se sume uno por descuido. Si se elige **Especificar**,
  aparece un renglón para escribir el tamaño a mano (ej. "5 m de altura"); los ya escritos se sugieren para
  que se escriban siempre igual. Cada tamaño escrito lleva su propio stock.

  La presentación que viene elegida es **Envasado** (el orden es Envasado, Maceta, Raíz desnuda).

  El remito a medio armar se guarda en el navegador: si se cierra la página, al volver sigue ahí.
- **Imprimir o descargar el remito (PDF):** al guardar aparece el enlace **Imprimir o descargar PDF**
  (también desde el número de remito en Últimos). Abre el remito con el formato de los presupuestos de Native
  (logo, datos de la empresa, tabla, observaciones debajo del detalle, total y lugar para las firmas) y el
  botón **Imprimir / Guardar PDF**:
  en la ventana de impresión se elige la impresora o **Guardar como PDF**. Los datos de la empresa que
  aparecen se cambian en `lib/empresa.ts`. Dice "Remito interno… no válido como factura", porque no es un
  remito fiscal.
- **Modificar un remito:** en la página del remito, el botón **Modificar** abre Cargar con todos sus datos y
  líneas (con el aviso "Estás modificando el remito N.º…"). Al tocar **Guardar cambios** se reemplazan sus
  datos y líneas, el stock se recalcula y el número no cambia. Queda anotado cuándo se modificó por última vez.
- **Anular un remito:** en la página del remito, el botón **Anular** pide el motivo y confirma. El remito no se
  borra: queda con su número, el motivo, la fecha y la marca **ANULADO** (también al imprimir), y sus plantas
  dejan de contar en el stock. Un remito anulado ya no se puede modificar, y no se puede "desanular" desde la app.
- **Quién puede modificar o anular:** por ahora todos. Cuando haya usuarios, se va a restringir en
  `lib/permisos.ts` (la pantalla oculta los botones y el servidor rechaza el pedido).
- **Últimos:** los últimos 30 movimientos: cada fila es lo que suma (+) o resta (−) en un depósito, con su
  número de remito (un movimiento entre dos depósitos aparece dos veces, una por depósito). Tocando el número
  se abre el remito, para verlo, imprimirlo, modificarlo o anularlo. Los de remitos anulados se ven tachados.

| Pantalla | Cómo se acomoda |
|---|---|
| Celu (hasta 639 px de ancho) | Pestañas abajo, al alcance del pulgar. Una tarjeta por fila. |
| Tablet (640 a 1023 px) | Pestañas arriba, en el encabezado. Dos tarjetas por fila. |
| Compu (1024 px o más) | Tres tarjetas por fila. En **Cargar**, el remito se arma al costado, siempre a la vista. |

## Archivos

| Archivo | Qué es |
|---|---|
| `app/page.tsx` + `app/ListaStock.tsx` | Pantalla **Stock**: total por especie, presentación y tamaño, buscador y filtros. |
| `app/cargar/` | Pantalla **Cargar**: el remito (datos, sumar plantas y guardar). |
| `app/remitos/[numero]/` | Un remito guardado: imprimir o guardar como PDF, modificar y anular. |
| `lib/permisos.ts` | Quién puede modificar y anular remitos (por ahora, todos). |
| `lib/empresa.ts` | Los datos de Native que salen en el remito impreso. |
| `app/not-found.tsx` | Lo que se ve si se entra a algo que no existe. |
| `app/ultimos/page.tsx` | Pantalla **Últimos**: los últimos 30 movimientos. |
| `app/acciones.ts` | Lo que pasa en el servidor al guardar un remito (revisa cada línea otra vez). |
| `app/layout.tsx`, `app/Navegacion.tsx` | Encabezado y pestañas. |
| `app/globals.css` | Colores de la marca, estilos y cómo se acomoda en celu, tablet y compu. |
| `public/`, `app/icon.svg` | Logo de Native (crema para la app, verde para el remito impreso) y el ícono de la pestaña. |
| `lib/stock.ts` | Reglas del stock (las salidas restan, etc.) y ayudas para la pantalla. |
| `lib/almacen.ts` | Lee y guarda los datos en la base Neon. Crea las tablas la primera vez. Tiene las listas iniciales de presentaciones y tamaños. |
| `lib/especies.ts` | El listado de las 179 especies (árboles nativos, palmeras y frutales), con su región y grupo. |
| `lib/tipos.ts` | La forma de los datos (especie, movimiento). |
| `scripts/cargar-especies.ts` | Agrega a la base las especies del listado que falten. |
| `.env.local` | La conexión a la base (solo en tu compu, no está en GitHub). |

## Los datos (base Neon)

Hay cinco tablas:

- **especies**: código, nombre común, nombre científico, región (o "Exótica"), grupo (Árbol, Palmera o
  Frutal), stock mínimo.
- **presentaciones**: Envasado, Maceta, Raíz desnuda (y su orden; la primera viene elegida al cargar).
- **tamanos**: los tamaños y su orden.
- **remitos**: número (`id`), fecha, tipo (Movimiento o Ajuste), punto de partida (`procedencia`) y de llegada
  (`destino`), con `procedencia_detalle` y `destino_detalle` para el nombre del proveedor o cliente (en los
  ajustes, el depósito va en `destino`), destinatario, responsable y observaciones, y si está anulado
  (`anulado`, `anulado_motivo`, `anulado_en`) o cuándo se modificó (`modificado_en`).
- **movimientos**: lo que cada línea de remito suma (+) o resta (−) en un **depósito** (`deposito`), con su
  especie, presentación, tamaño (y en `tamano_detalle`, lo escrito a mano con "Especificar"), el número de
  remito (`remito_id`) y el número de línea (`linea`). Un movimiento entre dos depósitos genera dos filas por
  línea: −N en el de partida y +N en el de llegada.

El stock no se guarda: la base lo calcula sumando los movimientos de cada depósito.

- La primera vez que se abre la app, crea las tablas y carga especies, presentaciones y tamaños. Solo lo hace
  si están **vacías**: nunca pisa datos que ya existen.
- Las tablas se pueden ver y editar desde el panel de Neon (**Tables**). Por ejemplo, para cargar el
  stock mínimo de una especie, o para **agregar un tamaño** (fila nueva en `tamanos`, con un número de
  `orden` para ubicarlo en la lista).
- Un remito se guarda (o se modifica) entero o no se guarda: nunca queda a medias. Los remitos anulados no
  cuentan en el stock.

### Agregar o corregir especies

1. Editá `lib/especies.ts`: una línea por especie, con `arbol(...)`, `palmera(...)` o `frutal(...)` (código, nombre común,
   nombre científico, región y, si querés, stock mínimo). El código tiene que ser único.
2. En una terminal, dentro de esta carpeta:

   ```bash
   npm.cmd run cargar-especies
   ```

   Agrega a la base las especies nuevas y corrige el grupo (Árbol o Palmera) de las que ya estaban. Lo demás no se toca (para corregir una que ya existe,
   editala desde el panel de Neon). Se puede correr las veces que quieras: no duplica nada.

## Publicarla en Vercel

1. En Vercel, el proyecto tiene que estar conectado al repositorio de GitHub y en
   **Settings → Build and Deployment → Root Directory** tiene que decir `app-stock-next`.
2. La base tiene que estar conectada al proyecto: **Storage → Neon**. Así Vercel carga sola la variable
   `DATABASE_URL`, sin copiarla a mano. Para revisarlo: **Settings → Environment Variables**.
3. Cada vez que se sube un cambio a GitHub, Vercel vuelve a publicar la app solo.

## Diferencias con la versión de Google

| | Google (`app-stock`) | Next.js (esta) |
|---|---|---|
| Dónde están los datos | Planilla de Google | Base de datos Neon |
| Cómo se lleva el stock | Especie y tamaño | Especie, presentación y tamaño |
| Usarla desde el celu | Sí, con el link | Sí, con el link de Vercel |
| Quién puede usarla | Solo quien tiene acceso a la planilla | Cualquiera con el link (por ahora) |
| Quién cargó cada cosa | Mail automático | Solo el campo Responsable |
| Personalización | Limitada | Total: es código propio |
