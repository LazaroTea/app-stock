// Cálculos y reglas que se usan tanto en el servidor como en la pantalla.
// El stock nunca se guarda: la base de datos lo calcula sumando los movimientos (ver lib/almacen.ts).
import type { Especie, Stock, StockPorDeposito, TipoMovimiento } from './tipos';

/** Los depósitos de Native: cada uno lleva su propio stock. */
export const DEPOSITOS = ['Benavidez', 'Pilar', 'Goya'];
/** De dónde pueden venir las entradas y a dónde pueden ir las salidas (sin stock propio). */
export const ORIGENES_EXTERNOS = ['Palma Sola', 'Proveedor'];
export const DESTINOS_EXTERNOS = ['Palma Sola', 'Cliente'];
/** Con estos hay que escribir cuál (nombre del proveedor o del cliente). */
export const LUGARES_A_ESPECIFICAR = ['Proveedor', 'Cliente'];

export interface ReglaLugar {
  titulo: string;
  opciones: string[];
  obligatorio: boolean;
}

// Qué lugares se piden en cada tipo de movimiento. null = ese campo no va.
export function lugaresDelTipo(tipo: TipoMovimiento): { procedencia: ReglaLugar | null; destino: ReglaLugar | null } {
  const depositoOrigen = { titulo: 'Depósito de origen', opciones: DEPOSITOS, obligatorio: true };
  const depositoDestino = { titulo: 'Depósito de destino', opciones: DEPOSITOS, obligatorio: true };
  switch (tipo) {
    case 'Entrada':
      return { procedencia: { titulo: 'Procedencia', opciones: ORIGENES_EXTERNOS, obligatorio: false }, destino: depositoDestino };
    case 'Salida':
      return { procedencia: depositoOrigen, destino: { titulo: 'Destino', opciones: DESTINOS_EXTERNOS, obligatorio: false } };
    case 'Pase':
      return { procedencia: depositoOrigen, destino: depositoDestino };
    case 'Ajuste':
      return { procedencia: null, destino: { titulo: 'Depósito', opciones: DEPOSITOS, obligatorio: true } };
  }
}

/**
 * Qué le hace una línea de remito al stock de cada depósito:
 * la entrada suma en el destino, la salida resta en el origen, el pase resta en el origen y suma en el
 * destino, y el ajuste suma o resta (según su signo) en el depósito elegido.
 */
export function efectos(
  tipo: TipoMovimiento,
  procedencia: string,
  destino: string,
  cantidad: number,
): { deposito: string; cantidad: number }[] {
  const n = Math.abs(cantidad);
  switch (tipo) {
    case 'Entrada':
      return [{ deposito: destino, cantidad: n }];
    case 'Salida':
      return [{ deposito: procedencia, cantidad: -n }];
    case 'Pase':
      return [
        { deposito: procedencia, cantidad: -n },
        { deposito: destino, cantidad: n },
      ];
    case 'Ajuste':
      return [{ deposito: destino, cantidad }];
  }
}

// El stock de un depósito, o de todos sumados si deposito es "".
export function stockDe(porDeposito: StockPorDeposito, deposito: string): Stock {
  if (deposito) return porDeposito[deposito] ?? {};
  const suma: Stock = {};
  for (const stock of Object.values(porDeposito)) {
    for (const [codigo, claves] of Object.entries(stock)) {
      for (const [clave, n] of Object.entries(claves)) {
        (suma[codigo] ??= {})[clave] = (suma[codigo][clave] ?? 0) + n;
      }
    }
  }
  return suma;
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

// "Proveedor" + "Vivero El Ceibo" -> "Proveedor (Vivero El Ceibo)"; "Goya" -> "Goya".
export function etiquetaLugar(lugar: string, detalle: string): string {
  return LUGARES_A_ESPECIFICAR.includes(lugar) && detalle ? `${lugar} (${detalle})` : lugar;
}

// 12 -> "000012"
export function numeroRemito(numero: number): string {
  return String(numero).padStart(6, '0');
}

// "2026-10-20" -> "20/10/2026"
export function fechaLegible(fecha: string): string {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}
