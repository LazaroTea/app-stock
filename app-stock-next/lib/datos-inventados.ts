// Datos de ejemplo INVENTADOS para probar la app. No son datos reales del vivero.
// Se cargan en la base de datos solo la primera vez, cuando las tablas están vacías.
import { ESPECIES_NATIVAS } from './especies-nativas';
import { cantidadConSigno } from './stock';
import type { Datos, Movimiento, TipoMovimiento } from './tipos';

// Los movimientos inventados se generan solo para las especies con stock mínimo (las 23 originales).
const CON_MOVIMIENTOS = ESPECIES_NATIVAS.filter(e => e.minimo > 0);

const TAMANOS = ['Maceta 1 L', 'Maceta 3 L', 'Maceta 10 L', 'Envase 20 L'];
const RESPONSABLES = ['Ana', 'Luis', 'Marta', 'Diego'];
const OBSERVACIONES: Record<TipoMovimiento, string[]> = {
  Entrada: ['Producción propia', 'Repique de almácigo', 'Donación de la cooperativa', ''],
  Salida: ['Venta a municipio', 'Venta mostrador', 'Entrega a escuela', 'Pérdida por helada', ''],
  Ajuste: ['Conteo mensual'],
};

// Generador de números al azar con semilla fija: siempre inventa los mismos datos.
function azar(semilla: number) {
  return () => {
    semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function crearDatosIniciales(): Datos {
  const r = azar(2026);
  const entre = (min: number, max: number) => min + Math.floor(r() * (max - min + 1));
  const elegir = <T,>(lista: T[]) => lista[Math.floor(r() * lista.length)];

  const movimientos: Movimiento[] = [];
  const stock: Record<string, number> = {};
  const inicio = new Date(2026, 6, 1); // 1 de julio de 2026

  for (let dia = 0; dia < 110; dia++) {
    const fecha = new Date(inicio);
    fecha.setDate(inicio.getDate() + dia);
    if (fecha.getDay() === 0) continue; // los domingos no se trabaja
    const fechaTexto = fecha.toLocaleDateString('sv-SE'); // AAAA-MM-DD

    for (let i = entre(0, 3); i > 0; i--) {
      const especie = elegir(CON_MOVIMIENTOS);
      const tamano = elegir(TAMANOS);
      const clave = especie.codigo + '|' + tamano;
      const hay = stock[clave] ?? 0;

      let tipo: TipoMovimiento;
      let cantidad: number;
      const tirada = r();
      if (hay > 5 && tirada < 0.4) {
        tipo = 'Salida';
        cantidad = entre(1, Math.min(hay, 25));
      } else if (hay > 5 && tirada < 0.47) {
        tipo = 'Ajuste';
        cantidad = entre(-3, 2) || -1;
      } else {
        tipo = 'Entrada';
        cantidad = tamano === 'Maceta 1 L' ? entre(10, 60) : entre(2, 20);
      }

      stock[clave] = hay + cantidadConSigno(tipo, cantidad);
      movimientos.push({
        id: movimientos.length + 1,
        fecha: fechaTexto,
        tipo,
        codigo: especie.codigo,
        tamano,
        cantidad,
        responsable: elegir(RESPONSABLES),
        observaciones: elegir(OBSERVACIONES[tipo]),
        registrado: new Date(fecha.getTime() + entre(8, 17) * 3600000).toISOString(),
      });
    }
  }

  return { especies: ESPECIES_NATIVAS, tamanos: TAMANOS, movimientos };
}
