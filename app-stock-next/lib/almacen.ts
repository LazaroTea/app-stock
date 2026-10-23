// Lee y guarda los datos en la base de datos Neon (Postgres). Solo corre en el servidor.
// La conexión sale de la variable DATABASE_URL: en la compu está en .env.local
// y en Vercel la carga sola la integración con Neon.
//
// La primera vez que se usa, crea las tablas y carga las especies nativas y las presentaciones
// (solo si están vacías: nunca pisa datos que ya existen). El stock arranca en cero.
import 'server-only';
import { neon } from '@neondatabase/serverless';
import { ESPECIES_NATIVAS } from './especies-nativas';
import { claveStock } from './stock';
import type { Especie, Movimiento, Stock, TipoMovimiento } from './tipos';

/** Cómo se entregan las plantas, en el orden en que se muestran. */
export const PRESENTACIONES = ['Maceta', 'Raíz desnuda', 'Envasado'];

/**
 * Tamaños: los de la lista desplegable de la columna "Tamaño" de la planilla de cotizaciones del vivero
 * (pestaña CONSULTATIO), ordenados por grupo. "2,5Mts" en la planilla aparecía partido en "2" y "5Mts".
 * Después de creada la base, se agregan o cambian desde el panel de Neon (tabla "tamanos").
 */
export const TAMANOS = [
  // Grosor del tronco (cm)
  'Varillon', '4-6', '6-8', '8-10', '10-12', '12-14', '14-16', '16-18', '20-22', '20-25', '26-30', '12-14RD',
  // Altura
  '150-180cm', '2,5Mts', '3Mts', '4Mts',
  // Volumen del envase
  '1Lt', '3Lts', '4Lts', '10Lts', '15Lts', '20Lts', '30Lts', '40Lts', '50Lts', 'E65L',
  // Categoría
  'Semi Ejemplar', 'Ejemplar', 'Super Ejemplar',
  // Otros
  '1Kg', 'Especificar',
];

// Número cualquiera que identifica el "candado" de la base (ver más abajo).
const CANDADO = 20261020;

// Cuenta cada movimiento con su signo: las salidas restan, las entradas suman y los ajustes van como están.
const CANTIDAD_CON_SIGNO = `CASE tipo WHEN 'Salida' THEN -abs(cantidad) WHEN 'Entrada' THEN abs(cantidad) ELSE cantidad END`;

function conexion() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error('Falta la variable DATABASE_URL con la conexión a la base de datos (ver README).');
  return neon(url);
}

// Prepara las tablas una sola vez por servidor.
let preparada: Promise<void> | null = null;
function prepararBase(): Promise<void> {
  preparada ??= crearTablas().catch(e => {
    preparada = null; // si falló, se reintenta en el próximo pedido
    throw e;
  });
  return preparada;
}

async function crearTablas() {
  const sql = conexion();
  const presentaciones = PRESENTACIONES.map((nombre, orden) => ({ nombre, orden }));
  const tamanos = TAMANOS.map((nombre, orden) => ({ nombre, orden }));
  // Todo en una transacción con candado: si dos pedidos llegan juntos al principio, el segundo espera
  // al primero y no carga los datos dos veces.
  await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(${CANDADO})`,
    // Cambio del 2026-10-23: el stock pasó de un solo "tamaño" (Maceta 1 L, 3 L...) a "presentación"
    // (Maceta, Raíz desnuda, Envasado) + "tamaño" (la lista de la planilla). En una base con el formato
    // anterior (sin presentación) se borran los movimientos (eran inventados), la tabla de tamaños vieja
    // y los stocks mínimos inventados. Solo pasa una vez.
    sql`DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'movimientos')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                           WHERE table_name = 'movimientos' AND column_name = 'presentacion') THEN
          DROP TABLE movimientos;
          DROP TABLE IF EXISTS tamanos;
          UPDATE especies SET minimo = 0;
        END IF;
      END $$`,
    sql`CREATE TABLE IF NOT EXISTS especies (
      codigo text PRIMARY KEY,
      comun text NOT NULL,
      cientifico text NOT NULL DEFAULT '',
      minimo integer NOT NULL DEFAULT 0
    )`,
    // Columna agregada después: en una base creada antes, se suma sin tocar los datos.
    sql`ALTER TABLE especies ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT ''`,
    sql`CREATE TABLE IF NOT EXISTS presentaciones (
      nombre text PRIMARY KEY,
      orden integer NOT NULL DEFAULT 0
    )`,
    sql`CREATE TABLE IF NOT EXISTS tamanos (
      nombre text PRIMARY KEY,
      orden integer NOT NULL DEFAULT 0
    )`,
    sql`CREATE TABLE IF NOT EXISTS movimientos (
      id serial PRIMARY KEY,
      fecha date NOT NULL,
      tipo text NOT NULL CHECK (tipo IN ('Entrada', 'Salida', 'Ajuste')),
      codigo text NOT NULL REFERENCES especies (codigo),
      presentacion text NOT NULL REFERENCES presentaciones (nombre),
      tamano text NOT NULL REFERENCES tamanos (nombre),
      cantidad integer NOT NULL,
      responsable text NOT NULL DEFAULT '',
      observaciones text NOT NULL DEFAULT '',
      registrado timestamptz NOT NULL DEFAULT now()
    )`,
    sql`INSERT INTO especies (codigo, comun, cientifico, region, minimo)
      SELECT * FROM json_to_recordset(${JSON.stringify(ESPECIES_NATIVAS)}::json)
        AS x (codigo text, comun text, cientifico text, region text, minimo integer)
      WHERE NOT EXISTS (SELECT 1 FROM especies)`,
    sql`INSERT INTO presentaciones (nombre, orden)
      SELECT * FROM json_to_recordset(${JSON.stringify(presentaciones)}::json) AS x (nombre text, orden integer)
      WHERE NOT EXISTS (SELECT 1 FROM presentaciones)`,
    sql`INSERT INTO tamanos (nombre, orden)
      SELECT * FROM json_to_recordset(${JSON.stringify(tamanos)}::json) AS x (nombre text, orden integer)
      WHERE NOT EXISTS (SELECT 1 FROM tamanos)`,
  ]);
}

export interface Catalogo {
  especies: Especie[];
  presentaciones: string[];
  tamanos: string[];
}

/** Las especies (por nombre), las presentaciones y los tamaños (en su orden). */
export async function leerCatalogo(): Promise<Catalogo> {
  await prepararBase();
  const sql = conexion();
  const [especies, presentaciones, tamanos] = await Promise.all([
    sql`SELECT codigo, comun, cientifico, region, minimo FROM especies ORDER BY comun`,
    sql`SELECT nombre FROM presentaciones ORDER BY orden, nombre`,
    sql`SELECT nombre FROM tamanos ORDER BY orden, nombre`,
  ]);
  return {
    especies: especies as Especie[],
    presentaciones: presentaciones.map(p => String(p.nombre)),
    tamanos: tamanos.map(t => String(t.nombre)),
  };
}

/** El stock actual, sumado por la base de datos: { código: { "presentación · tamaño": cantidad } }. */
export async function leerStock(): Promise<Stock> {
  await prepararBase();
  const filas = await conexion().query(
    `SELECT codigo, presentacion, tamano, SUM(${CANTIDAD_CON_SIGNO})::int AS cantidad
     FROM movimientos GROUP BY codigo, presentacion, tamano`,
  );
  const stock: Stock = {};
  for (const f of filas) (stock[f.codigo] ??= {})[claveStock(f.presentacion, f.tamano)] = f.cantidad;
  return stock;
}

/** Los últimos movimientos (los más nuevos primero) y cuántos hay en total. */
export async function leerUltimos(cantidad: number): Promise<{ movimientos: Movimiento[]; total: number }> {
  await prepararBase();
  const sql = conexion();
  const [filas, [{ total }]] = await Promise.all([
    sql`SELECT id, to_char(fecha, 'YYYY-MM-DD') AS fecha, tipo, codigo, presentacion, tamano, cantidad,
          responsable, observaciones, registrado::text AS registrado
        FROM movimientos ORDER BY fecha DESC, id DESC LIMIT ${cantidad}`,
    sql`SELECT count(*)::int AS total FROM movimientos`,
  ]);
  return { movimientos: filas as Movimiento[], total };
}

export interface MovimientoNuevo {
  fecha: string;
  tipo: TipoMovimiento;
  codigo: string;
  presentacion: string;
  tamano: string;
  cantidad: number;
  /** La cantidad que suma o resta al stock (negativa en las salidas). */
  cambio: number;
  responsable: string;
  observaciones: string;
}

/**
 * Guarda el movimiento solo si el stock no queda negativo.
 * Devuelve cuánto había antes y si se guardó.
 */
export async function guardarMovimiento(m: MovimientoNuevo): Promise<{ habia: number; guardado: boolean }> {
  await prepararBase();
  const sql = conexion();
  // El candado hace que dos personas guardando al mismo tiempo se atiendan de a una,
  // así ninguna de las dos puede dejar el stock negativo.
  const [, [resultado]] = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(${CANDADO})`,
    sql.query(
      `WITH actual AS (
         SELECT COALESCE(SUM(${CANTIDAD_CON_SIGNO}), 0)::int AS habia
         FROM movimientos WHERE codigo = $1 AND presentacion = $2 AND tamano = $9
       ), nuevo AS (
         INSERT INTO movimientos (fecha, tipo, codigo, presentacion, tamano, cantidad, responsable, observaciones)
         SELECT $3, $4, $1, $2, $9, $5, $6, $7 FROM actual WHERE habia + $8 >= 0
         RETURNING id
       )
       SELECT habia, EXISTS (SELECT 1 FROM nuevo) AS guardado FROM actual`,
      [m.codigo, m.presentacion, m.fecha, m.tipo, m.cantidad, m.responsable, m.observaciones, m.cambio, m.tamano],
    ),
  ]);
  return { habia: resultado.habia, guardado: resultado.guardado };
}
