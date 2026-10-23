import { leerCatalogo, leerStock } from '@/lib/almacen';
import Formulario from './Formulario';

export const dynamic = 'force-dynamic';

export default async function PaginaCargar() {
  const [{ especies, tamanos }, stock] = await Promise.all([leerCatalogo(), leerStock()]);
  return (
    <Formulario
      especies={especies}
      tamanos={tamanos}
      stock={stock}
      // Vercel corre en hora UTC: la fecha de hoy se calcula con la hora de Argentina.
      hoy={new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })}
    />
  );
}
