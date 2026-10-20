import { leerDatos } from '@/lib/almacen';
import { calcularStock } from '@/lib/stock';
import ListaStock from './ListaStock';

// Siempre leer los datos al momento, nunca mostrar una copia vieja.
export const dynamic = 'force-dynamic';

export default async function PaginaStock() {
  const datos = await leerDatos();
  return <ListaStock especies={datos.especies} tamanos={datos.tamanos} stock={calcularStock(datos.movimientos)} />;
}
