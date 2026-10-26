'use client';
// Remitos que se cargaron sin señal: quedan guardados en este celu (localStorage) hasta que se pueden subir.
// Cada uno lleva una "clave de envío" única: si el mismo remito llega dos veces al servidor, no se duplica.
import { useSyncExternalStore } from 'react';
import type { RemitoEnviado } from '@/app/acciones';

const CLAVE = 'remitos-pendientes';
const AVISO = 'pendientes-cambiaron';

export interface Pendiente {
  clave: string;
  /** Quién lo cargó: solo ese usuario lo sube (el servidor pone el responsable según quien tiene la sesión abierta). */
  usuario: string;
  /** Cuándo se armó (ISO), para mostrarlo. */
  creado: string;
  remito: RemitoEnviado;
  /** Por qué el servidor lo rechazó (un error del remito, no de la señal): queda esperando que se descarte o se revise. */
  error?: string;
}

/** Una clave al azar para identificar un remito (con crypto.randomUUID cuando el navegador lo tiene). */
export function nuevaClaveEnvio(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

function leer(): Pendiente[] {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function guardar(lista: Pendiente[]) {
  try {
    if (lista.length) localStorage.setItem(CLAVE, JSON.stringify(lista));
    else localStorage.removeItem(CLAVE);
  } catch {}
  cache = null;
  window.dispatchEvent(new Event(AVISO));
}

export function leerPendientes(): Pendiente[] {
  return leer();
}

/** Agrega un remito a la cola. Devuelve false si el celu no dejó guardarlo (memoria llena o navegación privada). */
export function agregarPendiente(p: Pendiente): boolean {
  const lista = leer().filter(x => x.clave !== p.clave);
  lista.push(p);
  guardar(lista);
  // Se vuelve a leer: si se guardó de verdad, tiene que estar.
  return leer().some(x => x.clave === p.clave);
}

export function quitarPendiente(clave: string) {
  guardar(leer().filter(p => p.clave !== clave));
}

export function marcarError(clave: string, error: string) {
  guardar(leer().map(p => (p.clave === clave ? { ...p, error } : p)));
}

export function limpiarError(clave: string) {
  guardar(leer().map(p => (p.clave === clave ? { ...p, error: undefined } : p)));
}

// Para que React vea la lista como "la misma" mientras no cambie (si no, se vuelve a dibujar sin parar).
let cache: { texto: string; lista: Pendiente[] } | null = null;
const VACIA: Pendiente[] = [];

function instantanea(): Pendiente[] {
  let texto = '';
  try {
    texto = localStorage.getItem(CLAVE) ?? '';
  } catch {}
  if (!texto) return VACIA;
  if (cache?.texto !== texto) cache = { texto, lista: leer() };
  return cache.lista;
}

function suscribir(avisar: () => void) {
  window.addEventListener(AVISO, avisar);
  window.addEventListener('storage', avisar); // otra pestaña
  return () => {
    window.removeEventListener(AVISO, avisar);
    window.removeEventListener('storage', avisar);
  };
}

/** La lista de pendientes, siempre al día (se actualiza sola cuando cambia). */
export function usePendientes(): Pendiente[] {
  return useSyncExternalStore(suscribir, instantanea, () => VACIA);
}

/** Si el celu cree que tiene conexión (no garantiza que haya señal de verdad: el envío puede fallar igual). */
export function useConectado(): boolean {
  return useSyncExternalStore(
    avisar => {
      window.addEventListener('online', avisar);
      window.addEventListener('offline', avisar);
      return () => {
        window.removeEventListener('online', avisar);
        window.removeEventListener('offline', avisar);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}
