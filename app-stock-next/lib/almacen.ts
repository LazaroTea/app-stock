// Guarda los datos en un archivo JSON (data/stock.json). Solo corre en el servidor.
// Si el archivo no existe, lo crea con los datos inventados.
// Para volver a empezar con los datos de ejemplo, borrá data/stock.json.
import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { crearDatosIniciales } from './datos-inventados';
import type { Datos } from './tipos';

const CARPETA = path.join(process.cwd(), 'data');
const ARCHIVO = path.join(CARPETA, 'stock.json');

export async function leerDatos(): Promise<Datos> {
  try {
    return JSON.parse(await fs.readFile(ARCHIVO, 'utf8')) as Datos;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    const datos = crearDatosIniciales();
    await guardarDatos(datos);
    return datos;
  }
}

// Escribe primero un archivo temporal y después lo renombra,
// así un corte a mitad de camino no deja el archivo roto.
export async function guardarDatos(datos: Datos): Promise<void> {
  await fs.mkdir(CARPETA, { recursive: true });
  await fs.writeFile(ARCHIVO + '.tmp', JSON.stringify(datos, null, 2), 'utf8');
  await fs.rename(ARCHIVO + '.tmp', ARCHIVO);
}

// Hace que los cambios se guarden de a uno, aunque dos personas carguen al mismo tiempo.
let cola: Promise<unknown> = Promise.resolve();
export function deAUno<T>(tarea: () => Promise<T>): Promise<T> {
  const resultado = cola.then(tarea, tarea);
  cola = resultado.catch(() => {});
  return resultado;
}
