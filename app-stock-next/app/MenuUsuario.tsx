'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cerrarSesion } from './sesion';

// Arriba a la derecha: el nombre y el rol de quien ingresó. Tocándolo se abre un menú con Mi clave y Salir.
export default function MenuUsuario({ nombre, rol }: { nombre: string; rol: string }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const ruta = usePathname();

  // Se cierra al cambiar de pantalla, al tocar afuera o con Escape.
  useEffect(() => setAbierto(false), [ruta]);
  useEffect(() => {
    if (!abierto) return;
    const afuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('pointerdown', afuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', afuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  return (
    <div className="usuario" ref={caja}>
      <button
        type="button"
        className="usuario-boton"
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto(a => !a)}
      >
        <span className="usuario-nombre">
          {nombre}
          <small>{rol}</small>
        </span>
        <span className="flechita" aria-hidden="true">
          ▾
        </span>
      </button>
      {abierto && (
        <div className="usuario-menu" role="menu">
          <Link href="/clave" role="menuitem">
            Mi clave
          </Link>
          <form action={cerrarSesion}>
            <button type="submit" role="menuitem">
              Salir
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
