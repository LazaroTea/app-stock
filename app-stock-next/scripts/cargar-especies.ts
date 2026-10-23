// Agrega a la base las especies de lib/especies-nativas.ts que todavía no están.
// Se corre a mano, desde la carpeta app-stock-next:  npm.cmd run cargar-especies
//
// - Las especies que ya existen no se modifican (ni nombre ni stock mínimo),
//   salvo la región si estaba vacía.
// - No borra nada.
import { neon } from '@neondatabase/serverless';
import { ESPECIES_NATIVAS } from '../lib/especies-nativas.ts';

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  console.error('Falta DATABASE_URL: este comando lee la conexión de .env.local.');
  process.exit(1);
}
const sql = neon(url);
const especies = JSON.stringify(ESPECIES_NATIVAS);

const [, agregadas, conRegion, [{ total }]] = await sql.transaction([
  sql`ALTER TABLE especies ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT ''`,
  sql`INSERT INTO especies (codigo, comun, cientifico, region, minimo)
    SELECT * FROM json_to_recordset(${especies}::json)
      AS x (codigo text, comun text, cientifico text, region text, minimo integer)
    ON CONFLICT (codigo) DO NOTHING
    RETURNING codigo`,
  sql`UPDATE especies e SET region = x.region
    FROM json_to_recordset(${especies}::json) AS x (codigo text, region text)
    WHERE e.codigo = x.codigo AND e.region = ''
    RETURNING e.codigo`,
  sql`SELECT count(*)::int AS total FROM especies`,
]);

console.log(`Especies agregadas: ${agregadas.length}`);
console.log(`Especies existentes a las que se les cargó la región: ${conRegion.length}`);
console.log(`Total de especies en la base: ${total}`);
