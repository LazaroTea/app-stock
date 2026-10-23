'use client';
import { useState } from 'react';
import { bajoMinimo, totalEspecie } from '@/lib/stock';
import type { Especie, Stock } from '@/lib/tipos';

interface Props {
  especies: Especie[];
  /** En el orden en que se muestran (de chico a grande). */
  tamanos: string[];
  stock: Stock;
}

export default function ListaStock({ especies, tamanos, stock }: Props) {
  const [buscar, setBuscar] = useState('');
  const [soloBajos, setSoloBajos] = useState(false);
  const [verTodas, setVerTodas] = useState(false);
  const [region, setRegion] = useState('');

  const regiones = [...new Set(especies.flatMap(e => regionesDe(e)))].sort((a, b) => a.localeCompare(b, 'es'));
  const conStock = (e: Especie) => totalEspecie(stock, e.codigo) !== 0;
  const texto = buscar.trim().toLowerCase();
  // Si se busca por nombre, aparecen también las especies sin stock.
  const lista = especies.filter(
    e =>
      (!texto || `${e.comun} ${e.cientifico} ${e.codigo} ${e.region}`.toLowerCase().includes(texto)) &&
      (!region || regionesDe(e).includes(region)) &&
      (soloBajos ? bajoMinimo(stock, e) : verTodas || texto !== '' || conStock(e)),
  );
  const cantidadBajos = especies.filter(e => bajoMinimo(stock, e)).length;
  const cantidadConStock = especies.filter(conStock).length;
  const totalPlantas = especies.reduce((suma, e) => suma + totalEspecie(stock, e.codigo), 0);

  return (
    <section>
      <div className="indicadores">
        <div className="indicador">
          <span className="valor">{totalPlantas.toLocaleString('es-AR')}</span>
          <span className="nombre-indicador">plantas</span>
        </div>
        <div className="indicador">
          <span className="valor">{cantidadConStock}</span>
          <span className="nombre-indicador">especies con stock (de {especies.length})</span>
        </div>
        {/* Tocar este indicador muestra solo las especies bajo el mínimo. */}
        <button
          type="button"
          className={soloBajos ? 'indicador alerta activo' : 'indicador alerta'}
          aria-pressed={soloBajos}
          onClick={() => setSoloBajos(!soloBajos)}
        >
          <span className="valor">{cantidadBajos}</span>
          <span className="nombre-indicador">{soloBajos ? 'bajo mínimo · ver todas' : 'bajo el mínimo'}</span>
        </button>
      </div>

      <div className="filtros">
        <input type="search" placeholder="Buscar especie o código" value={buscar} onChange={e => setBuscar(e.target.value)} />
        <select aria-label="Región" value={region} onChange={e => setRegion(e.target.value)}>
          <option value="">Todas las regiones</option>
          {regiones.map(r => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select
          aria-label="Qué especies mostrar"
          value={verTodas ? 'todas' : 'con-stock'}
          onChange={e => setVerTodas(e.target.value === 'todas')}
          disabled={soloBajos}
        >
          <option value="con-stock">Con stock</option>
          <option value="todas">Todas, con y sin stock</option>
        </select>
      </div>
      <p className="resumen">
        {soloBajos ? 'Mostrando solo las especies bajo el mínimo.' : `Mostrando ${lista.length} de ${especies.length} especies.`}
      </p>

      {lista.length === 0 && <p className="resumen">No hay especies que coincidan.</p>}
      <div className="grilla">
        {lista.map(e => {
          const bajo = bajoMinimo(stock, e);
          const porTamano = tamanos
            .map(t => [t, stock[e.codigo]?.[t] ?? 0] as const)
            .filter(([, n]) => n !== 0);
          return (
            <div key={e.codigo} className={bajo ? 'tarjeta bajo' : porTamano.length ? 'tarjeta' : 'tarjeta sin-stock'}>
              <div className="fila">
                <div>
                  <div className="nombre">{e.comun}</div>
                  <div className="cientifico">
                    {e.cientifico} · {e.codigo}
                  </div>
                  {e.region && <div className="region">{e.region}</div>}
                </div>
                <div className="total">{totalEspecie(stock, e.codigo)}</div>
              </div>
              {bajo && <div className="aviso">Por debajo del mínimo ({e.minimo})</div>}
              {porTamano.length > 0 && (
                <div className="tamanos">
                  {porTamano.map(([t, n]) => (
                    <span key={t} className="chip">
                      {t}: <b>{n}</b>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// "Chaco, Espinal" -> ["Chaco", "Espinal"]
function regionesDe(e: Especie): string[] {
  return e.region
    .split(',')
    .map(r => r.trim())
    .filter(Boolean);
}
