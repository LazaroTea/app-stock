'use client';
import { useState } from 'react';
import { bajoMinimo, DEPOSITOS, stockDe, stockPorPresentacion, totalEspecie } from '@/lib/stock';
import type { Especie, StockPorDeposito } from '@/lib/tipos';

interface Props {
  especies: Especie[];
  /** En el orden en que se muestran. */
  presentaciones: string[];
  tamanos: string[];
  stock: StockPorDeposito;
}

export default function ListaStock({ especies, presentaciones, tamanos, stock: porDeposito }: Props) {
  // "" = todos los depósitos sumados.
  const [deposito, setDeposito] = useState('');
  const [buscar, setBuscar] = useState('');
  const [soloBajos, setSoloBajos] = useState(false);
  const [verTodas, setVerTodas] = useState(false);
  const [region, setRegion] = useState('');
  const [grupo, setGrupo] = useState('');

  const stock = stockDe(porDeposito, deposito);
  const regiones = [...new Set(especies.flatMap(e => regionesDe(e)))].sort((a, b) => a.localeCompare(b, 'es'));
  const conStock = (e: Especie) => totalEspecie(stock, e.codigo) !== 0;
  const texto = buscar.trim().toLowerCase();
  // Si se busca por nombre, aparecen también las especies sin stock.
  const lista = especies.filter(
    e =>
      (!texto || `${e.comun} ${e.cientifico} ${e.codigo} ${e.region}`.toLowerCase().includes(texto)) &&
      (!region || regionesDe(e).includes(region)) &&
      (!grupo || e.grupo === grupo) &&
      (soloBajos ? bajoMinimo(stock, e) : verTodas || texto !== '' || conStock(e)),
  );
  const cantidadBajos = especies.filter(e => bajoMinimo(stock, e)).length;
  const cantidadConStock = especies.filter(conStock).length;
  const totalPlantas = especies.reduce((suma, e) => suma + totalEspecie(stock, e.codigo), 0);

  return (
    <section>
      {/* Qué stock se ve: el de un depósito o el de todos sumados. */}
      <div className="tipos depositos" role="radiogroup" aria-label="Depósito">
        {['', ...DEPOSITOS].map(d => (
          <button
            key={d || 'todos'}
            type="button"
            role="radio"
            aria-checked={deposito === d}
            className={deposito === d ? 'elegido' : undefined}
            onClick={() => setDeposito(d)}
          >
            {d || 'Todos'}
          </button>
        ))}
      </div>

      <div className="indicadores">
        <div className="indicador">
          <span className={totalPlantas < 0 ? 'valor negativo' : 'valor'}>{totalPlantas.toLocaleString('es-AR')}</span>
          <span className="nombre-indicador">plantas {deposito ? `en ${deposito}` : 'en total'}</span>
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
        <select aria-label="Árboles, palmeras o frutales" value={grupo} onChange={e => setGrupo(e.target.value)}>
          <option value="">Tipo: todos</option>
          <option value="Árbol">Solo árboles</option>
          <option value="Palmera">Solo palmeras</option>
          <option value="Frutal">Solo frutales</option>
        </select>
        <select aria-label="Región" value={region} onChange={e => setRegion(e.target.value)}>
          <option value="">Región: todas</option>
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

      {lista.length === 0 &&
        (cantidadConStock === 0 && !texto && !verTodas && !soloBajos ? (
          <div className="tarjeta">
            Todavía no hay stock {deposito ? `en ${deposito}` : 'cargado'}. Cargá las entradas desde la pestaña{' '}
            <b>Cargar</b>, o elegí &quot;Todas, con y sin stock&quot; para ver el listado de especies.
          </div>
        ) : (
          <p className="resumen">No hay especies que coincidan.</p>
        ))}
      <div className="grilla">
        {lista.map(e => {
          const bajo = bajoMinimo(stock, e);
          const total = totalEspecie(stock, e.codigo);
          const porPresentacion = stockPorPresentacion(stock, e.codigo, presentaciones, tamanos);
          // Con "Todos", cuánto hay en cada depósito.
          const porDepositoEspecie = DEPOSITOS.map(d => [d, totalEspecie(porDeposito[d] ?? {}, e.codigo)] as const).filter(
            ([, n]) => n !== 0,
          );
          return (
            <div key={e.codigo} className={bajo ? 'tarjeta bajo' : porPresentacion.length ? 'tarjeta' : 'tarjeta sin-stock'}>
              <div className="fila">
                <div>
                  <div className="nombre">{e.comun}</div>
                  <div className="cientifico">
                    {e.cientifico} · {e.codigo}
                  </div>
                  <div className="region">
                    {e.grupo !== 'Árbol' && (
                      <span className="etiqueta" title="Especie priorizada por SENASA (Res. 64/2026)">
                        {e.grupo}
                      </span>
                    )}
                    {e.region}
                  </div>
                </div>
                <div className={total < 0 ? 'total negativo' : 'total'}>{total}</div>
              </div>
              {bajo && <div className="aviso">Por debajo del mínimo ({e.minimo})</div>}
              {!deposito && porDepositoEspecie.length > 0 && (
                <div className="por-deposito">
                  {porDepositoEspecie.map(([d, n]) => (
                    <span key={d} className={n < 0 ? 'negativo' : undefined}>
                      {d}: <b>{n}</b>
                    </span>
                  ))}
                </div>
              )}
              {porPresentacion.length > 0 && (
                <div className="presentaciones">
                  {porPresentacion.map(([t, n]) => (
                    <span key={t} className={n < 0 ? 'chip negativo' : 'chip'}>
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
