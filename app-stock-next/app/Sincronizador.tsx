'use client';
// Lo que hace que la app aguante la falta de señal:
//  1. Registra el "service worker" (public/sw.js): guarda las pantallas en el celu para poder abrirlas sin señal.
//  2. Sube solos los remitos que se cargaron sin conexión (la cola de lib/pendientes.ts), sin duplicarlos.
//  3. Avisa arriba cuando no hay conexión y cuántos remitos esperan subir.
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { registrarRemito, type Resultado } from './acciones';
import {
  leerPendientes,
  limpiarError,
  quitarPendiente,
  marcarError,
  useConectado,
  usePendientes,
  type Pendiente,
} from '@/lib/pendientes';
import { etiquetaLugar, fechaLegible } from '@/lib/stock';

// Pantallas que se descargan de antemano (con señal) para poder abrirlas sin señal.
const PANTALLAS = ['/', '/cargar', '/ultimos'];
const CADA_CUANTO_SE_ACTUALIZA = 10 * 60 * 1000;

// Descarga las pantallas y los archivos que usan; el service worker se los queda.
async function prepararParaSinSenal() {
  try {
    const ultima = Number(localStorage.getItem('pantallas-preparadas') ?? 0);
    if (Date.now() - ultima < CADA_CUANTO_SE_ACTUALIZA) return;
    for (const ruta of PANTALLAS) {
      const respuesta = await fetch(ruta, { headers: { Accept: 'text/html' }, credentials: 'same-origin' });
      if (!respuesta.ok || respuesta.redirected) return; // sin sesión: no hay nada que guardar
      const html = await respuesta.text();
      const archivos = [...new Set(html.match(/\/_next\/static\/[^"'\\\s)<>]+/g) ?? [])];
      await Promise.all(archivos.map(a => fetch(a).catch(() => null)));
    }
    localStorage.setItem('pantallas-preparadas', String(Date.now()));
  } catch {
    // sin señal: se intenta de nuevo más tarde
  }
}

function recorrido(p: Pendiente['remito']): string {
  if (p.tipo === 'Ajuste') return `Ajuste en ${p.destino || '—'}`;
  const partida = p.procedencia ? etiquetaLugar(p.procedencia, p.procedenciaDetalle) : '';
  const llegada = p.destino ? etiquetaLugar(p.destino, p.destinoDetalle) : '';
  return [partida, llegada].filter(Boolean).join(' → ');
}

export default function Sincronizador({ usuario }: { usuario: string }) {
  const router = useRouter();
  const pendientes = usePendientes();
  const conectado = useConectado();
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState('');
  const [sinSesion, setSinSesion] = useState(false);
  const ocupado = useRef(false);

  // Sube, de a uno y en orden, los remitos de este usuario. Si se corta la señal, se frena y se reintenta después.
  const subir = useCallback(async () => {
    if (ocupado.current || !navigator.onLine) return;
    const lista = leerPendientes().filter(p => p.usuario === usuario && !p.error);
    if (lista.length === 0) return;
    ocupado.current = true;
    setSubiendo(true);
    let subidos = 0;
    let faltaSesion = false;
    try {
      for (const p of lista) {
        let r: Resultado;
        try {
          r = await registrarRemito(null, { ...p.remito, claveEnvio: p.clave });
        } catch {
          break; // sin señal: queda para la próxima
        }
        if (r.ok) {
          quitarPendiente(p.clave);
          subidos++;
        } else if (r.codigo === 'sin-sesion') {
          faltaSesion = true;
          break;
        } else if (r.codigo === 'temporal') {
          break;
        } else {
          marcarError(p.clave, r.mensaje); // un error del remito: no sirve reintentar igual
        }
      }
    } finally {
      ocupado.current = false;
      setSubiendo(false);
    }
    setSinSesion(faltaSesion);
    if (subidos > 0) {
      setAviso(`Se ${subidos === 1 ? 'subió 1 remito' : `subieron ${subidos} remitos`} que estaban esperando.`);
      router.refresh();
    }
  }, [usuario, router]);

  // Service worker (solo en la app publicada; en desarrollo molestaría).
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  // Cuándo intentar subir: al abrir, al volver la conexión, al volver a la app y cada 30 segundos.
  useEffect(() => {
    subir();
    prepararParaSinSenal();
    const alVolver = () => {
      subir();
      prepararParaSinSenal();
    };
    const alVerLaApp = () => document.visibilityState === 'visible' && alVolver();
    window.addEventListener('online', alVolver);
    document.addEventListener('visibilitychange', alVerLaApp);
    const reloj = setInterval(subir, 30_000);
    return () => {
      window.removeEventListener('online', alVolver);
      document.removeEventListener('visibilitychange', alVerLaApp);
      clearInterval(reloj);
    };
  }, [subir]);

  // Se agregó uno nuevo (se cortó el pedido aunque el celu creía tener señal): se reintenta enseguida.
  useEffect(() => {
    if (pendientes.length === 0) return;
    const espera = setTimeout(subir, 4000);
    return () => clearTimeout(espera);
  }, [pendientes.length, subir]);

  useEffect(() => {
    if (!aviso) return;
    const espera = setTimeout(() => setAviso(''), 8000);
    return () => clearTimeout(espera);
  }, [aviso]);

  const propios = pendientes.filter(p => p.usuario === usuario);
  const ajenos = pendientes.length - propios.length;
  const esperando = propios.filter(p => !p.error).length;

  if (conectado && pendientes.length === 0 && !aviso) return null;

  return (
    <div className="estado-red-caja no-imprimir" role="status">
      {!conectado && (
        <div className="estado-red sin-conexion">
          <b>Sin conexión.</b> Podés seguir cargando: lo que guardes queda en este celu y se sube solo cuando vuelva la
          señal. Para modificar o anular un remito hace falta conexión.
        </div>
      )}
      {aviso && <div className="estado-red ok">{aviso}</div>}
      {sinSesion && esperando > 0 && (
        <div className="estado-red mal">
          Tu sesión se cerró, por eso no se pudieron subir los remitos. Tocá <b>Salir</b> (arriba) y volvé a ingresar:
          siguen guardados en este celu.
        </div>
      )}
      {pendientes.length > 0 && (
        <div className="estado-red pendientes">
          <div className="estado-red-titulo">
            <b>
              {propios.length} {propios.length === 1 ? 'remito' : 'remitos'} sin subir
            </b>
            {subiendo ? (
              <span>Subiendo…</span>
            ) : (
              conectado &&
              esperando > 0 && (
                <button type="button" className="boton-texto" onClick={subir}>
                  Subir ahora
                </button>
              )
            )}
          </div>
          <details>
            <summary>Ver cuáles</summary>
            <ul>
              {propios.map(p => (
                <li key={p.clave}>
                  <div>
                    {fechaLegible(p.remito.fecha)} · {p.remito.tipo}: {recorrido(p.remito)} ·{' '}
                    {p.remito.lineas.length} {p.remito.lineas.length === 1 ? 'línea' : 'líneas'}
                  </div>
                  {p.error && (
                    <div className="mal">
                      No se pudo subir: {p.error}{' '}
                      <button type="button" className="boton-texto" onClick={() => limpiarError(p.clave)}>
                        Reintentar
                      </button>
                      <button
                        type="button"
                        className="boton-texto"
                        onClick={() => {
                          if (confirm('¿Descartar este remito? Se borra de este celu y no se sube.')) quitarPendiente(p.clave);
                        }}
                      >
                        Descartar
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {ajenos > 0 && (
              <p className="ayuda">
                Hay {ajenos} {ajenos === 1 ? 'remito' : 'remitos'} de otra persona en este celu: se sube cuando ella
                ingrese.
              </p>
            )}
          </details>
        </div>
      )}
    </div>
  );
}
