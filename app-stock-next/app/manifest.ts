import type { MetadataRoute } from 'next';

// Permite "instalar" la app en el celu (Agregar a la pantalla de inicio): se abre como una app, a pantalla completa.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Stock · Native',
    short_name: 'Stock Native',
    description: 'Control de stock de Native Trees: árboles nativos y palmeras.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f9f1d9',
    theme_color: '#646945',
    lang: 'es-AR',
    icons: [
      { src: '/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icono-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
