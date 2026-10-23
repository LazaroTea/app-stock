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

  const texto = buscar.trim().toLowerCase();
  const lista = especies.filter(
    e =>
      (!texto || `${e.comun} ${e.cientifico} ${e.codigo}`.toLowerCase().includes(texto)) &&
      (!soloBajos || bajoMinimo(stock, e)),
  );
  const cantidadBajos = especies.filter(e => bajoMinimo(stock, e)).length;
  const totalPlantas = especies.reduce((suma, e) => suma + totalEspecie(stock, e.codigo), 0);

  return (
    <section>
      <div className="indicadores">
        <div className="indicador">
          <span className="valor">{totalPlantas.toLocaleString('es-AR')}</span>
          <span className="nombre-indicador">plantas</span>
        </div>
        <div className="indicador">
          <span className="valor">{especies.length}</span>
          <span className="nombre-indicador">especies</span>
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
            <div key={e.codigo} className={bajo ? 'tarjeta bajo' : 'tarjeta'}>
              <div className="fila">
                <div>
                  <div className="nombre">{e.comun}</div>
                  <div className="cientifico">
                    {e.cientifico} · {e.codigo}
                  </div>
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
