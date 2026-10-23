// Cálculos que se usan tanto en el servidor como en la pantalla.
// El stock nunca se guarda: la base de datos lo calcula sumando los movimientos (ver lib/almacen.ts).
import type { Especie, Stock, TipoMovimiento } from './tipos';

// Las salidas restan, las entradas suman y los ajustes van con su signo (+ o -).
// La misma regla está escrita en SQL en lib/almacen.ts: si cambia una, hay que cambiar la otra.
export function cantidadConSigno(tipo: TipoMovimiento, cantidad: number): number {
  if (tipo === 'Salida') return -Math.abs(cantidad);
  if (tipo === 'Entrada') return Math.abs(cantidad);
  return cantidad;
}

/** El tamaño que, al elegirlo, pide escribir el tamaño a mano. */
export const TAMANO_A_ESPECIFICAR = 'Especificar';

// Cómo se muestra el tamaño: si es "Especificar", lo que se escribió a mano.
export function etiquetaTamano(tamano: string, detalle: string): string {
  return tamano === TAMANO_A_ESPECIFICAR && detalle ? detalle : tamano;
}

// El stock se lleva por presentación y tamaño juntos: "Maceta · 3Lts".
export function claveStock(presentacion: string, tamano: string): string {
  return `${presentacion} · ${tamano}`;
}

// Las combinaciones de presentación y tamaño que tienen stock (distinto de cero), en orden:
// por presentación y por tamaño según las listas; los tamaños escritos a mano van al final, por nombre.
export function stockPorPresentacion(
  stock: Stock,
  codigo: string,
  presentaciones: string[],
  tamanos: string[],
): [clave: string, cantidad: number][] {
  const posicion = (clave: string) => {
    const [p, ...resto] = clave.split(' · ');
    const t = tamanos.indexOf(resto.join(' · '));
    return [presentaciones.indexOf(p), t === -1 ? tamanos.length : t] as const;
  };
  return Object.entries(stock[codigo] ?? {})
    .filter(([, n]) => n !== 0)
    .sort(([a], [b]) => {
      const [pa, ta] = posicion(a);
      const [pb, tb] = posicion(b);
      return pa - pb || ta - tb || a.localeCompare(b, 'es');
    });
}

export function totalEspecie(stock: Stock, codigo: string): number {
  return Object.values(stock[codigo] ?? {}).reduce((a, b) => a + b, 0);
}

export function bajoMinimo(stock: Stock, e: Especie): boolean {
  return e.minimo > 0 && totalEspecie(stock, e.codigo) < e.minimo;
}

// Cómo se muestra una especie en el buscador del formulario.
export function etiquetaEspecie(e: Especie): string {
  return `${e.comun} — ${e.codigo}`;
}

// Acepta lo que se eligió en el buscador o directamente el código.
export function buscarEspecie(especies: Especie[], texto: string): Especie | undefined {
  const t = texto.trim().toLowerCase();
  return especies.find(e => etiquetaEspecie(e).toLowerCase() === t || e.codigo.toLowerCase() === t);
}

// "2026-10-20" -> "20/10/2026"
export function fechaLegible(fecha: string): string {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}
