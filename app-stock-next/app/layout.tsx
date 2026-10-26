import type { Metadata, Viewport } from 'next';
import { Montserrat, Raleway } from 'next/font/google';
import { puedeAdministrarUsuarios } from '@/lib/permisos';
import { usuarioActual } from '@/lib/sesion';
import MenuUsuario from './MenuUsuario';
import Navegacion from './Navegacion';
import Sincronizador from './Sincronizador';
import './globals.css';

// Tipografías de la marca Native (las mismas de nativetrees.com.ar y de los presupuestos):
// Montserrat para títulos y números, Raleway para el texto.
const montserrat = Montserrat({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--fuente-titulos' });
const raleway = Raleway({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--fuente-texto' });

export const metadata: Metadata = {
  title: 'Stock · Native',
  description: 'Control de stock de Native Trees: árboles nativos y palmeras.',
  // Ícono al agregar la app a la pantalla de inicio (iPhone).
  icons: { apple: '/icono-192.png' },
  appleWebApp: { capable: true, title: 'Stock Native', statusBarStyle: 'default' },
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
            </div>
            {/* En el celu la navegación va abajo (ver globals.css); en pantallas grandes, acá arriba. */}
            {/* Con clave provisoria no hay pestañas: primero tiene que cambiarla. */}
            {usuario && !usuario.cambiarClave && <Navegacion usuarios={puedeAdministrarUsuarios(usuario)} />}
            {usuario && <MenuUsuario nombre={usuario.nombre} rol={usuario.rol} />}
          </div>
        </header>
        {/* Sin señal: avisos, remitos pendientes y subida automática. */}
        {usuario && !usuario.cambiarClave && (
          <div className="contenedor">
            <Sincronizador usuario={usuario.nombre} />
          </div>
        )}
        <main className="contenedor">{children}</main>
      </body>
    </html>
  );
}
