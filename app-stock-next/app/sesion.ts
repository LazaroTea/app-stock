'use server';
// Iniciar y cerrar sesión, y cambiar la clave propia (se ejecuta en el servidor).
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  anotarIntentoFallido,
  borrarSesion,
  buscarUsuario,
  crearSesion,
  DIAS_DE_SESION,
  guardarClave,
  INTENTOS_PERMITIDOS,
  leerClave,
  MINUTOS_DE_BLOQUEO,
} from '@/lib/almacen';
import { claveCorrecta, encriptarClave, problemaConClave } from '@/lib/claves';
import { COOKIE_SESION, tokenActual, usuarioActual } from '@/lib/sesion';

export interface ResultadoIngreso {
  mensaje: string;
}

const ERROR_BASE = 'Hubo un problema con la base de datos. Probá de nuevo en un rato.';

export async function iniciarSesion(_anterior: ResultadoIngreso | null, datos: FormData): Promise<ResultadoIngreso> {
  const nombre = String(datos.get('nombre') ?? '');
  const clave = String(datos.get('clave') ?? '');
  if (!nombre) return { mensaje: 'Elegí tu nombre.' };
  if (!clave) return { mensaje: 'Escribí tu clave.' };
  let destino = '/';
  try {
    const usuario = await buscarUsuario(nombre);
    if (!usuario) return { mensaje: 'El nombre o la clave no son correctos.' };
    // Bloqueado por muchos intentos equivocados: ni se revisa la clave.
    if (usuario.minutosBloqueado > 0) {
      return {
        mensaje: `Por seguridad, ${usuario.nombre} quedó bloqueado por demasiados intentos con la clave equivocada. ` +
          `Probá de nuevo en ${usuario.minutosBloqueado} ${usuario.minutosBloqueado === 1 ? 'minuto' : 'minutos'}, ` +
          'o pedile a un administrador una clave provisoria.',
      };
    }
    if (!claveCorrecta(clave, usuario.clave)) {
      await anotarIntentoFallido(usuario.id);
      return {
        mensaje: `El nombre o la clave no son correctos. Después de ${INTENTOS_PERMITIDOS} intentos equivocados ` +
          `seguidos, el usuario se bloquea ${MINUTOS_DE_BLOQUEO} minutos.`,
      };
    }
    const token = await crearSesion(usuario.id);
    (await cookies()).set(COOKIE_SESION, token, {
      httpOnly: true, // el código de la página no la puede leer
      secure: process.env.NODE_ENV === 'production', // en Vercel, solo por https
      sameSite: 'lax',
      path: '/',
      maxAge: DIAS_DE_SESION * 24 * 60 * 60,
    });
    // Con clave provisoria, lo primero es cambiarla.
    if (usuario.cambiarClave) destino = '/clave';
  } catch (e) {
    console.error('Error al iniciar sesión:', e);
    return { mensaje: `No se pudo iniciar sesión. ${ERROR_BASE}` };
  }
  redirect(destino); // fuera del try: redirect funciona lanzando un aviso especial
}

export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  const token = almacen.get(COOKIE_SESION)?.value;
  if (token) await borrarSesion(token);
  almacen.delete(COOKIE_SESION);
  redirect('/login');
}

export interface ResultadoClave {
  ok: boolean;
  mensaje: string;
}

// Cambiar la clave propia. Pide la actual (por si alguien encuentra la sesión abierta en un celu ajeno).
// Al cambiarla, se cierran las sesiones en los demás dispositivos.
export async function cambiarMiClave(_anterior: ResultadoClave | null, datos: FormData): Promise<ResultadoClave> {
  const actual = String(datos.get('actual') ?? '');
  const nueva = String(datos.get('nueva') ?? '');
  const repetida = String(datos.get('repetida') ?? '');
  const usuario = await usuarioActual();
  if (!usuario) redirect('/login');
  if (!actual || !nueva) return { ok: false, mensaje: 'Completá la clave actual y la nueva.' };
  if (nueva !== repetida) return { ok: false, mensaje: 'La clave nueva y la repetida no son iguales.' };
  if (nueva === actual) return { ok: false, mensaje: 'La clave nueva tiene que ser distinta de la actual.' };
  const problema = problemaConClave(nueva, usuario.nombre);
  if (problema) return { ok: false, mensaje: problema };
  try {
    const guardada = await leerClave(usuario.id);
    if (!guardada || !claveCorrecta(actual, guardada)) return { ok: false, mensaje: 'La clave actual no es correcta.' };
    await guardarClave(usuario.id, encriptarClave(nueva), false, await tokenActual());
  } catch (e) {
    console.error('Error al cambiar la clave:', e);
    return { ok: false, mensaje: `No se pudo cambiar la clave. ${ERROR_BASE}` };
  }
  revalidatePath('/', 'layout');
  return { ok: true, mensaje: 'Listo: tu clave nueva quedó guardada. En los demás dispositivos vas a tener que volver a ingresar.' };
}
