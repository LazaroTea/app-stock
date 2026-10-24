import { exigirUsuario } from '@/lib/sesion';
import { leerCatalogo, leerUltimos } from '@/lib/almacen';
import Link from 'next/link';
import { etiquetaTamano, fechaLegible, numeroRemito } from '@/lib/stock';

export const dynamic = 'force-dynamic';

// Cada fila es un cambio de stock en un depósito: un movimiento entre dos depósitos aparece dos veces (resta en
// uno, suma en el otro). Los de remitos anulados se muestran tachados: no cuentan en el stock.
export default async function PaginaUltimos() {
  await exigirUsuario();
  const [{ especies }, { movimientos: ultimos, total }] = await Promise.all([leerCatalogo(), leerUltimos(30)]);
  const nombres = new Map(especies.map(e => [e.codigo, e.comun]));

  return (
    <section>
      <p className="resumen">
        Los últimos {ultimos.length} movimientos de {total} en total. Cada fila es lo que suma (+) o resta (−) en un
        depósito. Tocando el número de remito se puede ver, imprimir, modificar o anular.
      </p>
      <div className="tabla">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Remito</th>
              <th className="solo-ancho">Tipo</th>
              <th>Depósito</th>
              <th>Especie</th>
              <th className="solo-ancho">Presentación</th>
              <th className="num">Cant.</th>
              <th className="solo-ancho">Resp.</th>
            </tr>
          </thead>
          <tbody>
            {ultimos.map(m => (
              <tr key={m.id} className={m.anulado ? 'anulado' : undefined}>
                <td>{fechaLegible(m.fecha)}</td>
                <td className="estado">
                  <Link href={`/remitos/${m.remito}`}>{numeroRemito(m.remito)}</Link>
                  {m.anulado && <div className="negativo">Anulado</div>}
                </td>
                <td className={`solo-ancho tipo-${m.tipo}`}>{m.tipo}</td>
                <td>{m.deposito}</td>
                <td>{nombres.get(m.codigo) ?? m.codigo}</td>
                <td className="solo-ancho">
                  {m.presentacion} {etiquetaTamano(m.tamano, m.tamanoDetalle)}
                </td>
                <td className={m.cantidad < 0 ? 'num negativo' : 'num suma'}>
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
