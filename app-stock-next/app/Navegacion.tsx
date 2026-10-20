'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECCIONES = [
  { ruta: '/', nombre: 'Stock' },
  { ruta: '/cargar', nombre: 'Cargar' },
  { ruta: '/ultimos', nombre: 'Últimos' },
];

export default function Navegacion() {
  const actual = usePathname();
  return (
    <nav>
      {SECCIONES.map(s => (
        <Link key={s.ruta} href={s.ruta} className={actual === s.ruta ? 'activo' : undefined}>
          {s.nombre}
        </Link>
      ))}
    </nav>
  );
}
