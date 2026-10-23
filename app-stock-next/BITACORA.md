# Bitácora: app de stock (Next.js)

## 2026-10-20: primera versión

**Pedido:** una versión de `app-stock` en Next.js, en una carpeta aparte, con datos inventados.

**Decisiones**
- Mismas tres pantallas y mismas reglas que la versión de Google: stock por especie y tamaño,
  mínimo por especie, Entrada / Salida / Ajuste, no deja sacar más de lo que hay.
- Datos en un archivo JSON (`data/stock.json`) en lugar de una base de datos: no requiere instalar ni
  configurar nada más. Se guarda de a un cambio por vez para no pisar datos.
- Datos inventados con una semilla fija (`lib/datos-inventados.ts`): siempre se generan los mismos.
- Sin librerías de estilos: CSS simple, igual al de la versión de Google.

**Qué se hizo**
- Proyecto armado a mano (sin `create-next-app`) con Next.js 15, React 19 y TypeScript.

## 2026-10-20: instalación y prueba

- Se instaló **Node.js 24.20.0 (LTS)** con winget. Next.js quedó en la versión 15.5.28.
- `npm run build` compila sin errores ni advertencias.
- Probado en el navegador en tamaño celular: stock con los datos inventados (23 especies, 127 movimientos,
  2 especies bajo el mínimo), salida rechazada por falta de stock, salida correcta que actualiza el stock al
  instante, y la lista de últimos movimientos.

**Errores encontrados y corregidos**
- Después de guardar, React reiniciaba por dentro el tipo de movimiento a "Entrada", aunque en pantalla siguiera
  resaltado otro. El siguiente guardado se habría registrado con el tipo equivocado. Ahora el tipo se elige
  con botones y viaja en un campo oculto.
- Los tamaños de cada especie aparecían en desorden: ahora siguen el orden de la lista (de chico a grande).
- En el celu, la tabla de últimos movimientos cortaba la cantidad: ahora achica la letra y esconde la columna
  Responsable en pantallas chicas.

## 2026-10-23: diseño responsive

**Pedido:** que la app se adapte bien a cualquier pantalla.

**Problema:** en la compu, la app era una columna angosta de celu en el medio, con las pestañas estiradas
de punta a punta de la pantalla.

**Qué se hizo** (diseño pensado primero para el celu, con dos cortes: 640 px y 1024 px)
- **Celu:** pestañas fijas abajo, al alcance del pulgar. Botones y campos de al menos 44 px de alto,
  para tocarlos con el dedo.
- **Tablet:** las pestañas pasan al encabezado verde. Tarjetas en dos columnas.
- **Compu:** tarjetas en tres columnas, todo dentro de un ancho máximo de 1200 px. En **Cargar**, panel al
  costado con el stock de la especie elegida en cada tamaño.
- Nuevos indicadores arriba del stock: total de plantas, especies y especies bajo el mínimo. Tocar este
  último filtra la lista (reemplaza la casilla "Solo bajo mínimo").
- En **Últimos**, las entradas se muestran en verde y las salidas en rojo.

**Probado** en 1280 px (compu), 768 px (tablet), 375 px y 320 px (celu): sin desbordes horizontales en
ninguna pantalla, y guardar un movimiento sigue funcionando.

**Notas**
- Se buscó un skill de diseño: el recomendado es **frontend-design** (de Anthropic). Se instala desde la
  tarjeta que ofrece Claude; este cambio se hizo sin él.
- En Windows, `npm` está bloqueado por PowerShell: se usa `npm.cmd` (anotado en el README).
- Si el servidor de prueba muestra "404" o la página sin estilos, hay que borrar la carpeta `.next`.

## 2026-10-23: base de datos Neon (para Vercel)

**Problema:** al publicarla en Vercel daba "Application error". La app guardaba los datos en un archivo
(`data/stock.json`), y en Vercel no se pueden escribir archivos.

**Decisión:** base de datos **Neon** (Postgres), conectada desde el panel de Vercel. Se eligió porque Vercel
la configura sola y tiene plan gratis.

**Qué se hizo**
- Credenciales en `.env.local` (solo en la compu; `.gitignore` ignora los archivos `.env`).
- Conector `@neondatabase/serverless` (1.2.0), que funciona bien en Vercel.
- `lib/almacen.ts` reescrito: tablas `especies`, `tamanos` y `movimientos`. La primera vez que se abre la
  app las crea y carga los datos inventados, solo si están vacías.
- El stock lo calcula la base (suma de movimientos), y ya no se leen todos los movimientos para mostrarlo.
- Al guardar: un "candado" de la base atiende de a un movimiento por vez, para que nadie deje el stock negativo
  (antes era un candado en memoria, que en Vercel no sirve porque corren varias copias de la app).
- Si la base falla, el formulario muestra un mensaje en lugar de romperse.
- La fecha de hoy se calcula con la hora de Argentina (Vercel corre en hora UTC).
- Se borraron `data/stock.json` y el código del archivo JSON.

**Probado** contra la base real: se crearon las tablas, se cargaron 23 especies, 4 tamaños y 127 movimientos,
y el stock dio igual que antes (1.519 plantas). Se rechazó una salida sin stock y se guardó una correcta.
El movimiento de prueba se borró después. `npm run build` compila sin errores.

## 2026-10-23: listado de especies nativas

**Pedido:** incluir todas las especies que figuran en SENASA.

**Lo que se encontró:** SENASA no tiene un listado de árboles nativos. Su único listado para viveros es el
de "especies priorizadas según riesgo fitosanitario" (Resolución SENASA 64/2026): cítricos, frutales de
carozo y pepita, palmeras, orquídeas, banano, palta, vid, olivo, kiwi, eucaliptus, papa semilla, frutilla,
tomate y pimiento. INASE remite al "Catálogo de las Plantas Vasculares del Cono Sur" (Instituto Darwinion),
que tiene miles de especies y no es un listado de vivero.

**Decisión** (elegida por el usuario): cargar un listado de árboles y arbustos nativos de uso en viveros.

**Qué se hizo**
- `lib/especies-nativas.ts`: 133 especies (las 23 de antes y 110 nuevas), con nombre común, científico y
  región: Yungas, Selva paranaense, Chaco, Espinal, Pampa, Sierras, Delta y ribera, Monte, Patagonia andina.
  Lo armó Claude: **conviene que alguien del vivero lo revise** (nombres, regiones, especies que falten).
- Nueva columna `region` en la tabla `especies`, que se agrega sola en bases ya creadas.
- `npm.cmd run cargar-especies`: agrega las especies que falten sin tocar las existentes. Se corrió sobre
  la base: 110 agregadas, 23 con región cargada, 133 en total. Corrido de nuevo, no cambió nada.
- Pantalla Stock: muestra la región, filtro por región, y de entrada solo las especies con stock
  (con opción de ver todas). Al buscar por nombre aparecen también las especies sin stock.

**Probado:** compila sin errores; los filtros y la búsqueda funcionan; el formulario ofrece las 133 especies;
sin desbordes en celu (320 px), tablet ni compu.

## 2026-10-23: stock en cero, presentación y tamaño

**Pedido:** dejar todo el stock en cero; agregar la presentación (Maceta, Raíz desnuda, Envasado); usar como
tamaños los de la lista desplegable de la columna "Tamaño" de la planilla de cotizaciones del vivero
(Google Sheets).

**Decisiones**
- Cada movimiento lleva **presentación + tamaño**. El stock se ve por esa combinación
  (ej. "Raíz desnuda · 12-14RD: 7"). Al principio el usuario eligió "solo presentación", pero después mandó
  la planilla para los tamaños, así que quedaron las dos.
- **Stock en cero:** se borraron los 127 movimientos inventados y se dejó de generarlos (se borró
  `lib/datos-inventados.ts`).
- **Stocks mínimos en cero** (eran inventados), elegido por el usuario.
- Se sacó la etiqueta "Datos de prueba" del encabezado, porque ya no hay datos inventados.

**Tamaños** (31, de la pestaña CONSULTATIO, que tiene la lista más completa), ordenados por grupo:
grosor del tronco (Varillon, 4-6 … 26-30, 12-14RD), altura (150-180cm, 2,5Mts, 3Mts, 4Mts), envase
(1Lt … 50Lts, E65L), categoría (Semi Ejemplar, Ejemplar, Super Ejemplar) y otros (1Kg, Especificar).
En la planilla, "2,5Mts" aparecía partido en dos opciones ("2" y "5Mts") porque Google Sheets separa las
opciones con comas: acá quedó como una sola.

**Cambio en la base:** la app lo hace sola al arrancar si encuentra el formato anterior: borra los
movimientos, la tabla de tamaños vieja y los mínimos; crea `presentaciones` y `tamanos` nuevas y la columna
`presentacion` en `movimientos`. Ya se aplicó en la base real.

**Error encontrado y corregido:** después de un guardado que fallaba, el desplegable de tamaño volvía a
"Elegí un tamaño" aunque por dentro seguía elegido el anterior (mismo problema que el del 20/10 con el tipo de
movimiento: React reinicia el formulario después de cada envío). Ahora el formulario se envía sin ese
reinicio, y queda todo como estaba.

**Probado** contra la base real: entrada de 10 Ceibos (raíz desnuda, 12-14RD), salida de 50 rechazada,
salidas de 3 y 2 correctas, stock y "Últimos" correctos. Los movimientos de prueba se borraron: la base quedó
con 133 especies, 0 mínimos y 0 movimientos. Compila sin errores.

**Nota:** la planilla de cotizaciones también tiene un desplegable de especies con unas 85, muchas exóticas
(fresno, liquidámbar, olivo, ginkgo, etc.) que no están en el listado de nativas.

## 2026-10-23: palmeras y estética de la marca

**Pedido:** sumar las palmeras que se pueden comerciar e incorporar la estética de la marca, a partir de un
presupuesto (PDF de Native S.A.) y de https://www.nativetrees.com.ar/.

**Palmeras**
- La Resolución SENASA 64/2026 pone a **todas** las palmeras (familia Arecaceae) y a la cica (Cycas revoluta)
  en su listado de especies priorizadas: se pueden comerciar, pero con vivero inscripto en el RENFO y los
  requisitos sanitarios de esa resolución.
- Se sumaron 18 especies: 4 palmeras nativas (yatay poñí, mbocayá, caranday serrano, carandillo), 13 exóticas
  (entre ellas las de la web: butiagrus, Phoenix canariensis, Phoenix dactylifera, Washingtonia) y la cica.
  Pindó, caranday y palmera yatay ya estaban: ahora quedan marcadas como palmeras. Total: 151 especies,
  21 palmeras.
- No se incluyó el palmito (Euterpe edulis), porque es una especie protegida.
- Nueva columna `grupo` (Árbol / Palmera) en la base. Las palmeras exóticas llevan región "Exótica".
- `lib/especies-nativas.ts` pasó a llamarse `lib/especies.ts`, porque ahora también tiene especies exóticas.
- Pantalla Stock: filtro "Tipo" (árboles / palmeras) y etiqueta **Palmera** en cada tarjeta.

**Estética** (sacada de la web y del presupuesto)
- Colores: verde oliva `#646945` como principal, `#505437`, `#7f8463` en los encabezados de tabla (como el
  presupuesto), salvia `#b8bca6` y crema `#f9f1d9` (el color del logo).
- Tipografías: Montserrat (títulos, números, botones) y Raleway (texto), las de la web.
- Encabezado verde con el logo de la web (en crema, recortado para que no tenga márgenes) y "STOCK"; en la
  compu, el lema "Movemos naturaleza. Creamos paisaje". Ícono de pestaña: el árbol del logo sobre verde.
- Etiquetas en mayúsculas chicas y espaciadas, como "DESCRIPCIÓN" en el presupuesto.

**Probado:** compila sin errores. Filtro de palmeras (21), panel de stock en Cargar y la lista en compu,
tablet y celu (320 px y 375 px): sin desbordes ni textos cortados.

**Pendiente**
- [ ] Revisión del listado de especies (árboles y palmeras) por alguien del vivero.
- [ ] ¿Sumar las otras especies exóticas de la planilla de cotizaciones y de la web (fresnos, liquidámbar,
      olivo, etc.)?
- [ ] Subir estos cambios a GitHub y confirmar que Vercel la publica sin error.
- [ ] **Agregar inicio de sesión**: hoy cualquiera con el link puede cargar movimientos.
- [ ] Cambiar la contraseña de la base en Neon (quedó escrita en el chat) y actualizar `.env.local`.
