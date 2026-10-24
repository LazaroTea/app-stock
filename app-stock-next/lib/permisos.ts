// Quién puede hacer qué, según el rol del usuario (ver ROLES en lib/tipos.ts):
// - Administrador: todo, también la pantalla Usuarios (agregar, dar de baja, cambiar roles y dar claves provisorias).
// - Colaborador: cargar movimientos y ajustes, y ver el stock y los remitos; no modificar ni anular.
//
// Las pantallas (para mostrar u ocultar los botones) y el servidor (para rechazar el pedido aunque alguien
// lo intente igual) preguntan acá, así que para cambiar los permisos alcanza con cambiar este archivo.
import type { Usuario } from './tipos';

/** Puede cambiar los datos y las líneas de un remito ya guardado. */
export function puedeModificarRemitos(usuario: Usuario | null): boolean {
  return usuario?.rol === 'Administrador';
}

/** Puede anular un remito (deja de contar en el stock, pero no se borra). */
export function puedeAnularRemitos(usuario: Usuario | null): boolean {
  return usuario?.rol === 'Administrador';
}

/** Puede entrar a la pantalla Usuarios. */
export function puedeAdministrarUsuarios(usuario: Usuario | null): boolean {
  return usuario?.rol === 'Administrador';
}
