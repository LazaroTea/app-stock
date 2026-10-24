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

## 2026-10-23: ajustes de tamaños y "Especificar"

**Pedido:** quitar 1Kg, 12-14RD y 150-180cm; cambiar "E65L" por "65Lt" y "26-30" por "25-30"; y que al elegir
"Especificar" aparezca un renglón para escribir el tamaño.

**Qué se hizo**
- Lista de tamaños actualizada en `lib/almacen.ts` (para bases nuevas) y en la base real con un ajuste de una
  sola vez: no había movimientos con esos tamaños, así que no se perdió nada. Quedan 28 tamaños.
- "Especificar": aparece un renglón obligatorio debajo del desplegable (hasta 60 letras). Lo escrito se guarda
  en la columna nueva `tamano_detalle` de `movimientos` y se muestra como tamaño en Stock, Cargar y Últimos.
  Cada tamaño escrito lleva su propio stock; se sacan los espacios de más para que "5 m" y "5  m " sumen
  juntos, y los tamaños ya escritos se sugieren al escribir.
- Los movimientos viejos (antes de este cambio) siguen funcionando: `tamano_detalle` queda vacío.

**Probado** contra la base real, en tamaño celular: entrada de 4 Pindós con "5 m de altura" y salida de 1
escribiendo "  5  m de altura " (se descontó del mismo stock: quedaron 3). Los dos movimientos de prueba se
borraron. Compila sin errores.

**Nota:** durante la prueba aparecieron 3 movimientos cargados por el vivero (14:38, sin responsable):
1 Palmera canaria y 2 Fénix enana, todas envasado 4Mts. No se tocaron. Las dos de Fénix enana son iguales:
revisar si fue un doble envío.

## 2026-10-23: carga en formato remito

**Pedido:** que la carga tenga formato de remito, que se vayan sumando al costado las especies con su
cantidad, tamaño y presentación; el botón "Guardar movimiento" pasa a "Sumar", y un botón nuevo
"Guardar movimiento" guarda toda la carga.

**Qué se hizo**
- Pantalla Cargar en dos partes: "Datos del remito" (tipo, fecha, responsable, observaciones) y
  "Sumar plantas" (especie, presentación, tamaño, cantidad y **+ Sumar**). Al costado (en el celu, abajo) se
  arma el remito con el estilo de los presupuestos: título REMITO, tabla con encabezado oliva, total y el
  botón **Guardar movimiento**.
- Si se suma algo que ya está en el remito, se juntan las cantidades en la misma línea. Cada línea se puede
  quitar con ✕.
- Antes de guardar, cada línea de salida o ajuste se controla contra el stock: si no alcanza, se marca en rojo
  ("Hay 2") y no se puede guardar.
- **Guardar movimiento** guarda el remito entero en una sola operación: nueva tabla `remitos` (el número es
  el `id`) y columna `remito_id` en `movimientos`. Si mientras tanto alguien sacó stock y ya no alcanza, no se
  guarda nada, se explica qué línea falla y la pantalla se actualiza con el stock real.
- El remito a medio armar queda guardado en el navegador (no se pierde si se cierra la página).
- Últimos muestra el número de remito (en el celu se oculta, como el responsable).
- Ya no está el panel de "stock de la especie elegida" de la compu: su lugar lo ocupa el remito. El stock
  disponible se sigue viendo debajo del tamaño ("Hay 12 en maceta, 3Lts (en este remito: +5)").

**Probado** contra la base real: remito de entrada con 3 líneas (dos se juntaron: 10 + 2 = 12) guardado como
N.º 000001; salida sin stock marcada en rojo con el botón desactivado; dos pestañas guardando a la vez: la
segunda fue rechazada entera ("hay 2 y el remito necesita 10") y la línea quedó en rojo con el stock real.
Celu sin desbordes. Los remitos y movimientos de prueba se borraron y la numeración volvió a empezar en 1.
Los 3 movimientos cargados por el vivero no se tocaron. Compila sin errores.

## 2026-10-23: remito en PDF, destinatario y orden de presentaciones

**Pedido:** poder descargar e imprimir el remito en PDF; presentación por defecto Envasado, y el orden
Envasado, Maceta, Raíz desnuda; destinatario opcional. Los 3 movimientos sin remito que había eran pruebas
del vivero: no hace falta tenerlos en cuenta.

**Qué se hizo**
- Página `/remitos/[número]` con el remito armado como los presupuestos de Native: logo en verde
  (`public/logo-native-verde.png`, hecho a partir del logo crema), lema, datos de la empresa
  (`lib/empresa.ts`), fecha, movimiento, destinatario, responsable, observaciones, barra DESCRIPCIÓN, tabla
  (especie, nombre científico, presentación, tamaño, cantidad), total, firmas "Entregó" y "Recibió", y la
  aclaración "Remito interno de control de stock. Documento no válido como factura".
- Botón **Imprimir / Guardar PDF**: abre la impresión del navegador; para descargar se elige "Guardar como
  PDF". Al imprimir se ocultan el encabezado, las pestañas y los botones, y la hoja es A4. El nombre que propone
  el navegador para el archivo es "Remito 000001 - Native".
- Enlaces a esa página: al guardar un remito ("Imprimir o descargar PDF") y desde el número en Últimos.
- Destinatario opcional: nueva columna `destinatario` en `remitos`, con sugerencias de los ya usados. Sale en
  el remito de la pantalla y en el impreso.
- Orden de presentaciones: Envasado, Maceta, Raíz desnuda (en el código y en la base). Envasado viene elegida.
- Página "No encontrado" en español.

**Probado** contra la base real: remito con destinatario, una línea de envasado 20Lts y otra de maceta con
tamaño escrito a mano; la página del remito en compu y en celu; y un PDF generado con Edge en modo
automático: sale en una hoja A4 con los colores y el formato de los presupuestos. El remito de prueba se
borró y la numeración volvió a 1. Compila sin errores.

## 2026-10-23: observaciones debajo del detalle

**Pedido:** que las observaciones vayan debajo del detalle y antes del total.

**Qué se hizo:** en el remito impreso y en el remito que se arma en Cargar, las observaciones pasaron de los
datos de arriba a un bloque entre la tabla y el total.

**Probado:** PDF generado con Edge sobre un remito de prueba con observaciones, y el orden en Cargar.
El remito de prueba (000003) se borró. Para ese momento el vivero ya había guardado los remitos 000001 y
000002, que no se tocaron; la numeración se acomodó para que el próximo sea el 000003.

**Plan acordado para más adelante (usuarios):** cuando se agregue el inicio de sesión, cada persona tendrá su
usuario y el campo **Responsable** del remito se completará solo con el usuario que inició sesión (hoy se
recuerda el último nombre escrito en cada dispositivo).

## 2026-10-23: procedencia y destino

**Pedido:** agregar Procedencia (Palma Sola, Goya, Pilar, Benavidez, Proveedor) y Destino (Palma Sola, Goya,
Pilar, Benavidez, Cliente); con Proveedor o Cliente, poder especificar cuál.

**Qué se hizo**
- Dos desplegables en "Datos del remito", uno al lado del otro, que arrancan en "Sin especificar"
  (opcionales). Con Proveedor o Cliente aparece un renglón "¿Cuál?", obligatorio en ese caso, con sugerencias
  de los nombres ya usados.
- Columnas nuevas en `remitos`: `procedencia`, `procedencia_detalle`, `destino`, `destino_detalle`.
- Se muestran en el remito de Cargar y en el impreso: "Procedencia: Proveedor (Vivero X)", "Destino: Goya".
- El destinatario sigue como campo aparte, ahora pensado para la persona o contacto que recibe.

**Probado** contra la base real: remito con procedencia Proveedor y destino Cliente (sin el nombre no deja
guardar; con el nombre se guarda y sale en el impreso), sugerencia del proveedor al volver a cargar, y celu
sin desbordes. El remito de prueba se borró; quedan los 2 remitos del vivero y el próximo es el 000003.

**Idea para más adelante:** el stock hoy es uno solo para todo Native. Si hace falta saber cuánto hay en cada
lugar (Palma Sola, Goya, Pilar, Benavidez), se puede llevar el stock por lugar usando procedencia y destino
(por ejemplo, un pase de Goya a Pilar resta en Goya y suma en Pilar).

## 2026-10-23: stock por depósito, pases, sin límite de stock y frutales

**Pedido:** sumar el olivo y los frutales; llevar el stock de cada depósito (Benavidez, Pilar y Goya) y
cruzar la información según los movimientos entre ellos; no limitar los movimientos por la cantidad que haya.

**Decisiones** (elegidas por el usuario)
- **Palma Sola no lleva stock:** es origen o destino, como un proveedor o un cliente.
- **Cuatro tipos con botones**, y cada uno muestra solo los lugares que le corresponden:
  - Entrada: procedencia (opcional: Palma Sola o Proveedor) → depósito de destino (obligatorio). Suma.
  - Salida: depósito de origen (obligatorio) → destino (opcional: Palma Sola o Cliente). Resta.
  - Pase: depósito de origen → depósito de destino (distintos). Resta en uno y suma en el otro.
  - Ajuste: depósito. Suma o resta según el signo.
- **Se borró todo lo cargado antes** (eran pruebas) y el stock arrancó en cero, con la numeración en 000001.

**Qué se hizo**
- Tablas nuevas: `remitos` (ahora con tipo "Pase") y `movimientos` con `deposito` y `cantidad` con signo; un
  pase genera dos movimientos por línea. La app hizo el cambio sola al arrancar.
- Sin límite de stock: se guarda aunque no alcance. El remito avisa "Pilar queda en −2" pero no bloquea, y el
  stock negativo se ve en rojo.
- Stock: botones Todos / Benavidez / Pilar / Goya; con Todos, cada especie muestra cuánto hay en cada depósito.
- Cargar: debajo del tamaño se ve cuánto hay en el depósito (en un pase, en los dos).
- Últimos: columna Depósito y cantidad con signo (+/−).
- Remito impreso: "Depósito de origen" / "Depósito de destino" / "Procedencia" / "Destino" según el tipo.
- 28 frutales (`frutal(...)` en `lib/especies.ts`, grupo "Frutal"): olivo, 7 cítricos, 6 de carozo,
  3 de pepita y otros 11 (palta, banano, vid, kiwi, higuera, granado, nogal europeo, pecán, caqui, níspero,
  arándano). Cargados en la base: 179 especies. Filtro "Solo frutales" en Stock.

**Probado** contra la base real: entrada de un proveedor a Goya (10 olivos y 5 ceibos), pase de 4 olivos de Goya
a Pilar, salida de 6 olivos de Pilar a un cliente (Pilar quedó en −2, con aviso y sin bloquear) y ajuste de +2
ceibos en Benavidez. Stock: Goya 6 olivos y 5 ceibos; Pilar −2 olivos; Benavidez 2 ceibos; Todos 4 olivos y
7 ceibos. Últimos mostró el pase en dos filas (−4 Goya, +4 Pilar) y el remito impreso los depósitos. Celu sin
desbordes. Los 4 remitos de prueba se borraron (base en cero, próximo remito 000001). Compila sin errores.

## 2026-10-23: depósitos en procedencia y destino

**Pedido:** que en Procedencia aparezcan también Goya, Pilar y Benavidez (no solo Palma Sola y Proveedor).
También: poder emitir remitos aunque no haya stock (ya estaba así desde el cambio anterior; se confirmó en la
versión publicada que no queda ningún bloqueo, solo el aviso "queda en −N").

**Qué se hizo**
- Procedencia de una Entrada: Palma Sola, Goya, Pilar, Benavidez, Proveedor (la lista original del vivero).
  Destino de una Salida: Palma Sola, Goya, Pilar, Benavidez, Cliente.
- Si la procedencia de una entrada o el destino de una salida es un depósito, el stock se cruza como en un pase
  (resta en uno, suma en el otro), para no contar las plantas dos veces. Origen y destino tienen que ser
  distintos.

**Probado:** las reglas con casos de ejemplo (entrada de Pilar a Goya: −4 Pilar, +4 Goya; salida de Goya a
Benavidez: −2 Goya, +2 Benavidez; entrada de proveedor y salida a cliente sin cambios) y los desplegables en
pantalla, sin guardar nada en la base. Compila sin errores.

## 2026-10-24: Movimiento y Ajuste

**Pedido:** en vez de Entrada / Salida / Pase, dos tipos: **Movimiento** (resta en el punto de partida y suma
en el de llegada) y **Ajuste**. Partida: Palma Sola, Goya, Pilar, Benavidez, Proveedor. Llegada: las mismas más
Cliente. Los stocks que se controlan son solo Goya, Pilar y Benavidez.

**Qué se hizo**
- `TIPOS` = Movimiento y Ajuste. Reglas en `lib/stock.ts` (`PARTIDAS`, `LLEGADAS`, `efectos`): un movimiento
  resta en la partida y suma en la llegada solo si son depósitos. Partida y llegada son obligatorias; al menos
  una tiene que ser un depósito (si no, no cambiaría ningún stock) y no pueden ser el mismo depósito.
- Base: la app cambió sola la restricción de tipos y convirtió los remitos viejos a "Movimiento" sin tocar sus
  movimientos. Había uno solo, del vivero: el 000001 (Benavidez → Pilar, 2 olivos), que quedó igual.
- Sugerencias: un proveedor puede estar en la partida o en la llegada (devolución), y un cliente en la llegada.
- Remito impreso: "Tipo", "Punto de partida" y "Punto de llegada". Últimos: + en verde, − en rojo.

**Probado** contra la base real: Proveedor → Cliente no deja guardar; Proveedor → Goya (+1 en Goya) y
Goya → Palma Sola (−3 en Goya, Palma Sola sin stock) dieron Goya −2; el remito 000001 se ve como Movimiento.
Los dos remitos de prueba se borraron (el próximo es el 000002). Compila sin errores.

**Ojo:** hasta que se suba este código, la versión publicada no puede guardar remitos (la base ya no acepta
los tipos viejos).

## 2026-10-24: modificar y anular remitos

**Pedido:** botones para modificar y anular movimientos, que más adelante se van a restringir a ciertos usuarios.

**Decisiones**
- Se modifica y se anula el **remito entero** (los movimientos de stock salen de sus líneas).
- **Anular no borra:** el remito queda con su número, motivo (obligatorio), fecha y la marca ANULADO, y deja de
  contar en el stock. Así queda la historia. No se puede modificar ni "desanular" desde la app.
- **Modificar** reemplaza datos y líneas del remito, con el mismo número, y anota cuándo se modificó.
- **Permisos en un solo lugar:** `lib/permisos.ts` (`puedeModificarRemitos`, `puedeAnularRemitos`). Hoy
  devuelven siempre "sí"; cuando haya usuarios, se restringe ahí. Lo usan la pantalla (muestra u oculta los
  botones) y el servidor (rechaza el pedido igual).

**Qué se hizo**
- Base: columnas `anulado`, `anulado_motivo`, `anulado_en` y `modificado_en` en `remitos`. El stock solo suma
  remitos no anulados.
- Página del remito: botones **Modificar** (abre `/cargar?remito=N`) y **Anular** (pide motivo y confirma);
  aviso y marca ANULADO, también al imprimir.
- Cargar: modo "modificar" con el remito precargado, aviso arriba, botón **Guardar cambios**; al guardar vuelve
  a la página del remito. No toca el borrador del remito nuevo.
- Guardar y modificar usan las mismas revisiones (`revisarRemito` en `app/acciones.ts`).
- Últimos: el número de remito se ve también en el celu (es la puerta para modificar o anular) y los movimientos
  de remitos anulados se ven tachados.

**Probado** contra la base real: remito de prueba (5 lapachos, proveedor → Goya), modificado a 8 lapachos con
llegada en Pilar (mismo número, stock: Pilar 8, Goya 0) y anulado con motivo (stock en cero, tachado en Últimos,
marca ANULADO, sin botones de modificar ni anular, y `/cargar?remito=N` avisa que está anulado). El remito de
prueba se borró (el próximo es el 000002). Compila sin errores.

**Pendiente**
- [ ] Restringir modificar y anular a ciertos usuarios (cuando haya usuarios), en `lib/permisos.ts`.
- [ ] Más adelante: revisar si se vuelve a limitar por stock (el usuario lo quiere probar después).
- [ ] Listado de especies: por ahora está bien (el usuario lo dio por correcto el 2026-10-24); quizás se retome.
- [ ] ¿Sumar las otras especies exóticas de la planilla de cotizaciones y de la web (fresnos, liquidámbar,
      olivo, etc.)?
- [ ] Subir estos cambios a GitHub y confirmar que Vercel la publica sin error.
- [ ] **Agregar usuarios e inicio de sesión**: hoy cualquiera con el link puede cargar movimientos. El
      Responsable del remito tiene que salir del usuario que inició sesión.
- [ ] Cambiar la contraseña de la base en Neon (quedó escrita en el chat) y actualizar `.env.local`.
