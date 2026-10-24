'use server';
// Iniciar y cerrar sesión (se ejecuta en el servidor).
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { borrarSesion, buscarUsuario, crearSesion, DIAS_DE_SESION } from '@/lib/almacen';
import { claveCorrecta } from '@/lib/claves';
import { COOKIE_SESION } from '@/lib/sesion';

export interface ResultadoIngreso {
  mensaje: string;
}

export async function iniciarSesion(_anterior: ResultadoIngreso | null, datos: FormData): Promise<ResultadoIngreso> {
  const nombre = String(datos.get('nombre') ?? '');
  const clave = String(datos.get('clave') ?? '');
  if (!nombre) return { mensaje: 'Elegí tu nombre.' };
  if (!clave) return { mensaje: 'Escribí tu clave.' };
  try {
    const usuario = await buscarUsuario(nombre);
    // El mismo mensaje en los dos casos, para no dar pistas.
    if (!usuario || !claveCorrecta(clave, usuario.clave)) return { mensaje: 'El nombre o la clave no son correctos.' };
    const token = await crearSesion(usuario.id);
    (await cookies()).set(COOKIE_SESION, token, {
      httpOnly: true, // el código de la página no la puede leer
      secure: process.env.NODE_ENV === 'production', // en Vercel, solo por https
      sameSite: 'lax',
      path: '/',
      maxAge: DIAS_DE_SESION * 24 * 60 * 60,
    });
  } catch (e) {
    console.error('Error al iniciar sesión:', e);
    return { mensaje: 'No se pudo iniciar sesión: hubo un problema con la base de datos. Probá de nuevo en un rato.' };
  }
  redirect('/'); // fuera del try: redirect funciona lanzando un aviso especial
}

export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  const token = almacen.get(COOKIE_SESION)?.value;
  if (token) await borrarSesion(token);
  almacen.delete(COOKIE_SESION);
  redirect('/login');
}
