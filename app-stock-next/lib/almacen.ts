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
import { randomBytes } from 'crypto';
import { neon } from '@neondatabase/serverless';
import { encriptarClave } from './claves';
import { ESPECIES } from './especies';
import { claveStock, efectos, etiquetaTamano, TAMANO_A_ESPECIFICAR } from './stock';
import type { Especie, LineaRemito, Rol, StockPorDeposito, TipoMovimiento, Usuario } from './tipos';

/**
 * Usuarios iniciales (2026-10-24). Todos arrancan con la clave "1234": es provisoria, mientras se definen los
 * criterios de seguridad. Se cargan solo si la tabla de usuarios está vacía; después se cambian en la base.
 */
const USUARIOS_INICIALES: { nombre: string; rol: Rol }[] = [
  { nombre: 'Gustavo', rol: 'Administrador' },
  { nombre: 'Rocío', rol: 'Administrador' },
  { nombre: 'Ezequiel', rol: 'Colaborador' },
  { nombre: 'Martin', rol: 'Colaborador' },
  { nombre: 'Estela', rol: 'Colaborador' },
  { nombre: 'Martina', rol: 'Administrador' }, // administradora desde el 2026-10-24
  { nombre: 'Sebastián', rol: 'Colaborador' },
  { nombre: 'María', rol: 'Colaborador' },
];
const CLAVE_INICIAL = '1234';

/** Cuánto dura una sesión iniciada en un dispositivo. */
export const DIAS_DE_SESION = 30;

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
    // CUIT del proveedor o cliente de la partida y de la llegada (solo números), 2026-10-26.
    sql`ALTER TABLE remitos ADD COLUMN IF NOT EXISTS procedencia_cuit text NOT NULL DEFAULT ''`,
    sql`ALTER TABLE remitos ADD COLUMN IF NOT EXISTS destino_cuit text NOT NULL DEFAULT ''`,
    // Clave de envío: la genera el celu al armar el remito y viaja con él. Si el mismo remito llega dos veces (se
    // cortó la señal justo después de guardar, o se tocó dos veces el botón), la segunda no lo duplica.
    sql`ALTER TABLE remitos ADD COLUMN IF NOT EXISTS clave_envio text`,
    sql`CREATE UNIQUE INDEX IF NOT EXISTS remitos_clave_envio ON remitos (clave_envio)`,
    // El ingreso a ARCA (ticket) se guarda acá: ARCA no deja pedir uno nuevo mientras hay uno vigente, y en Vercel
    // cada pedido puede caer en un servidor distinto, así que no alcanza con tenerlo en memoria.
    sql`CREATE TABLE IF NOT EXISTS arca_tickets (
      servicio text NOT NULL,
      entorno text NOT NULL,
      token text NOT NULL,
      firma text NOT NULL,
      vence timestamptz NOT NULL,
      PRIMARY KEY (servicio, entorno)
    )`,
    // Quién modificó o anuló (nombre del usuario), desde que hay usuarios.
    sql`ALTER TABLE remitos ADD COLUMN IF NOT EXISTS modificado_por text NOT NULL DEFAULT ''`,
    sql`ALTER TABLE remitos ADD COLUMN IF NOT EXISTS anulado_por text NOT NULL DEFAULT ''`,
    // Usuarios y sesiones (2026-10-24). La clave se guarda encriptada (ver lib/claves.ts).
    sql`CREATE TABLE IF NOT EXISTS usuarios (
      id serial PRIMARY KEY,
      nombre text NOT NULL UNIQUE,
      clave text NOT NULL,
      rol text NOT NULL CHECK (rol IN ('Administrador', 'Colaborador')),
      activo boolean NOT NULL DEFAULT true,
      creado timestamptz NOT NULL DEFAULT now()
    )`,
    // Seguridad de las claves (2026-10-24):
    // - cambiar_clave: la clave es provisoria y hay que cambiarla al entrar. Arranca en true para todos (los
    //   usuarios iniciales tenían 1234) y vuelve a true cuando un administrador da una clave provisoria.
    // - intentos_fallidos y bloqueado_hasta: después de varios intentos con la clave equivocada, se bloquea un rato.
    sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cambiar_clave boolean NOT NULL DEFAULT true`,
    sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intentos_fallidos integer NOT NULL DEFAULT 0`,
    sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_hasta timestamptz`,
    sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_ingreso timestamptz`,
    // Una sesión por dispositivo donde alguien inició sesión: el navegador guarda el "token" en una cookie.
    sql`CREATE TABLE IF NOT EXISTS sesiones (
      token text PRIMARY KEY,
      usuario_id integer NOT NULL REFERENCES usuarios (id),
      creada timestamptz NOT NULL DEFAULT now(),
      vence timestamptz NOT NULL
    )`,
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
    // Cambio de nombre del 2026-10-28: el depósito "Goya" pasó a llamarse "Goya Vivero". Se actualiza todo lo ya guardado
    // (los movimientos y los puntos de partida y llegada de los remitos). Si ya se hizo, no encuentra nada que cambiar.
    sql`UPDATE movimientos SET deposito = 'Goya Vivero' WHERE deposito = 'Goya'`,
    sql`UPDATE remitos SET procedencia = 'Goya Vivero' WHERE procedencia = 'Goya'`,
    sql`UPDATE remitos SET destino = 'Goya Vivero' WHERE destino = 'Goya'`,
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
  // Usuarios iniciales: aparte, porque encriptar las claves tarda un poco y solo hace falta la primera vez.
  // "ON CONFLICT" evita repetirlos si dos pedidos llegan juntos.
  const [{ hay }] = await sql`SELECT EXISTS (SELECT 1 FROM usuarios) AS hay`;
  if (!hay) {
    const usuarios = USUARIOS_INICIALES.map(u => ({ nombre: u.nombre, clave: encriptarClave(CLAVE_INICIAL), rol: u.rol }));
    await sql`INSERT INTO usuarios (nombre, clave, rol)
      SELECT * FROM json_to_recordset(${JSON.stringify(usuarios)}::json) AS x (nombre text, clave text, rol text)
      ON CONFLICT (nombre) DO NOTHING`;
  }
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
/** Un remito en la lista de Últimos: sus datos y cuántas líneas y plantas tiene (el detalle se ve al abrirlo). */
export interface RemitoResumen {
  numero: number;
  fecha: string;
  tipo: TipoMovimiento;
  procedencia: string;
  procedenciaDetalle: string;
  destino: string;
  destinoDetalle: string;
  responsable: string;
  anulado: boolean;
  lineas: number;
  /** Total de plantas (en un ajuste, con signo: lo que suma o resta). */
  plantas: number;
}

/** Los últimos remitos (los más nuevos primero) y cuántos hay en total. */
export async function leerUltimosRemitos(cantidad: number): Promise<{ remitos: RemitoResumen[]; total: number }> {
  await prepararBase();
  const sql = conexion();
  const [filas, [{ total }]] = await Promise.all([
    // En un movimiento entre dos depósitos cada línea tiene dos filas en "movimientos" (−N y +N): por eso las
    // plantas se cuentan una vez por línea (todas las líneas de un remito tienen la misma cantidad de filas).
    sql`SELECT r.id AS numero, to_char(r.fecha, 'YYYY-MM-DD') AS fecha, r.tipo,
          r.procedencia, r.procedencia_detalle AS "procedenciaDetalle", r.destino, r.destino_detalle AS "destinoDetalle",
          r.responsable, r.anulado,
          count(DISTINCT m.linea)::int AS lineas,
          coalesce(CASE WHEN r.tipo = 'Ajuste' THEN sum(m.cantidad)
                        ELSE sum(abs(m.cantidad)) * count(DISTINCT m.linea) / nullif(count(m.id), 0) END, 0)::int AS plantas
        FROM remitos r LEFT JOIN movimientos m ON m.remito_id = r.id
        GROUP BY r.id ORDER BY r.fecha DESC, r.id DESC LIMIT ${cantidad}`,
    sql`SELECT count(*)::int AS total FROM remitos`,
  ]);
  return { remitos: filas as RemitoResumen[], total };
}

export interface RemitoNuevo {
  fecha: string;
  tipo: TipoMovimiento;
  procedencia: string;
  procedenciaDetalle: string;
  procedenciaCuit: string;
  destino: string;
  destinoDetalle: string;
  destinoCuit: string;
  responsable: string;
  observaciones: string;
  lineas: LineaRemito[];
}

export interface Sugerencias {
  proveedores: string[];
  clientes: string[];
}

/** Proveedores y clientes ya usados (los más recientes primero), para sugerirlos al cargar. */
export async function leerSugerencias(): Promise<Sugerencias> {
  await prepararBase();
  const sql = conexion();
  const [proveedores, clientes] = await Promise.all([
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
  return { proveedores: nombres(proveedores), clientes: nombres(clientes) };
}

export interface RemitoGuardado {
  numero: number;
  fecha: string;
  tipo: TipoMovimiento;
  procedencia: string;
  procedenciaDetalle: string;
  procedenciaCuit: string;
  destino: string;
  destinoDetalle: string;
  destinoCuit: string;
  responsable: string;
  observaciones: string;
  anulado: boolean;
  anuladoMotivo: string;
  /** Cuándo se anuló o se modificó por última vez ("dd/mm/aaaa hh:mm", hora de Argentina), o null. */
  anuladoEn: string | null;
  modificadoEn: string | null;
  /** Quién anuló o modificó por última vez (vacío si nadie, o si fue antes de que hubiera usuarios). */
  anuladoPor: string;
  modificadoPor: string;
  lineas: (LineaRemito & { comun: string; cientifico: string })[];
}

/** Un remito ya guardado, con sus líneas, para verlo, imprimirlo o modificarlo. Devuelve null si no existe. */
export async function leerRemito(numero: number): Promise<RemitoGuardado | null> {
  await prepararBase();
  const sql = conexion();
  const [[remito], lineas] = await Promise.all([
    sql`SELECT id AS numero, to_char(fecha, 'YYYY-MM-DD') AS fecha, tipo, responsable, observaciones,
          procedencia, procedencia_detalle AS "procedenciaDetalle", procedencia_cuit AS "procedenciaCuit",
          destino, destino_detalle AS "destinoDetalle", destino_cuit AS "destinoCuit",
          anulado, anulado_motivo AS "anuladoMotivo",
          to_char(anulado_en AT TIME ZONE 'America/Argentina/Buenos_Aires', 'DD/MM/YYYY HH24:MI') AS "anuladoEn",
          to_char(modificado_en AT TIME ZONE 'America/Argentina/Buenos_Aires', 'DD/MM/YYYY HH24:MI') AS "modificadoEn",
          anulado_por AS "anuladoPor", modificado_por AS "modificadoPor"
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
 * Con "claveEnvio", si ya hay un remito guardado con esa clave no se guarda otro: devuelve el que ya estaba
 * (repetido = true).
 */
export async function guardarRemito(r: RemitoNuevo, claveEnvio = ''): Promise<{ numero: number; repetido: boolean }> {
  await prepararBase();
  const movimientos = movimientosDe(r);
  const [resultado] = await conexion().query(
    `WITH remito AS (
       INSERT INTO remitos (fecha, tipo, responsable, observaciones,
                            procedencia, procedencia_detalle, procedencia_cuit, destino, destino_detalle, destino_cuit,
                            clave_envio)
       VALUES ($2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NULLIF($12, ''))
       ON CONFLICT (clave_envio) DO NOTHING
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
      movimientos, r.fecha, r.tipo, r.responsable, r.observaciones,
      r.procedencia, r.procedenciaDetalle, r.procedenciaCuit, r.destino, r.destinoDetalle, r.destinoCuit,
      claveEnvio,
    ],
  );
  if (resultado) return { numero: Number(resultado.numero), repetido: false };
  // No se insertó nada: ya existía un remito con esa clave de envío.
  const [existente] = await conexion()`SELECT id FROM remitos WHERE clave_envio = ${claveEnvio}`;
  return { numero: Number(existente.id), repetido: true };
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
 * El responsable no cambia (es quien lo emitió); queda anotado quién lo modificó (r.responsable).
 * Devuelve false si el remito no existe o está anulado (un remito anulado no se modifica).
 */
export async function modificarRemito(numero: number, r: RemitoNuevo): Promise<boolean> {
  await prepararBase();
  const [resultado] = await conexion().query(
    `WITH remito AS (
       UPDATE remitos SET fecha = $2, tipo = $3, modificado_por = $4, observaciones = $5,
              procedencia = $6, procedencia_detalle = $7, procedencia_cuit = $8, destino = $9, destino_detalle = $10,
              destino_cuit = $11, modificado_en = now()
       WHERE id = $12 AND NOT anulado
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
      movimientosDe(r), r.fecha, r.tipo, r.responsable, r.observaciones,
      r.procedencia, r.procedenciaDetalle, r.procedenciaCuit, r.destino, r.destinoDetalle, r.destinoCuit, numero,
    ],
  );
  return resultado.cambiados === 1;
}

/**
 * Anula un remito: queda guardado con su número, pero sus movimientos dejan de contar en el stock.
 * Devuelve false si no existe o ya estaba anulado.
 */
export async function anularRemito(numero: number, motivo: string, quien: string): Promise<boolean> {
  await prepararBase();
  const filas = await conexion()`
    UPDATE remitos SET anulado = true, anulado_motivo = ${motivo}, anulado_en = now(), anulado_por = ${quien}
    WHERE id = ${numero} AND NOT anulado RETURNING id`;
  return filas.length === 1;
}

// ---------- Usuarios y sesiones ----------

/** Los nombres de quienes pueden iniciar sesión, para elegir en la pantalla de ingreso. */
export async function leerNombresUsuarios(): Promise<string[]> {
  await prepararBase();
  const filas = await conexion()`SELECT nombre FROM usuarios WHERE activo ORDER BY nombre`;
  return filas.map(f => String(f.nombre));
}

/** Después de esta cantidad de claves equivocadas seguidas, el usuario queda bloqueado un rato. */
export const INTENTOS_PERMITIDOS = 5;
export const MINUTOS_DE_BLOQUEO = 15;

export interface UsuarioParaIngresar extends Usuario {
  clave: string;
  /** Minutos que faltan para que se desbloquee (0 si no está bloqueado). */
  minutosBloqueado: number;
}

/** El usuario con ese nombre y su clave encriptada (para revisarla), o null si no existe o no está activo. */
export async function buscarUsuario(nombre: string): Promise<UsuarioParaIngresar | null> {
  await prepararBase();
  const [fila] = await conexion()`
    SELECT id, nombre, rol, clave, cambiar_clave AS "cambiarClave",
           coalesce(ceil(extract(epoch FROM bloqueado_hasta - now()) / 60), 0)::int AS "minutosBloqueado"
    FROM usuarios WHERE nombre = ${nombre} AND activo`;
  if (!fila) return null;
  const u = fila as UsuarioParaIngresar;
  return { ...u, minutosBloqueado: Math.max(0, u.minutosBloqueado) };
}

/** Anota una clave equivocada; al llegar a INTENTOS_PERMITIDOS, bloquea al usuario MINUTOS_DE_BLOQUEO minutos. */
export async function anotarIntentoFallido(usuarioId: number): Promise<void> {
  await prepararBase();
  await conexion()`
    UPDATE usuarios SET
      bloqueado_hasta = CASE WHEN intentos_fallidos + 1 >= ${INTENTOS_PERMITIDOS}
                             THEN now() + make_interval(mins => ${MINUTOS_DE_BLOQUEO}) ELSE bloqueado_hasta END,
      intentos_fallidos = CASE WHEN intentos_fallidos + 1 >= ${INTENTOS_PERMITIDOS} THEN 0 ELSE intentos_fallidos + 1 END
    WHERE id = ${usuarioId}`;
}

/** Abre una sesión para el usuario y devuelve su "token" (un código al azar, imposible de adivinar). */
export async function crearSesion(usuarioId: number): Promise<string> {
  await prepararBase();
  const token = randomBytes(32).toString('hex');
  const sql = conexion();
  await sql.transaction([
    // De paso, se borran las sesiones vencidas.
    sql`DELETE FROM sesiones WHERE vence < now()`,
    sql`INSERT INTO sesiones (token, usuario_id, vence)
        VALUES (${token}, ${usuarioId}, now() + make_interval(days => ${DIAS_DE_SESION}))`,
    // Entró bien: se borran los intentos fallidos y se anota cuándo entró.
    sql`UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_ingreso = now()
        WHERE id = ${usuarioId}`,
  ]);
  return token;
}

/** El usuario de una sesión abierta (no vencida y de un usuario activo), o null. */
export async function usuarioDeSesion(token: string): Promise<Usuario | null> {
  await prepararBase();
  const [fila] = await conexion()`
    SELECT u.id, u.nombre, u.rol, u.cambiar_clave AS "cambiarClave"
    FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
    WHERE s.token = ${token} AND s.vence > now() AND u.activo`;
  return (fila as Usuario | undefined) ?? null;
}

export async function borrarSesion(token: string): Promise<void> {
  await prepararBase();
  await conexion()`DELETE FROM sesiones WHERE token = ${token}`;
}

/** La clave encriptada de un usuario (para revisar la actual antes de cambiarla). */
export async function leerClave(usuarioId: number): Promise<string | null> {
  await prepararBase();
  const [fila] = await conexion()`SELECT clave FROM usuarios WHERE id = ${usuarioId}`;
  return fila ? String(fila.clave) : null;
}

/**
 * Guarda una clave nueva (ya encriptada). "provisoria" = la dio un administrador y hay que cambiarla al entrar.
 * Cierra las sesiones del usuario en los demás dispositivos (menos la de "salvoSesion", si se indica).
 */
export async function guardarClave(
  usuarioId: number,
  clave: string,
  provisoria: boolean,
  salvoSesion = '',
): Promise<void> {
  await prepararBase();
  const sql = conexion();
  await sql.transaction([
    sql`UPDATE usuarios SET clave = ${clave}, cambiar_clave = ${provisoria}, intentos_fallidos = 0,
          bloqueado_hasta = NULL
        WHERE id = ${usuarioId}`,
    sql`DELETE FROM sesiones WHERE usuario_id = ${usuarioId} AND token <> ${salvoSesion}`,
  ]);
}

// ---------- Administración de usuarios (solo administradores) ----------

export interface UsuarioListado extends Usuario {
  activo: boolean;
  /** "dd/mm/aaaa hh:mm" (hora de Argentina) o null si nunca entró. */
  ultimoIngreso: string | null;
  bloqueado: boolean;
}

export async function leerUsuarios(): Promise<UsuarioListado[]> {
  await prepararBase();
  const filas = await conexion()`
    SELECT id, nombre, rol, activo, cambiar_clave AS "cambiarClave",
           to_char(ultimo_ingreso AT TIME ZONE 'America/Argentina/Buenos_Aires', 'DD/MM/YYYY HH24:MI') AS "ultimoIngreso",
           coalesce(bloqueado_hasta > now(), false) AS bloqueado
    FROM usuarios ORDER BY activo DESC, nombre`;
  return filas as UsuarioListado[];
}

/** Agrega un usuario con una clave provisoria (ya encriptada). Devuelve false si ya hay uno con ese nombre. */
export async function crearUsuario(nombre: string, rol: Rol, clave: string): Promise<boolean> {
  await prepararBase();
  const filas = await conexion()`
    INSERT INTO usuarios (nombre, clave, rol, cambiar_clave)
    SELECT ${nombre}, ${clave}, ${rol}, true
    WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE lower(nombre) = lower(${nombre}))
    RETURNING id`;
  return filas.length === 1;
}

export async function cambiarRol(usuarioId: number, rol: Rol): Promise<void> {
  await prepararBase();
  await conexion()`UPDATE usuarios SET rol = ${rol} WHERE id = ${usuarioId}`;
}

/** Da de baja (o vuelve a dar de alta) a un usuario. Al darlo de baja, se cierran todas sus sesiones. */
export async function cambiarActivo(usuarioId: number, activo: boolean): Promise<void> {
  await prepararBase();
  const sql = conexion();
  await sql.transaction([
    sql`UPDATE usuarios SET activo = ${activo} WHERE id = ${usuarioId}`,
    sql`DELETE FROM sesiones WHERE usuario_id = ${usuarioId} AND NOT ${activo}`,
  ]);
}

// ---------- Ingreso a ARCA (ver lib/arca.ts) ----------

export interface TicketArca {
  token: string;
  firma: string;
}

/** El ticket de ARCA guardado, si todavía le quedan más de 10 minutos de vida. */
export async function leerTicketArca(servicio: string, entorno: string): Promise<TicketArca | null> {
  await prepararBase();
  const [fila] = await conexion()`
    SELECT token, firma FROM arca_tickets
    WHERE servicio = ${servicio} AND entorno = ${entorno} AND vence > now() + interval '10 minutes'`;
  return (fila as TicketArca | undefined) ?? null;
}

export async function guardarTicketArca(servicio: string, entorno: string, ticket: TicketArca, vence: Date): Promise<void> {
  await prepararBase();
  await conexion()`
    INSERT INTO arca_tickets (servicio, entorno, token, firma, vence)
    VALUES (${servicio}, ${entorno}, ${ticket.token}, ${ticket.firma}, ${vence.toISOString()})
    ON CONFLICT (servicio, entorno) DO UPDATE SET token = EXCLUDED.token, firma = EXCLUDED.firma, vence = EXCLUDED.vence`;
}

/** Lo último que se averiguó de un CUIT en ARCA, para no volver a consultar el mismo (por ejemplo, al modificar). */
export async function nombreDeCuitUsado(cuit: string): Promise<string | null> {
  await prepararBase();
  const [fila] = await conexion()`
    SELECT nombre FROM (
      SELECT procedencia_detalle AS nombre, id FROM remitos WHERE procedencia_cuit = ${cuit}
      UNION ALL SELECT destino_detalle, id FROM remitos WHERE destino_cuit = ${cuit}
    ) x WHERE nombre <> '' ORDER BY id DESC LIMIT 1`;
  return fila ? String(fila.nombre) : null;
}
