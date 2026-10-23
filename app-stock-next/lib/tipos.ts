export const TIPOS = ['Entrada', 'Salida', 'Ajuste'] as const;
export type TipoMovimiento = (typeof TIPOS)[number];

export interface Especie {
  codigo: string;
  comun: string;
  cientifico: string;
  /** Regiones donde es nativa, separadas por coma (ej. "Chaco, Espinal"), o "Exótica". */
  region: string;
  /** "Árbol" o "Palmera" (las palmeras tienen requisitos SENASA aparte, Res. 64/2026). */
  grupo: string;
  /** Mínimo para el total de la especie (todas las presentaciones). 0 = sin aviso. */
  minimo: number;
}

export interface Movimiento {
  id: number;
  /** Fecha del movimiento, en formato AAAA-MM-DD. */
  fecha: string;
  tipo: TipoMovimiento;
  codigo: string;
  /** Maceta, Raíz desnuda o Envasado. */
  presentacion: string;
  /** De la lista de tamaños (ej. "12-14", "3Lts", "Ejemplar"). */
  tamano: string;
  /** Lo escrito a mano cuando el tamaño es "Especificar"; vacío en los demás. */
  tamanoDetalle: string;
  /** Entradas y salidas van sin signo; los ajustes pueden ser negativos. */
  cantidad: number;
  responsable: string;
  observaciones: string;
  /** Momento en que se cargó. */
  registrado: string;
}

/** { código de especie: { "presentación · tamaño": cantidad } } (ver claveStock en lib/stock.ts) */
export type Stock = Record<string, Record<string, number>>;
