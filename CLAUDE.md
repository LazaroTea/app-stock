# Desarrollos Claude

Carpeta de trabajo para los desarrollos que hacemos con Claude Code.

## Reglas de trabajo

- Todo archivo que se genere se guarda dentro de esta carpeta, en la subcarpeta del proyecto que corresponda
  (por ejemplo `app-stock/`). Nada de trabajo queda en carpetas temporales.
- Cada proyecto tiene:
  - `README.md`: qué es, qué archivos tiene y cómo se usa.
  - `BITACORA.md`: registro por fecha de lo que se hizo, lo que se decidió y por qué, y lo que queda pendiente.
- Después de cada cambio se actualiza la bitácora del proyecto, y el README si cambió algo de lo que describe.
- El usuario es principiante: la documentación va en español (rioplatense), simple y paso a paso.
- Este `CLAUDE.md` lista los proyectos de la carpeta; se actualiza al crear uno nuevo.

## GitHub

Esta carpeta es un repositorio Git que se sube a https://github.com/LazaroTea/app-stock (rama `main`).
Los mensajes de commit van en español. Subir (push) solo cuando el usuario lo pide.

## Proyectos

- `app-stock/`: control de stock de árboles nativos del vivero (Google Sheets + Apps Script).
- `app-stock-next/`: la misma app hecha en Next.js, publicada en Vercel, con una base Neon (Postgres).
  Tiene usuarios con clave y dos roles (Administrador y Colaborador); los permisos están en `lib/permisos.ts`.
  Los administradores manejan los usuarios desde la pantalla Usuarios; para probar, crear usuarios "PRUEBA …"
  y borrarlos después (nunca cambiar la clave de una persona real).
  Stock por depósito (Benavidez, Pilar, Goya), especie, presentación y tamaño; carga en formato remito
  (Movimiento de un punto de partida a uno de llegada, y Ajuste), sin límite de stock. Árboles nativos,
  palmeras y frutales.
  Usa la estética de la marca Native (nativetrees.com.ar): colores en `app/globals.css`, logo en `public/`. La conexión está en `app-stock-next/.env.local`, que nunca se sube ni se muestra en el chat.
  Ojo: la app local usa la misma base que la publicada; borrar lo que se cargue al probar.
  Proveedores y clientes llevan CUIT, con búsqueda del nombre en ARCA (necesita un certificado: ver el README).
  La clave privada de ese certificado está en `app-stock-next/certificados/`: nunca se sube ni se muestra.
  Funciona sin señal: lo que se carga queda en el celu y se sube solo (service worker + cola; ver el README). Para probarlo
  hace falta la versión publicable (`npm run build` + `start`) y un Chrome real: el navegador integrado no permite service workers.
