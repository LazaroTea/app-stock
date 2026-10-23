// Agrega a la base las especies de lib/especies.ts que todavía no están.
// Se corre a mano, desde la carpeta app-stock-next:  npm.cmd run cargar-especies
//
// - Las especies que ya existen no se modifican (ni nombre ni stock mínimo),
//   salvo la región si estaba vacía y el grupo (Árbol / Palmera), que siempre se toma del listado.
// - No borra nada.
import { neon } from '@neondatabase/serverless';
import { ESPECIES } from '../lib/especies.ts';

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  console.error('Falta DATABASE_URL: este comando lee la conexión de .env.local.');
  process.exit(1);
}
const sql = neon(url);
const especies = JSON.stringify(ESPECIES);

const [, , agregadas, conRegion, conGrupo, [{ total, palmeras }]] = await sql.transaction([
  sql`ALTER TABLE especies ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT ''`,
  sql`ALTER TABLE especies ADD COLUMN IF NOT EXISTS grupo text NOT NULL DEFAULT 'Árbol'`,
  sql`INSERT INTO especies (codigo, comun, cientifico, region, grupo, minimo)
    SELECT * FROM json_to_recordset(${especies}::json)
      AS x (codigo text, comun text, cientifico text, region text, grupo text, minimo integer)
    ON CONFLICT (codigo) DO NOTHING
    RETURNING codigo`,
  sql`UPDATE especies e SET region = x.region
    FROM json_to_recordset(${especies}::json) AS x (codigo text, region text)
    WHERE e.codigo = x.codigo AND e.region = ''
    RETURNING e.codigo`,
  sql`UPDATE especies e SET grupo = x.grupo
    FROM json_to_recordset(${especies}::json) AS x (codigo text, grupo text)
    WHERE e.codigo = x.codigo AND e.grupo <> x.grupo
    RETURNING e.codigo`,
  sql`SELECT count(*)::int AS total, count(*) FILTER (WHERE grupo = 'Palmera')::int AS palmeras FROM especies`,
]);

console.log(`Especies agregadas: ${agregadas.length}`);
console.log(`Especies existentes a las que se les cargó la región: ${conRegion.length}`);
console.log(`Especies existentes a las que se les corrigió el grupo: ${conGrupo.length}`);
console.log(`Total de especies en la base: ${total} (${palmeras} palmeras)`);
