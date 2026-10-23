'use server';
// Lo que se ejecuta en el servidor cuando alguien guarda un movimiento.
import { revalidatePath } from 'next/cache';
import { guardarMovimiento, leerCatalogo } from '@/lib/almacen';
import { buscarEspecie, cantidadConSigno } from '@/lib/stock';
import { TIPOS, type TipoMovimiento } from '@/lib/tipos';

export interface Resultado {
  ok: boolean;
  mensaje: string;
}

export async function registrarMovimiento(_anterior: Resultado | null, form: FormData): Promise<Resultado> {
  const tipo = String(form.get('tipo')) as TipoMovimiento;
  const tamano = String(form.get('tamano') ?? '');
  const cantidad = Number(form.get('cantidad'));
  const fecha = String(form.get('fecha') ?? '');

  if (!TIPOS.includes(tipo)) return { ok: false, mensaje: 'Tipo de movimiento inválido.' };
  if (!Number.isInteger(cantidad) || cantidad === 0) {
    return { ok: false, mensaje: 'La cantidad tiene que ser un número entero distinto de cero.' };
  }
  if (tipo !== 'Ajuste' && cantidad < 0) return { ok: false, mensaje: 'En entradas y salidas la cantidad va sin signo menos.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false, mensaje: 'La fecha no es válida.' };

  try {
    const { especies, tamanos } = await leerCatalogo();
    const especie = buscarEspecie(especies, String(form.get('especie') ?? ''));
    if (!especie) return { ok: false, mensaje: 'Elegí una especie de la lista.' };
    if (!tamanos.includes(tamano)) return { ok: false, mensaje: `El tamaño "${tamano}" no existe.` };

    const cambio = cantidadConSigno(tipo, cantidad);
    const { habia, guardado } = await guardarMovimiento({
      fecha,
      tipo,
      codigo: especie.codigo,
      tamano,
      cantidad,
      cambio,
      responsable: String(form.get('responsable') ?? '').trim(),
      observaciones: String(form.get('observaciones') ?? '').trim(),
    });
    if (!guardado) return { ok: false, mensaje: `No alcanza el stock: hay ${habia} de ${especie.comun} en ${tamano}.` };

    revalidatePath('/', 'layout');
    return { ok: true, mensaje: `Guardado. Ahora hay ${habia + cambio} de ${especie.comun} en ${tamano}.` };
  } catch (e) {
    console.error('Error al guardar el movimiento:', e);
    return { ok: false, mensaje: 'No se pudo guardar: hubo un problema con la base de datos. Probá de nuevo en un rato.' };
  }
}
