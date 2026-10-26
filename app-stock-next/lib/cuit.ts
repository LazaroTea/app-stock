// CUIT: 11 números. Los dos primeros dicen el tipo (20, 23, 24 y 27 personas; 30, 33 y 34 empresas) y el último
// es un dígito verificador que sirve para detectar errores de tipeo. Sirve en la pantalla y en el servidor.

/** Deja solo los números: "30-71792140-9" → "30717921409". */
export function soloNumeros(texto: string): string {
  return texto.replace(/\D/g, '');
}

/** "30717921409" → "30-71792140-9" (si no tiene 11 números, lo devuelve como está). */
export function formatearCuit(texto: string): string {
  const n = soloNumeros(texto);
  return n.length === 11 ? `${n.slice(0, 2)}-${n.slice(2, 10)}-${n.slice(10)}` : texto;
}

const PESOS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** El dígito verificador que le corresponde a los primeros 10 números. */
function digitoVerificador(diez: string): number {
  const suma = [...diez].reduce((total, d, i) => total + Number(d) * PESOS[i], 0);
  const resto = 11 - (suma % 11);
  return resto === 11 ? 0 : resto === 10 ? 9 : resto;
}

/** Si el CUIT tiene 11 números, un tipo válido y el dígito verificador correcto. */
export function cuitValido(texto: string): boolean {
  const n = soloNumeros(texto);
  if (n.length !== 11 || !['20', '23', '24', '27', '30', '33', '34'].includes(n.slice(0, 2))) return false;
  return digitoVerificador(n.slice(0, 10)) === Number(n[10]);
}
