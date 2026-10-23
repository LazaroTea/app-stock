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

// El stock se lleva por presentación y tamaño juntos: "Maceta · 3Lts".
export function claveStock(presentacion: string, tamano: string): string {
  return `${presentacion} · ${tamano}`;
}

// Las combinaciones de presentación y tamaño que tienen stock (distinto de cero), en orden.
export function stockPorPresentacion(
  stock: Stock,
  codigo: string,
  presentaciones: string[],
  tamanos: string[],
): [clave: string, cantidad: number][] {
  return presentaciones
    .flatMap(p => tamanos.map(t => claveStock(p, t)))
    .map(clave => [clave, stock[codigo]?.[clave] ?? 0] as [string, number])
    .filter(([, n]) => n !== 0);
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
