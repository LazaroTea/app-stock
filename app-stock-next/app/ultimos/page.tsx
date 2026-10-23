import { leerCatalogo, leerUltimos } from '@/lib/almacen';
import Link from 'next/link';
import { etiquetaTamano, fechaLegible, numeroRemito } from '@/lib/stock';

export const dynamic = 'force-dynamic';

// Cada fila es un cambio de stock en un depósito: un pase aparece dos veces (resta en uno, suma en el otro).
export default async function PaginaUltimos() {
  const [{ especies }, { movimientos: ultimos, total }] = await Promise.all([leerCatalogo(), leerUltimos(30)]);
  const nombres = new Map(especies.map(e => [e.codigo, e.comun]));

  return (
    <section>
      <p className="resumen">
        Los últimos {ultimos.length} movimientos de {total} en total. Cada fila es lo que suma (+) o resta (−) en un
        depósito.
      </p>
      <div className="tabla">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th className="solo-ancho">Remito</th>
              <th>Tipo</th>
              <th>Depósito</th>
              <th>Especie</th>
              <th className="solo-ancho">Presentación</th>
              <th className="num">Cant.</th>
              <th className="solo-ancho">Resp.</th>
            </tr>
          </thead>
          <tbody>
            {ultimos.map(m => (
              <tr key={m.id}>
                <td>{fechaLegible(m.fecha)}</td>
                <td className="solo-ancho">
                  <Link href={`/remitos/${m.remito}`}>{numeroRemito(m.remito)}</Link>
                </td>
                <td className={`tipo-${m.tipo}`}>{m.tipo}</td>
                <td>{m.deposito}</td>
                <td>{nombres.get(m.codigo) ?? m.codigo}</td>
                <td className="solo-ancho">
                  {m.presentacion} {etiquetaTamano(m.tamano, m.tamanoDetalle)}
                </td>
                <td className={m.cantidad < 0 ? 'num negativo' : 'num'}>
                  {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                </td>
                <td className="solo-ancho">{m.responsable}</td>
              </tr>
            ))}
            {ultimos.length === 0 && (
              <tr>
                <td colSpan={8}>Todavía no hay movimientos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
