export const TIPOS = ['Entrada', 'Salida', 'Ajuste'] as const;
export type TipoMovimiento = (typeof TIPOS)[number];

export interface Especie {
  codigo: string;
  comun: string;
  cientifico: string;
  /** Regiones donde es nativa, separadas por coma (ej. "Chaco, Espinal"). */
  region: string;
  /** Mínimo para el total de la especie (todos los tamaños). 0 = sin aviso. */
  minimo: number;
}

export interface Movimiento {
  id: number;
  /** Fecha del movimiento, en formato AAAA-MM-DD. */
  fecha: string;
  tipo: TipoMovimiento;
  codigo: string;
  tamano: string;
  /** Entradas y salidas van sin signo; los ajustes pueden ser negativos. */
  cantidad: number;
  responsable: string;
  observaciones: string;
  /** Momento en que se cargó, en formato ISO. */
  registrado: string;
}

export interface Datos {
  especies: Especie[];
  tamanos: string[];
  movimientos: Movimiento[];
}

/** { código de especie: { tamaño: cantidad } } */
export type Stock = Record<string, Record<string, number>>;
