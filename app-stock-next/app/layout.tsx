import type { Metadata, Viewport } from 'next';
import { Montserrat, Raleway } from 'next/font/google';
import { usuarioActual } from '@/lib/sesion';
import Navegacion from './Navegacion';
import { cerrarSesion } from './sesion';
import './globals.css';

// Tipografías de la marca Native (las mismas de nativetrees.com.ar y de los presupuestos):
// Montserrat para títulos y números, Raleway para el texto.
const montserrat = Montserrat({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--fuente-titulos' });
const raleway = Raleway({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--fuente-texto' });

export const metadata: Metadata = {
  title: 'Stock · Native',
  description: 'Control de stock de Native Trees: árboles nativos y palmeras.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#646945' };

export default async function Layout({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioActual();
  return (
    <html lang="es" className={`${montserrat.variable} ${raleway.variable}`}>
      <body>
        <header>
          <div className="contenedor encabezado">
            <div className="marca">
              {/* Logo de nativetrees.com.ar (en color crema, para ir sobre el verde de la marca). */}
              <img src="/logo-native.png" alt="Native" className="logo" width={713} height={212} />
              <span className="titulo-app">Stock</span>
            </div>
            {/* En el celu la navegación va abajo (ver globals.css); en pantallas grandes, acá arriba. */}
            {usuario && <Navegacion />}
            <span className="lema">Movemos naturaleza. Creamos paisaje</span>
            {usuario && (
              <form action={cerrarSesion} className="usuario">
                <span className="usuario-nombre">
                  {usuario.nombre}
                  <small>{usuario.rol}</small>
                </span>
                <button type="submit" className="salir">Salir</button>
              </form>
            )}
          </div>
        </header>
        <main className="contenedor">{children}</main>
      </body>
    </html>
  );
}
