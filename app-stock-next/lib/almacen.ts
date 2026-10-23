// Lee y guarda los datos en la base de datos Neon (Postgres). Solo corre en el servidor.
// La conexión sale de la variable DATABASE_URL: en la compu está en .env.local
// y en Vercel la carga sola la integración con Neon.
//
// La primera vez que se usa, crea las tablas y carga las especies nativas y las presentaciones
// (solo si están vacías: nunca pisa datos que ya existen). El stock arranca en cero.
import 'server-only';
import { neon } from '@neondatabase/serverless';
import { ESPECIES } from './especies';
import { cantidadConSigno, claveStock, etiquetaTamano, TAMANO_A_ESPECIFICAR } from './stock';
import type { Especie, LineaRemito, Movimiento, Stock, TipoMovimiento } from './tipos';

/** Cómo se entregan las plantas, en el orden en que se muestran. */
export const PRESENTACIONES = ['Maceta', 'Raíz desnuda', 'Envasado'];

/**
 * Tamaños: los de la lista desplegable de la columna "Tamaño" de la planilla de cotizaciones del vivero
 * (pestaña CONSULTATIO), ordenados por grupo. "2,5Mts" en la planilla aparecía partido en "2" y "5Mts".
 * Ajustes del vivero (2026-10-23): sin 1Kg, 12-14RD ni 150-180cm; "E65L" pasó a "65Lt" y "26-30" a "25-30".
 * Después de creada la base, se agregan o cambian desde el panel de Neon (tabla "tamanos").
 */
export const TAMANOS = [
  // Grosor del tronco (cm)
  'Varillon', '4-6', '6-8', '8-10', '10-12', '12-14', '14-16', '16-18', '20-22', '20-25', '25-30',
  // Altura
  '2,5Mts', '3Mts', '4Mts',
  // Volumen del envase
  '1Lt', '3Lts', '4Lts', '10Lts', '15Lts', '20Lts', '30Lts', '40Lts', '50Lts', '65Lt',
  // Categoría
  'Semi Ejemplar', 'Ejemplar', 'Super Ejemplar',
  // Otro tamaño: al elegirlo, el formulario pide escribirlo (se guarda en "tamano_detalle").
  TAMANO_A_ESPECIFICAR,
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
    sql`ALTER TABLE especies ADD COLUMN IF NOT EXISTS grupo text NOT NULL DEFAULT 'Árbol'`,
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
    // Lo que se escribe a mano cuando el tamaño es "Especificar" (vacío en los demás).
    sql`ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS tamano_detalle text NOT NULL DEFAULT ''`,
    // Remitos: cada carga junta varios movimientos (líneas) bajo un número. Los movimientos de antes
    // de los remitos quedan sin número (remito_id vacío).
    sql`CREATE TABLE IF NOT EXISTS remitos (
      id serial PRIMARY KEY,
      fecha date NOT NULL,
      tipo text NOT NULL CHECK (tipo IN ('Entrada', 'Salida', 'Ajuste')),
      responsable text NOT NULL DEFAULT '',
      observaciones text NOT NULL DEFAULT '',
      registrado timestamptz NOT NULL DEFAULT now()
    )`,
    sql`ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS remito_id integer REFERENCES remitos (id)`,
    sql`INSERT INTO especies (codigo, comun, cientifico, region, grupo, minimo)
      SELECT * FROM json_to_recordset(${JSON.stringify(ESPECIES)}::json)
        AS x (codigo text, comun text, cientifico text, region text, grupo text, minimo integer)
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
    sql`SELECT codigo, comun, cientifico, region, grupo, minimo FROM especies ORDER BY comun`,
    sql`SELECT nombre FROM presentaciones ORDER BY orden, nombre`,
    sql`SELECT nombre FROM tamanos ORDER BY orden, nombre`,
  ]);
  return {
    especies: especies as Especie[],
    presentaciones: presentaciones.map(p => String(p.nombre)),
    tamanos: tamanos.map(t => String(t.nombre)),
  };
}

/**
 * El stock actual, sumado por la base de datos: { código: { "presentación · tamaño": cantidad } }.
 * Con "Especificar", cada tamaño escrito a mano se cuenta aparte (ej. "Maceta · 5 m de altura").
 */
export async function leerStock(): Promise<Stock> {
  await prepararBase();
  const filas = await conexion().query(
    `SELECT codigo, presentacion, tamano, tamano_detalle, SUM(${CANTIDAD_CON_SIGNO})::int AS cantidad
     FROM movimientos GROUP BY codigo, presentacion, tamano, tamano_detalle`,
  );
  const stock: Stock = {};
  for (const f of filas) {
    (stock[f.codigo] ??= {})[claveStock(f.presentacion, etiquetaTamano(f.tamano, f.tamano_detalle))] = f.cantidad;
  }
  return stock;
}

/** Los últimos movimientos (los más nuevos primero) y cuántos hay en total. */
export async function leerUltimos(cantidad: number): Promise<{ movimientos: Movimiento[]; total: number }> {
  await prepararBase();
  const sql = conexion();
  const [filas, [{ total }]] = await Promise.all([
    sql`SELECT id, to_char(fecha, 'YYYY-MM-DD') AS fecha, tipo, codigo, presentacion, tamano,
          tamano_detalle AS "tamanoDetalle", cantidad, responsable, observaciones, registrado::text AS registrado,
          remito_id AS remito
        FROM movimientos ORDER BY fecha DESC, id DESC LIMIT ${cantidad}`,
    sql`SELECT count(*)::int AS total FROM movimientos`,
  ]);
  return { movimientos: filas as Movimiento[], total };
}

export interface RemitoNuevo {
  fecha: string;
  tipo: TipoMovimiento;
  responsable: string;
  observaciones: string;
  lineas: LineaRemito[];
}

/** Una combinación de especie, presentación y tamaño a la que no le alcanza el stock. */
export interface Faltante {
  codigo: string;
  presentacion: string;
  tamano: string;
  tamano_detalle: string;
  /** Lo que había antes del remito. */
  habia: number;
  /** Lo que el remito suma o resta en total para esa combinación. */
  cambio: number;
}

/**
 * Guarda el remito completo, todo junto o nada: si a alguna combinación de especie, presentación y tamaño
 * no le alcanza el stock, no se guarda ninguna línea y se devuelven las que faltan.
 * Si se guarda, devuelve el número de remito.
 */
export async function guardarRemito(r: RemitoNuevo): Promise<{ numero: number | null; faltantes: Faltante[] }> {
  await prepararBase();
  const sql = conexion();
  const lineas = JSON.stringify(
    r.lineas.map(l => ({
      codigo: l.codigo,
      presentacion: l.presentacion,
      tamano: l.tamano,
      tamano_detalle: l.tamanoDetalle,
      cantidad: l.cantidad,
      cambio: cantidadConSigno(r.tipo, l.cantidad),
    })),
  );
  // El candado hace que dos personas guardando al mismo tiempo se atiendan de a una,
  // así ninguna de las dos puede dejar el stock negativo.
  const [, [resultado]] = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(${CANDADO})`,
    sql.query(
      `WITH lineas AS (
         SELECT * FROM json_to_recordset($1::json)
           AS x (codigo text, presentacion text, tamano text, tamano_detalle text, cantidad integer, cambio integer)
       ), pedido AS (
         -- Si el remito tiene dos líneas de lo mismo, se controlan sumadas.
         SELECT codigo, presentacion, tamano, tamano_detalle, SUM(cambio)::int AS cambio
         FROM lineas GROUP BY codigo, presentacion, tamano, tamano_detalle
       ), con_stock AS (
         SELECT p.*, COALESCE((
           SELECT SUM(${CANTIDAD_CON_SIGNO}) FROM movimientos m
           WHERE m.codigo = p.codigo AND m.presentacion = p.presentacion
             AND m.tamano = p.tamano AND m.tamano_detalle = p.tamano_detalle
         ), 0)::int AS habia
         FROM pedido p
       ), faltantes AS (
         SELECT * FROM con_stock WHERE habia + cambio < 0
       ), remito AS (
         INSERT INTO remitos (fecha, tipo, responsable, observaciones)
         SELECT $2, $3, $4, $5 WHERE NOT EXISTS (SELECT 1 FROM faltantes)
         RETURNING id
       ), guardadas AS (
         INSERT INTO movimientos
           (fecha, tipo, codigo, presentacion, tamano, tamano_detalle, cantidad, responsable, observaciones, remito_id)
         SELECT $2, $3, l.codigo, l.presentacion, l.tamano, l.tamano_detalle, l.cantidad, $4, $5, remito.id
         FROM lineas l CROSS JOIN remito
         RETURNING id
       )
       SELECT (SELECT id FROM remito) AS numero,
              (SELECT count(*) FROM guardadas) AS lineas,
              COALESCE((SELECT json_agg(faltantes) FROM faltantes), '[]'::json) AS faltantes`,
      [lineas, r.fecha, r.tipo, r.responsable, r.observaciones],
    ),
  ]);
  return { numero: resultado.numero ?? null, faltantes: resultado.faltantes as Faltante[] };
}
