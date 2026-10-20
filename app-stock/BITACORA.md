# Bitácora: app de stock

## 2026-10-20: primera versión

**Contexto** (de la charla previa en claude.ai): vivero de árboles nativos, inscripto en SENASA. Hoy no llevan
el stock. Lo usarán varias personas desde la compu y el celu. Usuario principiante en programación.

**Decisiones**
- Datos en **Google Sheets** con una app de **Apps Script**: gratis, sin servidor, funciona en compu y celu,
  y la planilla sirve de respaldo y para consultar directo.
- Stock **por especie y tamaño** (no por lote). Alrededor de 50 a 200 especies.
- Stock mínimo **por especie** (total de todos los tamaños).
- Tres tipos de movimiento: Entrada, Salida y Ajuste (este último con signo).
- La app se publica como "usuario que accede": solo la usan quienes tienen acceso a la planilla y queda
  registrado el mail de quién carga cada movimiento.

**Qué se hizo**
- `Codigo.gs`, `Index.html` e `INSTRUCCIONES.md`.
- Validaciones: no deja sacar más de lo que hay; cantidades enteras; especie y tamaño tienen que existir;
  los textos que empiezan con `=` se guardan como texto y no como fórmula.
- Probado en el navegador con una planilla simulada (no con Google real): cálculo del stock, salida
  rechazada por falta de stock, ajuste negativo y vista en tamaño celular. Se corrigió que el tamaño elegido
  volvía al primero después de guardar.

**Pendiente**
- [ ] Instalarla en la cuenta de Google del vivero siguiendo `INSTRUCCIONES.md`.
- [ ] Cargar especies y tamaños reales.
- [ ] Confirmar qué datos de trazabilidad pide SENASA y si hay que agregar columnas.
- [ ] Ideas para la segunda etapa: mínimo por tamaño, botón de trasplante (cambio de tamaño en un solo paso),
      mejoras visuales.
