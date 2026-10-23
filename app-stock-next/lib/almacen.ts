// Lee y guarda los datos en la base de datos Neon (Postgres). Solo corre en el servidor.
// La conexión sale de la variable DATABASE_URL: en la compu está en .env.local
// y en Vercel la carga sola la integración con Neon.
//
// La primera vez que se usa, crea las tablas y las llena con los datos inventados
// (solo si están vacías: nunca pisa datos que ya existen).
import 'server-only';
import { neon } from '@neondatabase/serverless';
import { crearDatosIniciales } from './datos-inventados';
import type { Especie, Movimiento, Stock, TipoMovimiento } from './tipos';

// Número cualquiera que identifica el "candado" de la base (ver más abajo).
const CANDADO = 20261020;

// Cuenta cada movimiento con su signo: las salidas restan, las entradas suman y los ajustes van como están.
const CANTIDAD_CON_SIGNO = `CASE tipo WHEN 'Salida' THEN -abs(cantidad) WHEN 'Entrada' THEN abs(cantidad) ELSE cantidad END`;

function conexion() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error('Falta la variable DATABASE_URL con la conexión a la base de datos (ver README).');
  return neon(url);
}

// Crea las tablas y carga los datos de ejemplo una sola vez por servidor.
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
  const datos = crearDatosIniciales();
  const tamanos = datos.tamanos.map((nombre, orden) => ({ nombre, orden }));
  // Todo en una transacción con candado: si dos pedidos llegan juntos al principio, el segundo espera
  // al primero y no carga los datos de ejemplo dos veces.
  await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(${CANDADO})`,
    sql`CREATE TABLE IF NOT EXISTS especies (
      codigo text PRIMARY KEY,
      comun text NOT NULL,
      cientifico text NOT NULL DEFAULT '',
      minimo integer NOT NULL DEFAULT 0
    )`,
    // Columna agregada después: en una base creada antes, se suma sin tocar los datos.
    sql`ALTER TABLE especies ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT ''`,
    sql`CREATE TABLE IF NOT EXISTS tamanos (
      nombre text PRIMARY KEY,
      orden integer NOT NULL DEFAULT 0
    )`,
    sql`CREATE TABLE IF NOT EXISTS movimientos (
      id serial PRIMARY KEY,
      fecha date NOT NULL,
      tipo text NOT NULL CHECK (tipo IN ('Entrada', 'Salida', 'Ajuste')),
      codigo text NOT NULL REFERENCES especies (codigo),
      tamano text NOT NULL REFERENCES tamanos (nombre),
      cantidad integer NOT NULL,
      responsable text NOT NULL DEFAULT '',
      observaciones text NOT NULL DEFAULT '',
      registrado timestamptz NOT NULL DEFAULT now()
    )`,
    sql`INSERT INTO especies (codigo, comun, cientifico, region, minimo)
      SELECT * FROM json_to_recordset(${JSON.stringify(datos.especies)}::json)
        AS x (codigo text, comun text, cientifico text, region text, minimo integer)
      WHERE NOT EXISTS (SELECT 1 FROM especies)`,
    sql`INSERT INTO tamanos (nombre, orden)
      SELECT * FROM json_to_recordset(${JSON.stringify(tamanos)}::json) AS x (nombre text, orden integer)
      WHERE NOT EXISTS (SELECT 1 FROM tamanos)`,
    sql`INSERT INTO movimientos (fecha, tipo, codigo, tamano, cantidad, responsable, observaciones, registrado)
      SELECT fecha, tipo, codigo, tamano, cantidad, responsable, observaciones, registrado
      FROM json_to_recordset(${JSON.stringify(datos.movimientos)}::json)
        AS x (fecha date, tipo text, codigo text, tamano text, cantidad integer,
              responsable text, observaciones text, registrado timestamptz)
      WHERE NOT EXISTS (SELECT 1 FROM movimientos)
      ORDER BY registrado`,
  ]);
}

/** Las especies (por nombre) y los tamaños (de chico a grande). */
export async function leerCatalogo(): Promise<{ especies: Especie[]; tamanos: string[] }> {
  await prepararBase();
  const sql = conexion();
  const [especies, tamanos] = await Promise.all([
    sql`SELECT codigo, comun, cientifico, region, minimo FROM especies ORDER BY comun`,
    sql`SELECT nombre FROM tamanos ORDER BY orden, nombre`,
  ]);
  return { especies: especies as Especie[], tamanos: tamanos.map(t => String(t.nombre)) };
}

/** El stock actual, sumado por la base de datos: { código: { tamaño: cantidad } }. */
export async function leerStock(): Promise<Stock> {
  await prepararBase();
  const filas = await conexion().query(
    `SELECT codigo, tamano, SUM(${CANTIDAD_CON_SIGNO})::int AS cantidad FROM movimientos GROUP BY codigo, tamano`,
  );
  const stock: Stock = {};
  for (const f of filas) (stock[f.codigo] ??= {})[f.tamano] = f.cantidad;
  return stock;
}

/** Los últimos movimientos (los más nuevos primero) y cuántos hay en total. */
export async function leerUltimos(cantidad: number): Promise<{ movimientos: Movimiento[]; total: number }> {
  await prepararBase();
  const sql = conexion();
  const [filas, [{ total }]] = await Promise.all([
    sql`SELECT id, to_char(fecha, 'YYYY-MM-DD') AS fecha, tipo, codigo, tamano, cantidad,
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
         FROM movimientos WHERE codigo = $1 AND tamano = $2
       ), nuevo AS (
         INSERT INTO movimientos (fecha, tipo, codigo, tamano, cantidad, responsable, observaciones)
         SELECT $3, $4, $1, $2, $5, $6, $7 FROM actual WHERE habia + $8 >= 0
         RETURNING id
       )
       SELECT habia, EXISTS (SELECT 1 FROM nuevo) AS guardado FROM actual`,
      [m.codigo, m.tamano, m.fecha, m.tipo, m.cantidad, m.responsable, m.observaciones, m.cambio],
    ),
  ]);
  return { habia: resultado.habia, guardado: resultado.guardado };
}
