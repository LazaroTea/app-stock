// App de stock del vivero.
// Todos los datos viven en la planilla de Google a la que está pegado este script.
// El stock no se escribe a mano: se calcula sumando los movimientos.

const HOJAS = {
  especies: { nombre: 'Especies', columnas: ['Código', 'Nombre común', 'Nombre científico', 'Stock mínimo'] },
  tamanos: { nombre: 'Tamaños', columnas: ['Tamaño'] },
  movimientos: {
    nombre: 'Movimientos',
    columnas: ['Fecha', 'Tipo', 'Código', 'Especie', 'Tamaño', 'Cantidad', 'Responsable', 'Observaciones', 'Usuario', 'Registrado'],
  },
};

const TIPOS = ['Entrada', 'Salida', 'Ajuste'];

// Abre la app cuando alguien entra al link.
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Stock del vivero')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Ejecutar UNA vez desde el editor: crea las hojas con sus encabezados.
// Si las hojas ya existen, no toca nada.
function configurar() {
  const ss = SpreadsheetApp.getActive();
  Object.values(HOJAS).forEach(h => {
    const hoja = ss.getSheetByName(h.nombre) || ss.insertSheet(h.nombre);
    if (hoja.getLastRow() === 0) {
      hoja.appendRow(h.columnas);
      hoja.getRange(1, 1, 1, h.columnas.length).setFontWeight('bold');
      hoja.setFrozenRows(1);
    }
  });
  const tamanos = ss.getSheetByName(HOJAS.tamanos.nombre);
  if (tamanos.getLastRow() === 1) {
    tamanos.getRange(2, 1, 4, 1).setValues([['Maceta 1 L'], ['Maceta 3 L'], ['Maceta 10 L'], ['Envase 20 L']]);
  }
}

// Devuelve las filas de datos de una hoja (sin el encabezado).
function filas_(clave) {
  const h = HOJAS[clave];
  const hoja = SpreadsheetApp.getActive().getSheetByName(h.nombre);
  if (!hoja) throw new Error('Falta la hoja "' + h.nombre + '". Ejecutá la función configurar desde el editor.');
  const n = hoja.getLastRow() - 1;
  return n > 0 ? hoja.getRange(2, 1, n, h.columnas.length).getValues() : [];
}

// Las salidas restan, las entradas suman y los ajustes van con su signo (+ o -).
function cantidadConSigno_(tipo, cantidad) {
  if (tipo === 'Salida') return -Math.abs(cantidad);
  if (tipo === 'Entrada') return Math.abs(cantidad);
  return cantidad;
}

// Arma { código: { tamaño: cantidad } } a partir de todos los movimientos.
function calcularStock_(movimientos) {
  const stock = {};
  movimientos.forEach(m => {
    const tipo = m[1], codigo = String(m[2]), tamano = String(m[4]);
    if (!codigo || !tamano) return;
    stock[codigo] = stock[codigo] || {};
    stock[codigo][tamano] = (stock[codigo][tamano] || 0) + cantidadConSigno_(tipo, Number(m[5]) || 0);
  });
  return stock;
}

// Evita que un texto que empieza con "=" se tome como fórmula en la planilla.
function texto_(valor) {
  const t = String(valor || '').trim();
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

// Todo lo que la pantalla necesita para mostrarse.
function obtenerDatos() {
  const movimientos = filas_('movimientos');
  const zona = Session.getScriptTimeZone();
  return {
    especies: filas_('especies')
      .filter(f => String(f[0]).trim() !== '')
      .map(f => ({ codigo: String(f[0]), comun: String(f[1]), cientifico: String(f[2]), minimo: Number(f[3]) || 0 })),
    tamanos: filas_('tamanos').map(f => String(f[0]).trim()).filter(Boolean),
    stock: calcularStock_(movimientos),
    ultimos: movimientos.slice(-30).reverse().map(m => ({
      fecha: m[0] instanceof Date ? Utilities.formatDate(m[0], zona, 'dd/MM/yyyy') : String(m[0]),
      tipo: String(m[1]),
      especie: String(m[3]),
      tamano: String(m[4]),
      cantidad: Number(m[5]) || 0,
      responsable: String(m[6]),
    })),
  };
}

// Guarda un movimiento nuevo. Devuelve cómo quedó el stock de esa especie y tamaño.
function registrarMovimiento(m) {
  const tipo = String(m.tipo);
  const codigo = String(m.codigo);
  const tamano = String(m.tamano);
  const cantidad = Number(m.cantidad);

  if (!TIPOS.includes(tipo)) throw new Error('Tipo de movimiento inválido.');
  if (!Number.isInteger(cantidad) || cantidad === 0) throw new Error('La cantidad tiene que ser un número entero distinto de cero.');
  if (tipo !== 'Ajuste' && cantidad < 0) throw new Error('En entradas y salidas la cantidad va sin signo menos.');

  const especie = filas_('especies').find(f => String(f[0]) === codigo);
  if (!especie) throw new Error('No existe una especie con código ' + codigo + '.');
  if (!filas_('tamanos').some(f => String(f[0]).trim() === tamano)) throw new Error('El tamaño "' + tamano + '" no está en la hoja Tamaños.');

  // El lock evita que dos personas cargando al mismo tiempo dejen el stock negativo.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const actual = (calcularStock_(filas_('movimientos'))[codigo] || {})[tamano] || 0;
    const nuevo = actual + cantidadConSigno_(tipo, cantidad);
    if (nuevo < 0) {
      throw new Error('No alcanza el stock: hay ' + actual + ' de ' + especie[1] + ' en ' + tamano + '.');
    }
    const fecha = m.fecha ? new Date(m.fecha + 'T12:00:00') : new Date();
    SpreadsheetApp.getActive().getSheetByName(HOJAS.movimientos.nombre).appendRow([
      fecha, tipo, codigo, especie[1], tamano, cantidad,
      texto_(m.responsable), texto_(m.observaciones),
      Session.getActiveUser().getEmail(), new Date(),
    ]);
    return nuevo;
  } finally {
    lock.releaseLock();
  }
}
