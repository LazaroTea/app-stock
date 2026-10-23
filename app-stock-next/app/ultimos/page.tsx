import { leerCatalogo, leerUltimos } from '@/lib/almacen';
import Link from 'next/link';
import { etiquetaTamano, fechaLegible, numeroRemito } from '@/lib/stock';

export const dynamic = 'force-dynamic';

export default async function PaginaUltimos() {
  const [{ especies }, { movimientos: ultimos, total }] = await Promise.all([leerCatalogo(), leerUltimos(30)]);
  const nombres = new Map(especies.map(e => [e.codigo, e.comun]));

  return (
    <section>
      <p className="resumen">Los últimos {ultimos.length} movimientos de {total} en total.</p>
      <div className="tabla">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th className="solo-ancho">Remito</th>
              <th>Tipo</th>
              <th>Especie</th>
              <th>Presentación</th>
              <th className="num">Cant.</th>
              <th className="solo-ancho">Resp.</th>
            </tr>
          </thead>
          <tbody>
            {ultimos.map(m => (
              <tr key={m.id}>
                <td>{fechaLegible(m.fecha)}</td>
                <td className="solo-ancho">
                  {m.remito ? <Link href={`/remitos/${m.remito}`}>{numeroRemito(m.remito)}</Link> : '—'}
                </td>
                <td className={`tipo-${m.tipo}`}>{m.tipo}</td>
                <td>{nombres.get(m.codigo) ?? m.codigo}</td>
                <td>
                  {m.presentacion} {etiquetaTamano(m.tamano, m.tamanoDetalle)}
                </td>
                <td className="num">{m.cantidad}</td>
                <td className="solo-ancho">{m.responsable}</td>
              </tr>
            ))}
            {ultimos.length === 0 && (
              <tr>
                <td colSpan={7}>Todavía no hay movimientos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
