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
- `app-stock-next/`: la misma app hecha en Next.js, con datos inventados guardados en un archivo JSON.
