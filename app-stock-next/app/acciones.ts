'use server';
// Lo que se ejecuta en el servidor cuando alguien guarda, modifica o anula un remito.
import { revalidatePath } from 'next/cache';
import {
  anularRemito as marcarAnulado,
  guardarRemito,
  leerCatalogo,
  modificarRemito as guardarCambios,
  type RemitoNuevo,
} from '@/lib/almacen';
import { puedeAnularRemitos, puedeModificarRemitos } from '@/lib/permisos';
import { usuarioActual } from '@/lib/sesion';
import {
  DEPOSITOS,
  LUGARES_A_ESPECIFICAR,
  lugaresDelTipo,
  numeroRemito,
  TAMANO_A_ESPECIFICAR,
  type ReglaLugar,
} from '@/lib/stock';
import { TIPOS, type LineaRemito, type TipoMovimiento } from '@/lib/tipos';

export interface Resultado {
  ok: boolean;
  mensaje: string;
  /** Número del remito guardado, para abrirlo e imprimirlo. */
  numero?: number;
}

export interface RemitoEnviado {
  tipo: TipoMovimiento;
  fecha: string;
  destinatario: string;
  procedencia: string;
  procedenciaDetalle: string;
  destino: string;
  destinoDetalle: string;
  observaciones: string;
  lineas: LineaRemito[];
}

const MAXIMO_LINEAS = 200;

// Saca los espacios de más para que "5 m" y "5  m " sumen al mismo stock.
function limpiar(texto: unknown): string {
  return String(texto ?? '').trim().replace(/\s+/g, ' ');
}

// Revisa un lugar (procedencia o destino) contra la regla del tipo de movimiento.
// Con "Proveedor" o "Cliente" el nombre es obligatorio. Devuelve el lugar y su detalle limpios, o un error.
function revisarLugar(regla: ReglaLugar | null, lugar: unknown, detalle: unknown): { lugar: string; detalle: string } | string {
  const l = String(lugar ?? '');
  if (!regla) return { lugar: '', detalle: '' };
  if (!l) return regla.obligatorio ? `Elegí el ${regla.titulo.toLowerCase()}.` : { lugar: '', detalle: '' };
  if (!regla.opciones.includes(l)) return `"${l}" no es una opción válida para ${regla.titulo.toLowerCase()}.`;
  if (!LUGARES_A_ESPECIFICAR.includes(l)) return { lugar: l, detalle: '' };
  const d = limpiar(detalle);
  if (!d) return `Escribí qué ${l.toLowerCase()} es.`;
  if (d.length > 100) return `El nombre del ${l.toLowerCase()} es muy largo (máximo 100 letras).`;
  return { lugar: l, detalle: d };
}


// Revisa todo lo que llega de la pantalla (aunque la pantalla ya lo haya controlado) y lo devuelve limpio,
// listo para guardar. Si algo está mal, devuelve el mensaje de error.
// El responsable no viene de la pantalla: es el usuario que inició sesión.
async function revisarRemito(remito: RemitoEnviado, responsable: string): Promise<RemitoNuevo | string> {
  const tipo = remito.tipo;
  const fecha = String(remito.fecha ?? '');
  if (!TIPOS.includes(tipo)) return 'Tipo de movimiento inválido.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return 'La fecha no es válida.';
  if (!Array.isArray(remito.lineas) || remito.lineas.length === 0) return 'El remito está vacío: sumá al menos una planta.';
  if (limpiar(remito.destinatario).length > 100) return 'El destinatario es muy largo (máximo 100 letras).';
  if (remito.lineas.length > MAXIMO_LINEAS) return `El remito tiene más de ${MAXIMO_LINEAS} líneas.`;

  const reglas = lugaresDelTipo(tipo);
  const procedencia = revisarLugar(reglas.procedencia, remito.procedencia, remito.procedenciaDetalle);
  if (typeof procedencia === 'string') return procedencia;
  const destino = revisarLugar(reglas.destino, remito.destino, remito.destinoDetalle);
  if (typeof destino === 'string') return destino;
  if (DEPOSITOS.includes(procedencia.lugar) && procedencia.lugar === destino.lugar) {
    return 'El punto de partida y el de llegada tienen que ser distintos.';
  }
  // Si ni la partida ni la llegada son depósitos, el movimiento no cambiaría ningún stock.
  if (tipo === 'Movimiento' && !DEPOSITOS.includes(procedencia.lugar) && !DEPOSITOS.includes(destino.lugar)) {
    return 'El punto de partida o el de llegada tiene que ser un depósito (Goya, Pilar o Benavidez).';
  }

  const { especies, presentaciones, tamanos } = await leerCatalogo();
  const codigos = new Set(especies.map(e => e.codigo));
  const lineas: LineaRemito[] = [];
  for (const [i, l] of remito.lineas.entries()) {
    const n = `Línea ${i + 1}`;
    const cantidad = Number(l.cantidad);
    const tamano = String(l.tamano ?? '');
    const tamanoDetalle = tamano === TAMANO_A_ESPECIFICAR ? limpiar(l.tamanoDetalle) : '';
    if (!codigos.has(String(l.codigo))) return `${n}: la especie no existe.`;
    if (!presentaciones.includes(String(l.presentacion))) return `${n}: la presentación no existe.`;
    if (!tamanos.includes(tamano)) return `${n}: el tamaño no existe.`;
    if (tamano === TAMANO_A_ESPECIFICAR && !tamanoDetalle) return `${n}: falta escribir el tamaño.`;
    if (tamanoDetalle.length > 60) return `${n}: el tamaño escrito es muy largo.`;
    if (!Number.isInteger(cantidad) || cantidad === 0) return `${n}: la cantidad no es válida.`;
    if (tipo !== 'Ajuste' && cantidad < 0) return `${n}: la cantidad va sin signo menos (solo los ajustes pueden ser negativos).`;
    lineas.push({ codigo: String(l.codigo), presentacion: String(l.presentacion), tamano, tamanoDetalle, cantidad });
  }

  return {
    tipo,
    fecha,
    destinatario: limpiar(remito.destinatario),
    procedencia: procedencia.lugar,
    procedenciaDetalle: procedencia.detalle,
    destino: destino.lugar,
    destinoDetalle: destino.detalle,
    responsable,
    observaciones: String(remito.observaciones ?? '').trim(),
    lineas,
  };
}

// "2 líneas, 15 plantas"
function resumen(lineas: LineaRemito[]): string {
  const plantas = lineas.reduce((suma, l) => suma + Math.abs(l.cantidad), 0);
  return `${lineas.length} ${lineas.length === 1 ? 'línea' : 'líneas'}, ${plantas} ${plantas === 1 ? 'planta' : 'plantas'}`;
}

const SIN_SESION = 'Tu sesión se cerró: tocá Stock para volver a ingresar. Lo que ibas cargando queda guardado en este dispositivo.';
const ERROR_BASE = 'No se pudo guardar: hubo un problema con la base de datos. Probá de nuevo en un rato.';

export async function registrarRemito(_anterior: Resultado | null, remito: RemitoEnviado): Promise<Resultado> {
  try {
    const usuario = await usuarioActual();
    if (!usuario) return { ok: false, mensaje: SIN_SESION };
    const nuevo = await revisarRemito(remito, usuario.nombre);
    if (typeof nuevo === 'string') return { ok: false, mensaje: nuevo };
    const numero = await guardarRemito(nuevo);
    revalidatePath('/', 'layout');
    return { ok: true, numero, mensaje: `Remito N.º ${numeroRemito(numero)} guardado: ${resumen(nuevo.lineas)}.` };
  } catch (e) {
    console.error('Error al guardar el remito:', e);
    return { ok: false, mensaje: ERROR_BASE };
  }
}

// Modificar un remito ya guardado: mismo número, datos y líneas nuevos. Se usa con .bind(null, numero).
export async function modificarRemito(numero: number, _anterior: Resultado | null, remito: RemitoEnviado): Promise<Resultado> {
  try {
    const usuario = await usuarioActual();
    if (!usuario) return { ok: false, mensaje: SIN_SESION };
    if (!puedeModificarRemitos(usuario)) return { ok: false, mensaje: 'No tenés permiso para modificar remitos.' };
    // Acá "responsable" es quien modifica: se guarda como modificado_por (ver modificarRemito en lib/almacen.ts).
    const nuevo = await revisarRemito(remito, usuario.nombre);
    if (typeof nuevo === 'string') return { ok: false, mensaje: nuevo };
    if (!(await guardarCambios(numero, nuevo))) {
      return { ok: false, mensaje: 'No se pudo modificar: el remito no existe o está anulado.' };
    }
    revalidatePath('/', 'layout');
    return { ok: true, numero, mensaje: `Remito N.º ${numeroRemito(numero)} modificado: ${resumen(nuevo.lineas)}.` };
  } catch (e) {
    console.error('Error al modificar el remito:', e);
    return { ok: false, mensaje: ERROR_BASE };
  }
}

// Anular un remito: no se borra, pero deja de contar en el stock. El motivo es obligatorio.
export async function anularRemito(numero: number, motivo: string): Promise<Resultado> {
  const m = limpiar(motivo);
  if (!m) return { ok: false, mensaje: 'Escribí el motivo de la anulación.' };
  if (m.length > 200) return { ok: false, mensaje: 'El motivo es muy largo (máximo 200 letras).' };
  try {
    const usuario = await usuarioActual();
    if (!usuario) return { ok: false, mensaje: SIN_SESION };
    if (!puedeAnularRemitos(usuario)) return { ok: false, mensaje: 'No tenés permiso para anular remitos.' };
    if (!(await marcarAnulado(numero, m, usuario.nombre))) return { ok: false, mensaje: 'El remito no existe o ya estaba anulado.' };
    revalidatePath('/', 'layout');
    return { ok: true, numero, mensaje: `Remito N.º ${numeroRemito(numero)} anulado.` };
  } catch (e) {
    console.error('Error al anular el remito:', e);
    return { ok: false, mensaje: ERROR_BASE };
  }
}
