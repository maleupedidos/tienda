# Contexto — la tienda online de Maleu

> Se carga en toda sesión que arranque acá adentro, encima del de [Maleu](../CLAUDE.md).
> **Creado el 25/8/2026**, el día que la tienda se separó del ERP.

Este repo es **la tienda online y nada más**. Es lo único que ve un cliente.
Publica en **https://maleu.com.ar** (GitHub Pages + dominio propio).

## Por qué está separada del ERP

Hasta el 25/8/2026 la tienda y el ERP vivían en el mismo repo
(`maleupedidos.github.io`) y por lo tanto en el mismo dominio. Eso tenía dos
problemas:

1. **No se podía poner la tienda en `maleu.com.ar` sin arrastrar el ERP.**
   GitHub Pages sirve un repo entero bajo un solo dominio: el `CNAME` aplica a
   todo. El ERP habría quedado colgando del dominio de la marca.
2. **Mover el ERP de dominio cuesta plata.** El origen cambia, y con el origen
   se va el `localStorage` de todos los celulares. Ahí adentro está
   `maleu_ruta_sync`, la cola de cobros que Ruta todavía no sincronizó. Un
   repartidor con cobros pendientes los perdía sin enterarse.

Separando, la tienda se muda y **el ERP no se entera**: sigue en
`maleupedidos.github.io/app.html`, mismo origen, mismos íconos instalados,
misma cola de cobros.

| | Dónde vive | Quién entra |
|---|---|---|
| **La tienda** (este repo) | `maleu.com.ar` | El cliente. Público, indexable. |
| **El ERP** (`maleupedidos.github.io`) | `maleupedidos.github.io/app.html` | Nosotros. Login con token + permisos por rol. |

## Los precios se editan en UN solo lugar

`app.js` → array `PRODUCTOS` → es **la fuente única**.

Cuando se pushea un cambio a `app.js`, el workflow `sync-precios.yml` regenera
`data/precios.json` (mapa `id → precio`). El **Portal Red del ERP** (`red.html`)
lo lee por HTTP desde `https://maleu.com.ar/data/precios.json`.

> [!warning] No edites `data/precios.json` a mano
> Lo pisa el workflow en el próximo push a `app.js`. Si cambiás un precio,
> cambialo en `app.js` y listo — el portal lo toma solo.

## Qué hay acá

| Archivo | Qué es |
|---|---|
| `index.html` | La tienda. Incluye GA4 (`G-H3W8C74PQP`). |
| `app.js` | El catálogo (`PRODUCTOS`) y toda la lógica del carrito. |
| `styles.css` | Los estilos. |
| `img/` | Fotos de producto. Las saca Tadeo con el iPhone. |
| `data/precios.json` | **Generado.** Lo lee el Portal Red del ERP. |
| `CNAME` | `maleu.com.ar`. Sin esto GitHub Pages no sirve el dominio propio. |

## ⚠ El `?v=` NO se toca a mano — y por que importa (1/9/2026)

`index.html` carga los archivos con un cache-buster:

```html
<link href="styles.css?v=cf3d3cd5">
<script src="app.js?v=867da4ad">
```

**Ese `?v=` es el hash md5 del contenido y lo actualiza el workflow solo.** No lo
edites: si le pones un valor a mano, el proximo push te lo pisa.

> [!danger] Un cambio publicado puede no llegarle al cliente
> Hasta el 1/9/2026 el `?v=` era **`20260819-1`, fijo desde el 19/8**. Y GitHub
> Pages sirve `app.js` con **`Cache-Control: max-age=14400`** — 4 horas.
>
> El navegador cachea **por URL exacta**. Misma URL, misma copia vieja: un
> cambio a `app.js` — **un precio incluido** — podia tardar 4 horas en llegar,
> o no llegar nunca mientras nadie tocara el `?v=`.
>
> Se descubrio porque Tadeo no veia el modo autopedido recién publicado.

> [!danger] Y el workflow que lo actualiza estuvo ROTO desde que se creo (2/9/2026)
> `_tools/cachebuster.py` tenia `RAIZ = r'c:\Tadeo Ustariz\...\tienda'` — la ruta
> de la compu de Tadeo — escrita adentro. En el runner de Ubuntu esa carpeta no
> existe, asi que el paso **fallaba siempre** con `FileNotFoundError`.
>
> **No se notaba porque el `?v=` se actualizaba a mano** corriendo el script en
> Windows: el job quedaba en rojo pero el numero terminaba bien igual. O sea que
> el sintoma era un job fallado que nadie miraba, y el costo era que **cada push
> que tocaba `app.js` o `styles.css` se publicaba con el `?v= `viejo** — el bug
> que este script vino a resolver el dia anterior.
>
> Hoy la raiz sale de `os.path.abspath(__file__)`. Verificado en CI: el run del
> commit `2236ce2` paso y el bot commiteo el `?v=` corregido.

> [!warning] El hash se normaliza a LF, y no es un detalle cosmetico
> Sin normalizar, **el mismo archivo da dos hashes distintos**: en Windows el
> working copy tiene CRLF y el checkout del runner viene con LF. El 2/9/2026 eso
> hizo que el workflow cambiara el `?v=` de `app.js` de `867da4ad` a `84081e7d`
> **sin que `app.js` hubiera cambiado** — 200KB que todos los clientes volvian a
> bajar al pedo, mas un commit de correccion del bot cada vez que alguien corria
> el script a mano en Windows.
>
> `hash_de()` hace `.replace(b'\r\n', b'\n')` antes de hashear. Verificado: las
> dos plataformas dan identico (`84081e7d` y `9e636333`).
>
> **Si algun dia el bot empieza a commitear un `?v=` distinto en cada push sin
> que cambie nada, mira esto primero.**

> [!warning] `curl` NO responde la pregunta que importa
> `curl https://maleu.com.ar/app.js | grep loQueSea` dice que **el servidor tiene
> el archivo nuevo**. Eso es otra pregunta distinta de si **el navegador lo
> recibe**. Lo mismo un Chrome headless con el cache desactivado: pasa siempre.
>
> Asi se dio por verificado el modo autopedido cuando Tadeo no lo veia.
>
> Para contestar la de verdad: **`node _tools/probar-cache.js`**. Visita la
> tienda, deja el cache poblado como cualquier cliente, vuelve a visitarla **sin
> limpiar nada**, y verifica que igual ve el codigo de ahora. El cache queda
> **prendido a proposito**.

Los otros dos:

| | |
|---|---|
| `node _tools/diagnostico-vivo.js` | recorre maleu.com.ar como una persona (elige zona en el modal) y reporta el estado interno |

**El `index.html` se sirve con `max-age=600`** (10 min), asi que un cambio tarda
como mucho ese rato en verse: el navegador pide el index nuevo, ve un `?v=`
distinto, y baja el archivo. Si hace falta antes, recarga forzada.

## Los 7 gustos de sorrentinos se venden en las dos zonas (10/9/2026)

Hasta ese día **cuatro tenían `zonas:["pilar"]`** — Queso Brie, Langostinos al
Azafrán, Pollo y Puerro y Espinaca — y en Estancias no se mostraban. Tadeo los
abrió: *"que en estancias también aparezcan… arriame todos los gustos"*.

**No se les puso ningún "sin stock" a mano, y no es un olvido.** La tienda no
tiene un flag de agotado: lee el stock real del ERP (`action=stock_full`) y de
ahí sale lo que se ve. O sea que la pantalla dice la verdad sola y se corrige
sola el día que Tadeo le compre a Le Unike, sin tocar una línea:

| lo que elige el cliente | modo | qué ve |
|---|---|---|
| entrega **antes del próximo viernes** | `real` / `proyectado` | los que están en 0 dicen **"Sin stock"** y no entran al carrito |
| entrega **del viernes en adelante** | `ilimitado` | se pueden pedir: entran en la orden de compra del jueves, igual que el resto del catálogo |

Un flag de agotado escrito a mano habría hecho las dos cosas mal: taparía las
unidades que sí hay —al abrirlos, **Pollo y Puerro tenía 2 en el freezer**— y
habría que acordarse de sacarlo el día de la compra, con el catálogo mintiendo
hasta que alguien se acuerde.

> [!warning] La chapita "Nuevo" es por zona (`nuevoEn`), no global
> En Pilar estos cuatro se venden hace meses: decirle "Nuevo" a alguien que ya
> los compró gasta la única chapita que hace que un cliente frecuente vuelva a
> mirar el catálogo. `nuevo` sigue siendo el flag de siempre; `nuevoEn` lo acota
> a las zonas donde de verdad es una novedad. Lo resuelve `_esNuevo(p)`.

> [!danger] Abrir un producto a una zona sin mirar la hoja lo cobra y no lo guarda
> Si el id no tiene columna en la hoja de ese canal, el backend **lo cobra y no
> lo escribe**: el pedido entra, el total está bien, y la cantidad no cae en
> ningún lado. Sin error, sin log, sin nada.
>
> Estos cuatro estaban cubiertos —`HOME_PRODUCT_COLS` los tiene en 66-69 desde
> el 1/9/2026, y `PAGE_ID_TO_ABBR`, `PILAR_PRODUCT_COLS` y `RED_PRODUCT_COLS`
> también—, y se verificó **antes** de abrirlos, no después.
>
> Lo vigila `node _tools/verificar-pedido.js`, que desde el 10/9/2026 cruza **el
> catálogo entero** contra los mapas reales del `Code.js` del ERP. Antes miraba
> sólo `cat === 'Carnes'`, así que este cambio no lo habría mirado: la red
> existía para la carne y el modo de fallo no es de la carne, es de cualquier id.

**En la hoja `Proveedores` de la planilla, los cuatro siguen diciendo Canal de
Venta = "Red y Delivery"**, no "Home". El código no lee esa columna —es
documentación— así que no rompe nada, pero quedó vieja: hoy también se venden
en Home.

## Los carteles de stock se borran solos si alguien repinta el catálogo (10/9/2026)

> [!danger] Medido contra maleu.com.ar: el cliente veía "Sin stock" 2 segundos
> Y después desaparecía **de los 34 productos**, sin un solo error en consola.
> Muestreado cada 400 ms contra producción:
>
> | | renderCatalog | updateStockDisplay | el cartel |
> |---|---|---|---|
> | 0,0 s | 1 | 3 | **"Sin stock"** |
> | 2,0 s — llega el inventario de carne | **2** | 3 | **vacío** |

La causa: **los badges se pintan aparte del HTML de la card**, así que cualquier
`renderCatalog()` los borra. De los **cinco** caminos que repintan el catálogo,
cuatro llamaban a `updateStockDisplay()` y el de `fetchPiezas` no.

Es el mismo patrón que el comentario de `renderCatNav()` ya tenía anotado tres
líneas más arriba —*"colgarlo de los call sites es como los botones dejaron de
andar el 10/9/2026: había cinco y dos se olvidaron de llamarlo"*— y el stock
había quedado afuera de esa lección. Por eso **se arregló en la raíz**:
`renderCatalog()` repinta el stock él mismo. Un sexto lugar del que acordarse
habría durado hasta el séptimo camino.

> [!warning] Estuvo LATENTE hasta que Lucas cargó las primeras piezas de carne
> Sin piezas, `piezas_full` devuelve `{}`, la firma no cambia y ese segundo
> repintado **no ocurre nunca**. El bug se activó solo, sin que nadie tocara la
> tienda, la noche del 10/9/2026.

> [!danger] Y el test lo daba VERDE, por culpa de su propio stub
> El escenario devolvía `{}` en `piezas_full` para simplificar. Con eso la firma
> nunca cambiaba y **el repintado no se ejercitaba**: 37 ok sobre un bug que
> estaba vivo en producción. Ahora el stub devuelve piezas de verdad y hay un
> chequeo explícito — leer el cartel, llamar a `renderCatalog()`, leerlo otra vez
> y exigir que diga lo mismo.
>
> Es la lección de siempre dada vuelta: un stub que simplifica de más no hace
> fallar algo que anda, **hace pasar algo que está roto**.

> [!tip] Lo encontró una captura de pantalla, no un número
> El test daba verde y las redes también. Salió de sacar la foto para mostrarle
> el resultado a Tadeo: la primera captura mostraba "Sin stock" y la segunda, un
> minuto después, no. **Mirá la pantalla, no sólo los números.**

> [!warning] Existió `?autopedido=1` y se eliminó el 8/9/2026
> Del 1/9 al 8/9 ese parámetro mostraba el catálogo completo acá. No andaba mal
> — el problema era que convertía a la tienda en una **segunda pantalla para
> cargar pedidos**, en paralelo a la del ERP. Dos caminos para lo mismo se
> despegan solos, y este no tenía los controles del otro: ni el stock del
> freezer, ni el origen, ni «ya me pagó», ni el resumen para WhatsApp.
>
> Si aparece un link viejo con `?autopedido=1`, hoy **no hace nada**: el
> parámetro se ignora y la tienda filtra por zona como siempre.
>
> Y desde el 10/9/2026 el caso que lo motivó tampoco existe: los 4 sorrentinos
> que Galarraga no podía pedir hoy están en el catálogo de Estancias, así que el
> cliente los carga solo.

## Deploy

El push a `main` **ES** la publicación (GitHub Pages). Si sale mal, sale mal en
producción. Tarda ~1 minuto en propagar. Después de publicar, verificá contra la
URL viva — que el job diga OK no alcanza.

La cuenta la decide la carpeta (`includeIf` en `C:\Users\tadeu\.gitconfig`):
todo lo que cuelga de `Trabajo\` firma como **maleupedidos**. No corras
`gh auth switch`.

## Lo que NO está acá

- **Las reglas de la tienda** (stock, cutoffs, zonas, días de entrega): están en
  `Cerebro Maleu\06-Claude Code\Tienda - Reglas de stock y horarios.md`.
  Releelo antes de tocar nada de stock u horarios.
- **El ERP**: está en `..\maleupedidos.github.io\`.
