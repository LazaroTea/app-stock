// Claves de los usuarios: nunca se guardan como texto, sino "encriptadas" (un resumen que no se puede
// volver atrás). Para revisar una clave se encripta lo que escribió la persona y se compara.
import 'server-only';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// Formato guardado: "scrypt$<sal>$<resumen>".
export function encriptarClave(clave: string): string {
  const sal = randomBytes(16).toString('hex');
  const resumen = scryptSync(clave, sal, 64).toString('hex');
  return `scrypt$${sal}$${resumen}`;
}

export function claveCorrecta(clave: string, guardada: string): boolean {
  const [metodo, sal, resumen] = guardada.split('$');
  if (metodo !== 'scrypt' || !sal || !resumen) return false;
  const esperado = Buffer.from(resumen, 'hex');
  const calculado = scryptSync(clave, sal, esperado.length);
  return timingSafeEqual(esperado, calculado);
}
