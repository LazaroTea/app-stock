/**
 * Tipos de movimiento (ver las reglas en lugaresDelTipo y efectos, en lib/stock.ts):
 * - Movimiento: de un punto de partida a un punto de llegada. Resta en el depósito de partida y suma en el
 *   de llegada (proveedor y cliente no llevan stock).
 * - Ajuste: corrige el stock de un depósito (positivo o negativo).
 * Los remitos de antes del 2026-10-24 eran "Entrada", "Salida" o "Pase": se convirtieron a "Movimiento".
 */
export const TIPOS = ['Movimiento', 'Ajuste'] as const;
export type TipoMovimiento = (typeof TIPOS)[number];

export interface Especie {
  codigo: string;
  comun: string;
  cientifico: string;
  /** Regiones donde es nativa, separadas por coma (ej. "Chaco, Espinal"), o "Exótica". */
  region: string;
  /** "Árbol", "Palmera" o "Frutal" (palmeras y varios frutales tienen requisitos SENASA, Res. 64/2026). */
  grupo: string;
  /** Mínimo para el total de la especie (todas las presentaciones). 0 = sin aviso. */
  minimo: number;
}

/** Un cambio de stock en un depósito (un pase genera dos: uno en cada depósito). */
export interface Movimiento {
  id: number;
  /** Fecha del remito, en formato AAAA-MM-DD. */
  fecha: string;
  tipo: TipoMovimiento;
  /** El depósito donde cambia el stock. */
  deposito: string;
  codigo: string;
  /** Envasado, Maceta o Raíz desnuda. */
  presentacion: string;
  /** De la lista de tamaños (ej. "12-14", "3Lts", "Ejemplar"). */
  tamano: string;
  /** Lo escrito a mano cuando el tamaño es "Especificar"; vacío en los demás. */
  tamanoDetalle: string;
  /** Lo que suma (+) o resta (-) en el depósito. */
  cantidad: number;
  responsable: string;
  remito: number;
  /** Si el remito está anulado: el movimiento se muestra, pero no cuenta en el stock. */
  anulado: boolean;
}

/** Una línea de un remito: qué planta, cómo se entrega y cuántas. */
export interface LineaRemito {
  codigo: string;
  presentacion: string;
  tamano: string;
  /** Lo escrito a mano cuando el tamaño es "Especificar"; vacío en los demás. */
  tamanoDetalle: string;
  /** Sin signo en entradas, salidas y pases; con signo en los ajustes. */
  cantidad: number;
}

/**
 * Roles (ver lib/permisos.ts):
 * - Administrador: puede todo, incluso modificar y anular remitos.
 * - Colaborador: puede cargar movimientos y ajustes (y ver el stock), pero no modificar ni anular.
 */
export const ROLES = ['Administrador', 'Colaborador'] as const;
export type Rol = (typeof ROLES)[number];

/** La persona que inició sesión. */
export interface Usuario {
  id: number;
  nombre: string;
  rol: Rol;
  /** La clave es provisoria (la inicial o una dada por un administrador): hay que cambiarla antes de seguir. */
  cambiarClave: boolean;
}

/** { código de especie: { "presentación · tamaño": cantidad } } (ver claveStock en lib/stock.ts) */
export type Stock = Record<string, Record<string, number>>;

/** El stock de cada depósito: { depósito: Stock }. */
export type StockPorDeposito = Record<string, Stock>;
