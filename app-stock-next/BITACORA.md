# Bitácora: app de stock (Next.js)

## 2026-10-20: primera versión

**Pedido:** una versión de `app-stock` en Next.js, en una carpeta aparte, con datos inventados.

**Decisiones**
- Mismas tres pantallas y mismas reglas que la versión de Google: stock por especie y tamaño,
  mínimo por especie, Entrada / Salida / Ajuste, no deja sacar más de lo que hay.
- Datos en un archivo JSON (`data/stock.json`) en lugar de una base de datos: no requiere instalar ni
  configurar nada más. Se guarda de a un cambio por vez para no pisar datos.
- Datos inventados con una semilla fija (`lib/datos-inventados.ts`): siempre se generan los mismos.
- Sin librerías de estilos: CSS simple, igual al de la versión de Google.

**Qué se hizo**
- Proyecto armado a mano (sin `create-next-app`) con Next.js 15, React 19 y TypeScript.

## 2026-10-20: instalación y prueba

- Se instaló **Node.js 24.20.0 (LTS)** con winget. Next.js quedó en la versión 15.5.28.
- `npm run build` compila sin errores ni advertencias.
- Probado en el navegador en tamaño celular: stock con los datos inventados (23 especies, 127 movimientos,
  2 especies bajo el mínimo), salida rechazada por falta de stock, salida correcta que actualiza el stock al
  instante, y la lista de últimos movimientos.

**Errores encontrados y corregidos**
- Después de guardar, React reiniciaba por dentro el tipo de movimiento a "Entrada", aunque en pantalla siguiera
  resaltado otro. El siguiente guardado se habría registrado con el tipo equivocado. Ahora el tipo se elige
  con botones y viaja en un campo oculto.
- Los tamaños de cada especie aparecían en desorden: ahora siguen el orden de la lista (de chico a grande).
- En el celu, la tabla de últimos movimientos cortaba la cantidad: ahora achica la letra y esconde la columna
  Responsable en pantallas chicas.

**Pendiente**
- [ ] Más adelante: publicarla en internet y pasar los datos a una base de datos online para usarla desde el celu.
