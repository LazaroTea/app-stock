'use server';
// Lo que se ejecuta en el servidor cuando alguien guarda un remito.
import { revalidatePath } from 'next/cache';
import { guardarRemito, leerCatalogo } from '@/lib/almacen';
import { LUGARES_A_ESPECIFICAR, lugaresDelTipo, numeroRemito, TAMANO_A_ESPECIFICAR, type ReglaLugar } from '@/lib/stock';
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
  responsable: string;
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

export async function registrarRemito(_anterior: Resultado | null, remito: RemitoEnviado): Promise<Resultado> {
  const tipo = remito.tipo;
  const fecha = String(remito.fecha ?? '');
  if (!TIPOS.includes(tipo)) return { ok: false, mensaje: 'Tipo de movimiento inválido.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false, mensaje: 'La fecha no es válida.' };
  if (!Array.isArray(remito.lineas) || remito.lineas.length === 0) {
    return { ok: false, mensaje: 'El remito está vacío: sumá al menos una planta.' };
  }
  if (limpiar(remito.destinatario).length > 100) return { ok: false, mensaje: 'El destinatario es muy largo (máximo 100 letras).' };
  if (remito.lineas.length > MAXIMO_LINEAS) return { ok: false, mensaje: `El remito tiene más de ${MAXIMO_LINEAS} líneas.` };

  const reglas = lugaresDelTipo(tipo);
  const procedencia = revisarLugar(reglas.procedencia, remito.procedencia, remito.procedenciaDetalle);
  if (typeof procedencia === 'string') return { ok: false, mensaje: procedencia };
  const destino = revisarLugar(reglas.destino, remito.destino, remito.destinoDetalle);
  if (typeof destino === 'string') return { ok: false, mensaje: destino };
  if (tipo === 'Pase' && procedencia.lugar === destino.lugar) {
    return { ok: false, mensaje: 'En un pase, el depósito de origen y el de destino tienen que ser distintos.' };
  }

  try {
    const { especies, presentaciones, tamanos } = await leerCatalogo();
    const codigos = new Set(especies.map(e => e.codigo));
    const lineas: LineaRemito[] = [];

    // Se revisa línea por línea, aunque la pantalla ya lo haya controlado.
    for (const [i, l] of remito.lineas.entries()) {
      const n = `Línea ${i + 1}`;
      const cantidad = Number(l.cantidad);
      const tamano = String(l.tamano ?? '');
      const tamanoDetalle = tamano === TAMANO_A_ESPECIFICAR ? limpiar(l.tamanoDetalle) : '';
      if (!codigos.has(String(l.codigo))) return { ok: false, mensaje: `${n}: la especie no existe.` };
      if (!presentaciones.includes(String(l.presentacion))) return { ok: false, mensaje: `${n}: la presentación no existe.` };
      if (!tamanos.includes(tamano)) return { ok: false, mensaje: `${n}: el tamaño no existe.` };
      if (tamano === TAMANO_A_ESPECIFICAR && !tamanoDetalle) return { ok: false, mensaje: `${n}: falta escribir el tamaño.` };
      if (tamanoDetalle.length > 60) return { ok: false, mensaje: `${n}: el tamaño escrito es muy largo.` };
      if (!Number.isInteger(cantidad) || cantidad === 0) return { ok: false, mensaje: `${n}: la cantidad no es válida.` };
      if (tipo !== 'Ajuste' && cantidad < 0) {
        return { ok: false, mensaje: `${n}: la cantidad va sin signo menos (solo los ajustes pueden ser negativos).` };
      }
      lineas.push({ codigo: String(l.codigo), presentacion: String(l.presentacion), tamano, tamanoDetalle, cantidad });
    }

    const numero = await guardarRemito({
      tipo,
      fecha,
      destinatario: limpiar(remito.destinatario),
      procedencia: procedencia.lugar,
      procedenciaDetalle: procedencia.detalle,
      destino: destino.lugar,
      destinoDetalle: destino.detalle,
      responsable: limpiar(remito.responsable),
      observaciones: String(remito.observaciones ?? '').trim(),
      lineas,
    });

    revalidatePath('/', 'layout');
    const plantas = lineas.reduce((suma, l) => suma + Math.abs(l.cantidad), 0);
    return {
      ok: true,
      numero,
      mensaje: `Remito N.º ${numeroRemito(numero)} guardado: ${lineas.length} ${lineas.length === 1 ? 'línea' : 'líneas'}, ${plantas} plantas.`,
    };
  } catch (e) {
    console.error('Error al guardar el remito:', e);
    return { ok: false, mensaje: 'No se pudo guardar: hubo un problema con la base de datos. Probá de nuevo en un rato.' };
  }
}
