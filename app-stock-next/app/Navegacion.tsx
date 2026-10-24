'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECCIONES = [
  { ruta: '/', nombre: 'Stock' },
  { ruta: '/cargar', nombre: 'Cargar' },
  { ruta: '/ultimos', nombre: 'Últimos' },
];

// "usuarios": si se muestra la pestaña Usuarios (solo administradores).
export default function Navegacion({ usuarios }: { usuarios: boolean }) {
  const actual = usePathname();
  const secciones = usuarios ? [...SECCIONES, { ruta: '/usuarios', nombre: 'Usuarios' }] : SECCIONES;
  return (
    <nav>
      {secciones.map(s => (
        <Link key={s.ruta} href={s.ruta} className={actual === s.ruta ? 'activo' : undefined}>
          {s.nombre}
        </Link>
      ))}
    </nav>
  );
}
