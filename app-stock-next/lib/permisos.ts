// Quién puede hacer qué. Todavía no hay usuarios ni inicio de sesión, así que por ahora todos pueden todo.
//
// Cuando se agreguen los usuarios, acá se va a decidir, por ejemplo, que solo ciertos usuarios puedan
// modificar o anular remitos. Las pantallas (para mostrar u ocultar los botones) y el servidor (para
// rechazar el pedido aunque alguien lo intente igual) preguntan acá, así que alcanza con cambiar este archivo.

/** Puede cambiar los datos y las líneas de un remito ya guardado. */
export function puedeModificarRemitos(): boolean {
  return true;
}

/** Puede anular un remito (deja de contar en el stock, pero no se borra). */
export function puedeAnularRemitos(): boolean {
  return true;
}
