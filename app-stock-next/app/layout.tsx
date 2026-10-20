import type { Metadata, Viewport } from 'next';
import Navegacion from './Navegacion';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stock del vivero',
  description: 'Control de stock de árboles nativos',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header>
          <h1>Stock del vivero</h1>
          <span className="demo">Datos de prueba</span>
        </header>
        <Navegacion />
        <main>{children}</main>
      </body>
    </html>
  );
}
