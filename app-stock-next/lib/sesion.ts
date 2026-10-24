// Quién está usando la app. Al iniciar sesión, el navegador guarda una cookie "sesion" con un código al azar
// (el token); en cada pedido se busca en la base a qué usuario corresponde.
import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { usuarioDeSesion } from './almacen';
import type { Usuario } from './tipos';

export const COOKIE_SESION = 'sesion';

/** El usuario que inició sesión, o null. Se busca una sola vez por pedido (cache). */
export const usuarioActual = cache(async (): Promise<Usuario | null> => {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (!token) return null;
  return usuarioDeSesion(token);
});

/** El usuario que inició sesión; si no hay ninguno, lleva a la pantalla de ingreso. */
export async function exigirUsuario(): Promise<Usuario> {
  const usuario = await usuarioActual();
  if (!usuario) redirect('/login');
  return usuario;
}
