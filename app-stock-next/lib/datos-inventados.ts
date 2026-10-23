// Datos de ejemplo INVENTADOS para probar la app. No son datos reales del vivero.
// Se cargan en la base de datos solo la primera vez, cuando las tablas están vacías.
import { cantidadConSigno } from './stock';
import type { Datos, Especie, Movimiento, TipoMovimiento } from './tipos';

const ESPECIES: Especie[] = [
  { codigo: 'ALG', comun: 'Algarrobo blanco', cientifico: 'Prosopis alba', minimo: 50 },
  { codigo: 'ALN', comun: 'Algarrobo negro', cientifico: 'Prosopis nigra', minimo: 30 },
  { codigo: 'ANC', comun: 'Anchico colorado', cientifico: 'Parapiptadenia rigida', minimo: 10 },
  { codigo: 'ARR', comun: 'Arrayán', cientifico: 'Blepharocalyx salicifolius', minimo: 10 },
  { codigo: 'CEI', comun: 'Ceibo', cientifico: 'Erythrina crista-galli', minimo: 20 },
  { codigo: 'CHL', comun: 'Chal-chal', cientifico: 'Allophylus edulis', minimo: 15 },
  { codigo: 'CHN', comun: 'Chañar', cientifico: 'Geoffroea decorticans', minimo: 20 },
  { codigo: 'COR', comun: 'Coronillo', cientifico: 'Scutia buxifolia', minimo: 15 },
  { codigo: 'CUR', comun: 'Curupí', cientifico: 'Sapium haematospermum', minimo: 10 },
  { codigo: 'ESP', comun: 'Espinillo', cientifico: 'Vachellia caven', minimo: 30 },
  { codigo: 'ING', comun: 'Ingá', cientifico: 'Inga uruguensis', minimo: 10 },
  { codigo: 'JAC', comun: 'Jacarandá', cientifico: 'Jacaranda mimosifolia', minimo: 15 },
  { codigo: 'LAP', comun: 'Lapacho rosado', cientifico: 'Handroanthus impetiginosus', minimo: 20 },
  { codigo: 'MOL', comun: 'Molle', cientifico: 'Schinus longifolius', minimo: 20 },
  { codigo: 'PAL', comun: 'Palo borracho', cientifico: 'Ceiba speciosa', minimo: 10 },
  { codigo: 'PIT', comun: 'Pitanga', cientifico: 'Eugenia uniflora', minimo: 20 },
  { codigo: 'QBL', comun: 'Quebracho blanco', cientifico: 'Aspidosperma quebracho-blanco', minimo: 15 },
  { codigo: 'QCO', comun: 'Quebracho colorado chaqueño', cientifico: 'Schinopsis balansae', minimo: 10 },
  { codigo: 'SAU', comun: 'Sauce criollo', cientifico: 'Salix humboldtiana', minimo: 25 },
  { codigo: 'SDT', comun: 'Sombra de toro', cientifico: 'Jodina rhombifolia', minimo: 10 },
  { codigo: 'TAL', comun: 'Tala', cientifico: 'Celtis tala', minimo: 40 },
  { codigo: 'TIM', comun: 'Timbó', cientifico: 'Enterolobium contortisiliquum', minimo: 15 },
  { codigo: 'TIP', comun: 'Tipa', cientifico: 'Tipuana tipu', minimo: 25 },
];

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
      const especie = elegir(ESPECIES);
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

  return { especies: ESPECIES, tamanos: TAMANOS, movimientos };
}
