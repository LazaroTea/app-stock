``# Bitácora: app de stock (Next.js)
``
``## 2026-10-20: primera versión
``
``**Pedido:** una versión de `app-stock` en Next.js, en una carpeta aparte, con datos inventados.
``
``**Decisiones**
``- Mismas tres pantallas y mismas reglas que la versión de Google: stock por especie y tamaño,
``  mínimo por especie, Entrada / Salida / Ajuste, no deja sacar más de lo que hay.
``- Datos en un archivo JSON (`data/stock.json`) en lugar de una base de datos: no requiere instalar ni
``  configurar nada más. Se guarda de a un cambio por vez para no pisar datos.
``- Datos inventados con una semilla fija (`lib/datos-inventados.ts`): siempre se generan los mismos.
``- Sin librerías de estilos: CSS simple, igual al de la versión de Google.
``
``**Qué se hizo**
``- Proyecto armado a mano (sin `create-next-app`) con Next.js 15, React 19 y TypeScript.
``
``## 2026-10-20: instalación y prueba
``
``- Se instaló **Node.js 24.20.0 (LTS)** con winget. Next.js quedó en la versión 15.5.28.
``- `npm run build` compila sin errores ni advertencias.
``- Probado en el navegador en tamaño celular: stock con los datos inventados (23 especies, 127 movimientos,
``  2 especies bajo el mínimo), salida rechazada por falta de stock, salida correcta que actualiza el stock al
``  instante, y la lista de últimos movimientos.
``
``**Errores encontrados y corregidos**
``- Después de guardar, React reiniciaba por dentro el tipo de movimiento a "Entrada", aunque en pantalla siguiera
``  resaltado otro. El siguiente guardado se habría registrado con el tipo equivocado. Ahora el tipo se elige
``  con botones y viaja en un campo oculto.
``- Los tamaños de cada especie aparecían en desorden: ahora siguen el orden de la lista (de chico a grande).
``- En el celu, la tabla de últimos movimientos cortaba la cantidad: ahora achica la letra y esconde la columna
``  Responsable en pantallas chicas.
``
``## 2026-10-23: diseño responsive
``
``**Pedido:** que la app se adapte bien a cualquier pantalla.
``
``**Problema:** en la compu, la app era una columna angosta de celu en el medio, con las pestañas estiradas
``de punta a punta de la pantalla.
``
``**Qué se hizo** (diseño pensado primero para el celu, con dos cortes: 640 px y 1024 px)
``- **Celu:** pestañas fijas abajo, al alcance del pulgar. Botones y campos de al menos 44 px de alto,
``  para tocarlos con el dedo.
``- **Tablet:** las pestañas pasan al encabezado verde. Tarjetas en dos columnas.
``- **Compu:** tarjetas en tres columnas, todo dentro de un ancho máximo de 1200 px. En **Cargar**, panel al
``  costado con el stock de la especie elegida en cada tamaño.
``- Nuevos indicadores arriba del stock: total de plantas, especies y especies bajo el mínimo. Tocar este
``  último filtra la lista (reemplaza la casilla "Solo bajo mínimo").
``- En **Últimos**, las entradas se muestran en verde y las salidas en rojo.
``
``**Probado** en 1280 px (compu), 768 px (tablet), 375 px y 320 px (celu): sin desbordes horizontales en
``ninguna pantalla, y guardar un movimiento sigue funcionando.
``
``**Notas**
``- Se buscó un skill de diseño: el recomendado es **frontend-design** (de Anthropic). Se instala desde la
``  tarjeta que ofrece Claude; este cambio se hizo sin él.
``- En Windows, `npm` está bloqueado por PowerShell: se usa `npm.cmd` (anotado en el README).
``- Si el servidor de prueba muestra "404" o la página sin estilos, hay que borrar la carpeta `.next`.
``
``## 2026-10-23: base de datos Neon (para Vercel)
``
``**Problema:** al publicarla en Vercel daba "Application error". La app guardaba los datos en un archivo
``(`data/stock.json`), y en Vercel no se pueden escribir archivos.
``
``**Decisión:** base de datos **Neon** (Postgres), conectada desde el panel de Vercel. Se eligió porque Vercel
``la configura sola y tiene plan gratis.
``
``**Qué se hizo**
``- Credenciales en `.env.local` (solo en la compu; `.gitignore` ignora los archivos `.env`).
``- Conector `@neondatabase/serverless` (1.2.0), que funciona bien en Vercel.
``- `lib/almacen.ts` reescrito: tablas `especies`, `tamanos` y `movimientos`. La primera vez que se abre la
``  app las crea y carga los datos inventados, solo si están vacías.
``- El stock lo calcula la base (suma de movimientos), y ya no se leen todos los movimientos para mostrarlo.
``- Al guardar: un "candado" de la base atiende de a un movimiento por vez, para que nadie deje el stock negativo
``  (antes era un candado en memoria, que en Vercel no sirve porque corren varias copias de la app).
``- Si la base falla, el formulario muestra un mensaje en lugar de romperse.
``- La fecha de hoy se calcula con la hora de Argentina (Vercel corre en hora UTC).
``- Se borraron `data/stock.json` y el código del archivo JSON.
``
``**Probado** contra la base real: se crearon las tablas, se cargaron 23 especies, 4 tamaños y 127 movimientos,
``y el stock dio igual que antes (1.519 plantas). Se rechazó una salida sin stock y se guardó una correcta.
``El movimiento de prueba se borró después. `npm run build` compila sin errores.
``
``## 2026-10-23: listado de especies nativas
``
``**Pedido:** incluir todas las especies que figuran en SENASA.
``
``**Lo que se encontró:** SENASA no tiene un listado de árboles nativos. Su único listado para viveros es el
``de "especies priorizadas según riesgo fitosanitario" (Resolución SENASA 64/2026): cítricos, frutales de
``carozo y pepita, palmeras, orquídeas, banano, palta, vid, olivo, kiwi, eucaliptus, papa semilla, frutilla,
``tomate y pimiento. INASE remite al "Catálogo de las Plantas Vasculares del Cono Sur" (Instituto Darwinion),
``que tiene miles de especies y no es un listado de vivero.
``
``**Decisión** (elegida por el usuario): cargar un listado de árboles y arbustos nativos de uso en viveros.
``
``**Qué se hizo**
``- `lib/especies-nativas.ts`: 133 especies (las 23 de antes y 110 nuevas), con nombre común, científico y
``  región: Yungas, Selva paranaense, Chaco, Espinal, Pampa, Sierras, Delta y ribera, Monte, Patagonia andina.
``  Lo armó Claude: **conviene que alguien del vivero lo revise** (nombres, regiones, especies que falten).
``- Nueva columna `region` en la tabla `especies`, que se agrega sola en bases ya creadas.
``- `npm.cmd run cargar-especies`: agrega las especies que falten sin tocar las existentes. Se corrió sobre
``  la base: 110 agregadas, 23 con región cargada, 133 en total. Corrido de nuevo, no cambió nada.
``- Pantalla Stock: muestra la región, filtro por región, y de entrada solo las especies con stock
``  (con opción de ver todas). Al buscar por nombre aparecen también las especies sin stock.
``
``**Probado:** compila sin errores; los filtros y la búsqueda funcionan; el formulario ofrece las 133 especies;
``sin desbordes en celu (320 px), tablet ni compu.
``
``## 2026-10-23: stock en cero, presentación y tamaño
``
``**Pedido:** dejar todo el stock en cero; agregar la presentación (Maceta, Raíz desnuda, Envasado); usar como
``tamaños los de la lista desplegable de la columna "Tamaño" de la planilla de cotizaciones del vivero
``(Google Sheets).
``
``**Decisiones**
``- Cada movimiento lleva **presentación + tamaño**. El stock se ve por esa combinación
``  (ej. "Raíz desnuda · 12-14RD: 7"). Al principio el usuario eligió "solo presentación", pero después mandó
``  la planilla para los tamaños, así que quedaron las dos.
``- **Stock en cero:** se borraron los 127 movimientos inventados y se dejó de generarlos (se borró
``  `lib/datos-inventados.ts`).
``- **Stocks mínimos en cero** (eran inventados), elegido por el usuario.
``- Se sacó la etiqueta "Datos de prueba" del encabezado, porque ya no hay datos inventados.
``
``**Tamaños** (31, de la pestaña CONSULTATIO, que tiene la lista más completa), ordenados por grupo:
``grosor del tronco (Varillon, 4-6 … 26-30, 12-14RD), altura (150-180cm, 2,5Mts, 3Mts, 4Mts), envase
``(1Lt … 50Lts, E65L), categoría (Semi Ejemplar, Ejemplar, Super Ejemplar) y otros (1Kg, Especificar).
``En la planilla, "2,5Mts" aparecía partido en dos opciones ("2" y "5Mts") porque Google Sheets separa las
``opciones con comas: acá quedó como una sola.
``
``**Cambio en la base:** la app lo hace sola al arrancar si encuentra el formato anterior: borra los
``movimientos, la tabla de tamaños vieja y los mínimos; crea `presentaciones` y `tamanos` nuevas y la columna
```presentacion` en `movimientos`. Ya se aplicó en la base real.
``
``**Error encontrado y corregido:** después de un guardado que fallaba, el desplegable de tamaño volvía a
``"Elegí un tamaño" aunque por dentro seguía elegido el anterior (mismo problema que el del 20/10 con el tipo de
``movimiento: React reinicia el formulario después de cada envío). Ahora el formulario se envía sin ese
``reinicio, y queda todo como estaba.
``
``**Probado** contra la base real: entrada de 10 Ceibos (raíz desnuda, 12-14RD), salida de 50 rechazada,
``salidas de 3 y 2 correctas, stock y "Últimos" correctos. Los movimientos de prueba se borraron: la base quedó
``con 133 especies, 0 mínimos y 0 movimientos. Compila sin errores.
``
``**Nota:** la planilla de cotizaciones también tiene un desplegable de especies con unas 85, muchas exóticas
``(fresno, liquidámbar, olivo, ginkgo, etc.) que no están en el listado de nativas.
``
``## 2026-10-23: palmeras y estética de la marca
``
``**Pedido:** sumar las palmeras que se pueden comerciar e incorporar la estética de la marca, a partir de un
``presupuesto (PDF de Native S.A.) y de https://www.nativetrees.com.ar/.
``
``**Palmeras**
``- La Resolución SENASA 64/2026 pone a **todas** las palmeras (familia Arecaceae) y a la cica (Cycas revoluta)
``  en su listado de especies priorizadas: se pueden comerciar, pero con vivero inscripto en el RENFO y los
``  requisitos sanitarios de esa resolución.
``- Se sumaron 18 especies: 4 palmeras nativas (yatay poñí, mbocayá, caranday serrano, carandillo), 13 exóticas
``  (entre ellas las de la web: butiagrus, Phoenix canariensis, Phoenix dactylifera, Washingtonia) y la cica.
``  Pindó, caranday y palmera yatay ya estaban: ahora quedan marcadas como palmeras. Total: 151 especies,
``  21 palmeras.
``- No se incluyó el palmito (Euterpe edulis), porque es una especie protegida.
``- Nueva columna `grupo` (Árbol / Palmera) en la base. Las palmeras exóticas llevan región "Exótica".
``- `lib/especies-nativas.ts` pasó a llamarse `lib/especies.ts`, porque ahora también tiene especies exóticas.
``- Pantalla Stock: filtro "Tipo" (árboles / palmeras) y etiqueta **Palmera** en cada tarjeta.
``
``**Estética** (sacada de la web y del presupuesto)
``- Colores: verde oliva `#646945` como principal, `#505437`, `#7f8463` en los encabezados de tabla (como el
``  presupuesto), salvia `#b8bca6` y crema `#f9f1d9` (el color del logo).
``- Tipografías: Montserrat (títulos, números, botones) y Raleway (texto), las de la web.
``- Encabezado verde con el logo de la web (en crema, recortado para que no tenga márgenes) y "STOCK"; en la
``  compu, el lema "Movemos naturaleza. Creamos paisaje". Ícono de pestaña: el árbol del logo sobre verde.
``- Etiquetas en mayúsculas chicas y espaciadas, como "DESCRIPCIÓN" en el presupuesto.
``
``**Probado:** compila sin errores. Filtro de palmeras (21), panel de stock en Cargar y la lista en compu,
``tablet y celu (320 px y 375 px): sin desbordes ni textos cortados.
``
``## 2026-10-23: ajustes de tamaños y "Especificar"
``
``**Pedido:** quitar 1Kg, 12-14RD y 150-180cm; cambiar "E65L" por "65Lt" y "26-30" por "25-30"; y que al elegir
``"Especificar" aparezca un renglón para escribir el tamaño.
``
``**Qué se hizo**
``- Lista de tamaños actualizada en `lib/almacen.ts` (para bases nuevas) y en la base real con un ajuste de una
``  sola vez: no había movimientos con esos tamaños, así que no se perdió nada. Quedan 28 tamaños.
``- "Especificar": aparece un renglón obligatorio debajo del desplegable (hasta 60 letras). Lo escrito se guarda
``  en la columna nueva `tamano_detalle` de `movimientos` y se muestra como tamaño en Stock, Cargar y Últimos.
``  Cada tamaño escrito lleva su propio stock; se sacan los espacios de más para que "5 m" y "5  m " sumen
``  juntos, y los tamaños ya escritos se sugieren al escribir.
``- Los movimientos viejos (antes de este cambio) siguen funcionando: `tamano_detalle` queda vacío.
``
``**Probado** contra la base real, en tamaño celular: entrada de 4 Pindós con "5 m de altura" y salida de 1
``escribiendo "  5  m de altura " (se descontó del mismo stock: quedaron 3). Los dos movimientos de prueba se
``borraron. Compila sin errores.
``
``**Nota:** durante la prueba aparecieron 3 movimientos cargados por el vivero (14:38, sin responsable):
``1 Palmera canaria y 2 Fénix enana, todas envasado 4Mts. No se tocaron. Las dos de Fénix enana son iguales:
``revisar si fue un doble envío.
``
``## 2026-10-23: carga en formato remito
``
``**Pedido:** que la carga tenga formato de remito, que se vayan sumando al costado las especies con su
``cantidad, tamaño y presentación; el botón "Guardar movimiento" pasa a "Sumar", y un botón nuevo
``"Guardar movimiento" guarda toda la carga.
``
``**Qué se hizo**
``- Pantalla Cargar en dos partes: "Datos del remito" (tipo, fecha, responsable, observaciones) y
``  "Sumar plantas" (especie, presentación, tamaño, cantidad y **+ Sumar**). Al costado (en el celu, abajo) se
``  arma el remito con el estilo de los presupuestos: título REMITO, tabla con encabezado oliva, total y el
``  botón **Guardar movimiento**.
``- Si se suma algo que ya está en el remito, se juntan las cantidades en la misma línea. Cada línea se puede
``  quitar con ✕.
``- Antes de guardar, cada línea de salida o ajuste se controla contra el stock: si no alcanza, se marca en rojo
``  ("Hay 2") y no se puede guardar.
``- **Guardar movimiento** guarda el remito entero en una sola operación: nueva tabla `remitos` (el número es
``  el `id`) y columna `remito_id` en `movimientos`. Si mientras tanto alguien sacó stock y ya no alcanza, no se
``  guarda nada, se explica qué línea falla y la pantalla se actualiza con el stock real.
``- El remito a medio armar queda guardado en el navegador (no se pierde si se cierra la página).
``- Últimos muestra el número de remito (en el celu se oculta, como el responsable).
``- Ya no está el panel de "stock de la especie elegida" de la compu: su lugar lo ocupa el remito. El stock
``  disponible se sigue viendo debajo del tamaño ("Hay 12 en maceta, 3Lts (en este remito: +5)").
``
``**Probado** contra la base real: remito de entrada con 3 líneas (dos se juntaron: 10 + 2 = 12) guardado como
``N.º 000001; salida sin stock marcada en rojo con el botón desactivado; dos pestañas guardando a la vez: la
``segunda fue rechazada entera ("hay 2 y el remito necesita 10") y la línea quedó en rojo con el stock real.
``Celu sin desbordes. Los remitos y movimientos de prueba se borraron y la numeración volvió a empezar en 1.
``Los 3 movimientos cargados por el vivero no se tocaron. Compila sin errores.
``
``## 2026-10-23: remito en PDF, destinatario y orden de presentaciones
``
``**Pedido:** poder descargar e imprimir el remito en PDF; presentación por defecto Envasado, y el orden
``Envasado, Maceta, Raíz desnuda; destinatario opcional. Los 3 movimientos sin remito que había eran pruebas
``del vivero: no hace falta tenerlos en cuenta.
``
``**Qué se hizo**
``- Página `/remitos/[número]` con el remito armado como los presupuestos de Native: logo en verde
``  (`public/logo-native-verde.png`, hecho a partir del logo crema), lema, datos de la empresa
``  (`lib/empresa.ts`), fecha, movimiento, destinatario, responsable, observaciones, barra DESCRIPCIÓN, tabla
``  (especie, nombre científico, presentación, tamaño, cantidad), total, firmas "Entregó" y "Recibió", y la
``  aclaración "Remito interno de control de stock. Documento no válido como factura".
``- Botón **Imprimir / Guardar PDF**: abre la impresión del navegador; para descargar se elige "Guardar como
``  PDF". Al imprimir se ocultan el encabezado, las pestañas y los botones, y la hoja es A4. El nombre que propone
``  el navegador para el archivo es "Remito 000001 - Native".
``- Enlaces a esa página: al guardar un remito ("Imprimir o descargar PDF") y desde el número en Últimos.
``- Destinatario opcional: nueva columna `destinatario` en `remitos`, con sugerencias de los ya usados. Sale en
``  el remito de la pantalla y en el impreso.
``- Orden de presentaciones: Envasado, Maceta, Raíz desnuda (en el código y en la base). Envasado viene elegida.
``- Página "No encontrado" en español.
``
``**Probado** contra la base real: remito con destinatario, una línea de envasado 20Lts y otra de maceta con
``tamaño escrito a mano; la página del remito en compu y en celu; y un PDF generado con Edge en modo
``automático: sale en una hoja A4 con los colores y el formato de los presupuestos. El remito de prueba se
``borró y la numeración volvió a 1. Compila sin errores.
``
``## 2026-10-23: observaciones debajo del detalle
``
``**Pedido:** que las observaciones vayan debajo del detalle y antes del total.
``
``**Qué se hizo:** en el remito impreso y en el remito que se arma en Cargar, las observaciones pasaron de los
``datos de arriba a un bloque entre la tabla y el total.
``
``**Probado:** PDF generado con Edge sobre un remito de prueba con observaciones, y el orden en Cargar.
``El remito de prueba (000003) se borró. Para ese momento el vivero ya había guardado los remitos 000001 y
``000002, que no se tocaron; la numeración se acomodó para que el próximo sea el 000003.
``
``**Plan acordado para más adelante (usuarios):** cuando se agregue el inicio de sesión, cada persona tendrá su
``usuario y el campo **Responsable** del remito se completará solo con el usuario que inició sesión (hoy se
``recuerda el último nombre escrito en cada dispositivo).
``
``## 2026-10-23: procedencia y destino
``
``**Pedido:** agregar Procedencia (Palma Sola, Goya, Pilar, Benavidez, Proveedor) y Destino (Palma Sola, Goya,
``Pilar, Benavidez, Cliente); con Proveedor o Cliente, poder especificar cuál.
``
``**Qué se hizo**
``- Dos desplegables en "Datos del remito", uno al lado del otro, que arrancan en "Sin especificar"
``  (opcionales). Con Proveedor o Cliente aparece un renglón "¿Cuál?", obligatorio en ese caso, con sugerencias
``  de los nombres ya usados.
``- Columnas nuevas en `remitos`: `procedencia`, `procedencia_detalle`, `destino`, `destino_detalle`.
``- Se muestran en el remito de Cargar y en el impreso: "Procedencia: Proveedor (Vivero X)", "Destino: Goya".
``- El destinatario sigue como campo aparte, ahora pensado para la persona o contacto que recibe.
``
``**Probado** contra la base real: remito con procedencia Proveedor y destino Cliente (sin el nombre no deja
``guardar; con el nombre se guarda y sale en el impreso), sugerencia del proveedor al volver a cargar, y celu
``sin desbordes. El remito de prueba se borró; quedan los 2 remitos del vivero y el próximo es el 000003.
``
``**Idea para más adelante:** el stock hoy es uno solo para todo Native. Si hace falta saber cuánto hay en cada
``lugar (Palma Sola, Goya, Pilar, Benavidez), se puede llevar el stock por lugar usando procedencia y destino
``(por ejemplo, un pase de Goya a Pilar resta en Goya y suma en Pilar).
``
``## 2026-10-23: stock por depósito, pases, sin límite de stock y frutales
``
``**Pedido:** sumar el olivo y los frutales; llevar el stock de cada depósito (Benavidez, Pilar y Goya) y
``cruzar la información según los movimientos entre ellos; no limitar los movimientos por la cantidad que haya.
``
``**Decisiones** (elegidas por el usuario)
``- **Palma Sola no lleva stock:** es origen o destino, como un proveedor o un cliente.
``- **Cuatro tipos con botones**, y cada uno muestra solo los lugares que le corresponden:
``  - Entrada: procedencia (opcional: Palma Sola o Proveedor) → depósito de destino (obligatorio). Suma.
``  - Salida: depósito de origen (obligatorio) → destino (opcional: Palma Sola o Cliente). Resta.
``  - Pase: depósito de origen → depósito de destino (distintos). Resta en uno y suma en el otro.
``  - Ajuste: depósito. Suma o resta según el signo.
``- **Se borró todo lo cargado antes** (eran pruebas) y el stock arrancó en cero, con la numeración en 000001.
``
``**Qué se hizo**
``- Tablas nuevas: `remitos` (ahora con tipo "Pase") y `movimientos` con `deposito` y `cantidad` con signo; un
``  pase genera dos movimientos por línea. La app hizo el cambio sola al arrancar.
``- Sin límite de stock: se guarda aunque no alcance. El remito avisa "Pilar queda en −2" pero no bloquea, y el
``  stock negativo se ve en rojo.
``- Stock: botones Todos / Benavidez / Pilar / Goya; con Todos, cada especie muestra cuánto hay en cada depósito.
``- Cargar: debajo del tamaño se ve cuánto hay en el depósito (en un pase, en los dos).
``- Últimos: columna Depósito y cantidad con signo (+/−).
``- Remito impreso: "Depósito de origen" / "Depósito de destino" / "Procedencia" / "Destino" según el tipo.
``- 28 frutales (`frutal(...)` en `lib/especies.ts`, grupo "Frutal"): olivo, 7 cítricos, 6 de carozo,
``  3 de pepita y otros 11 (palta, banano, vid, kiwi, higuera, granado, nogal europeo, pecán, caqui, níspero,
``  arándano). Cargados en la base: 179 especies. Filtro "Solo frutales" en Stock.
``
``**Probado** contra la base real: entrada de un proveedor a Goya (10 olivos y 5 ceibos), pase de 4 olivos de Goya
``a Pilar, salida de 6 olivos de Pilar a un cliente (Pilar quedó en −2, con aviso y sin bloquear) y ajuste de +2
``ceibos en Benavidez. Stock: Goya 6 olivos y 5 ceibos; Pilar −2 olivos; Benavidez 2 ceibos; Todos 4 olivos y
``7 ceibos. Últimos mostró el pase en dos filas (−4 Goya, +4 Pilar) y el remito impreso los depósitos. Celu sin
``desbordes. Los 4 remitos de prueba se borraron (base en cero, próximo remito 000001). Compila sin errores.
``
``## 2026-10-23: depósitos en procedencia y destino
``
``**Pedido:** que en Procedencia aparezcan también Goya, Pilar y Benavidez (no solo Palma Sola y Proveedor).
``También: poder emitir remitos aunque no haya stock (ya estaba así desde el cambio anterior; se confirmó en la
``versión publicada que no queda ningún bloqueo, solo el aviso "queda en −N").
``
``**Qué se hizo**
``- Procedencia de una Entrada: Palma Sola, Goya, Pilar, Benavidez, Proveedor (la lista original del vivero).
``  Destino de una Salida: Palma Sola, Goya, Pilar, Benavidez, Cliente.
``- Si la procedencia de una entrada o el destino de una salida es un depósito, el stock se cruza como en un pase
``  (resta en uno, suma en el otro), para no contar las plantas dos veces. Origen y destino tienen que ser
``  distintos.
``
``**Probado:** las reglas con casos de ejemplo (entrada de Pilar a Goya: −4 Pilar, +4 Goya; salida de Goya a
``Benavidez: −2 Goya, +2 Benavidez; entrada de proveedor y salida a cliente sin cambios) y los desplegables en
``pantalla, sin guardar nada en la base. Compila sin errores.
``
``## 2026-10-24: Movimiento y Ajuste
``
``**Pedido:** en vez de Entrada / Salida / Pase, dos tipos: **Movimiento** (resta en el punto de partida y suma
``en el de llegada) y **Ajuste**. Partida: Palma Sola, Goya, Pilar, Benavidez, Proveedor. Llegada: las mismas más
``Cliente. Los stocks que se controlan son solo Goya, Pilar y Benavidez.
``
``**Qué se hizo**
``- `TIPOS` = Movimiento y Ajuste. Reglas en `lib/stock.ts` (`PARTIDAS`, `LLEGADAS`, `efectos`): un movimiento
``  resta en la partida y suma en la llegada solo si son depósitos. Partida y llegada son obligatorias; al menos
``  una tiene que ser un depósito (si no, no cambiaría ningún stock) y no pueden ser el mismo depósito.
``- Base: la app cambió sola la restricción de tipos y convirtió los remitos viejos a "Movimiento" sin tocar sus
``  movimientos. Había uno solo, del vivero: el 000001 (Benavidez → Pilar, 2 olivos), que quedó igual.
``- Sugerencias: un proveedor puede estar en la partida o en la llegada (devolución), y un cliente en la llegada.
``- Remito impreso: "Tipo", "Punto de partida" y "Punto de llegada". Últimos: + en verde, − en rojo.
``
``**Probado** contra la base real: Proveedor → Cliente no deja guardar; Proveedor → Goya (+1 en Goya) y
``Goya → Palma Sola (−3 en Goya, Palma Sola sin stock) dieron Goya −2; el remito 000001 se ve como Movimiento.
``Los dos remitos de prueba se borraron (el próximo es el 000002). Compila sin errores.
``
``**Ojo:** hasta que se suba este código, la versión publicada no puede guardar remitos (la base ya no acepta
``los tipos viejos).
``
``## 2026-10-24: modificar y anular remitos
``
``**Pedido:** botones para modificar y anular movimientos, que más adelante se van a restringir a ciertos usuarios.
``
``**Decisiones**
``- Se modifica y se anula el **remito entero** (los movimientos de stock salen de sus líneas).
``- **Anular no borra:** el remito queda con su número, motivo (obligatorio), fecha y la marca ANULADO, y deja de
``  contar en el stock. Así queda la historia. No se puede modificar ni "desanular" desde la app.
``- **Modificar** reemplaza datos y líneas del remito, con el mismo número, y anota cuándo se modificó.
``- **Permisos en un solo lugar:** `lib/permisos.ts` (`puedeModificarRemitos`, `puedeAnularRemitos`). Hoy
``  devuelven siempre "sí"; cuando haya usuarios, se restringe ahí. Lo usan la pantalla (muestra u oculta los
``  botones) y el servidor (rechaza el pedido igual).
``
``**Qué se hizo**
``- Base: columnas `anulado`, `anulado_motivo`, `anulado_en` y `modificado_en` en `remitos`. El stock solo suma
``  remitos no anulados.
``- Página del remito: botones **Modificar** (abre `/cargar?remito=N`) y **Anular** (pide motivo y confirma);
``  aviso y marca ANULADO, también al imprimir.
``- Cargar: modo "modificar" con el remito precargado, aviso arriba, botón **Guardar cambios**; al guardar vuelve
``  a la página del remito. No toca el borrador del remito nuevo.
``- Guardar y modificar usan las mismas revisiones (`revisarRemito` en `app/acciones.ts`).
``- Últimos: el número de remito se ve también en el celu (es la puerta para modificar o anular) y los movimientos
``  de remitos anulados se ven tachados.
``
``**Probado** contra la base real: remito de prueba (5 lapachos, proveedor → Goya), modificado a 8 lapachos con
``llegada en Pilar (mismo número, stock: Pilar 8, Goya 0) y anulado con motivo (stock en cero, tachado en Últimos,
``marca ANULADO, sin botones de modificar ni anular, y `/cargar?remito=N` avisa que está anulado). El remito de
``prueba se borró (el próximo es el 000002). Compila sin errores.
``
``**Pendiente**
``- [x] Restringir modificar y anular a ciertos usuarios (hecho el 2026-10-24: solo administradores).
``- [ ] Más adelante: revisar si se vuelve a limitar por stock (el usuario lo quiere probar después).
``- [ ] Listado de especies: por ahora está bien (el usuario lo dio por correcto el 2026-10-24); quizás se retome.
``- [ ] ¿Sumar las otras especies exóticas de la planilla de cotizaciones y de la web (fresnos, liquidámbar,
``      olivo, etc.)?
``- [ ] Subir estos cambios a GitHub y confirmar que Vercel la publica sin error.
``- [x] **Agregar usuarios e inicio de sesión** (hecho el 2026-10-24, ver abajo).
``- [ ] Cambiar la contraseña de la base en Neon (quedó escrita en el chat) y actualizar `.env.local`.
``
``## 2026-10-24: usuarios, ingreso y roles
``
``**Pedido:** usuarios para Gustavo, Rocío, Ezequiel, Martin, Estela, Martina, Sebastián y María, todos con la
``clave 1234 por ahora (los criterios de seguridad se ven más adelante). Dos roles: **Administrador** (Rocío y
``Gustavo, pueden todo) y **Colaborador** (solo movimientos y ajustes).
``
``**Decisiones**
``- **Claves encriptadas** (`lib/claves.ts`): en la base no queda la clave escrita, así que cuando se pasen a
``  claves de verdad ya está resuelto cómo se guardan.
``- **Sesiones en la base** (tabla `sesiones`), con una cookie que el código de la página no puede leer. Duran
``  30 días por dispositivo. Al tocar **Salir** se borra la sesión. Un usuario con `activo = false` deja de poder
``  entrar al instante.
``- **Pantalla de ingreso** con el nombre en un desplegable (son pocos) y la clave. Si algo está mal, el mensaje
``  no dice si fue el nombre o la clave.
``- El **colaborador** puede cargar (Movimiento y Ajuste), ver Stock y Últimos e imprimir remitos. No ve los
``  botones Modificar ni Anular, y el servidor lo rechaza aunque lo intente igual.
``- El **responsable** del remito sale del usuario que ingresó (ya no se escribe). Al **modificar**, el
``  responsable sigue siendo quien lo emitió y se anota quién lo modificó (`modificado_por`); al **anular**,
``  quién lo anuló (`anulado_por`). Se ve en la página del remito.
``
``**Qué se hizo**
``- Base: tablas `usuarios` y `sesiones`, columnas `modificado_por` y `anulado_por` en `remitos`. Los 8 usuarios
``  se cargan solos si la tabla está vacía.
``- Todas las pantallas piden haber ingresado (si no, llevan a `/login`), y guardar, modificar y anular revisan
``  la sesión en el servidor.
``- Encabezado: nombre, rol y botón **Salir**; las pestañas no aparecen en la pantalla de ingreso.
``- `lib/permisos.ts` ahora decide según el rol.
``
``**Probado** contra la base real: clave equivocada rechazada (y el nombre elegido no se borra); Martina
``(colaboradora) entra, no ve Modificar ni Anular y `/cargar?remito=1` le dice que no tiene permiso; guardó un
``ajuste de prueba con responsable Martina. Gustavo (administrador) lo modificó (el responsable sigue siendo
``Martina, "modificado por Gustavo") y lo anuló ("anulado por Gustavo"). Encabezado bien en el celu. El remito y
``las sesiones de prueba se borraron (el próximo remito sigue siendo el 000002). Compila sin errores.
``
``**Pendiente**
``- [ ] Criterios de seguridad de las claves: que cada uno cambie la suya, largo mínimo, etc. (hoy todos 1234).
``- [ ] Desde la app, que un administrador pueda agregar o desactivar usuarios y cambiar roles o claves (hoy,
``      desde el panel de Neon).
``- [ ] Más adelante: revisar si se vuelve a limitar por stock (el usuario lo quiere probar después).
``- [ ] Listado de especies: por ahora está bien; quizás se retome.
``- [ ] Subir estos cambios a GitHub y confirmar que Vercel la publica sin error. **Ojo:** la base ya tiene las
``      tablas nuevas; conviene subir pronto.
``- [ ] Cambiar la contraseña de la base en Neon (quedó escrita en el chat) y actualizar `.env.local`.
``
``## 2026-10-24: seguridad de las claves y pantalla Usuarios
``
``**Pedido:** avanzar con los pendientes: criterios de seguridad de las claves, manejar los usuarios desde la app
``y cambiar la contraseña de la base en Neon.
``
``**Decisiones**
``- **Clave provisoria obligatoria de cambiar:** todos tenían 1234, así que al entrar por primera vez la app pide
``  elegir una clave propia y no deja hacer nada más hasta cambiarla (tampoco desde el servidor).
``- **Reglas:** al menos 8 letras o números; no puede tener el nombre de la persona (cada palabra del nombre, sin
``  acentos), ser una clave muy común ni el mismo carácter repetido. Se eligió 8 como equilibrio entre seguridad y
``  que sea fácil de escribir en el celu. Todo está en `lib/claves.ts`.
``- **Bloqueo:** 5 intentos equivocados seguidos bloquean al usuario 15 minutos (evita que alguien pruebe claves
``  hasta acertar). Un administrador lo desbloquea dándole una clave provisoria.
``- **Al cambiar la clave** se cierran las sesiones en los demás dispositivos (por si alguien la sabía).
``- **Pantalla Usuarios** (solo administradores): agregar (la app genera una clave provisoria de 6 números y la
``  muestra una sola vez), clave provisoria nueva, cambiar rol, dar de baja y de alta. Nadie puede cambiarse el rol
``  ni darse de baja a sí mismo, así siempre queda un administrador. Dar de baja no borra: los remitos siguen a su
``  nombre.
``- **Contraseña de Neon:** cambiarla es una tarea de seguridad de la cuenta, así que la hace el usuario (Claude no
``  maneja contraseñas). Quedó una guía paso a paso en el README ("Cambiar la contraseña de la base").
``- En la compu de 1024 px, con la pestaña Usuarios no entraba todo el encabezado: el lema ahora se ve desde 1280 px.
``
``**Qué se hizo**
``- Base: en `usuarios`, columnas `cambiar_clave` (arranca en true para todos), `intentos_fallidos`,
``  `bloqueado_hasta` y `ultimo_ingreso`.
``- Pantallas nuevas: **Mi clave** (`/clave`, tocando el nombre arriba a la derecha) y **Usuarios** (`/usuarios`).
``- Ingreso: bloqueo por intentos y, con clave provisoria, va directo a elegir la clave.
``
``**Probado** contra la base real, con usuarios de prueba (no se tocaron las claves de las personas): con clave
``provisoria lleva a "Elegí tu clave" y no deja ir a otra pantalla; rechaza 12345678, claves distintas al
``repetirlas y claves con el nombre; agregar usuario (muestra la clave provisoria), nombre repetido rechazado,
``cambio de rol, dar de baja (desaparece de la lista de ingreso); 5 claves equivocadas bloquean incluso con la
``clave correcta, y una clave provisoria nueva lo desbloquea; un colaborador no ve la pestaña Usuarios y `/usuarios`
``lo devuelve al inicio. Celu sin desbordes. Los usuarios de prueba se borraron. Compila sin errores.
``
``**Error encontrado y corregido:** "pruebanuevo99" se aceptaba para el usuario "PRUEBA Nuevo" (el nombre tenía un
``espacio y la clave no). Ahora se revisa cada palabra del nombre.
``
``**Pendiente**
``- [ ] **Cambiar la contraseña de la base en Neon** (la hace el usuario, con la guía del README) y avisar para
``      probar la conexión.
``- [ ] Subir estos cambios a GitHub. Al publicarse, cada persona entra con 1234 y elige su clave.
``- [ ] Más adelante: revisar si se vuelve a limitar por stock (el usuario lo quiere probar después).
``- [ ] Listado de especies: por ahora está bien; quizás se retome.
``
``## 2026-10-24: Martina, administradora
``
``**Pedido:** que Martina también sea administradora.
``
``**Qué se hizo:** se cambió su rol en la base (rige al instante, también en la app publicada). Para que todo
``coincida, también se cambió en la lista de usuarios iniciales (`lib/almacen.ts`) y en el README. Ahora los
``administradores son Gustavo, Rocío y Martina. Más adelante, esto se puede hacer desde la pantalla **Usuarios**.
``
``## 2026-10-26: quién recibe con el punto de llegada, Últimos por remito y menú del usuario
``
``**Pedido:** (1) fusionar el destinatario con el punto de llegada; (2) que Últimos no muestre el desglose, solo
``los remitos, y que se pueda entrar a cada uno para ver el detalle; (3) sacar el "Stock" que estaba al lado del
``logo, y que el usuario de arriba a la derecha sea un menú desplegable con "Mi clave" y "Salir".
``
``**Decisiones**
``- **Quién recibe** (antes "Destinatario") pasó a estar **debajo del punto de llegada**, solo en los
``  Movimientos (en un Ajuste no hay a quién entregar). En el remito sale en el mismo renglón que el punto de
``  llegada: "Punto de llegada: Cliente (Vivero X) · recibe Juan". En la base sigue la misma columna
``  (`destinatario`), así que los remitos viejos no cambian; si alguno tiene destinatario y no tiene punto de
``  llegada, se sigue mostrando aparte.
``- **Últimos** ahora lista **remitos** (50 por vez), no movimientos de stock: fecha, número, tipo, recorrido,
``  quién recibe, plantas, líneas y responsable. Tocando el número o el recorrido se abre el remito. Antes
``  un movimiento entre depósitos ocupaba dos filas por línea.
``- **Menú del usuario:** nombre y rol arriba a la derecha; al tocarlo se abre un menú con **Mi clave** y **Salir**
``  (se cierra al tocar afuera, con Escape o al cambiar de pantalla).
``- Se sacó el rótulo "Stock" junto al logo (repetía la pestaña).
``
``**Probado** contra la base real con un usuario y un remito de prueba (ya borrados; el próximo remito es el
``000003): Quién recibe aparece solo en Movimiento, el resumen del remito, el remito impreso y la fila de Últimos
``muestran "recibe Juan"; Últimos cuenta bien las plantas (+40 el ajuste de 4 líneas, 2 el movimiento entre
``depósitos); el menú abre, y Salir cierra la sesión. Celu sin desbordes. Compila sin errores.
``
``**Pendiente**
``- [ ] Cambiar la contraseña de la base en Neon (la hace el usuario, con la guía del README).
``- [ ] Más adelante: revisar si se vuelve a limitar por stock (el usuario lo quiere probar después).
``- [ ] Listado de especies: por ahora está bien; quizás se retome.
``
``## 2026-10-26: Stock como listado
``
``**Pedido:** que las plantas de la pantalla Stock se vean más como un listado, con los detalles al costado.
``
``**Qué se hizo:** las tarjetas pasaron a un **listado de una fila por especie**: a la izquierda el nombre (con
``nombre científico, código y región), al costado el detalle (stock por depósito con "Todos", y presentaciones y
``tamaños) y a la derecha el total. En el celu el detalle va debajo del nombre y el total queda arriba a la
``derecha. Las especies bajo el mínimo tienen una marca roja a la izquierda y el aviso en el detalle. No cambió
``ningún dato ni cuenta, solo cómo se ve.
``
``**Probado** en compu (1024 px) y celu (375 px) con la base real, sin desbordes. Compila sin errores.
``
``## 2026-10-26: se saca "Quién recibe"
``
``**Pedido:** sacar el campo "Quién recibe" (antes Destinatario).
``
``**Qué se hizo:** se sacó del formulario de Cargar, del resumen del remito, del remito impreso, de Últimos y
``del servidor (ya no lo pide ni lo guarda). La columna `destinatario` sigue en la tabla `remitos` (vacía), por si
``algún día se vuelve a necesitar; no se perdió ningún dato (nunca hubo remitos reales con destinatario).
``
``**Probado** contra la base real con un usuario y un remito de prueba (ya borrados): guardar y modificar un
``remito siguen funcionando, y se ve bien en Últimos y en el remito. El próximo remito es el 000003. Compila sin
``errores.
``
``## 2026-10-26: CUIT de proveedores y clientes con búsqueda en ARCA
``
``**Pedido:** un campo que, al cargar el CUIT, encuentre a quién nos referimos, tanto para proveedores como para
``clientes. Se eligió la fuente **oficial de ARCA** (gratis, confiable) en vez de un servicio de terceros.
``
``**Decisiones**
``- **Búsqueda oficial:** servicio \`ws_sr_constancia_inscripcion\` (método \`getPersona_v2\`). Los campos y las
``  direcciones se confirmaron en el WSDL público de ARCA. ARCA exige un certificado digital de la empresa y que se
``  autorice ese servicio: lo tiene que hacer el dueño de la clave fiscal (guía en el README, "Buscar un CUIT en
``  ARCA"). Hasta entonces, la app **no se rompe**: dice que la búsqueda no está activada y el nombre se escribe a
``  mano.
``- **Plan B sin ARCA:** si el CUIT ya se usó en un remito anterior, el nombre se completa con ese.
``- **El CUIT es opcional,** pero si se escribe tiene que ser válido (11 números, tipo 20/23/24/27/30/33/34 y
``  dígito verificador), también en el servidor.
``- Al encontrar el nombre, se completa solo el renglón "¿Cuál?" (se puede corregir a mano).
``- El ticket de ingreso a ARCA se guarda en la base (\`arca_tickets\`) porque ARCA no deja pedir uno nuevo mientras
``  hay uno vigente y en Vercel cada pedido puede caer en un servidor distinto.
``- Para firmar el pedido de ingreso se agregó la librería \`node-forge\`. \`npm audit\` la marca por fallas al
``  *leer* archivos ASN.1 de terceros o verificar firmas; acá solo se usa para firmar un pedido propio con la
``  clave propia, así que no aplica. No hay versión más nueva.
``- **Seguridad:** la clave privada (\`certificados/native-arca.key\`) se generó en tu compu, está ignorada por Git
``  (\`certificados/\`, \`*.key\`, \`*.pem\`, \`*.csr\`, \`*.crt\`) y nunca se muestra. Para la app publicada, la clave y el
``  certificado van como variables en Vercel (las pega el dueño de la cuenta).
``
``**Qué se hizo**
``- Remitos: columnas \`procedencia_cuit\` y \`destino_cuit\`; tabla \`arca_tickets\`.
``- \`lib/cuit.ts\` (validar y dar formato), \`lib/arca.ts\` (ingreso firmado y consulta).
``- Cargar: campo CUIT debajo del tipo de lugar (proveedor o cliente), con búsqueda automática al completar los 11
``  números, avisos, y bloqueo de guardado si el CUIT está mal escrito. El CUIT sale en el resumen y en el remito
``  impreso ("Cliente (Vivero X · CUIT 30-…)"). Funciona también al modificar un remito.
``- Se generó la clave privada y el pedido de certificado de Native (CUIT 30-71792140-9).
``
``**Probado:** el validador con CUITs reales y erróneos; el pedido de ingreso firmado con un certificado de prueba y
``**verificado con OpenSSL** ("CMS Verification successful"); la lectura de respuestas de ARCA de ejemplo (empresa,
``persona, CUIT inexistente y falla de autorización); la pantalla contra la base real (formato, avisos, guardar con
``CUIT, remito impreso, y completar el nombre desde un remito anterior). Compila sin errores. Los datos de prueba se
``borraron (el próximo remito es el 000003).
``**No se pudo probar todavía:** la llamada real a ARCA, porque necesita el certificado. Cuando esté, se prueba en el
``entorno real con un CUIT conocido; si ARCA respondiera algo distinto de lo esperado, se ajusta \`lib/arca.ts\`.
``
``**Pendiente**
``- [ ] Sacar el certificado en ARCA y autorizar el servicio (pasos 1 a 4 del README), y avisar para probar.
``- [ ] Cargar \`ARCA_CUIT\`, \`ARCA_CERT\`, \`ARCA_KEY\` y \`ARCA_ENTORNO\` en Vercel y volver a publicar.
``- [ ] Cambiar la contraseña de la base en Neon (la hace el usuario, con la guía del README).
``- [ ] Más adelante: revisar si se vuelve a limitar por stock (el usuario lo quiere probar después).
``- [ ] Listado de especies: por ahora está bien; quizás se retome.
`
`## 2026-10-26: uso sin señal (guardar y subir cuando haya conexión)
`
`**Pedido:** la app se va a usar en zonas con poca señal: que guarde lo cargado y lo suba cuando se conecte.
`
`**Decisiones**
`- **Se puede cargar sin señal** (Movimiento y Ajuste). Modificar, anular, ingresar, buscar un CUIT y cambiar la
`  clave necesitan conexión (son acciones sobre datos que cambian, o que dependen de ARCA).
`- **El remito sin subir no tiene número:** lo asigna el sistema al subirlo (para no repetir números entre
`  celulares). Hasta entonces se ve como "pendiente" arriba.
`- **Cola en el celu** (\`localStorage\`, \`lib/pendientes.ts\`) y envío automático: al abrir la app, al volver la señal,
`  al volver a la app y cada 30 segundos; de a uno y en orden. Si se corta, se frena y se reintenta.
`- **Sin duplicados:** cada remito lleva una *clave de envío* (UUID). La tabla \`remitos\` tiene \`clave_envio\` única;
`  si el mismo remito llega dos veces, el servidor devuelve el que ya guardó. Esto cubre también el doble toque
`  del botón y el corte de señal justo después de guardar.
`- **El responsable** lo pone el servidor según quien tiene la sesión abierta. Por eso cada pendiente guarda quién lo
`  cargó y solo ese usuario lo sube (si otra persona ingresa en el celu, esperan).
`- **Errores de datos** (ej. una especie que ya no existe) no se reintentan solos: quedan marcados con el motivo y
`  los botones Reintentar y Descartar. Los errores de señal o de base de datos sí se reintentan.
`- **Abrir la app sin señal:** *service worker* (\`public/sw.js\`): guarda las pantallas (con la red primero y la copia
`  como respaldo, esperando 4 segundos) y los archivos de la app. Solo se activa en la app publicada. Al salir
`  (\`Salir\`) se borran las pantallas guardadas.
`- **Instalable:** manifiesto (\`app/manifest.ts\`) e íconos de Native (192, 512 y 512 para recorte en círculo), hechos con
`  el logo sobre el verde de la marca.
`- **La fecha** de un remito nuevo se calcula en el celu (hora de Argentina): sin señal, la pantalla guardada puede
`  ser de otro día.
`
`**Qué se hizo:** columna \`clave_envio\` (+ índice único) en \`remitos\`; \`guardarRemito\` idempotente; \`Resultado\` con
`\`codigo\` (sin-sesión / temporal) y \`pendiente\`; Cargar guarda en la cola si no hay señal; componente
`\`Sincronizador\` (avisos, subida automática, registro del service worker, descarga de las pantallas); \`sw.js\`,
`manifiesto, íconos y cabecera sin caché para \`sw.js\` en \`next.config.ts\`.
`
`**Probado** de punta a punta con un Chrome real controlado por un script (20 de 20): el service worker toma el
`control y guarda Stock, Cargar y Últimos con 14 archivos; **se apagó el servidor** y Cargar abrió igual; se
`guardaron dos remitos (uno con el servidor apagado y otro con el celu marcado "sin conexión", que muestra el aviso);
`quedaron en la cola y nada llegó a la base; al **prender el servidor y volver la señal** se subieron solos, con su
`responsable y sus movimientos, y la cola quedó vacía; reenviar el mismo remito **no lo duplicó**; al salir se
`borraron las pantallas guardadas. El test encontró un error mío (una regla mal escrita rechazaba todos los
`remitos) y se corrigió. Los datos de prueba se borraron (el próximo remito es el 000003).
`**No se pudo probar** en un celu real ni con señal mala "de verdad" (solo apagando el servidor y simulando "sin
`conexión"). El navegador integrado de esta ventana no permite service workers, por eso se usó Chrome desde un
`script. Conviene probarlo en el celu: ver el README, "Usarla sin señal".
`
`**Pendiente**
`- [ ] Probar en un celu real, con modo avión: abrir la app instalada, cargar un remito, y volver a conectar.
`- [ ] Sacar el certificado en ARCA y autorizar el servicio (pasos 1 a 4 del README, "Buscar un CUIT en ARCA").
`- [ ] Cargar \`ARCA_CUIT\`, \`ARCA_CERT\`, \`ARCA_KEY\` y \`ARCA_ENTORNO\` en Vercel y volver a publicar.
`- [ ] Cambiar la contraseña de la base en Neon (la hace el usuario, con la guía del README).
`- [ ] Más adelante: revisar si se vuelve a limitar por stock (el usuario lo quiere probar después).
`- [ ] Listado de especies: por ahora está bien; quizás se retome.

## 2026-10-26: se saca el lema del encabezado

**Pedido:** retirar la frase "Movemos naturaleza. Creamos paisaje".

**Qué se hizo:** se sacó del encabezado de la app y también del remito impreso (debajo del logo), junto con
sus estilos, el dato `lema` de `lib/empresa.ts` y la mención en el README. Si algún día se quiere volver a poner,
se agrega `lema` en `lib/empresa.ts` y se muestra en `app/remitos/[numero]/page.tsx`.

**Probado:** compila sin errores. No se revisó a ojo en pantalla.

## 2026-10-26: la activación de ARCA queda para después de revisar la seguridad

**Decisión del usuario:** sacar el certificado en ARCA y activar la búsqueda de nombre por CUIT **más adelante, después
de revisar toda la seguridad** de la app.

**Estado:** la función ya está hecha, probada y publicada, pero **apagada** (sin certificado, el CUIT se valida y se
guarda, y el nombre se escribe a mano). Los archivos de `app-stock-next/certificados/` (clave privada y pedido) ya
están generados y fuera de GitHub. No hay que hacer nada hasta retomarlo; los pasos están en el README ("Buscar un
CUIT en ARCA").

**Pendiente (en este orden)**
- [ ] **Revisión general de seguridad** de la app (claves, sesiones, permisos, datos guardados en el celu, variables de
      Vercel, base de datos).
- [ ] Cambiar la contraseña de la base en Neon (la hace el usuario, con la guía del README).
- [ ] Después: sacar el certificado en ARCA y activar la búsqueda por CUIT (pasos 1 a 4 del README).
- [ ] Probar el uso sin señal en un celu real, con modo avión.
- [ ] Más adelante: revisar si se vuelve a limitar por stock (el usuario lo quiere probar después).
- [ ] Listado de especies: por ahora está bien; quizás se retome.

## 2026-10-26: Usuarios pasa al menú del nombre

**Pedido:** la sección Usuarios dentro del menú desplegable del nombre.

**Qué se hizo:** se sacó la pestaña **Usuarios** de la barra y ahora es una opción del menú de arriba a la derecha
(**Usuarios**, **Mi clave**, **Salir**), solo para administradores. Los colaboradores ven solo Mi clave y Salir. La
barra queda con tres pestañas (Stock, Cargar, Últimos), lo que también ordena el celu.

**Probado:** con un usuario administrador de prueba (ya borrado): la barra tiene 3 pestañas y el menú muestra
Usuarios, Mi clave y Salir. Compila sin errores. No se pudo ver la captura en tamaño celu (el navegador integrado
se trabó); el cambio de tamaño no toca estilos nuevos.

## 2026-10-28: se agrega Sauce llorón

**Pedido:** agregar al listado de plantas el sauce llorón.

**Qué se hizo:** se sumó **Sauce llorón** (*Salix babylonica*), código `SLL`, grupo Árbol, región **Exótica** (no es
nativo), sin stock mínimo, en `lib/especies.ts` y en la base (con `npm.cmd run cargar-especies`, que solo agrega lo
que falta). El listado pasó de 179 a **180** especies; se actualizó el README. No se tocó ningún dato existente.

**Notas**
- El nombre científico y la región los elegí yo (el sauce llorón común es *Salix babylonica*; en muchos viveros
  también se vende el híbrido *Salix × sepulcralis*). Si el vivero vende otro, se corrige el nombre científico
  desde el panel de Neon (tabla `especies`).
- El código `SLL` no se puede cambiar una vez que la especie tiene movimientos.

## 2026-10-28: se agregan los fresnos

**Pedido:** sumar todos los fresnos que haya en Argentina.

**Qué se hizo:** se agregaron **4 fresnos** (todos grupo Árbol, región Exótica, sin stock mínimo), y se
juntaron con el sauce llorón en una sección nueva de "Árboles exóticos" de `lib/especies.ts`. El listado pasó
de 180 a **184** especies. Se cargaron en la base con `npm.cmd run cargar-especies` (no se tocó nada existente).

| Código | Nombre | Científico |
|---|---|---|
| `FRA` | Fresno americano | *Fraxinus pennsylvanica* |
| `FRZ` | Fresno de Arizona | *Fraxinus velutina* |
| `FRD` | Fresno dorado | *Fraxinus excelsior* 'Aurea' |
| `FRE` | Fresno europeo | *Fraxinus excelsior* |

**Cómo se eligieron (para que el vivero lo revise):** solo entraron los que tienen registro en Argentina.
- *F. pennsylvanica*: es el "fresno americano" cultivado y naturalizado del país (Achinelli y Delucchi, 1999,
  concluyen que todo lo que se llama "americano" en Argentina es esta especie).
- *F. excelsior*: lo registra Kew como introducido en el Noreste, y lo producen los viveros provinciales de Mendoza;
  la forma dorada ('Aurea') figura en el Plan de Arbolado de Buenos Aires.
- *F. velutina*: Kew lo cita como introducido en el Noreste; algunos autores lo tratan como subespecie de
  *F. pennsylvanica* (puede ser lo mismo que el fresno americano: el vivero decide si lo vende aparte).
- **No se agregaron** *F. americana* (el estudio de 1999 dice que no está en el país, aunque un inventario de
  Resistencia la nombra: probablemente confundida con la anterior), ni *F. angustifolia*, *F. ornus*, *F. uhdei*,
  *F. chinensis*, que no tienen registros en Argentina.
- Si el vivero vende otro (o quiere separar o juntar alguno), se agrega o se quita en `lib/especies.ts` y se corre
  de nuevo `cargar-especies` (para quitar una, se borra su fila en Neon si no tiene movimientos).

## 2026-10-28: "fresno rojo"

**Pedido:** sumar el fresno rojo.

**Qué se encontró:** en Argentina "fresno rojo" (y "fresno verde") son otros nombres del **fresno americano**
(*Fraxinus pennsylvanica*), que ya estaba cargado (`FRA`). Para no tener la misma especie dos veces (el stock
quedaría partido en dos), no se agregó una especie nueva: se cambió el nombre de `FRA` a **"Fresno americano
(fresno rojo)"**, así aparece al buscar "rojo" en Cargar y en Stock. Cambió el nombre en `lib/especies.ts` y en la
base (la especie no tenía movimientos, así que no afectó nada).

**Si el vivero vende otro "fresno rojo"** (por ejemplo una variedad distinta de otoño colorado), se agrega como
especie aparte con su nombre científico o cultivar.

## 2026-10-28: se agrega el fresno Raywood

**Pedido:** sumar el fresno Raywood.

**Qué se hizo:** se agregó **Fresno Raywood** (`FRR`), *Fraxinus angustifolia* 'Raywood' (variedad de hoja que se pone
roja en otoño; a veces se vende como *F. oxycarpa* 'Raywood'). Árbol, región Exótica, sin stock mínimo. El listado
pasó de 184 a **185** especies. Se cargó en la base con `cargar-especies`.

**Nota:** antes no se había incluido *F. angustifolia* porque no encontré registros en la bibliografía argentina;
se agrega ahora porque el vivero la trabaja. Si el nombre científico que usan es otro, se corrige en la tabla
`especies` de Neon.

## 2026-10-28: Stock como tabla angosta con detalle al tocar

**Pedido:** ver opciones para que el listado de plantas condense la información, más parecido a una lista.

**Opciones que se mostraron:** (1) planilla con una fila por variante y columnas por depósito, (2) una línea por
especie con desplegable, (3) especie con sus variantes siempre a la vista, (4) tabla angosta solo con lo esencial.
**Se eligió la 4.**

**Qué se hizo:** la pantalla Stock ahora es una tabla de tres columnas: **código, especie y total**. Tocando una
fila se abre el detalle (nombre científico, región, grupo, aviso de mínimo, stock por depósito con "Todos", y
presentaciones y tamaños); tocándola otra vez se cierra, y se pueden tener varias abiertas. Las bajo el mínimo llevan
una marca roja. Reemplaza el listado de dos pasos anterior (nombre, detalle y total en la misma fila). No cambió
ningún dato ni cuenta, solo cómo se ve.

**Probado** con un usuario de prueba (ya borrado) y capturas con Chrome en tamaño celu (375 px) y compu (1100 px):
sin desbordes, la fila abre y cierra el detalle, y se ve bien con "Todas, con y sin stock". Compila sin errores.

**Si no convence:** las otras opciones se pueden armar (la planilla por variante es la más parecida a un inventario).

## 2026-10-28: detalle de Stock por depósito

**Pedido:** (1) en el detalle de cada planta no mostrar la procedencia; (2) dejar el nombre científico sin mayor
relevancia; (3) que al desplegar se vea un listado por depósito y, dentro de cada uno, las presentaciones.

**Qué se hizo:** el detalle de una fila ahora muestra el nombre científico en chico y gris (con la etiqueta de
grupo, Palmera o Frutal, al lado) y, por cada depósito con stock, un título con su subtotal y debajo una lista de
"presentación · tamaño" con su cantidad. Con "Todos" aparecen los tres depósitos (los que tienen plantas); si se
elige un depósito arriba, solo ese. Se sacó la región del detalle (el filtro **Región** sigue funcionando) y se
borraron los estilos que quedaron sin uso (chips, línea de depósitos).

**Probado** con un usuario de prueba (ya borrado) y capturas con Chrome en celu y compu: Aguaribay (Pilar y Goya
con sus presentaciones) y Olivo (frutal, solo Goya) se ven bien, sin desbordes. Compila sin errores.
