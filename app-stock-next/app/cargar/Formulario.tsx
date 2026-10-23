'use client';
// Pantalla Cargar, en formato remito: arriba los datos del remito, abajo se suman las plantas una por una
// y al costado se va armando el remito. "Guardar movimiento" guarda todo el remito junto.
import { startTransition, useActionState, useEffect, useRef, useState } from 'react';
import { registrarRemito } from '../acciones';
import {
  buscarEspecie,
  cantidadConSigno,
  claveStock,
  DESTINOS,
  etiquetaEspecie,
  etiquetaLugar,
  etiquetaTamano,
  fechaLegible,
  LUGARES_A_ESPECIFICAR,
  PROCEDENCIAS,
  TAMANO_A_ESPECIFICAR,
} from '@/lib/stock';
import type { Sugerencias } from '@/lib/almacen';
import { TIPOS, type Especie, type LineaRemito, type Stock, type TipoMovimiento } from '@/lib/tipos';

const AYUDAS: Record<TipoMovimiento, string> = {
  Entrada: 'Plantas que ingresan: producción propia, compras, donaciones.',
  Salida: 'Plantas que se van: ventas, entregas, pérdidas.',
  Ajuste: 'Para corregir después de un conteo: positivo si sobran, negativo (ej. -3) si faltan.',
};

// El remito a medio armar se guarda en este dispositivo, para no perderlo si se cierra la página.
const BORRADOR = 'remito-borrador';

interface Props {
  especies: Especie[];
  presentaciones: string[];
  tamanos: string[];
  stock: Stock;
  /** Destinatarios, proveedores y clientes ya usados, para sugerirlos. */
  sugerencias: Sugerencias;
  hoy: string;
}

// Saca los espacios de más para que "5 m" y "5  m " sumen al mismo stock.
const limpiar = (texto: string) => texto.trim().replace(/\s+/g, ' ');

const claveLinea = (l: LineaRemito) => claveStock(l.presentacion, etiquetaTamano(l.tamano, l.tamanoDetalle));

export default function Formulario({ especies, presentaciones, tamanos, stock, sugerencias, hoy }: Props) {
  const [resultado, enviar, guardando] = useActionState(registrarRemito, null);

  // Datos del remito
  const [tipo, setTipo] = useState<TipoMovimiento>('Entrada');
  const [fecha, setFecha] = useState(hoy);
  const [destinatario, setDestinatario] = useState('');
  const [procedencia, setProcedencia] = useState('');
  const [procedenciaDetalle, setProcedenciaDetalle] = useState('');
  const [destino, setDestino] = useState('');
  const [destinoDetalle, setDestinoDetalle] = useState('');
  const [responsable, setResponsable] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [lineas, setLineas] = useState<LineaRemito[]>([]);

  // La planta que se está por sumar
  const [especie, setEspecie] = useState('');
  const [presentacion, setPresentacion] = useState(presentaciones[0] ?? '');
  // Sin tamaño elegido de entrada, para que no se sume uno por descuido.
  const [tamano, setTamano] = useState('');
  const [tamanoDetalle, setTamanoDetalle] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const campoEspecie = useRef<HTMLInputElement>(null);

  const nombre = new Map(especies.map(e => [e.codigo, e.comun]));

  // Al abrir: el responsable recordado y el remito a medio armar, si había.
  useEffect(() => {
    try {
      setResponsable(localStorage.getItem('responsable') ?? '');
      const borrador = JSON.parse(localStorage.getItem(BORRADOR) ?? 'null');
      if (Array.isArray(borrador?.lineas) && borrador.lineas.length) {
        setLineas(borrador.lineas);
        if (TIPOS.includes(borrador.tipo)) setTipo(borrador.tipo);
        if (typeof borrador.destinatario === 'string') setDestinatario(borrador.destinatario);
        if (typeof borrador.procedencia === 'string') setProcedencia(borrador.procedencia);
        if (typeof borrador.procedenciaDetalle === 'string') setProcedenciaDetalle(borrador.procedenciaDetalle);
        if (typeof borrador.destino === 'string') setDestino(borrador.destino);
        if (typeof borrador.destinoDetalle === 'string') setDestinoDetalle(borrador.destinoDetalle);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const borrador = { tipo, destinatario, procedencia, procedenciaDetalle, destino, destinoDetalle, lineas };
      if (lineas.length) localStorage.setItem(BORRADOR, JSON.stringify(borrador));
      else localStorage.removeItem(BORRADOR);
    } catch {}
  }, [tipo, destinatario, procedencia, procedenciaDetalle, destino, destinoDetalle, lineas]);

  // Después de guardar bien, el remito queda vacío para empezar otro.
  useEffect(() => {
    if (resultado?.ok) {
      setLineas([]);
      setDestinatario('');
      setProcedencia('');
      setProcedenciaDetalle('');
      setDestino('');
      setDestinoDetalle('');
      setObservaciones('');
      setAviso(null);
    }
  }, [resultado]);

  const especificar = tamano === TAMANO_A_ESPECIFICAR;
  const tamanoElegido = etiquetaTamano(tamano, limpiar(tamanoDetalle));
  const elegida = buscarEspecie(especies, especie);

  // Lo que hay en stock y lo que ya está en este remito, para la planta que se está por sumar.
  const enRemito = (codigo: string, clave: string) =>
    lineas
      .filter(l => l.codigo === codigo && claveLinea(l) === clave)
      .reduce((suma, l) => suma + cantidadConSigno(tipo, l.cantidad), 0);
  const claveElegida = claveStock(presentacion, tamanoElegido);
  const disponible =
    elegida && tamano && (!especificar || limpiar(tamanoDetalle)) ? (stock[elegida.codigo]?.[claveElegida] ?? 0) : null;

  // Tamaños escritos a mano en otros movimientos, para sugerirlos y que se escriban siempre igual.
  const yaEspecificados = [
    ...new Set(
      Object.values(stock)
        .flatMap(Object.keys)
        .map(clave => clave.split(' · ').slice(1).join(' · '))
        .filter(t => !tamanos.includes(t)),
    ),
  ].sort((a, b) => a.localeCompare(b, 'es'));

  function sumar() {
    const detalle = especificar ? limpiar(tamanoDetalle) : '';
    const n = Number(cantidad);
    const error = !elegida
      ? 'Elegí una especie de la lista.'
      : !tamano
        ? 'Elegí un tamaño.'
        : especificar && !detalle
          ? 'Escribí el tamaño.'
          : !Number.isInteger(n) || n === 0
            ? 'La cantidad tiene que ser un número entero distinto de cero.'
            : tipo !== 'Ajuste' && n < 0
              ? 'En entradas y salidas la cantidad va sin signo menos.'
              : '';
    if (error || !elegida) {
      setAviso({ ok: false, texto: error });
      return;
    }
    const nueva: LineaRemito = { codigo: elegida.codigo, presentacion, tamano, tamanoDetalle: detalle, cantidad: n };
    // Si ya hay una línea igual (misma especie, presentación y tamaño), se suma a esa.
    setLineas(actuales => {
      const i = actuales.findIndex(l => l.codigo === nueva.codigo && claveLinea(l) === claveLinea(nueva));
      if (i === -1) return [...actuales, nueva];
      return actuales
        .map((l, j) => (j === i ? { ...l, cantidad: l.cantidad + n } : l))
        .filter(l => l.cantidad !== 0);
    });
    setAviso({ ok: true, texto: `Sumado al remito: ${n} ${elegida.comun} (${presentacion.toLowerCase()}, ${tamanoElegido}).` });
    setCantidad('');
    setEspecie('');
    campoEspecie.current?.focus();
  }

  function guardar() {
    try {
      localStorage.setItem('responsable', responsable);
    } catch {}
    startTransition(() =>
      enviar({
        tipo,
        fecha,
        destinatario,
        procedencia,
        procedenciaDetalle,
        destino,
        destinoDetalle,
        responsable,
        observaciones,
        lineas,
      }),
    );
  }

  // Control de cada línea: en salidas y ajustes, que no se saque más de lo que hay.
  const filas = lineas.map(l => {
    const clave = claveLinea(l);
    const hay = stock[l.codigo]?.[clave] ?? 0;
    const queda = hay + enRemito(l.codigo, clave);
    return { linea: l, hay, sinStock: tipo !== 'Entrada' && queda < 0 };
  });
  const conSigno = tipo !== 'Ajuste' && lineas.some(l => l.cantidad < 0);
  const totalPlantas = lineas.reduce((suma, l) => suma + l.cantidad, 0);
  const faltaNombre = (lugar: string, detalle: string) => LUGARES_A_ESPECIFICAR.includes(lugar) && !limpiar(detalle);
  const problema = conSigno
    ? 'Hay cantidades negativas: solo se permiten en los ajustes.'
    : filas.some(f => f.sinStock)
      ? 'Hay líneas sin stock suficiente (en rojo).'
      : faltaNombre(procedencia, procedenciaDetalle)
        ? 'Falta escribir qué proveedor es (Procedencia).'
        : faltaNombre(destino, destinoDetalle)
          ? 'Falta escribir qué cliente es (Destino).'
          : '';

  return (
    <div className="cargar">
      <form
        className="formulario"
        onSubmit={ev => {
          ev.preventDefault();
          sumar();
        }}
        autoComplete="off"
      >
        <h2 className="seccion">Datos del remito</h2>

        <label>Tipo de movimiento</label>
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

        <div className="dos">
          <div>
            <label htmlFor="fecha">Fecha</label>
            <input id="fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="responsable">Responsable</label>
            <input
              id="responsable"
              placeholder="Quién lo carga"
              value={responsable}
              onChange={e => setResponsable(e.target.value)}
            />
          </div>
        </div>

        <div className="dos">
          <CampoLugar
            id="procedencia"
            titulo="Procedencia"
            opciones={PROCEDENCIAS}
            lugar={procedencia}
            detalle={procedenciaDetalle}
            onLugar={setProcedencia}
            onDetalle={setProcedenciaDetalle}
            sugeridos={sugerencias.proveedores}
          />
          <CampoLugar
            id="destino"
            titulo="Destino"
            opciones={DESTINOS}
            lugar={destino}
            detalle={destinoDetalle}
            onLugar={setDestino}
            onDetalle={setDestinoDetalle}
            sugeridos={sugerencias.clientes}
          />
        </div>

        <label htmlFor="destinatario">
          Destinatario <span className="opcional">(opcional)</span>
        </label>
        <input
          id="destinatario"
          list="lista-destinatarios"
          placeholder="Persona o contacto que recibe"
          maxLength={100}
          value={destinatario}
          onChange={e => setDestinatario(e.target.value)}
        />
        <datalist id="lista-destinatarios">
          {sugerencias.destinatarios.map(d => (
            <option key={d} value={d} />
          ))}
        </datalist>

        <label htmlFor="observaciones">Observaciones</label>
        <textarea
          id="observaciones"
          rows={2}
          placeholder="Opcional: dirección de entrega, n.º de remito del proveedor…"
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
        />

        <h2 className="seccion">Sumar plantas</h2>

        <label htmlFor="especie">Especie</label>
        <input
          id="especie"
          ref={campoEspecie}
          list="lista-especies"
          placeholder="Escribí el nombre o el código"
          value={especie}
          onChange={e => setEspecie(e.target.value)}
        />
        <datalist id="lista-especies">
          {especies.map(e => (
            <option key={e.codigo} value={etiquetaEspecie(e)}>
              {e.cientifico}
            </option>
          ))}
        </datalist>

        <label>Presentación</label>
        <div className="tipos" role="radiogroup" aria-label="Presentación">
          {presentaciones.map(p => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={presentacion === p}
              className={presentacion === p ? 'elegido' : undefined}
              onClick={() => setPresentacion(p)}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="dos">
          <div>
            <label htmlFor="tamano">Tamaño</label>
            <select id="tamano" value={tamano} onChange={e => setTamano(e.target.value)}>
              <option value="" disabled>
                Elegí un tamaño
              </option>
              {tamanos.map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cantidad">Cantidad</label>
            <input
              id="cantidad"
              type="number"
              step={1}
              inputMode="numeric"
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
            />
          </div>
        </div>
        {especificar && (
          <>
            <input
              id="tamano_detalle"
              className="renglon-extra"
              aria-label="Escribí el tamaño"
              placeholder="Escribí el tamaño (ej.: 5 m de altura)"
              list="lista-especificados"
              maxLength={60}
              value={tamanoDetalle}
              onChange={e => setTamanoDetalle(e.target.value)}
              autoFocus
            />
            <datalist id="lista-especificados">
              {yaEspecificados.map(t => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </>
        )}
        {disponible !== null && elegida && (
          <div className="ayuda">
            Hay {disponible} en {presentacion.toLowerCase()}, {tamanoElegido}
            {enRemito(elegida.codigo, claveElegida) !== 0 &&
              ` (en este remito: ${enRemito(elegida.codigo, claveElegida) > 0 ? '+' : ''}${enRemito(elegida.codigo, claveElegida)})`}
            .
          </div>
        )}

        <button type="submit" className="secundario">
          + Sumar
        </button>
        {aviso && <div className={aviso.ok ? 'mensaje ok' : 'mensaje error'}>{aviso.texto}</div>}
      </form>

      {/* El remito que se va armando. */}
      <aside className="remito" aria-live="polite">
        <div className="remito-cabecera">
          <div>
            <div className="remito-titulo">Remito</div>
            <div className="remito-numero">N.º se asigna al guardar</div>
          </div>
          <div className="remito-datos">
            <div>{tipo}</div>
            <div>{fecha ? fechaLegible(fecha) : ''}</div>
          </div>
        </div>
        {(procedencia || destino || destinatario || responsable) && (
          <div className="remito-extra">
            {procedencia && <div>Procedencia: {etiquetaLugar(procedencia, limpiar(procedenciaDetalle))}</div>}
            {destino && <div>Destino: {etiquetaLugar(destino, limpiar(destinoDetalle))}</div>}
            {destinatario && <div className="remito-destinatario">Destinatario: {destinatario}</div>}
            {responsable && <div>Responsable: {responsable}</div>}
          </div>
        )}

        <div className="tabla">
          <table>
            <thead>
              <tr>
                <th>Especie</th>
                <th>Presentación</th>
                <th className="num">Cant.</th>
                <th aria-label="Quitar"></th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 && (
                <tr>
                  <td colSpan={4} className="vacio">
                    Todavía no sumaste plantas.
                  </td>
                </tr>
              )}
              {filas.map(({ linea, hay, sinStock }, i) => (
                <tr key={linea.codigo + claveLinea(linea)} className={sinStock ? 'sin-stock' : undefined}>
                  <td>
                    {nombre.get(linea.codigo) ?? linea.codigo}
                    {sinStock && <div className="aviso">Hay {hay}</div>}
                  </td>
                  <td>
                    {linea.presentacion}
                    <div className="tamano-linea">{etiquetaTamano(linea.tamano, linea.tamanoDetalle)}</div>
                  </td>
                  <td className="num">{linea.cantidad}</td>
                  <td className="num">
                    <button
                      type="button"
                      className="quitar"
                      aria-label={`Quitar ${nombre.get(linea.codigo)}`}
                      onClick={() => setLineas(ls => ls.filter((_, j) => j !== i))}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Como en el remito impreso: las observaciones debajo del detalle y antes del total. */}
        {observaciones && <div className="remito-observaciones">Observaciones: {observaciones}</div>}

        <div className="remito-total">
          <span>Total</span>
          <b>
            {totalPlantas} {Math.abs(totalPlantas) === 1 ? 'planta' : 'plantas'}
          </b>
        </div>

        {problema && <div className="mensaje error">{problema}</div>}
        <button
          type="button"
          className="principal"
          disabled={guardando || lineas.length === 0 || problema !== ''}
          onClick={guardar}
        >
          {guardando ? 'Guardando…' : 'Guardar movimiento'}
        </button>
        {resultado && (
          <div className={resultado.ok ? 'mensaje ok' : 'mensaje error'}>
            {resultado.mensaje}
            {resultado.numero !== undefined && (
              <a className="enlace-remito" href={`/remitos/${resultado.numero}`} target="_blank" rel="noopener">
                Imprimir o descargar PDF
              </a>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

interface PropsLugar {
  id: string;
  titulo: string;
  opciones: string[];
  lugar: string;
  detalle: string;
  onLugar: (valor: string) => void;
  onDetalle: (valor: string) => void;
  /** Nombres ya usados de proveedores o clientes, para sugerirlos. */
  sugeridos: string[];
}

// Procedencia o destino: un desplegable y, si se elige "Proveedor" o "Cliente", un renglón para escribir cuál.
function CampoLugar({ id, titulo, opciones, lugar, detalle, onLugar, onDetalle, sugeridos }: PropsLugar) {
  const especificar = LUGARES_A_ESPECIFICAR.includes(lugar);
  return (
    <div>
      <label htmlFor={id}>
        {titulo} <span className="opcional">(opcional)</span>
      </label>
      <select id={id} value={lugar} onChange={e => onLugar(e.target.value)}>
        <option value="">Sin especificar</option>
        {opciones.map(o => (
          <option key={o}>{o}</option>
        ))}
      </select>
      {especificar && (
        <>
          <input
            id={`${id}_detalle`}
            className="renglon-extra"
            aria-label={`Escribí qué ${lugar.toLowerCase()} es`}
            placeholder="¿Cuál?"
            list={`lista-${id}`}
            maxLength={100}
            value={detalle}
            onChange={e => onDetalle(e.target.value)}
            autoFocus
          />
          <datalist id={`lista-${id}`}>
            {sugeridos.map(s => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </>
      )}
    </div>
  );
}
