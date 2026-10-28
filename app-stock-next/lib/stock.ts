// Cálculos y reglas que se usan tanto en el servidor como en la pantalla.
// El stock nunca se guarda: la base de datos lo calcula sumando los movimientos (ver lib/almacen.ts).
import { formatearCuit } from './cuit';
import type { Especie, Stock, StockPorDeposito, TipoMovimiento } from './tipos';

/**
 * Los depósitos de Native: cada uno lleva su propio stock.
 * 2026-10-28: "Goya" pasó a llamarse "Goya Vivero" y se sumó "Monteflorido". Para agregar o renombrar otro, se cambia
 * acá (y, si se renombra, se actualizan los datos ya guardados: ver el cambio de nombre en crearTablas, lib/almacen.ts).
 */
export const DEPOSITOS = ['Benavidez', 'Pilar', 'Goya Vivero', 'Monteflorido'];
/** Nombres viejos de un depósito, que se siguen aceptando (por ejemplo, remitos sin subir cargados antes del cambio). */
export const NOMBRES_VIEJOS: Record<string, string> = { Goya: 'Goya Vivero' };
/** "Goya Vivero, Pilar, Benavidez o Monteflorido", para los mensajes. */
export function depositosEnTexto(): string {
  return `${DEPOSITOS.slice(0, -1).join(', ')} o ${DEPOSITOS[DEPOSITOS.length - 1]}`;
}
/**
 * Puntos de partida y de llegada de un movimiento. Palma Sola, Proveedor y Cliente no llevan stock:
 * solo cambia el stock de los depósitos (ver efectos).
 */
export const PARTIDAS = ['Palma Sola', 'Goya Vivero', 'Monteflorido', 'Pilar', 'Benavidez', 'Proveedor'];
export const LLEGADAS = ['Palma Sola', 'Goya Vivero', 'Monteflorido', 'Pilar', 'Benavidez', 'Proveedor', 'Cliente'];
/** Con estos hay que escribir cuál (nombre del proveedor o del cliente). */
export const LUGARES_A_ESPECIFICAR = ['Proveedor', 'Cliente'];

export interface ReglaLugar {
  titulo: string;
  opciones: string[];
  obligatorio: boolean;
}

// Qué lugares se piden en cada tipo. null = ese campo no va. El punto de partida se guarda en "procedencia"
// y el de llegada (o el depósito de un ajuste) en "destino".
// Los remitos viejos ("Entrada", "Salida", "Pase") se muestran como un Movimiento.
export function lugaresDelTipo(tipo: TipoMovimiento | string): { procedencia: ReglaLugar | null; destino: ReglaLugar | null } {
  if (tipo === 'Ajuste') return { procedencia: null, destino: { titulo: 'Depósito', opciones: DEPOSITOS, obligatorio: true } };
  return {
    procedencia: { titulo: 'Punto de partida', opciones: PARTIDAS, obligatorio: true },
    destino: { titulo: 'Punto de llegada', opciones: LLEGADAS, obligatorio: true },
  };
}

/**
 * Qué le hace una línea de remito al stock de cada depósito:
 * un movimiento resta en el punto de partida y suma en el de llegada, si son depósitos (Palma Sola,
 * Proveedor y Cliente no llevan stock); un ajuste suma o resta, según su signo, en el depósito elegido.
 */
export function efectos(
  tipo: TipoMovimiento,
  procedencia: string,
  destino: string,
  cantidad: number,
): { deposito: string; cantidad: number }[] {
  if (tipo === 'Ajuste') return [{ deposito: destino, cantidad }];
  const n = Math.abs(cantidad);
  const cambios: { deposito: string; cantidad: number }[] = [];
  if (DEPOSITOS.includes(procedencia)) cambios.push({ deposito: procedencia, cantidad: -n });
  if (DEPOSITOS.includes(destino)) cambios.push({ deposito: destino, cantidad: n });
  return cambios;
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

// "Proveedor" + "Vivero El Ceibo" -> "Proveedor (Vivero El Ceibo)"; "Goya Vivero" -> "Goya Vivero".
// Con CUIT: "Cliente (Vivero X · CUIT 30-71792140-9)".
export function etiquetaLugar(lugar: string, detalle: string, cuit = ''): string {
  if (!LUGARES_A_ESPECIFICAR.includes(lugar) || !detalle) return lugar;
  return `${lugar} (${detalle}${cuit ? ` · CUIT ${formatearCuit(cuit)}` : ''})`;
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
