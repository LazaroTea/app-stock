// Claves de los usuarios: nunca se guardan como texto, sino "encriptadas" (un resumen que no se puede
// volver atrás). Para revisar una clave se encripta lo que escribió la persona y se compara.
import 'server-only';
import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'crypto';

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

// ---------- Reglas para elegir una clave (2026-10-24) ----------

export const LARGO_MINIMO = 8;

// Claves muy usadas que se rechazan aunque cumplan el largo (se comparan en minúsculas y sin espacios).
const CLAVES_COMUNES = [
  '12345678', '123456789', '1234567890', '87654321', '11111111', '00000000', '12341234', 'password', 'contraseña',
  'qwertyui', 'asdfghjk', 'contrasena', 'native123', 'nativetrees', 'vivero123', 'arboles123', 'goya1234', 'pilar1234',
];

/** Revisa una clave nueva. Devuelve qué tiene de malo, o '' si está bien. */
export function problemaConClave(clave: string, nombre: string): string {
  // En minúsculas, sin espacios ni acentos ("Rocío" → "rocio").
  const simplificar = (texto: string) =>
    texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s/g, '');
  const simple = simplificar(clave);
  // Cada palabra del nombre (de 3 letras o más) y el nombre entero sin espacios.
  const partesDelNombre = [...nombre.split(/\s+/), nombre].map(simplificar).filter(p => p.length >= 3);
  if (clave.length < LARGO_MINIMO) return `La clave tiene que tener al menos ${LARGO_MINIMO} letras o números.`;
  if (clave.length > 100) return 'La clave es muy larga (máximo 100).';
  if (/^(.)\1*$/.test(simple)) return 'La clave no puede ser el mismo carácter repetido.';
  if (CLAVES_COMUNES.includes(simple)) return 'Esa clave es muy común: elegí otra.';
  if (partesDelNombre.some(p => simple.includes(p))) return 'La clave no puede tener tu nombre.';
  return '';
}

/** Una clave provisoria al azar de 6 números, para que un administrador se la pase a alguien. */
export function claveProvisoria(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}
