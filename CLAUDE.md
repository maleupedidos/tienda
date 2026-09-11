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

## El píxel de Meta (10/9/2026)

Está instalado en `index.html` y los cuatro eventos cuelgan de **`_track`**, la
misma función por la que ya pasaban los de GA4. No se cuelgan de cada botón: de
los cinco caminos que repintan el catálogo, uno se olvidó del stock ese mismo
día, y con seis call sites pasaría igual.

| lo que hace el cliente | evento de Meta | dónde |
|---|---|---|
| entra al catálogo | `ViewContent` | `select_zone` |
| agrega algo | `AddToCart` | los 3 `add_to_cart` (producto, combo, pieza de carne) |
| va al formulario | `InitiateCheckout` | `goToForm` |
| manda el pedido | `Purchase` | `enviarPedido` |

`AddToCart`, `InitiateCheckout` y `Purchase` viajan con **`value` + `currency:
'ARS'`**. Sin moneda, Meta no puede calcular el retorno y el número queda mudo.

> [!important] El `eventID` del Purchase es el `clientOrderId`
> El mismo con el que el backend deduplica un reintento. Hoy no hace falta
> —sólo manda el navegador—, pero el día que el ERP mande la compra por la API
> de Conversiones, Meta reconoce que es **el mismo hecho** y no cuenta la venta
> dos veces. Ponerlo ahora es gratis; ponerlo después obliga a tocar las dos
> puntas a la vez.

> [!warning] `fbevents.js` va diferido, pero se FUERZA antes de un Purchase
> Se difiere igual que GA4 y por el mismo motivo (pesa, y la tienda arranca en
> un celular con 4G). Se puede, porque el stub es una **cola**: lo encolado se
> manda cuando el script llega.
>
> Pero antes de `InitiateCheckout` y `Purchase` se llama a `_metaForzarCarga()`.
> Sin eso, quien compra rápido se lleva el evento sin enviar: la tienda salta a
> WhatsApp enseguida y una cola pendiente se va con la página. Es justo el
> evento que más importa.

> [!danger] El `<noscript>` va en el BODY, no en el head
> Un `<img>` dentro del `<head>` no está permitido: el parser **cierra el head
> ahí mismo** y manda al body todo lo que venga después. Hoy no hay nada
> después, pero el día que alguien agregue un `<link>` al final del head se le
> iría al body sin que nada lo avise.

### El conjunto 856053897491524 SI recibe eventos web (10/9/2026)

Y esto corrige un diagnostico que estuvo escrito aca **veinte minutos** y era
falso: decia que ese conjunto —el de *WhatsApp Marketing Message Event
Sharing*— no aceptaba eventos de navegador, y mandaba a crear uno nuevo.

**La prueba de que si acepta**, medida contra la API de Meta:

| | antes | despues de mandarle dos hits por `curl` |
|---|---|---|
| `last_fired_time` | `1969-12-31` (nunca) | **`2026-09-10T17:51:31`** |
| eventos registrados | `[]` | **`PageView` 1 · `AddToCart` 1** |

Son exactamente los dos que se le mandaron a mano a
`https://www.facebook.com/tr/?id=856053897491524&ev=...`, que es la misma via
del `<noscript>`. **El conjunto sirve y no hay que crear ninguno.**

> [!danger] Lo que no manda es CHROME HEADLESS, no el pixel
> Desde `--headless=new`, `fbevents.js` carga (v2.9.398), baja el config del
> pixel, se instancia... y **no intenta enviar por ninguna via** — ni `Image`,
> ni `fetch`, ni `sendBeacon`, ni `XHR`, sin un solo warning. Tampoco lo
> arregla apagar `navigator.webdriver`.
>
> O sea que **`_tools/verificar-pixel-red.js` da un falso negativo desde un
> navegador headless**, y no se puede usar para concluir que el pixel no anda.

> [!danger] La leccion, y es sobre el CONTROL — no sobre Meta
> Para descartar que el problema fuera nuestro se armo una pagina de diez
> lineas con el snippet **oficial** de Meta, sin una linea de la tienda. Tampoco
> mandaba, y de ahi salió la conclusion falsa: *"no es el codigo, entonces es
> el dataset"*.
>
> **El control estaba mal armado.** Un control tiene que variar UNA sola cosa, y
> el mio variaba el codigo dejando fijo el entorno — cuando el entorno
> (headless) era justamente la causa. Los dos lados del experimento compartian
> el vicio, asi que la comparacion no podia detectarlo.
>
> Lo destapo mirar el dato desde **otro angulo que no fuera el navegador**:
> preguntarle a la API de Meta si habia recibido algo. Cuando dos caminos
> independientes se contradicen, el que tiene mas piezas en el medio es el
> sospechoso — y un Chrome headless tiene muchas mas que una consulta HTTP.

**Como se verifica de verdad, entonces:** que entre una persona con un telefono
de verdad a `maleu.com.ar`, y despues consultar el conjunto por la API
(`last_fired_time` y los eventos por tipo). Es lo unico que no depende de un
navegador automatizado.

`_tools/verificar-pixel.js` (los 4 eventos y sus parametros) **si sirve desde
headless** y es el que hay que correr ante cualquier cambio: mide como se arma
el evento, no como viaja.

> [!important] Verificado de punta a punta el 10/9/2026 a las 22:11
> Tadeo entro a `maleu.com.ar` desde un telefono de verdad, toco productos y los
> agrego al carrito. El `last_fired_time` del conjunto paso de **21:51:31** —mis
> dos hits de prueba por `curl`— a **22:11:31**, que es el minuto exacto en que
> el entro. **El pixel mide con un navegador de verdad, y lo que no manda es
> Chrome headless.**

> [!warning] El desglose por tipo de evento tarda; `last_fired_time` es inmediato
> `ads_get_dataset_stats` agrega **por hora**, y el bucket de la hora en curso
> puede no existir todavia. Consultado a las 22:14, seguia mostrando solo los dos
> hits de las 21:00 y **nada de la visita de las 22:11** — que ya habia llegado.
>
> O sea que mirar ahi y no ver nada **no prueba que el evento no llego**. Es la
> misma trampa que ya costo una tarde con el headless: el instrumento contesta
> una pregunta distinta de la que uno cree estar haciendo. Para *"¿llego algo?"*
> va `last_fired_time`; para *"¿que llego?"*, los stats, pero recien una hora
> despues.

### La privacidad tuvo que decir la verdad

`privacidad.html` decía *"no cedemos tus datos a terceros con fines
publicitarios"*, y con un píxel instalado eso deja de ser cierto. Se corrigió el
mismo día: Meta entra en la lista de con quién se comparte, y se dice qué recibe
—datos de uso— y qué **no**: nombre, teléfono ni dirección. Eso es verificable
en el código: los eventos mandan `value`, `currency`, `content_ids` y el
`clientOrderId`, nada del formulario.

**No es el tema legal que está en pausa** (ese es CUIT y razón social). Es que
una página publicada no puede mentir por algo que acabamos de instalar nosotros.

## El buscador busca el PRODUCTO, no su descripción (10/9/2026)

Tadeo, desde el celular: *"cuando pongo cor de cordero, en vez de que diga 5 de
36 productos, aunque sea poner los productos que el usuario está tipeando"*. Y
al rato: *"busqué cebolla y me aparecieron 4 productos… el de cordero no
debería, aparece por la descripción"*.

Son dos problemas distintos del mismo renglón, y el segundo es el de fondo.

### Se busca el nombre; la descripción es el respaldo

Cada card guarda **dos** textos (`_busqTextosDeCard`): el **fuerte** —nombre +
categoría— y el **débil** —descripción, porciones y chips—. Se filtra por el
fuerte, y **sólo si no hay ni un resultado** entra el débil.

| | antes | ahora |
|---|---|---|
| `cebolla` | **4** (el sorrentino de cordero entraba por su descripción) | **3**, los que se llaman cebolla |
| `cor` | **8** en 4 categorías | **1**, el cordero |
| `pollo` · `queso` | 3 · 9 | **iguales** |
| `zanahoria` · `apio` | 1 | **1, avisando** que salió de la descripción |

> [!danger] Los CHIPS eran la mitad del ruido, y no se veía venir
> Van del lado débil aunque parezcan etiquetas de producto: son de
> presentación —*"Para 2-3 personas"*, *"600g · 16 unidades"*, *"Lista para
> cortar y servir"*—. **Ese último metía las TRES tortas en una búsqueda de
> "cor"**, por la palabra *cortar*. Sacar sólo la descripción no alcanzaba.

> [!important] El respaldo existe para no mentir por omisión
> Sin él, buscar `zanahoria` o `apio` daría *"no encontramos nada"* sobre un
> producto que **sí** los lleva. Con él aparece, y el renglón dice **"1 por la
> descripción"** en naranja: `cebolla` y `zanahoria` devolverían listas que se
> leen igual y significan cosas distintas.

### El renglón de abajo: cuántos y qué hacer con ellos

```
3 productos coinciden con tu búsqueda              Limpiar
Seguí bajando para pedirlos ↓
```

> [!important] Tuvo chips con el nombre de cada resultado, y duraron una hora
> Se hicieron a pedido de Tadeo —*"en vez de que diga 5 de 36 productos, aunque
> sea poner los productos que el usuario está tipeando"*— y los dio de baja el
> mismo día: *"abortalo, que solo aparezca 3 de 36 productos coinciden con tu
> búsqueda, continuá bajando para pedir"*.
>
> **Y tiene razón de fondo:** `_busqAcomodarScroll` ya deja el primer resultado
> justo debajo de la barra, así que los productos **ya están a la vista**.
> Nombrarlos arriba era decir dos veces lo mismo, a cambio de 140 líneas de
> código (acortar el nombre sin perder de qué producto se habla, desambiguar
> los que chocaban, emparejar por categoría, el salto a la card, el destello).
> Se borraron las 140.
>
> Lo que sí faltaba era **la segunda línea**: un número solo no dice qué hacer
> con él.

> [!important] Y un rato después se fue también el total del catálogo
> Tadeo: *"no me gusta que diga de 36 productos. Prefiero que diga por ejemplo
> 5 productos coinciden con tu búsqueda"*. El total **no es lo que uno vino a
> buscar**, y obliga a restar de cabeza para saber cuántos quedaron afuera.

> [!danger] "con tu búsqueda" entra SÓLO desde que se fue el "de 36"
> Esa cola se había sacado unas horas antes justamente porque partía el renglón
> en dos y **la barra pegada subía de 47 a 62px**. Con las dos cosas juntas el
> texto medía 43 caracteres; ahora mide **37**, o sea más que los 27 de la
> versión sin cola, pero menos que los 43 que no entraban.
>
> **Medido a 390px: un renglón, 47px** — el mismo alto de siempre, porque
> «Limpiar» ya ocupaba 44 y el texto entra adentro. No cuesta un solo píxel.
>
> Si se toca el texto **se vuelve a medir**: dos renglones suben la barra 15px,
> y `_busqAcomodarScroll` calcula el tope del scroll con ese alto ya puesto.

Singular y plural se dicen bien (*coincide* / *coinciden*), y sin resultados no
aparece la invitación a bajar — no hay adónde.

## Las fotos de los 5 cortes de carne (10/9/2026)

> [!warning] Son **generadas con IA**, no fotos del producto real
> Las hizo Tadeo con ChatGPT. No hay problema de derechos — son suyas — pero
> **la pieza que se ve no es la que el cliente recibe**, y en una tienda de
> alimentos eso importa: la carne se vende envasada al vacío y estas se ven
> sueltas sobre mármol.
>
> **Quedan hasta que Lucas fotografíe un paquete de cada gusto**, que es lo que
> acordaron el 10/9/2026 a la noche. Cuando lleguen, se reemplazan y este bloque
> se borra.

| corte | foto |
|---|---|
| Entraña | `carne-entrana.jpg` — muestra las 2 tiras, que es lo que dice su chip |
| Vacío | `carne-vacio.jpg` |
| Colita, Lomo, Picaña | **`carne-cortes.jpg`, la misma para los tres** |

Hasta ese día **los cinco compartían `carne-cortes.jpg`**, así que en el
catálogo se veían todos iguales.

> [!tip] Se generan a 16:9, y no es un gusto
> `.carne-card .product-thumb` tiene `aspect-ratio:16/9` en el celular — que es
> donde compra el 100% de los clientes — con `object-fit:cover`. Una foto
> vertical se recorta a una franja del medio y pierde las puntas de la pieza.
> El script que las preparó está en el scratchpad (`fotos_carne.py`): recorte
> centrado a 16:9, 1100x619, y la calidad más alta que entre por debajo de
> 100 KB, como el resto de `img/`.

> [!danger] Una foto nueva hay que sellarla en `IMG_V`
> El `?v=` de cada imagen sale de ese mapa, entre los anclajes `IMG_V:INICIO` y
> `IMG_V:FIN` de `app.js`, y lo genera `python _tools/cachebuster.py`. Sin
> sellarla la foto se sirve **sin** `?v=`: hoy no molesta porque el archivo es
> nuevo, pero el día que se reemplace por la foto real, el navegador del
> cliente seguiría mostrando la vieja hasta 4 horas.

> [!note] Al publicar, el `app.js` sale antes que las imágenes
> Medido el 10/9/2026: el catálogo nuevo estaba a los **45 segundos** y las dos
> fotos recién a los **3 minutos**. En esa ventana las cards apuntan a un 404 y
> el `onerror` las deja sin imagen. Se pasa solo; no hay que tocar nada.

## La tienda se comporta como una app, no como un documento (10/9/2026)

### El fondo se queda quieto

Tadeo: *"cuando pongo ver pedido… lo que está atrás debería estar estable y
fijo, y no se debería poder scrollear"*.

> [!danger] Había DOS mecanismos y sólo uno funciona en el iPhone
> | quién | usaba | ¿frena en iOS? |
> |---|---|---|
> | modal de zona | clase `modal-open` (html + body + `touch-action:none`) | **sí** |
> | **carrito**, combo, envío, menú | `body.style.overflow='hidden'` | **no** |
>
> Safari en iOS **ignora** `overflow:hidden` sobre el body. Por eso se notaba
> justo en el carrito, que es el que más se abre. Y el comentario del menú
> lateral decía que arreglaba el scroll de atrás — no lo arreglaba.

Hoy hay una sola puerta, **`_fondoQuieto(quien, bloquear)`**, y la usan los
cinco. Lleva **la cuenta de quién lo pidió, con nombre**, no un contador ni un
booleano: los paneles se superponen (desde el carrito se va al formulario y
encima aparece el overlay de envío) y hay cierres que corren sin que ese panel
estuviera abierto. Con un contador, ese cierre de más le devolvería el scroll al
fondo con otro panel todavía abierto.

> [!danger] Al unificarlo apareció un bug PEOR que el original
> Con `html.modal-open{height:100%}` el documento se recorta y el navegador
> **clampea el scroll a 0**: abrías el carrito mirando la mitad del catálogo, lo
> cerrabas, y aparecías arriba de todo. Medido: 1200 → **0**.
>
> No se veía antes porque el único que usaba esa clase era el modal de zona, que
> sale al abrir la tienda, **con el scroll ya en 0**. El `height:100%` queda sólo
> en el body; sin él en el html, la posición se conserva exacta (1200 → 1200).

Y `touch-action:none` apaga el dedo en **toda** la página, así que hay que
volver a prenderlo adentro de cada panel (`pan-y`) o el carrito largo queda sin
poder scrollearse. `overscroll-behavior:contain` es la otra mitad: sin eso, al
llegar al final del panel el scroll se pasa al fondo.

### La interfaz no se selecciona; el alias sí

Tadeo: *"manteniendo una palabra puedo seleccionar y copiar, y eso en una tienda
online no se puede"*. Lo que se siente mal es concreto: mantener el dedo sobre
un botón pinta todo de azul y salta el menú *Copiar / Buscar / Compartir*.
`-webkit-touch-callout:none` es la mitad que más se nota en el iPhone.

> [!danger] NO se bloquea todo, y no es por descuido
> La tienda le dice al cliente **"Copiá el alias, mandá el pedido y transferí
> desde tu app"**. Si la selección se bloquea ahí y el botón Copiar falla
> (`navigator.clipboard` puede fallar y el código no lo cubre), **el cliente se
> queda sin poder pagar**. El alias y los campos del formulario quedan
> seleccionables a propósito.

Y cuelga de `body.tienda`, **no de `body` a secas**: `styles.css` lo comparten
las 9 páginas, y en las de texto (términos, privacidad, preguntas) impedir
copiar sería hostil.

### El zoom ya estaba resuelto — y bloquearlo sería un retroceso

Tadeo también pidió *"tampoco debería poder hacer zoom"*. **La causa real ya se
había arreglado esa misma mañana**: iOS hace zoom solo al enfocar un campo con
`font-size < 16px`, y por eso el buscador pasó a 16px. Verificado el 10/9 a la
noche: de los **19 campos, los 17 de texto miden 16px o más**; los 2 menores son
`radio`, que no disparan zoom.

**No se bloqueó el pinch**, y está anotado desde el 19/8/2026 en el `<head>`: le
saca al cliente que necesita agrandar la letra la única forma de leer. El
problema que se sentía era el otro, y ya no está.

### La red: `node _tools/verificar-paneles.js`

**45 chequeos** a 390px — el fondo quieto panel por panel, la superposición, el
scroll adentro del panel, la selección de texto, y el buscador (que busque el
nombre, y que su renglón entre en una línea).

> [!danger] La rueda de una compu NO puede reproducir el bug de iOS
> En escritorio el que frena es `overflow:hidden`; en el iPhone es
> `touch-action:none`. O sea que un verde en la prueba de la rueda **convive
> perfectamente con el fondo scrolleándose en el teléfono de Tadeo**. Por eso el
> test mide `touch-action` directo sobre la propiedad, además de la rueda.

> [!important] El control no es opcional
> Si la rueda no mueve el fondo **ni siquiera sin panel abierto**, entonces "el
> fondo no se movió" no prueba nada: prueba que el instrumento no sabe
> scrollear. El test **corta** en ese caso en vez de dar verde. Ya pasó una vez
> en el ERP con `page.mouse.wheel`.

Probado en las dos direcciones, con los tres bugs reinyectados — **los tres se
agarran**, y el tercero reproduce el síntoma exacto que reportó Tadeo:
*"cebolla trae 4"* con el sorrentino de cordero adentro.

## Escaneo general de la tienda (11/9/2026)

Tadeo, yéndose a dormir: *"Escaneo general de la tienda. Tanto para computadora
como para celular. Ajustar cada cosa que sientas que hay trabas o fallas. Si ves
alguna mejora, implementala"*.

### Lo que está sano — no volver a auditarlo sin motivo

| Qué | Resultado |
|---|---|
| Las **12 redes** del repo | verdes a 390 y 1440px |
| **Errores de consola** en todo el camino del cliente | **0 excepciones** |
| El flujo entero | agregar · combo · carrito · formulario · WhatsApp, sin una traba |
| Accesibilidad | 0 imágenes sin `alt`, 0 campos sin nombre, 0 botones mudos, `lang="es"` |
| **Foco de teclado** | anda: **todos** los controles muestran `:focus-visible` con Tab |
| **CLS de la carga** | **0** con 4G simulado (Google pide ≤ 0,1) |
| Peso de las fotos | ninguna pasa el tope de 160 KB que fija `verificar-imagenes.js` |
| Links internos | 0 rotos entre las 9 páginas |

### Lo que se arregló

| Qué | Antes | Ahora |
|---|---|---|
| **El foco al validar el formulario** | te llevaba al campo que falta y ahí te soltaba | queda el foco puesto: se escribe derecho |
| **Los controles del combo** | 34px (cerrar, y cada opción de gusto) | **44px**, el mismo mínimo que `.add-btn` |
| **La home no tenía `h1`** | era la única de las 9 sin encabezado principal | el título del hero, **sin cambiar cómo se ve** |
| **Compartir por WhatsApp** | sólo `index.html` tenía `og:image` y `canonical` | las **9** páginas |
| **Contraste de los grises** | `#888` 3,55 · `#999` 2,85 · `#8a8a8a` 3,45 | **24 reglas** arriba de 4,5 |
| Un encabezado saltado | `h2` → `h4` en «Resumen» | `h3` |

> [!important] Los grises que se tocaron son NEUTROS, y los de marca NO
> Se subieron `#888`, `#999`, `#8a8a8a`, y dos controles que casi no se veían
> (`.summary-empty` en #bbb, la × del newsletter en #ccc). Ninguna de esas
> reglas declara fondo propio —todas heredan blanco o crema—, así que
> oscurecerlas no podía empeorar ningún caso.
>
> **No se tocó el precio viejo tachado** (`.combo-price-old`, #bbb): va apagado
> a propósito y además tachado, se entiende sin leerlo.

### Lo que NO se tocó, y por qué — leer esto antes de "arreglar el contraste"

> [!danger] El naranja de marca da 2,72 y NO es un bug que haya que arreglar
> `--orange #F07D47` con texto blanco —el botón «+ Agregar», «Armar mi pedido»,
> el chip de categoría activo— da **2,72**, por debajo del 4,5 de WCAG. Lo mismo
> el naranja sobre crema (2,22) y las chapitas `#E65100` sobre `#FFF3E0` (3,46).
>
> **Es la identidad de Maleu y la decide el manual de marca, no un escaneo.**
> Cambiar `--orange` mueve la tienda entera. Si algún día se toca, es una
> decisión de Tadeo con Juani Peña delante, no un arreglo al pasar.

> [!warning] Y tres "hallazgos" del escaneo eran del instrumento, no de la tienda
> · **Contraste 1,0 y 1,16** en `.cat-tile-name`, `.cat-tile-count` y el chip
>   «🎁 Combos»: es texto blanco sobre **imagen** y sobre **gradiente**. Medir el
>   contraste subiendo por el DOM a buscar `background-color` no ve ese fondo y
>   da un falso positivo. Se comprobó mirando la captura: se leen perfecto.
> · **"Los controles no tienen foco visible"**: Chrome dibuja el anillo sólo con
>   `:focus-visible`, o sea con **teclado**. Un `.focus()` desde JS no lo dispara.
>   Con Tab de verdad: **ninguno sin anillo**.
> · **CLS 0,321**: el salto ocurre al **elegir zona**, y los shifts dentro de los
>   500 ms de una interacción no cuentan. Un click programático **no marca**
>   `hadRecentInput`, así que le atribuía a la carga un salto que dispara el
>   usuario. Medido por tramos: la carga es **0**.

> [!note] Dos cosas medidas que se dejan como están
> · **771 KB de fotos se bajan antes de elegir zona**, mientras el cliente mira el
>   modal. Suena a desperdicio y es lo contrario: son las primeras cards, iguales
>   en todas las zonas, así que cuando elige ya están. Diferirlas haría aparecer
>   el catálogo sin fotos.
> · **El logo se pide 6 veces sin `loading=lazy`** — es el mismo archivo: el
>   navegador lo baja una sola vez.

### La red nueva: `node _tools/verificar-formulario.js [ancho]`

Es el último paso de la compra y **no lo miraba nada**: `verificar-pedido.js`
comprueba que el pedido armado llegue bien al backend, no que la tienda frene el
que está a medias. Falla en las dos direcciones — si valida de más, un cliente
que quiere comprar no puede; si valida de menos, entra un pedido sin nombre, sin
lote o sin día y no hay a quién entregárselo.

Prueba los tres estados: carrito vacío · con productos y sin datos · completo.

> [!danger] Tres trampas de medición, las tres pisadas al escribirlo
> · **El pedido sale por DOS vías**: `sendBeacon` (que sobrevive al redirect) y
>   `fetch`. Mirar sólo `fetch` dice *"no manda"* sobre un pedido que sí salió.
> · **Al enviar, la página NAVEGA a WhatsApp** y se lleva puesto cualquier
>   `window.__loQueSea` donde uno venía anotando. Por eso los POST se capturan
>   por CDP, fuera de la página — que es exactamente la razón por la que el
>   código usa `sendBeacon`.
> · **El día no es un `<select>`**: `f-dia` es un input hidden y la fecha se
>   elige clickeando una celda. Y las celdas se marcan `.available` / `.past` /
>   `.unavailable` — **no existe `.disabled`**, así que un `:not(.disabled)`
>   agarra un día pasado, el click no hace nada, y el test culpa al formulario.

### El test de Analytics medía su propia impaciencia

Estaba en **rojo** y la tienda no tenía nada: dormía **1500 ms** fijos esperando
el pageview, y el hit tarda **~5,2 s** desde el toque — lo que manda no es la
tienda sino la descarga de `gtag/js`, 172 KB, desde Google. La otra rama dormía
5000 para algo que tarda 5100: estaba a un mal día de red de volverse
intermitente.

Ahora **espera al hit** y dice cuánto tardó (1668 ms solo · 5204 ms con toque).

> [!tip] Cuando un test falla sobre código que no tocaste, sospechá del test
> Es la lección que ya está escrita tres veces en el CLAUDE.md del ERP, y en este
> escaneo aparecieron **cinco** casos: el de Analytics, el contraste sobre
> gradiente, el foco con `.focus()`, el CLS con click programático, y un servidor
> de prueba que devolvía 404 en todo porque comparaba rutas de Windows con
> barras normales contra `path.join`, que las normaliza a `\`.

## La carne de la tanda anterior va primero, y en oferta (11/9/2026)

Lucas, por Tadeo: *"si un cliente nos quiere pedir entraña, no darle la que
vamos a recibir hoy: entregarle la de la semana pasada"*. La carne fresca dura
**dos semanas** desde que llega y cada semana entra una tanda nueva, así que la
vieja tiene que salir primero. La idea: que se vea como primera opción, con el
precio de lista tachado y uno más bajo al lado.

**La tienda no decide nada de esto: lo manda el backend** en `piezas_full`, con
dos campos opcionales por pieza.

| campo | qué es | qué hace la tienda |
|---|---|---|
| `v:1` | la pieza **no es de la última tanda** de su corte | la pone **primera** |
| `of:5` | el **%** de oferta de esa pieza | tachado + precio con el %, chapita **5% OFF**, y **Oferta** sobre la foto |

```
{ "CVa": [{"id":"P-0002","kg":1.064,"v":1,"of":5}, {"id":"P-0007","kg":1.1}] }
```

> [!important] Sin `v` ni `of` la tienda queda EXACTAMENTE como antes
> Es como responde el backend hasta que publique su parte: por eso esto se
> publicó antes y no rompe nada. El día que el ERP mande los campos, la oferta
> aparece sola. Lo verifica el escenario 1 de `verificar-oferta.js`.

**Por qué la regla vive del otro lado:** es el backend el que sabe de cuándo es
cada pieza y cuánto costó —la tienda es pública y no puede saber el costo—, y el
que tiene la palanca en Config_Maleu. Una regla escrita en los dos lados se
despega.

> [!danger] La oferta SE SUMA al 10% de efectivo, y por eso necesita un piso
> Si no se sumara, al que paga en efectivo le convendría la pieza **nueva**
> (10% contra 5%) y la oferta empujaría al revés de lo que se quiere.
>
> Pero sumada, dos cortes quedan abajo del costo: con el 10% la entraña ya deja
> **2%** y el lomo **4%** (anotado en `descontableSubtotal`). Por eso el backend
> topea el % para que la pieza nunca quede abajo del costo **ni pagando en
> efectivo**, y si el tope da menos de 2% no manda `of`: la pieza va primera
> igual (por `v`), sin tachado. Al 11/9/2026 eso deja **la entraña sin oferta**
> —justo el corte que nombró Lucas—, el lomo en 4% y el resto en 5%.

**Lo que viaja en el pedido:** el precio con oferta ya va adentro de `importe` y
de `subtotalSinDescuento`, así que el backend no recalcula nada. Aparte, el item
de carne lleva `ofertas: {"P-0002": 5}` para poder medir si la oferta movió la
tanda vieja — **aparte de `piezas`**, que el backend lee como lista de ids y no
puede cambiar de forma.

**El precio queda fijo al elegir la pieza.** Si el catálogo se refresca y el %
cambia, al cliente se le respeta el que vio. La firma de `_piezasFirma` lleva la
oferta adentro: si sólo cambia el % en Config_Maleu, las piezas no cambian de id
ni de peso, y sin eso el catálogo seguiría mostrando el precio de antes.

**Un `of` que no es un entero entre 1 y 50 se ignora.** Un 90 por un tipeo en la
planilla vendería la carne al 10%.

### La red: `node _tools/verificar-oferta.js [ancho]`

**44 chequeos** en seis escenarios —como responde el ERP hoy, con oferta, al
elegir la pieza, si cambia el %, el pedido que viaja y el mensaje de WhatsApp, y
un `of` basura—, verdes a 390 y 1440px. Probada en la dirección contraria con
cuatro bugs reinyectados (ordenar sólo por peso, la firma sin la oferta, no
validar el %, el carrito a precio de lista): **los cuatro se agarran**.

> [!warning] Lo que falta es del lado del ERP
> `piezas_full` todavía no manda `v` ni `of`. El prompt para la sesión Backend se
> armó el 11/9/2026 con el contrato completo: la tanda es el **día de la
> col Recibida** (no "7 días", porque las 5 primeras piezas tienen Recibida =
> 10/9, el día que se cargaron, no el que llegaron), el % en
> **`CARNE_OFERTA_PCT`** de Config_Maleu (default 5) y el piso contra el costo.

## Un pedido se da por registrado SOLO cuando el ERP lo confirma (11/9/2026)

Tadeo: *"nos hacen un pedido, nos llega el mensaje por WhatsApp, y en el ERP
no aparece... un negocio funciona cuando vende, y si tenemos fallas en el flujo
de ventas estamos cagados"*. Un pedido de **$84.600 del 10/9** le llegó por
WhatsApp y **nunca llegó a la planilla**: ni una fila en `Log Pedidos` (que
anota hasta los reintentos repetidos) ni en `Log Errores`. O sea que el POST no
llegó ni a ejecutarse en el backend. Se cargó a mano el 11/9/2026: es el
**Home N° 933**. Se cargó como entregado por error (sólo se había confirmado que no estaba cobrado) y esa misma tarde se volvió a pendiente, con el stock devuelto al freezer: se entrega el 11/9.

> [!danger] La causa: la tienda mandaba a WhatsApp SIN confirmación, siempre
> El flujo viejo (21/06/26) mandaba al cliente a WhatsApp a los **3,8 s** si
> `navigator.sendBeacon()` devolvía `true`. Pero `true` sólo quiere decir **"el
> navegador lo puso en la cola"**, no "llegó". Y como Apps Script tarda **como
> mínimo ~5 s** en contestar, la confirmación real por `fetch` no llegaba
> **nunca** dentro de los 3 s: **el 100% de los pedidos salía por el camino
> optimista.** Medido en `Log Pedidos`: el primer registro de cada pedido llega
> a los ~6 s del click.
>
> Si el beacon no salía —mala señal, o el navegador cerrado al saltar a
> WhatsApp—, el pedido se perdía **sin un error en ningún lado**. Y el mensaje
> le llegaba igual a Maleu: **WhatsApp guarda y reenvía aunque no haya señal**,
> el navegador no.

**Cuánto pasa, medido** cruzando cada mensaje *"Hola! Quiero hacer un pedido:"*
que entró por WATI (284 desde el 15/5/2026) contra las 4 hojas y `Log Pedidos`:

| | |
|---|---|
| Desde que existe `Log Pedidos` (31/8) | **21 pedidos de la tienda, 1 no llegó** — el del 10/9 |
| Los otros 3 que "no aparecían" | **sí están**: el teléfono del formulario venía con **15 en vez de 11** |
| Antes del 31/8 | no se puede separar un POST perdido de uno cargado a mano; hay 3 candidatos en 3 meses |

### El flujo nuevo

| cuándo | qué pasa |
|---|---|
| al tocar | **un solo POST por `fetch`** — "Registrando tu pedido…" |
| ~7-9 s | el ERP contesta `{ok:true}` → **"¡Pedido registrado!"** → WhatsApp con el mensaje normal |
| 8 s sin respuesta | *"La conexión está lenta. Seguimos intentando…"* |
| 25 s sin respuesta | **"Todavía no se registró"** + botón *Mandar por WhatsApp* |
| si confirma con ese cartel puesto | sigue solo por el camino normal |

**El mensaje de WhatsApp ahora lleva siempre el día de entrega y una
referencia** (`📅 Viernes 12/09 · 19 a 21 hs` y `_Pedido web · K3P9Q_`). La
referencia son 5 caracteres del `clientOrderId`, así que **se busca en la col H
de `Log Pedidos`** — sin depender del teléfono, que viene mal tipeado seguido.
La primera línea no se tocó: si alguna regla de WATI la busca tal cual, se
rompería sin avisar.

> [!important] Si llega un WhatsApp con "⚠️ La web no llegó a confirmar este pedido"
> Es el del botón de los 25 s. Trae **nombre, teléfono, dirección, día y pago**
> para cargarlo a mano. **Primero buscalo en el ERP** (por nombre o por la
> referencia): la tienda sigue reintentando, así que puede haber entrado solo
> un rato después. Si no está, se carga desde la tab AUTOPEDIDO.

**Reintentos, rehechos:** un solo POST en vuelo por pedido, tope de **30 s** por
intento (el lock de `doPost` espera hasta 30 s: abortar a los 12, como antes, no
cancela nada en el servidor, sólo fabrica otro reintento) y espera de 2, 4, 8,
15 s… **El beacon quedó como último recurso**: sólo cuando la página se va con
un pedido sin confirmar, y nunca cuenta como confirmación.

> [!warning] Antes, un pedido llegaba hasta 18 veces al backend
> Cada reintento disparaba un beacon **más** un fetch, y el intervalo de 30 s
> arrancaba otra cadena encima de la que ya corría. Un pedido del 11/9 entró
> **18 veces** a Apps Script en 17 minutos, y cada una toma el lock de `doPost`
> que usa **todo el ERP**. Ahora es 1 por pedido (2 si la página se va antes de
> confirmar).

### La red: `node _tools/verificar-envio.js [ancho]`

Seis escenarios con el backend **simulado** —confirma a los 6 s, tarda 12, no
contesta nunca, dos `{ok:false}`, dos fallas de red, confirma a los 27 s con el
cartel ya puesto—, **37 chequeos** verdes a 390 y 1440px. Corrido contra el
código viejo da **16 mal**: con el backend colgado, a los 3,8 s mandaba al
cliente a WhatsApp como si estuviera registrado.

> [!danger] Ningún test puede meter un pedido en la planilla
> El 11/9/2026 entró *"Prueba Escaneo"* a la hoja Home desde un script que
> cortaba los POST **adentro de la página** (`Runtime.evaluate`): la página
> recargó, la tienda reintentó el pedido que había quedado en `localStorage`, y
> ese reintento salió de verdad. Por eso este test tiene **dos seguros**:
>
> · corta todo POST al backend **por CDP** (`Fetch`), fuera de la página y desde
>   antes de la primera navegación;
> · y sirve `app.js` con la URL del backend **cambiada por una que no existe**:
>   si algo se escapara, Google contesta 404 y no escribe nada.
>
> `verificar-pedido.js` y `verificar-pixel.js` cortan adentro de la página pero
> con `Page.addScriptToEvaluateOnNewDocument`, que se reinstala en cada recarga
> antes de que arranque la tienda: esos son seguros.

**Y `verificar-llamadas.js` aprendió los parámetros**: un callback que llega por
parámetro (`function (alTocar) { alTocar(); }`) se marcaba como llamada a algo
inexistente. Probado en la dirección contraria: sigue agarrando `updateCart()`.

> [!note] Lo que se le pidió al ERP el 11/9/2026
> · **Resuelto ese mismo día (backend @576):** el dedup marcaba el pedido como
>   visto ANTES de guardarlo, así que si `_doPostHome` reventaba, los reintentos
>   recibían `{ok:true, dedup:true}` y la tienda lo daba por confirmado. Ahora se
>   marca después de guardar. La contracara, aceptada a propósito: si algo
>   revienta DESPUÉS de escribir la fila, el reintento la duplica. Un duplicado
>   se ve y se borra; un pedido perdido no se ve.
> · **Pendiente, lo tiene Backend:** una alarma que no dependa del navegador
>   del cliente: cada mensaje de la
>   tienda que entra por WATI tiene que tener su fila en `Log Pedidos` (se cruza
>   por la referencia). Si a los 15 minutos no la tiene, avisar. Es lo único
>   que agarra un pedido perdido **por cualquier causa**, incluidas las que la
>   tienda no puede ver.

## Lo que NO está acá

- **Las reglas de la tienda** (stock, cutoffs, zonas, días de entrega): están en
  `Cerebro Maleu\06-Claude Code\Tienda - Reglas de stock y horarios.md`.
  Releelo antes de tocar nada de stock u horarios.
- **El ERP**: está en `..\maleupedidos.github.io\`.
