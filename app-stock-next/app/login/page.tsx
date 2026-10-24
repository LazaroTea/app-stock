import { redirect } from 'next/navigation';
import { leerNombresUsuarios } from '@/lib/almacen';
import { usuarioActual } from '@/lib/sesion';
import Ingreso from './Ingreso';

export const dynamic = 'force-dynamic';

// Pantalla de ingreso: elegir el nombre y escribir la clave.
export default async function PaginaLogin() {
  if (await usuarioActual()) redirect('/');
  const nombres = await leerNombresUsuarios();
  return <Ingreso nombres={nombres} />;
}
