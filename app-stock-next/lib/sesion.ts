// Quién está usando la app. Al iniciar sesión, el navegador guarda una cookie "sesion" con un código al azar
// (el token); en cada pedido se busca en la base a qué usuario corresponde.
import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { usuarioDeSesion } from './almacen';
import { puedeAdministrarUsuarios } from './permisos';
import type { Usuario } from './tipos';

export const COOKIE_SESION = 'sesion';

/** El usuario que inició sesión, o null. Se busca una sola vez por pedido (cache). */
export const usuarioActual = cache(async (): Promise<Usuario | null> => {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (!token) return null;
  return usuarioDeSesion(token);
});

/**
 * El usuario que inició sesión; si no hay ninguno, lleva a la pantalla de ingreso. Si su clave es provisoria,
 * lleva a cambiarla (salvo en la misma pantalla de cambiar la clave: aceptarProvisoria).
 */
export async function exigirUsuario({ aceptarProvisoria = false } = {}): Promise<Usuario> {
  const usuario = await usuarioActual();
  if (!usuario) redirect('/login');
  if (usuario.cambiarClave && !aceptarProvisoria) redirect('/clave');
  return usuario;
}

/** Como exigirUsuario, pero además tiene que poder administrar usuarios; si no, vuelve al inicio. */
export async function exigirAdministrador(): Promise<Usuario> {
  const usuario = await exigirUsuario();
  if (!puedeAdministrarUsuarios(usuario)) redirect('/');
  return usuario;
}

/** El token de la sesión de este dispositivo (para no cerrarla al cambiar la clave). */
export async function tokenActual(): Promise<string> {
  return (await cookies()).get(COOKIE_SESION)?.value ?? '';
}
