import { leerDatos } from '@/lib/almacen';
import { fechaLegible } from '@/lib/stock';

export const dynamic = 'force-dynamic';

export default async function PaginaUltimos() {
  const datos = await leerDatos();
  const nombres = new Map(datos.especies.map(e => [e.codigo, e.comun]));
  const ultimos = [...datos.movimientos]
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)
    .slice(0, 30);

  return (
    <section>
      <p className="resumen">Los últimos 30 movimientos de {datos.movimientos.length} en total.</p>
      <div className="tabla">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Especie</th>
              <th>Tamaño</th>
              <th className="num">Cant.</th>
              <th className="solo-ancho">Resp.</th>
            </tr>
          </thead>
          <tbody>
            {ultimos.map(m => (
              <tr key={m.id}>
                <td>{fechaLegible(m.fecha)}</td>
                <td>{m.tipo}</td>
                <td>{nombres.get(m.codigo) ?? m.codigo}</td>
                <td>{m.tamano}</td>
                <td className="num">{m.cantidad}</td>
                <td className="solo-ancho">{m.responsable}</td>
              </tr>
            ))}
            {ultimos.length === 0 && (
              <tr>
                <td colSpan={6}>Todavía no hay movimientos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
