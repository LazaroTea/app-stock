# App de stock del vivero: versión Next.js

Versión paralela de `../app-stock` hecha con **Next.js**, una herramienta para armar aplicaciones web con código propio.
Hace lo mismo que la versión de Google (Stock, Cargar, Últimos), pero se publica en **Vercel** y guarda
los datos en una base de datos **Neon** (Postgres) en internet.

El stock se lleva por **especie**, **presentación** (Maceta, Raíz desnuda o Envasado) y **tamaño**
(la lista de la planilla de cotizaciones del vivero: 6-8, 12-14, 3Lts, Ejemplar, etc.).

> **El stock arranca en cero.** Las especies son reales: 133 árboles y arbustos nativos de Argentina, con su
> región (ver `lib/especies-nativas.ts`). No es un listado oficial: SENASA no publica uno de especies nativas.

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

## Cómo se usa

- **Stock:** cada especie muestra su total y el detalle por presentación y tamaño (ej. "Raíz desnuda · 12-14RD: 7").
  Arriba hay tres números: total de plantas, especies con stock y especies bajo el mínimo (tocándolo se ven
  solo esas). De entrada se ven solo las especies **con stock**; con los filtros se elige una **región** o
  se ven **todas**. Al buscar por nombre aparecen también las que no tienen stock.
- **Cargar:** tipo de movimiento, especie, presentación (botones), tamaño (desplegable), cantidad y fecha.
  El tamaño no viene elegido de entrada, para que no se guarde uno por descuido.
- **Últimos:** los últimos 30 movimientos.

| Pantalla | Cómo se acomoda |
|---|---|
| Celu (hasta 639 px de ancho) | Pestañas abajo, al alcance del pulgar. Una tarjeta por fila. |
| Tablet (640 a 1023 px) | Pestañas arriba, en el encabezado. Dos tarjetas por fila. |
| Compu (1024 px o más) | Tres tarjetas por fila. En **Cargar**, un panel al costado muestra el stock de la especie elegida. |

## Archivos

| Archivo | Qué es |
|---|---|
| `app/page.tsx` + `app/ListaStock.tsx` | Pantalla **Stock**: total por especie, presentación y tamaño, buscador y filtros. |
| `app/cargar/` | Pantalla **Cargar**: formulario de entradas, salidas y ajustes. |
| `app/ultimos/page.tsx` | Pantalla **Últimos**: los últimos 30 movimientos. |
| `app/acciones.ts` | Lo que pasa en el servidor al guardar un movimiento (validaciones incluidas). |
| `app/layout.tsx`, `app/Navegacion.tsx` | Encabezado y pestañas. |
| `app/globals.css` | Estilos y cómo se acomoda en celu, tablet y compu. |
| `lib/stock.ts` | Reglas del stock (las salidas restan, etc.) y ayudas para la pantalla. |
| `lib/almacen.ts` | Lee y guarda los datos en la base Neon. Crea las tablas la primera vez. Tiene las listas iniciales de presentaciones y tamaños. |
| `lib/especies-nativas.ts` | El listado de las 133 especies nativas, con su región. |
| `lib/tipos.ts` | La forma de los datos (especie, movimiento). |
| `scripts/cargar-especies.ts` | Agrega a la base las especies del listado que falten. |
| `.env.local` | La conexión a la base (solo en tu compu, no está en GitHub). |

## Los datos (base Neon)

Hay cuatro tablas:

- **especies**: código, nombre común, nombre científico, región, stock mínimo.
- **presentaciones**: Maceta, Raíz desnuda, Envasado (y su orden).
- **tamanos**: los tamaños y su orden.
- **movimientos**: cada entrada, salida o ajuste, con su presentación y tamaño.

El stock no se guarda: la base lo calcula sumando los movimientos.

- La primera vez que se abre la app, crea las tablas y carga especies, presentaciones y tamaños. Solo lo hace
  si están **vacías**: nunca pisa datos que ya existen.
- Las tablas se pueden ver y editar desde el panel de Neon (**Tables**). Por ejemplo, para cargar el
  stock mínimo de una especie, o para **agregar un tamaño** (fila nueva en `tamanos`, con un número de
  `orden` para ubicarlo en la lista).
- Si dos personas guardan al mismo tiempo, la base las atiende de a una, así nadie deja el stock negativo.

### Agregar o corregir especies

1. Editá `lib/especies-nativas.ts`: una línea por especie (código, nombre común, nombre científico,
   región y, si querés, stock mínimo). El código tiene que ser único.
2. En una terminal, dentro de esta carpeta:

   ```bash
   npm.cmd run cargar-especies
   ```

   Agrega a la base las especies nuevas. Las que ya estaban no se tocan (para corregir una que ya existe,
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
