import Link from 'next/link';
import { leerUltimosRemitos, type RemitoResumen } from '@/lib/almacen';
import { exigirUsuario } from '@/lib/sesion';
import { etiquetaLugar, fechaLegible, numeroRemito } from '@/lib/stock';

export const dynamic = 'force-dynamic';

const CANTIDAD = 50;

// De dónde a dónde: "Goya → Pilar", "Proveedor (Vivero X) → Goya". En un ajuste, el depósito.
function recorrido(r: RemitoResumen): string {
  if (r.tipo === 'Ajuste') return r.destino;
  const partida = r.procedencia ? etiquetaLugar(r.procedencia, r.procedenciaDetalle) : '';
  const llegada = r.destino ? etiquetaLugar(r.destino, r.destinoDetalle) : '';
  return [partida, llegada].filter(Boolean).join(' → ');
}

// Una fila por remito (sin el detalle de las plantas): tocándolo se abre para ver el detalle, imprimir,
// modificar o anular. Los anulados se ven tachados (no cuentan en el stock).
export default async function PaginaUltimos() {
  await exigirUsuario();
  const { remitos, total } = await leerUltimosRemitos(CANTIDAD);

  return (
    <section>
      <p className="resumen">
        {remitos.length === total
          ? `Los ${total} remitos, del más nuevo al más viejo.`
          : `Los últimos ${remitos.length} remitos de ${total} en total.`}{' '}
        Tocando un remito se ve el detalle, y se puede imprimir, modificar o anular.
      </p>
      <div className="tabla">
        <table className="tabla-remitos">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Remito</th>
              <th className="solo-ancho">Tipo</th>
              <th>Recorrido</th>
              <th className="num">Plantas</th>
              <th className="solo-ancho">Resp.</th>
            </tr>
          </thead>
          <tbody>
            {remitos.map(r => (
              <tr key={r.numero} className={r.anulado ? 'anulado' : undefined}>
                <td>{fechaLegible(r.fecha)}</td>
                <td className="estado">
                  <Link href={`/remitos/${r.numero}`}>{numeroRemito(r.numero)}</Link>
                  {r.anulado && <div className="negativo">Anulado</div>}
                </td>
                <td className={`solo-ancho tipo-${r.tipo}`}>{r.tipo}</td>
                <td>
                  <Link href={`/remitos/${r.numero}`} className="enlace-fila">
                    {r.tipo === 'Ajuste' && <span className="tipo-Ajuste">Ajuste en </span>}
                    {recorrido(r)}
                  </Link>
                </td>
                <td className={r.plantas < 0 ? 'num negativo' : 'num'}>
                  {r.tipo === 'Ajuste' && r.plantas > 0 ? `+${r.plantas}` : r.plantas}
                  <div className="ayuda">
                    {r.lineas} {r.lineas === 1 ? 'línea' : 'líneas'}
                  </div>
                </td>
                <td className="solo-ancho">{r.responsable}</td>
              </tr>
            ))}
            {remitos.length === 0 && (
              <tr>
                <td colSpan={6}>Todavía no hay remitos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
