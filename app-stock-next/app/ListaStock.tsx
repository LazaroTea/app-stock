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
  // Las especies con el detalle abierto (por código).
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());
  const alternar = (codigo: string) =>
    setAbiertas(antes => {
      const ahora = new Set(antes);
      if (!ahora.delete(codigo)) ahora.add(codigo);
      return ahora;
    });

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
      {/* Tabla angosta: código, especie y total. Tocando una fila se abre el detalle (presentaciones, tamaños,
          depósitos). */}
      {lista.length > 0 && (
        <div className="tabla tabla-stock">
          <table>
            <thead>
              <tr>
                <th>Cód.</th>
                <th>Especie</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            {lista.map(e => {
              const bajo = bajoMinimo(stock, e);
              const total = totalEspecie(stock, e.codigo);
              const porPresentacion = stockPorPresentacion(stock, e.codigo, presentaciones, tamanos);
              // Para el detalle: cada depósito (el elegido arriba, o los tres) con sus presentaciones y tamaños.
              const porDepositos = (deposito ? [deposito] : DEPOSITOS)
                .map(d => {
                  const items = stockPorPresentacion(porDeposito[d] ?? {}, e.codigo, presentaciones, tamanos);
                  return [d, items, totalEspecie(porDeposito[d] ?? {}, e.codigo)] as const;
                })
                .filter(([, items]) => items.length > 0);
              const abierta = abiertas.has(e.codigo);
              const clase = [bajo ? 'bajo' : '', porPresentacion.length === 0 ? 'sin-stock' : '', abierta ? 'abierta' : '']
                .filter(Boolean)
                .join(' ');
              return (
                <tbody key={e.codigo} className={clase || undefined}>
                  <tr className="fila-especie" onClick={() => alternar(e.codigo)}>
                    <td className="cod">{e.codigo}</td>
                    <td>
                      <button
                        type="button"
                        className="boton-fila"
                        aria-expanded={abierta}
                        onClick={ev => {
                          ev.stopPropagation(); // el clic ya lo maneja la fila
                          alternar(e.codigo);
                        }}
                      >
                        <span className="flechita" aria-hidden="true">
                          {abierta ? '▾' : '▸'}
                        </span>
                        {e.comun}
                        <span className="cientifico-fila"> ({e.cientifico})</span>
                      </button>
                    </td>
                    <td className={total < 0 ? 'num negativo' : 'num total-fila'}>{total}</td>
                  </tr>
                  {abierta && (
                    <tr className="detalle-especie">
                      <td colSpan={3}>
                        {e.grupo !== 'Árbol' && (
                          <div>
                            <span className="etiqueta" title="Especie priorizada por SENASA (Res. 64/2026)">
                              {e.grupo}
                            </span>
                          </div>
                        )}
                        {bajo && <div className="aviso">Por debajo del mínimo ({e.minimo})</div>}
                        {/* Por depósito, y dentro de cada uno, sus presentaciones y tamaños. */}
                        {porDepositos.length > 0 ? (
                          porDepositos.map(([d, items, subtotal]) => (
                            <div key={d} className="dep-bloque">
                              <div className={subtotal < 0 ? 'dep-titulo negativo' : 'dep-titulo'}>
                                <b>{d}</b>
                                <b>{subtotal}</b>
                              </div>
                              <ul className="dep-lista">
                                {items.map(([t, n]) => (
                                  <li key={t} className={n < 0 ? 'negativo' : undefined}>
                                    <span>{t}</span>
                                    <b>{n}</b>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))
                        ) : (
                          <div className="ayuda">Sin stock{deposito ? ' en ' + deposito : ''}.</div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
      )}
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
