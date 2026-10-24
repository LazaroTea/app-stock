'use server';
// Lo que pasa en el servidor desde la pantalla Usuarios. Todo revisa antes que quien lo pide sea administrador.
import { revalidatePath } from 'next/cache';
import { cambiarActivo, cambiarRol, crearUsuario, guardarClave } from '@/lib/almacen';
import { claveProvisoria, encriptarClave } from '@/lib/claves';
import { puedeAdministrarUsuarios } from '@/lib/permisos';
import { usuarioActual } from '@/lib/sesion';
import { ROLES, type Rol, type Usuario } from '@/lib/tipos';

export interface ResultadoUsuarios {
  ok: boolean;
  mensaje: string;
  /** La clave provisoria recién creada, para que el administrador se la pase a la persona. Se muestra una vez. */
  clave?: string;
}

const ERROR_BASE = 'Hubo un problema con la base de datos. Probá de nuevo en un rato.';

// Quién pide el cambio, si es administrador; si no, el mensaje de error.
async function administrador(): Promise<Usuario | string> {
  const usuario = await usuarioActual();
  if (!usuario || usuario.cambiarClave) return 'Tu sesión se cerró o tenés que cambiar la clave: volvé a ingresar.';
  if (!puedeAdministrarUsuarios(usuario)) return 'No tenés permiso para administrar usuarios.';
  return usuario;
}

// Corre el cambio, refresca la pantalla y atrapa los errores de la base.
async function hacer(cambio: () => Promise<ResultadoUsuarios>): Promise<ResultadoUsuarios> {
  try {
    const resultado = await cambio();
    revalidatePath('/usuarios');
    return resultado;
  } catch (e) {
    console.error('Error en Usuarios:', e);
    return { ok: false, mensaje: ERROR_BASE };
  }
}

export async function agregarUsuario(nombre: string, rol: Rol): Promise<ResultadoUsuarios> {
  const admin = await administrador();
  if (typeof admin === 'string') return { ok: false, mensaje: admin };
  const n = String(nombre ?? '').trim().replace(/\s+/g, ' ');
  if (n.length < 2 || n.length > 40) return { ok: false, mensaje: 'El nombre tiene que tener entre 2 y 40 letras.' };
  if (!/^[\p{L} .'-]+$/u.test(n)) return { ok: false, mensaje: 'El nombre solo puede tener letras y espacios.' };
  if (!ROLES.includes(rol)) return { ok: false, mensaje: 'Elegí el rol.' };
  return hacer(async () => {
    const clave = claveProvisoria();
    if (!(await crearUsuario(n, rol, encriptarClave(clave)))) {
      return { ok: false, mensaje: `Ya hay un usuario que se llama ${n}.` };
    }
    return { ok: true, mensaje: `Listo: ${n} ya puede ingresar como ${rol.toLowerCase()} con esta clave provisoria.`, clave };
  });
}

export async function darClaveProvisoria(usuarioId: number, nombre: string): Promise<ResultadoUsuarios> {
  const admin = await administrador();
  if (typeof admin === 'string') return { ok: false, mensaje: admin };
  return hacer(async () => {
    const clave = claveProvisoria();
    // Cierra sus sesiones abiertas y saca el bloqueo, si tenía.
    await guardarClave(usuarioId, encriptarClave(clave), true);
    return { ok: true, mensaje: `Nueva clave provisoria de ${nombre}. Al ingresar va a tener que elegir una propia.`, clave };
  });
}

export async function cambiarRolUsuario(usuarioId: number, rol: Rol): Promise<ResultadoUsuarios> {
  const admin = await administrador();
  if (typeof admin === 'string') return { ok: false, mensaje: admin };
  // Nadie se cambia el rol a sí mismo: así siempre queda al menos un administrador.
  if (usuarioId === admin.id) return { ok: false, mensaje: 'No podés cambiar tu propio rol.' };
  if (!ROLES.includes(rol)) return { ok: false, mensaje: 'Rol inválido.' };
  return hacer(async () => {
    await cambiarRol(usuarioId, rol);
    return { ok: true, mensaje: 'Rol cambiado.' };
  });
}

export async function cambiarAccesoUsuario(usuarioId: number, activo: boolean): Promise<ResultadoUsuarios> {
  const admin = await administrador();
  if (typeof admin === 'string') return { ok: false, mensaje: admin };
  if (usuarioId === admin.id) return { ok: false, mensaje: 'No podés darte de baja a vos mismo.' };
  return hacer(async () => {
    await cambiarActivo(usuarioId, Boolean(activo));
    return { ok: true, mensaje: activo ? 'Usuario dado de alta otra vez.' : 'Usuario dado de baja: ya no puede ingresar.' };
  });
}
