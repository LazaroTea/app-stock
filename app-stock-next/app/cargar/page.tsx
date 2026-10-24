import Link from 'next/link';
import { leerCatalogo, leerRemito, leerStock, leerSugerencias } from '@/lib/almacen';
import { puedeModificarRemitos } from '@/lib/permisos';
import { exigirUsuario } from '@/lib/sesion';
import { numeroRemito } from '@/lib/stock';
import Formulario from './Formulario';

export const dynamic = 'force-dynamic';

// /cargar: remito nuevo. /cargar?remito=12: modificar el remito 12.
export default async function PaginaCargar({ searchParams }: { searchParams: Promise<{ remito?: string }> }) {
  const usuario = await exigirUsuario();
  const numero = Number((await searchParams).remito);
  const modificando = Number.isInteger(numero) && numero > 0;

  const [{ especies, presentaciones, tamanos }, stock, sugerencias, editando] = await Promise.all([
    leerCatalogo(),
    leerStock(),
    leerSugerencias(),
    modificando ? leerRemito(numero) : Promise.resolve(null),
  ]);

  if (modificando) {
    const problema = !puedeModificarRemitos(usuario)
      ? 'No tenés permiso para modificar remitos.'
      : !editando
        ? 'Ese remito no existe.'
        : editando.anulado
          ? 'Ese remito está anulado: no se puede modificar.'
          : '';
    if (problema) {
      return (
        <section className="tarjeta">
          <h2 className="seccion">Modificar remito N.º {numeroRemito(numero)}</h2>
          <p>{problema}</p>
          <p>
            <Link href={`/remitos/${numero}`}>Volver al remito</Link>
          </p>
        </section>
      );
    }
  }

  return (
    <Formulario
      // La clave hace que, al pasar de "modificar" a "nuevo", el formulario arranque de cero.
      key={editando ? `remito-${editando.numero}` : 'nuevo'}
      especies={especies}
      presentaciones={presentaciones}
      tamanos={tamanos}
      stock={stock}
      sugerencias={sugerencias}
      editando={editando ?? undefined}
      // El responsable de un remito nuevo es quien inició sesión; al modificar, se mantiene el original.
      usuario={usuario.nombre}
      // Vercel corre en hora UTC: la fecha de hoy se calcula con la hora de Argentina.
      hoy={new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })}
    />
  );
}
