import { leerUsuarios } from '@/lib/almacen';
import { exigirAdministrador } from '@/lib/sesion';
import AdministrarUsuarios from './AdministrarUsuarios';

export const dynamic = 'force-dynamic';

// Pantalla Usuarios (solo administradores): agregar, dar de baja, cambiar el rol y dar claves provisorias.
export default async function PaginaUsuarios() {
  const yo = await exigirAdministrador();
  const usuarios = await leerUsuarios();
  return <AdministrarUsuarios usuarios={usuarios} miId={yo.id} />;
}
