'use client';
import { useActionState, useEffect, useState } from 'react';
import { registrarMovimiento } from '../acciones';
import { bajoMinimo, buscarEspecie, etiquetaEspecie, totalEspecie } from '@/lib/stock';
import { TIPOS, type Especie, type Stock, type TipoMovimiento } from '@/lib/tipos';

const AYUDAS: Record<TipoMovimiento, string> = {
  Entrada: 'Plantas que ingresan: producción propia, compras, donaciones.',
  Salida: 'Plantas que se van: ventas, entregas, pérdidas.',
  Ajuste: 'Para corregir después de un conteo: positivo si sobran, negativo (ej. -3) si faltan.',
};

interface Props {
  especies: Especie[];
  tamanos: string[];
  stock: Stock;
  hoy: string;
}

export default function Formulario({ especies, tamanos, stock, hoy }: Props) {
  const [resultado, enviar, guardando] = useActionState(registrarMovimiento, null);
  const [tipo, setTipo] = useState<TipoMovimiento>('Entrada');
  const [especie, setEspecie] = useState('');
  const [tamano, setTamano] = useState(tamanos[0] ?? '');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(hoy);
  const [responsable, setResponsable] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // El responsable se recuerda en este dispositivo para no escribirlo cada vez.
  useEffect(() => {
    try {
      setResponsable(localStorage.getItem('responsable') ?? '');
    } catch {}
  }, []);

  // Después de guardar bien, se limpian la cantidad y las observaciones.
  useEffect(() => {
    if (resultado?.ok) {
      setCantidad('');
      setObservaciones('');
    }
  }, [resultado]);

  const elegida = buscarEspecie(especies, especie);
  const disponible = elegida ? (stock[elegida.codigo]?.[tamano] ?? 0) : null;

  return (
    <div className="cargar">
      <form
        className="formulario"
        action={form => {
          try {
            localStorage.setItem('responsable', responsable);
          } catch {}
          enviar(form);
        }}
        autoComplete="off"
      >
        <label>Tipo de movimiento</label>
        {/* Botones en vez de radios: React reinicia los radios del formulario después de cada envío
            y podía quedar marcado otro tipo que el que se ve. El tipo viaja en el campo oculto. */}
        <input type="hidden" name="tipo" value={tipo} />
        <div className="tipos" role="radiogroup">
          {TIPOS.map(t => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tipo === t}
              className={tipo === t ? 'elegido' : undefined}
              onClick={() => setTipo(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="ayuda">{AYUDAS[tipo]}</div>

        <label htmlFor="especie">Especie</label>
        <input
          id="especie"
          name="especie"
          list="lista-especies"
          placeholder="Escribí el nombre o el código"
          value={especie}
          onChange={e => setEspecie(e.target.value)}
          required
        />
        <datalist id="lista-especies">
          {especies.map(e => (
            <option key={e.codigo} value={etiquetaEspecie(e)}>
              {e.cientifico}
            </option>
          ))}
        </datalist>

        <label htmlFor="tamano">Tamaño</label>
        <select id="tamano" name="tamano" value={tamano} onChange={e => setTamano(e.target.value)} required>
          {tamanos.map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {disponible !== null && <div className="ayuda">Hay {disponible} en este tamaño.</div>}

        <div className="dos">
          <div>
            <label htmlFor="cantidad">Cantidad</label>
            <input
              id="cantidad"
              name="cantidad"
              type="number"
              step={1}
              min={tipo === 'Ajuste' ? undefined : 1}
              inputMode="numeric"
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="fecha">Fecha</label>
            <input id="fecha" name="fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)} required />
          </div>
        </div>

        <label htmlFor="responsable">Responsable</label>
        <input
          id="responsable"
          name="responsable"
          placeholder="Quién hace el movimiento"
          value={responsable}
          onChange={e => setResponsable(e.target.value)}
        />

        <label htmlFor="observaciones">Observaciones</label>
        <textarea
          id="observaciones"
          name="observaciones"
          rows={2}
          placeholder="Opcional: destino, procedencia, n.º de remito…"
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
        />

        <button type="submit" className="principal" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar movimiento'}
        </button>
        {resultado && <div className={resultado.ok ? 'mensaje ok' : 'mensaje error'}>{resultado.mensaje}</div>}
      </form>

      {/* Solo se ve en pantallas grandes: el stock completo de la especie elegida. */}
      <aside className="panel" aria-live="polite">
        {elegida ? (
          <>
            <h2>{elegida.comun}</h2>
            <div className="cientifico">{elegida.cientifico}</div>
            <div className="tabla">
              <table>
                <tbody>
                  {tamanos.map(t => (
                    <tr key={t}>
                      <td>{t === tamano ? <b>{t}</b> : t}</td>
                      <td className="num">{stock[elegida.codigo]?.[t] ?? 0}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <b>Total</b>
                    </td>
                    <td className="num">
                      <b>{totalEspecie(stock, elegida.codigo)}</b>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {bajoMinimo(stock, elegida) && <div className="aviso">Por debajo del mínimo ({elegida.minimo})</div>}
          </>
        ) : (
          <p className="resumen">Elegí una especie para ver cuántas plantas hay de cada tamaño.</p>
        )}
      </aside>
    </div>
  );
}
