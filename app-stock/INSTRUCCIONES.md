# App de stock del vivero: cómo ponerla en marcha

La app guarda todo en una planilla de Google. Se abre con un link desde la compu o el celu.
No hace falta instalar nada ni pagar nada.

Archivos:
- `Codigo.gs`: la lógica (lee y escribe la planilla).
- `Index.html`: la pantalla.

---

## 1. Crear la planilla

1. Entrá a https://sheets.google.com con la cuenta de Google del vivero y creá una planilla en blanco.
2. Ponele un nombre, por ejemplo **Stock vivero**.

## 2. Pegar el código

1. En la planilla, andá a **Extensiones > Apps Script**. Se abre el editor en otra pestaña.
2. A la izquierda vas a ver un archivo `Código.gs`. Borrá todo lo que tiene y pegá el contenido de **`Codigo.gs`**.
3. Tocá el **+** al lado de "Archivos" > **HTML** y llamalo exactamente `Index` (sin el `.html`, lo agrega solo).
   Borrá lo que trae y pegá el contenido de **`Index.html`**.
4. Guardá (ícono del disquete o Ctrl+S).

## 3. Crear las hojas

1. En el editor, arriba, elegí la función **configurar** en la lista desplegable y tocá **Ejecutar**.
2. La primera vez Google pide permisos: **Revisar permisos**, elegí tu cuenta.
   Si aparece "Google no verificó esta app", tocá **Configuración avanzada > Ir a … (no seguro)**.
   Es normal: la "app" es tu propio script.
3. Volvé a la planilla: ahora tiene las hojas **Especies**, **Tamaños** y **Movimientos**.

## 4. Cargar especies y tamaños

**Especies**: una fila por especie.

| Código | Nombre común | Nombre científico | Stock mínimo |
|---|---|---|---|
| ALG | Algarrobo blanco | Prosopis alba | 50 |
| CEI | Ceibo | Erythrina crista-galli | 20 |

- El código tiene que ser único y corto. No lo cambies después de cargar movimientos.
- El **stock mínimo** es para el total de la especie (todos los tamaños juntos). Si dejás 0, no avisa.

**Tamaños**: trae cuatro de ejemplo (Maceta 1 L, 3 L, 10 L, Envase 20 L). Cambialos por los que usen ustedes,
uno por fila, **antes** de cargar movimientos.

> Si ya tienen la lista de especies en algún lado, copiala y pegala directo en la hoja.

## 5. Publicar la app

1. En el editor de Apps Script: **Implementar > Nueva implementación**.
2. En el engranaje, elegí **Aplicación web**.
3. Completá:
   - **Ejecutar como**: *Usuario que accede a la aplicación web*
   - **Quién tiene acceso**: *Cualquier usuario con cuenta de Google*
4. **Implementar**. Copiá la **URL de la aplicación web**: ese es el link de la app.

Con esta configuración solo pueden usar la app las personas que tengan acceso a la planilla, y la hoja
Movimientos anota automáticamente el mail de quién cargó cada cosa.

## 6. Dar acceso al equipo

1. En la planilla: **Compartir** y agregá el mail de cada persona como **Editor**.
2. Mandales el link de la app. Cada uno, la primera vez, acepta los permisos (como en el paso 3).
3. En el celu: abrí el link y usá **Agregar a pantalla de inicio** para tenerlo como un ícono.

## 7. Probar antes de usarla en serio

Cargá unos 10 movimientos de prueba (entradas, una salida, un ajuste) y fijate que el stock dé lo que esperás.
Después, en la hoja **Movimientos**, borrá esas filas de prueba (dejá la fila de títulos).

---

## Cómo se usa

- **Entrada**: plantas que ingresan (producción, compras, donaciones).
- **Salida**: plantas que se van (ventas, entregas, pérdidas). No deja sacar más de lo que hay.
- **Ajuste**: corrige después de contar. Número positivo si sobran, negativo (ej. `-3`) si faltan.
- **Pasar plantas de un tamaño a otro** (trasplante): por ahora son dos movimientos,
  una salida del tamaño chico y una entrada en el grande.

El stock **nunca se escribe a mano**: se calcula sumando los movimientos. Si hay un error, se corrige con un Ajuste,
así queda registrado.

## Si cambiás el código más adelante

Después de pegar una versión nueva: **Implementar > Gestionar implementaciones**, el lápiz,
en "Versión" elegí **Nueva versión** y **Implementar**. El link sigue siendo el mismo.

## Respaldo

La planilla ya guarda historial (**Archivo > Historial de versiones**). Igual, conviene descargar una copia
de vez en cuando: **Archivo > Descargar > Microsoft Excel**.
