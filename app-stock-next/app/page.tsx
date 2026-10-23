import { leerCatalogo, leerStock } from '@/lib/almacen';
import ListaStock from './ListaStock';

// Siempre leer los datos al momento, nunca mostrar una copia vieja.
export const dynamic = 'force-dynamic';

export default async function PaginaStock() {
  const [{ especies, presentaciones, tamanos }, stock] = await Promise.all([leerCatalogo(), leerStock()]);
  return <ListaStock especies={especies} presentaciones={presentaciones} tamanos={tamanos} stock={stock} />;
}
