import type { Metadata, Viewport } from 'next';
import Navegacion from './Navegacion';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stock del vivero',
  description: 'Control de stock de árboles nativos',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#2f6b3a' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header>
          <div className="contenedor encabezado">
            <h1>Stock del vivero</h1>
            {/* En el celu la navegación va abajo (ver globals.css); en pantallas grandes, acá arriba. */}
            <Navegacion />
            <span className="demo">Datos de prueba</span>
          </div>
        </header>
        <main className="contenedor">{children}</main>
      </body>
    </html>
  );
}
