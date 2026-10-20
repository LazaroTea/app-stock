'use server';
// Lo que se ejecuta en el servidor cuando alguien guarda un movimiento.
import { revalidatePath } from 'next/cache';
import { deAUno, guardarDatos, leerDatos } from '@/lib/almacen';
import { buscarEspecie, calcularStock, cantidadConSigno } from '@/lib/stock';
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

  return deAUno(async () => {
    const datos = await leerDatos();
    const especie = buscarEspecie(datos.especies, String(form.get('especie') ?? ''));
    if (!especie) return { ok: false, mensaje: 'Elegí una especie de la lista.' };
    if (!datos.tamanos.includes(tamano)) return { ok: false, mensaje: `El tamaño "${tamano}" no existe.` };

    const actual = calcularStock(datos.movimientos)[especie.codigo]?.[tamano] ?? 0;
    const nuevo = actual + cantidadConSigno(tipo, cantidad);
    if (nuevo < 0) return { ok: false, mensaje: `No alcanza el stock: hay ${actual} de ${especie.comun} en ${tamano}.` };

    datos.movimientos.push({
      id: Math.max(0, ...datos.movimientos.map(m => m.id)) + 1,
      fecha,
      tipo,
      codigo: especie.codigo,
      tamano,
      cantidad,
      responsable: String(form.get('responsable') ?? '').trim(),
      observaciones: String(form.get('observaciones') ?? '').trim(),
      registrado: new Date().toISOString(),
    });
    await guardarDatos(datos);
    revalidatePath('/', 'layout');
    return { ok: true, mensaje: `Guardado. Ahora hay ${nuevo} de ${especie.comun} en ${tamano}.` };
  });
}
