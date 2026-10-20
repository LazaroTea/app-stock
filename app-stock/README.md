# App de stock del vivero

Control de stock de árboles nativos de Argentina. Se usa desde la compu y el celu con un link.
Los datos se guardan en una planilla de Google Sheets; la app es un script de Google Apps Script pegado a esa planilla.

## Archivos

| Archivo | Qué es |
|---|---|
| `Codigo.gs` | La lógica: lee y escribe la planilla, calcula el stock y valida los movimientos. |
| `Index.html` | La pantalla de la app (Stock, Cargar, Últimos). |
| `INSTRUCCIONES.md` | Paso a paso para instalarla y publicarla en Google. |
| `BITACORA.md` | Qué se hizo, cuándo y por qué, y qué queda pendiente. |

## Cómo está organizada la planilla

- **Especies**: código, nombre común, nombre científico, stock mínimo (para el total de la especie).
- **Tamaños**: los tamaños de envase que usa el vivero.
- **Movimientos**: cada entrada, salida o ajuste, con fecha, especie, tamaño, cantidad, responsable,
  observaciones, mail de quién lo cargó y momento en que se registró.

El stock no se escribe a mano: se calcula sumando los movimientos, por especie y por tamaño.

## Importante

Los archivos de esta carpeta son la copia de trabajo. Lo que corre de verdad es lo que está pegado en el
editor de Apps Script de la planilla: cada vez que cambia `Codigo.gs` o `Index.html` hay que volver a pegarlo
y publicar una versión nueva (ver el final de `INSTRUCCIONES.md`).
