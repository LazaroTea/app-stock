import { leerDatos } from '@/lib/almacen';
import { calcularStock } from '@/lib/stock';
import Formulario from './Formulario';

export const dynamic = 'force-dynamic';

export default async function PaginaCargar() {
  const datos = await leerDatos();
  return (
    <Formulario
      especies={datos.especies}
      tamanos={datos.tamanos}
      stock={calcularStock(datos.movimientos)}
      hoy={new Date().toLocaleDateString('sv-SE')}
    />
  );
}
