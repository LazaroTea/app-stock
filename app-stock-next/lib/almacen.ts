// Lee y guarda los datos en la base de datos Neon (Postgres). Solo corre en el servidor.
// La conexión sale de la variable DATABASE_URL: en la compu está en .env.local
// y en Vercel la carga sola la integración con Neon.
//
// La primera vez que se usa, crea las tablas y carga las especies, las presentaciones y los tamaños
// (solo si están vacías: nunca pisa datos que ya existen). El stock arranca en cero.
//
// Cómo se guarda el stock: cada remito (tabla "remitos") tiene líneas, y cada línea genera uno o dos
// movimientos (tabla "movimientos"), cada uno con el depósito donde suma o resta. El stock de un depósito es
// la suma de sus movimientos. Ver efectos() en lib/stock.ts.
import 'server-only';
import { neon } from '@neondatabase/serverless';
import { ESPECIES } from './especies';
import { claveStock, efectos, etiquetaTamano, TAMANO_A_ESPECIFICAR } from './stock';
import type { Especie, LineaRemito, Movimiento, StockPorDeposito, TipoMovimiento } from './tipos';

/** Cómo se entregan las plantas, en el orden en que se muestran. La primera es la que viene elegida al cargar. */
export const PRESENTACIONES = ['Envasado', 'Maceta', 'Raíz desnuda'];

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
    // Cambio del 2026-10-23: el stock pasó a llevarse por depósito (Benavidez, Pilar, Goya). En una base con
    // el formato anterior (movimientos sin depósito) se borran los remitos y movimientos, que eran pruebas
    // (lo pidió el vivero), y el stock arranca en cero. Solo pasa una vez.
    sql`DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'movimientos')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                           WHERE table_name = 'movimientos' AND column_name = 'deposito') THEN
          DROP TABLE movimientos;
          DROP TABLE IF EXISTS remitos;
        END IF;
      END $$`,
    sql`CREATE TABLE IF NOT EXISTS especies (
      codigo text PRIMARY KEY,
      comun text NOT NULL,
      cientifico text NOT NULL DEFAULT '',
      minimo integer NOT NULL DEFAULT 0
    )`,
    // Columnas agregadas después: en una base creada antes, se suman sin tocar los datos.
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
    // Un remito: los datos de la carga. Procedencia y destino según el tipo (ver lugaresDelTipo en
    // lib/stock.ts); con "Proveedor" o "Cliente", en *_detalle va el nombre. En los ajustes, el depósito
    // va en "destino".
    sql`CREATE TABLE IF NOT EXISTS remitos (
      id serial PRIMARY KEY,
      fecha date NOT NULL,
      tipo text NOT NULL CONSTRAINT remitos_tipo_check CHECK (tipo IN ('Movimiento', 'Ajuste')),
      procedencia text NOT NULL DEFAULT '',
      procedencia_detalle text NOT NULL DEFAULT '',
      destino text NOT NULL DEFAULT '',
      destino_detalle text NOT NULL DEFAULT '',
      destinatario text NOT NULL DEFAULT '',
      responsable text NOT NULL DEFAULT '',
      observaciones text NOT NULL DEFAULT '',
      registrado timestamptz NOT NULL DEFAULT now()
    )`,
    // Cambio del 2026-10-24: los tipos Entrada, Salida y Pase pasaron a ser uno solo, "Movimiento" (de un punto
    // de partida a uno de llegada). Los remitos viejos se convierten sin tocar sus movimientos, que ya restan y
    // suman en el depósito que corresponde. Solo pasa una vez.
    sql`DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint
                       WHERE conname = 'remitos_tipo_check' AND pg_get_constraintdef(oid) LIKE '%Movimiento%') THEN
          ALTER TABLE remitos DROP CONSTRAINT IF EXISTS remitos_tipo_check;
          UPDATE remitos SET tipo = 'Movimiento' WHERE tipo IN ('Entrada', 'Salida', 'Pase');
          ALTER TABLE remitos ADD CONSTRAINT remitos_tipo_check CHECK (tipo IN ('Movimiento', 'Ajuste'));
        END IF;
      END $$`,
    // Anular y modificar (2026-10-24): un remito anulado no se borra, pero deja de contar en el stock.
    sql`ALTER TABLE remitos ADD COLUMN IF NOT EXISTS anulado boolean NOT NULL DEFAULT false`,
    sql`ALTER TABLE remitos ADD COLUMN IF NOT EXISTS anulado_motivo text NOT NULL DEFAULT ''`,
    sql`ALTER TABLE remitos ADD COLUMN IF NOT EXISTS anulado_en timestamptz`,
    sql`ALTER TABLE remitos ADD COLUMN IF NOT EXISTS modificado_en timestamptz`,
    // Cada línea del remito genera uno o dos movimientos: lo que suma (+) o resta (-) en un depósito.
    // "linea" es el número de línea dentro del remito (en un pase, los dos movimientos tienen la misma).
    sql`CREATE TABLE IF NOT EXISTS movimientos (
      id serial PRIMARY KEY,
      remito_id integer NOT NULL REFERENCES remitos (id),
      linea integer NOT NULL,
      deposito text NOT NULL,
      codigo text NOT NULL REFERENCES especies (codigo),
      presentacion text NOT NULL REFERENCES presentaciones (nombre),
      tamano text NOT NULL REFERENCES tamanos (nombre),
      tamano_detalle text NOT NULL DEFAULT '',
      cantidad integer NOT NULL
    )`,
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
 * El stock de cada depósito, sumado por la base de datos:
 * { depósito: { código: { "presentación · tamaño": cantidad } } }.
 * Con "Especificar", cada tamaño escrito a mano se cuenta aparte (ej. "Maceta · 5 m de altura").
 * Los remitos anulados no cuentan.
 */
export async function leerStock(): Promise<StockPorDeposito> {
  await prepararBase();
  const filas = await conexion()`
    SELECT m.deposito, m.codigo, m.presentacion, m.tamano, m.tamano_detalle, SUM(m.cantidad)::int AS cantidad
    FROM movimientos m JOIN remitos r ON r.id = m.remito_id
    WHERE NOT r.anulado
    GROUP BY m.deposito, m.codigo, m.presentacion, m.tamano, m.tamano_detalle`;
  const stock: StockPorDeposito = {};
  for (const f of filas) {
    const clave = claveStock(f.presentacion, etiquetaTamano(f.tamano, f.tamano_detalle));
    ((stock[f.deposito] ??= {})[f.codigo] ??= {})[clave] = f.cantidad;
  }
  return stock;
}

/** Los últimos movimientos (los más nuevos primero) y cuántos hay en total. */
export async function leerUltimos(cantidad: number): Promise<{ movimientos: Movimiento[]; total: number }> {
  await prepararBase();
  const sql = conexion();
  const [filas, [{ total }]] = await Promise.all([
    sql`SELECT m.id, to_char(r.fecha, 'YYYY-MM-DD') AS fecha, r.tipo, m.deposito, m.codigo, m.presentacion, m.tamano,
          m.tamano_detalle AS "tamanoDetalle", m.cantidad, r.responsable, r.id AS remito, r.anulado
        FROM movimientos m JOIN remitos r ON r.id = m.remito_id
        ORDER BY r.fecha DESC, m.id DESC LIMIT ${cantidad}`,
    sql`SELECT count(*)::int AS total FROM movimientos`,
  ]);
  return { movimientos: filas as Movimiento[], total };
}

export interface RemitoNuevo {
  fecha: string;
  tipo: TipoMovimiento;
  destinatario: string;
  procedencia: string;
  procedenciaDetalle: string;
  destino: string;
  destinoDetalle: string;
  responsable: string;
  observaciones: string;
  lineas: LineaRemito[];
}

export interface Sugerencias {
  destinatarios: string[];
  proveedores: string[];
  clientes: string[];
}

/** Destinatarios, proveedores y clientes ya usados (los más recientes primero), para sugerirlos al cargar. */
export async function leerSugerencias(): Promise<Sugerencias> {
  await prepararBase();
  const sql = conexion();
  const [destinatarios, proveedores, clientes] = await Promise.all([
    sql`SELECT destinatario AS nombre FROM remitos WHERE destinatario <> ''
        GROUP BY destinatario ORDER BY max(id) DESC LIMIT 200`,
    // Un proveedor puede estar en la partida (compra) o en la llegada (devolución); un cliente, en la llegada.
    sql`SELECT nombre FROM (
          SELECT procedencia_detalle AS nombre, id FROM remitos WHERE procedencia = 'Proveedor'
          UNION ALL SELECT destino_detalle, id FROM remitos WHERE destino = 'Proveedor'
        ) x WHERE nombre <> '' GROUP BY nombre ORDER BY max(id) DESC LIMIT 200`,
    sql`SELECT nombre FROM (
          SELECT destino_detalle AS nombre, id FROM remitos WHERE destino = 'Cliente'
          UNION ALL SELECT procedencia_detalle, id FROM remitos WHERE procedencia = 'Cliente'
        ) x WHERE nombre <> '' GROUP BY nombre ORDER BY max(id) DESC LIMIT 200`,
  ]);
  const nombres = (filas: Record<string, unknown>[]) => filas.map(f => String(f.nombre));
  return { destinatarios: nombres(destinatarios), proveedores: nombres(proveedores), clientes: nombres(clientes) };
}

export interface RemitoGuardado {
  numero: number;
  fecha: string;
  tipo: TipoMovimiento;
  destinatario: string;
  procedencia: string;
  procedenciaDetalle: string;
  destino: string;
  destinoDetalle: string;
  responsable: string;
  observaciones: string;
  anulado: boolean;
  anuladoMotivo: string;
  /** Cuándo se anuló o se modificó por última vez ("dd/mm/aaaa hh:mm", hora de Argentina), o null. */
  anuladoEn: string | null;
  modificadoEn: string | null;
  lineas: (LineaRemito & { comun: string; cientifico: string })[];
}

/** Un remito ya guardado, con sus líneas, para verlo, imprimirlo o modificarlo. Devuelve null si no existe. */
export async function leerRemito(numero: number): Promise<RemitoGuardado | null> {
  await prepararBase();
  const sql = conexion();
  const [[remito], lineas] = await Promise.all([
    sql`SELECT id AS numero, to_char(fecha, 'YYYY-MM-DD') AS fecha, tipo, destinatario, responsable, observaciones,
          procedencia, procedencia_detalle AS "procedenciaDetalle", destino, destino_detalle AS "destinoDetalle",
          anulado, anulado_motivo AS "anuladoMotivo",
          to_char(anulado_en AT TIME ZONE 'America/Argentina/Buenos_Aires', 'DD/MM/YYYY HH24:MI') AS "anuladoEn",
          to_char(modificado_en AT TIME ZONE 'America/Argentina/Buenos_Aires', 'DD/MM/YYYY HH24:MI') AS "modificadoEn"
        FROM remitos WHERE id = ${numero}`,
    // Una fila por línea (en un pase hay dos movimientos por línea). La cantidad va sin signo,
    // salvo en los ajustes.
    sql`SELECT DISTINCT ON (m.linea) m.codigo, m.presentacion, m.tamano, m.tamano_detalle AS "tamanoDetalle",
          CASE WHEN r.tipo = 'Ajuste' THEN m.cantidad ELSE abs(m.cantidad) END AS cantidad, e.comun, e.cientifico
        FROM movimientos m JOIN remitos r ON r.id = m.remito_id JOIN especies e ON e.codigo = m.codigo
        WHERE m.remito_id = ${numero} ORDER BY m.linea, m.id`,
  ]);
  if (!remito) return null;
  return { ...(remito as Omit<RemitoGuardado, 'lineas'>), lineas: lineas as RemitoGuardado['lineas'] };
}

/**
 * Guarda el remito completo con todos sus movimientos, en una sola operación (todo o nada),
 * y devuelve su número. No controla que alcance el stock: un depósito puede quedar en negativo.
 */
export async function guardarRemito(r: RemitoNuevo): Promise<number> {
  await prepararBase();
  const movimientos = movimientosDe(r);
  const [resultado] = await conexion().query(
    `WITH remito AS (
       INSERT INTO remitos (fecha, tipo, responsable, observaciones, destinatario,
                            procedencia, procedencia_detalle, destino, destino_detalle)
       VALUES ($2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id
     ), guardados AS (
       INSERT INTO movimientos (remito_id, linea, deposito, codigo, presentacion, tamano, tamano_detalle, cantidad)
       SELECT remito.id, x.linea, x.deposito, x.codigo, x.presentacion, x.tamano, x.tamano_detalle, x.cantidad
       FROM json_to_recordset($1::json)
         AS x (linea integer, deposito text, codigo text, presentacion text, tamano text, tamano_detalle text,
               cantidad integer)
       CROSS JOIN remito
       RETURNING id
     )
     SELECT id AS numero FROM remito`,
    [
      movimientos, r.fecha, r.tipo, r.responsable, r.observaciones, r.destinatario,
      r.procedencia, r.procedenciaDetalle, r.destino, r.destinoDetalle,
    ],
  );
  return Number(resultado.numero);
}

// Los movimientos (en JSON) que genera un remito: uno o dos por línea, con lo que suma o resta en cada depósito.
function movimientosDe(r: RemitoNuevo): string {
  return JSON.stringify(
    r.lineas.flatMap((l, linea) =>
      efectos(r.tipo, r.procedencia, r.destino, l.cantidad).map(e => ({
        linea,
        deposito: e.deposito,
        codigo: l.codigo,
        presentacion: l.presentacion,
        tamano: l.tamano,
        tamano_detalle: l.tamanoDetalle,
        cantidad: e.cantidad,
      })),
    ),
  );
}

/**
 * Reemplaza los datos y las líneas de un remito ya guardado (mismo número), en una sola operación.
 * Devuelve false si el remito no existe o está anulado (un remito anulado no se modifica).
 */
export async function modificarRemito(numero: number, r: RemitoNuevo): Promise<boolean> {
  await prepararBase();
  const [resultado] = await conexion().query(
    `WITH remito AS (
       UPDATE remitos SET fecha = $2, tipo = $3, responsable = $4, observaciones = $5, destinatario = $6,
              procedencia = $7, procedencia_detalle = $8, destino = $9, destino_detalle = $10, modificado_en = now()
       WHERE id = $11 AND NOT anulado
       RETURNING id
     ), borrados AS (
       DELETE FROM movimientos WHERE remito_id IN (SELECT id FROM remito)
     ), guardados AS (
       INSERT INTO movimientos (remito_id, linea, deposito, codigo, presentacion, tamano, tamano_detalle, cantidad)
       SELECT remito.id, x.linea, x.deposito, x.codigo, x.presentacion, x.tamano, x.tamano_detalle, x.cantidad
       FROM json_to_recordset($1::json)
         AS x (linea integer, deposito text, codigo text, presentacion text, tamano text, tamano_detalle text,
               cantidad integer)
       CROSS JOIN remito
     )
     SELECT count(*)::int AS cambiados FROM remito`,
    [
      movimientosDe(r), r.fecha, r.tipo, r.responsable, r.observaciones, r.destinatario,
      r.procedencia, r.procedenciaDetalle, r.destino, r.destinoDetalle, numero,
    ],
  );
  return resultado.cambiados === 1;
}

/**
 * Anula un remito: queda guardado con su número, pero sus movimientos dejan de contar en el stock.
 * Devuelve false si no existe o ya estaba anulado.
 */
export async function anularRemito(numero: number, motivo: string): Promise<boolean> {
  await prepararBase();
  const filas = await conexion()`
    UPDATE remitos SET anulado = true, anulado_motivo = ${motivo}, anulado_en = now()
    WHERE id = ${numero} AND NOT anulado RETURNING id`;
  return filas.length === 1;
}
