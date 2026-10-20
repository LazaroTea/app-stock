# App de stock del vivero: versión Next.js

Versión paralela de `../app-stock` hecha con **Next.js**, una herramienta para armar aplicaciones web con código propio.
Hace lo mismo que la versión de Google (Stock, Cargar, Últimos), pero corre en una computadora
y guarda los datos en un archivo, no en Google Sheets.

> **Los datos son inventados.** 23 especies nativas reales con stocks mínimos, tamaños y 127
> movimientos entre julio y octubre de 2026, generados al azar. Sirven solo para probar.

## Qué hace falta

- **Node.js** (versión LTS) instalado: https://nodejs.org (en esta compu ya está: versión 24.20.0)

## Cómo abrirla

En una terminal, dentro de esta carpeta:

```bash
npm install
```

(solo la primera vez: descarga las librerías en `node_modules/`)

```bash
npm run dev
```

y abrí http://localhost:3000 en el navegador. Para cortarla: `Ctrl+C` en la terminal.

## Archivos

| Archivo | Qué es |
|---|---|
| `app/page.tsx` + `app/ListaStock.tsx` | Pantalla **Stock**: total por especie y por tamaño, buscador, aviso de mínimo. |
| `app/cargar/` | Pantalla **Cargar**: formulario de entradas, salidas y ajustes. |
| `app/ultimos/page.tsx` | Pantalla **Últimos**: los últimos 30 movimientos. |
| `app/acciones.ts` | Lo que pasa en el servidor al guardar un movimiento (validaciones incluidas). |
| `app/layout.tsx`, `app/Navegacion.tsx`, `app/globals.css` | Encabezado, pestañas y estilos. |
| `lib/stock.ts` | Cálculo del stock a partir de los movimientos. |
| `lib/almacen.ts` | Lee y guarda los datos en `data/stock.json`. |
| `lib/datos-inventados.ts` | Las especies y los movimientos de ejemplo. |
| `lib/tipos.ts` | La forma de los datos (especie, movimiento). |

## Los datos

- Se guardan en `data/stock.json`, que se crea solo la primera vez que se abre la app.
- **Para volver a los datos de ejemplo:** cortá la app, borrá `data/stock.json` y volvé a abrirla.
- Las especies y los tamaños se cambian en `lib/datos-inventados.ts` (y después se borra `data/stock.json`).

## Diferencias con la versión de Google

| | Google (`app-stock`) | Next.js (esta) |
|---|---|---|
| Dónde están los datos | Planilla de Google | Archivo en la compu |
| Usarla desde el celu | Sí, con el link | Solo si se publica en internet (todavía no) |
| Quién cargó cada cosa | Mail automático | Solo el campo Responsable |
| Personalización | Limitada | Total: es código propio |

Para usarla de verdad con varias personas habría que publicarla (por ejemplo en Vercel) y pasar los datos
a una base de datos online. Eso queda para más adelante.
