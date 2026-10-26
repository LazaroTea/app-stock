// Service worker: permite abrir la app sin señal.
//  - Las pantallas (Stock, Cargar, Últimos y las que ya se abrieron) se guardan en el celu cada vez que se abren
//    con señal. Sin señal, se muestra la última copia guardada. Con señal lenta, se espera 4 segundos a la red y
//    si no llega se muestra la copia.
//  - Los archivos de la app (/_next/static, logos, tipografías) se guardan una vez y se reusan.
//  - Lo que se carga sin señal no pasa por acá: lo guarda la pantalla (ver app/Sincronizador.tsx).
// Al cerrar sesión se borran las pantallas guardadas (mensaje "limpiar").
const VERSION = 'v1';
const PANTALLAS = 'pantallas-' + VERSION;
const ARCHIVOS = 'archivos-' + VERSION;
const ESPERA_A_LA_RED = 4000;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', evento => {
  evento.waitUntil(
    (async () => {
      for (const nombre of await caches.keys()) {
        if (nombre !== PANTALLAS && nombre !== ARCHIVOS) await caches.delete(nombre);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', evento => {
  if (evento.data === 'limpiar') evento.waitUntil(caches.delete(PANTALLAS));
});

self.addEventListener('fetch', evento => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return; // guardar, modificar, anular: siempre por la red
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/_next/static/') || /\.(?:png|svg|ico)$/.test(url.pathname)) {
    evento.respondWith(archivo(pedido));
    return;
  }
  // Las pantallas: navegaciones y las descargas de HTML que hace la app para dejarlas listas. Los pedidos internos
  // de Next (cabecera RSC) van por la red normal; si fallan, Next vuelve a cargar la pantalla entera y entra acá.
  const quiereHtml = pedido.mode === 'navigate' || (pedido.headers.get('accept') || '').includes('text/html');
  if (quiereHtml && !pedido.headers.get('rsc')) evento.respondWith(pantalla(pedido, evento));
});

// Archivos que no cambian (los de /_next/static llevan una huella en el nombre): primero la copia guardada.
async function archivo(pedido) {
  const cache = await caches.open(ARCHIVOS);
  const guardado = await cache.match(pedido, { ignoreVary: true });
  if (guardado) return guardado;
  const respuesta = await fetch(pedido);
  if (respuesta.ok) cache.put(pedido, respuesta.clone());
  return respuesta;
}

const SIN_COPIA = () =>
  new Response(
    '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Sin conexión · Native</title><style>body{font-family:system-ui,sans-serif;background:#f9f1d9;color:#505437;margin:0;padding:32px 20px}' +
      'h1{font-size:1.3rem}p{line-height:1.5}</style></head><body><h1>Sin conexión</h1>' +
      '<p>Esta pantalla todavía no se guardó en el celu. Abrí la app una vez con señal (iniciá sesión y esperá un momento) ' +
      'y después va a abrir también sin señal.</p></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );

// Pantallas: la red primero (siempre se quiere lo más nuevo), con la copia guardada como respaldo.
async function pantalla(pedido, evento) {
  const cache = await caches.open(PANTALLAS);
  const copia = await cache.match(pedido, { ignoreVary: true });

  const red = fetch(pedido).then(async respuesta => {
    if (respuesta.status >= 500) throw new Error('error del servidor');
    // Solo se guardan las pantallas normales: no los redireccionamientos (por ejemplo, al ingreso si no hay sesión).
    if (respuesta.ok && respuesta.type === 'basic') {
      await cache.put(pedido, respuesta.clone());
    }
    return respuesta;
  });
  evento.waitUntil(red.catch(() => {})); // que termine de guardar aunque se haya mostrado la copia

  if (!copia) return red.catch(SIN_COPIA);
  const demora = new Promise(resolver => setTimeout(() => resolver(copia), ESPERA_A_LA_RED));
  return Promise.race([red, demora]).catch(() => copia);
}
