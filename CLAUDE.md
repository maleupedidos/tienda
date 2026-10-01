# Contexto — la tienda online de Maleu

> [!danger] Este archivo NO se publica, y por eso puede decir cosas de adentro
> Hasta el 28/9/2026 `https://maleu.com.ar/CLAUDE.md` devolvía **200**: GitHub
> Pages sirve el repo entero, así que el manual interno de la tienda estaba en
> internet, con `robots.txt` diciendo `Allow: /`. Adentro había **nombres y
> apellidos de clientas con el monto de su pedido**, los **márgenes** de dos
> cortes de carne y el proveedor por su nombre — justo lo que la regla del repo
> prohíbe. Lo saca `_config.yml` (`exclude`), que es el mismo mecanismo por el
> que `_tools/` nunca se publicó.
>
> **Si agregás un archivo interno, va con guión bajo adelante o entra al
> `exclude`.** Y comprobalo contra la URL viva: que el repo sea público no es lo
> mismo que estar servido en el dominio de la marca e indexable por Google.
>
> Lo que ya se escribió sigue en la historia de git, que también es pública. Por
> eso acá no van nombres de clientes, costos ni márgenes: se nombra el hecho y
> el número se busca en el ERP.

> Se carga en toda sesión que arranque acá adentro, encima del de [Maleu](../CLAUDE.md).
> **Creado el 25/8/2026**, el día que la tienda se separó del ERP.

Este repo es **la tienda online y nada más**. Es lo único que ve un cliente.
Publica en **https://maleu.com.ar** (GitHub Pages + dominio propio).

> [!warning] Lo que publica es `main`, y la rama local `main` está MUY atrás (23/9/2026)
> Medido ese día: la rama local era **`tienda-v2`** y **`main` local estaba 40 commits
> atrás de `origin/main`**, que es la que sirve GitHub Pages. Hay seis ramas locales
> vivas (`carne`, `carne-rangos`, `reserva-carne`, `respaldo-autopedido`,
> `tienda-v2`, `main`): no asumas en cuál estás parado.
>
> **Git NO deja publicar la vieja por accidente** — comprobado con
> `git push --dry-run origin main:main` ese mismo día: sale
> `! [rejected] main -> main (non-fast-forward)`. Lo que hay que cuidar es lo que
> viene DESPUÉS del rechazo: resolverlo con `--force` sí publica la tienda vieja.
> Si un push rebota así, **nunca forzar**: `git fetch` y mirar qué te falta.
>
> Lo que sí pasa en silencio es trabajar sobre una rama atrasada creyendo que es lo
> que está publicado: probás contra un catálogo de hace semanas y todo "anda bien".
>
> **Pushear siempre con `git push origin HEAD:main`**, que manda lo que tenés
> trabajado a la rama que publica, sin depender de en qué rama estés parado. Y antes,
> `git fetch` + `git log --oneline HEAD..origin/main`: si eso devuelve algo, te falta
> lo publicado y todavía no estás para pushear.

> [!warning] Este repo suele tener trabajo de OTRA sesión sin commitear
> El 23/9/2026, al publicar la página de Catering, el árbol tenía sin commitear el
> rediseño del modal de zona: **239 líneas de `app.js`**, `index.html` y seis
> `_tools/verificar-*.js`. Terminado, fechado ese mismo día, **y sin publicar**.
>
> Acá no hay `deploy.sh` que frene nada: **el push ES la publicación**. Un
> `git add -A` habría puesto en producción el modal que ve todo el que entra a la
> tienda, sin que nadie lo probara.
>
> **Antes de commitear, mirá `git status` y `git diff` de lo que no escribiste vos.**
> Si hay algo ajeno en un archivo que SÍ tenés que tocar (pasó con `index.html`), se
> puede commitear sólo tu parte sin tocarle el disco al otro: armás el contenido a
> partir de `git show HEAD:<archivo>` con tu cambio encima, y lo ponés en el índice
> con `git hash-object -w` + `git update-index --cacheinfo`.
>
> Y si tenés que destrabar el árbol para rebasear, **copiá los archivos ajenos antes**
> (al scratchpad, nunca al lado del archivo). El `stash`/`pop` los devuelve enteros
> pero convertidos a CRLF, así que comparalos ignorando el fin de línea antes de
> asustarte.

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
| `node _tools/diagnostico-vivo.js` | recorre maleu.com.ar como una persona (escribe su barrio en el buscador) y reporta que hay publicado: el `?v=`, el catalogo, el interruptor del cierre, el stock del ERP, las fechas de entrega y las excepciones. Solo lectura. **Reescrito el 29/9/2026**: lo de antes medía `?autopedido=1`, eliminado el 8/9 |

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
> que un cliente de Estancias no podía pedir hoy están en su catálogo, así que el
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

## Las fotos de los 5 cortes de carne (10/9 y 11/9/2026)

| corte | foto | de dónde salió |
|---|---|---|
| Colita | `carne-colita.jpg` | la pasó Tadeo el 11/9/2026 |
| Lomo | `carne-lomo.jpg` | la pasó Tadeo el 11/9/2026 |
| Vacío | `carne-vacio.jpg` | la pasó Tadeo el 11/9/2026: *"un vacío en serio, como la gente"*. Reemplazó a la del 10/9, que no parecía un vacío |
| Entraña | `carne-entrana.jpg` | **generada con IA** el 10/9/2026 — muestra las 2 tiras, que es lo que dice su chip |
| Picaña | `carne-cortes.jpg` | **la genérica**, la misma de la categoría Carnes. Al 11/9 no tiene piezas, así que no se ve |

Hasta el 10/9 **los cinco compartían `carne-cortes.jpg`**, así que en el
catálogo se veían todos iguales.

> [!warning] La de la entraña es **generada con IA**, no el producto real
> La hizo Tadeo con ChatGPT. No hay problema de derechos — es suya — pero **la
> pieza que se ve no es la que el cliente recibe**, y en una tienda de alimentos
> eso importa: la carne se vende envasada al vacío y ésta se ve suelta sobre
> mármol. De las tres del 11/9 no quedó dicho si son fotos propias o generadas.
>
> Lo acordado con Lucas el 10/9/2026 a la noche sigue en pie: **fotografiar un
> paquete de cada corte**. Cuando lleguen, se reemplazan.

> [!tip] Se preparan con `python _tools/fotos-producto.py ORIGEN img/destino.jpg`
> `.carne-card .product-thumb` tiene `aspect-ratio:16/9` en el celular — que es
> donde compra el 100% de los clientes — con `object-fit:cover`. Una foto que no
> es 16:9 se recorta a una franja del medio y pierde las puntas de la pieza.
> El script la deja en 1100x619 y con la calidad más alta que entre por debajo
> de 100 KB, como el resto de `img/`.
>
> **Una foto cuadrada va con `--extender`**: en vez de cortarle las puntas a la
> pieza, agranda el fondo a los costados con el color del borde de cada lado.
> Así se hizo el vacío del 11/9 (1080x1080, con `--filas 90:950` para acercarlo).
> Sirve sólo si el fondo es liso y la pieza no toca los bordes laterales:
> **mirá el resultado antes de publicar**. La primera versión desenfocaba la foto
> entera para el fondo, y a los costados aparecía un fantasma rosado de la carne.

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

## La oferta de la tanda anterior: se probó y se dio de baja (11/9/2026)

Lucas, por Tadeo: *"si un cliente nos quiere pedir entraña, no darle la que
vamos a recibir hoy: entregarle la de la semana pasada"*. Se construyó de los
dos lados: el backend manda en `piezas_full` `v:1` (la pieza no es de la última
tanda) y `of:5` (su % de oferta, topeado contra el costo), y la tienda ponía
esas piezas primero, con el precio de lista tachado y la chapita "Oferta".

Estuvo en producción unas horas del 11/9 —los 4 vacíos del 10/9 al 5%— y Tadeo
la dio de baja esa misma noche: *"te cancelo la idea del descuento a carne
antigua. Pone todo en orden. De menor a mayor"*.

> [!important] Si `v` u `of` vuelven a aparecer, la tienda los IGNORA
> Backend los sacó de `piezas_full` el mismo 11/9 (@580): hoy devuelve sólo
> `{id, kg}`, de menor a mayor, y `_piezasAsignar_` ya no anota la oferta.
> Igual `_piezaDeRespuesta` toma el id y el peso y nada más: el precio de una
> pieza es su peso por el kilo, y su lugar en la lista, su peso. Lo sostiene
> `verificar-piezas.js`, cuyo inventario los trae **a propósito**.

> [!note] Si algún día vuelve, está en el historial de git
> El código y su test (`_tools/verificar-oferta.js`) están hasta el commit
> `e927498`. Dos cosas que ya estaban resueltas y conviene no redescubrir: la
> oferta **se suma** al 10% de efectivo, así que necesita un piso contra el costo
> (con el 10% encima, lo que deja la carne casi desaparece); y el precio tiene que quedar
> fijo al elegir la pieza, aunque el catálogo se refresque con otro %.

## La carne se elige pieza por pieza, en una grilla que se despliega (11/9/2026)

A la tarde del 11/9 se probó elegir la carne por **rango de 200 g**: el cliente
elegía *"1,2 a 1,4 kg"* y quien arma agarraba cualquier pieza de esa bolsa. Se
construyó de los dos lados y esa misma tarde Tadeo y Lucas lo dieron vuelta:
*"si hacemos por rango estaríamos categorizando por precio y perdiendo plata.
Cada peso de pieza tiene un precio distinto"*.

**No llegó a publicarse en la tienda**, y el backend lo sacó de producción
(@579). El contrato quedó el de siempre: `piezas_full` `{id, kg}` —el backend
puede agregar `v`/`of`, que se ignoran, ver arriba— y `piezas: [ids]` en cada
item de carne del pedido.

> [!important] El rango quería resolver dos problemas, y los dos siguen resueltos
> · **Una lista de 25 piezas tapa el catálogo.** Lo resuelve la grilla de abajo.
> · **En el freezer cuesta encontrar la pieza que eligió el cliente.** Desde el
>   ERP v296, ARMADO y RUTA dicen la pieza exacta de cada pedido: *"Carne Vacío ·
>   2 piezas: 1,241 y 1,383 kg"*. Para que eso sirva en el freezer, **cada
>   paquete tiene que llevar su peso escrito** desde que se pesa en RECIBIR CARNE.

**La grilla:**

| | |
|---|---|
| cada pieza | un botón de 56px con el peso grande y el precio abajo, como los talles de una tienda de ropa |
| columnas | `auto-fill` con mínimo 120px: 2 por fila en el celular, 3 en la compu (4 desde 1024px desde el 13/9/2026, con el catálogo a 1100), sin un media query por pantalla |
| con **9 o más** | se ven las primeras 6 y *"Ver las 14 piezas · de 0,950 a 2,140 kg"* despliega el resto |
| con 8 o menos | se ven todas: esconder una o dos detrás de un botón es un toque de más |
| el orden | de la más chica a la más grande. A igual peso decide el id, para que dos piezas iguales no se crucen en cada refresco |
| el resumen | *"Llevás 2 piezas · 3,090 kg · $80.340"* |

- **Lo elegido se ve siempre**, plegada o no: si el cliente elige la de 2,1 kg
  con la lista abierta y la cierra, su pieza no puede desaparecer.
- **El estado vive en `pzDesplegado`, fuera del DOM.** La card se redibuja
  entera al elegir una pieza y con cada refresco del catálogo: guardado en la
  card, cada toque la volvería a plegar.
- **Al plegar, el scroll se corre para que el botón quede bajo el dedo.** Si
  no, con la lista abierta abajo de todo, al cerrarla se aparece en el medio
  del corte siguiente. Ese salto va con `scroll-behavior` apagado: el html lo
  tiene en `smooth`, y animado el botón se iría de abajo del dedo y volvería.
- **Por qué no un `<select>`:** no deja elegir dos piezas, y en el iPhone abre
  una ruedita de números sin precios.

### La red: `node _tools/verificar-piezas.js [ancho]`

**30 chequeos**, verdes a 390 y 1440px:

1. plegado, de la más chica a la más grande aunque el backend mande `v`, y el
   rango de kilos del botón;
2. los bordes: con 9 se pliega, con 8 no, con 3 no;
3. desplegar y elegir con **toques de verdad** (el mouse de Chrome en el centro
   del botón: si algo lo tapa, el toque le cae a otro);
4. la elegida sigue a la vista al plegar, y el botón no se mueve de abajo del dedo;
5. el estado sobrevive a `renderCatalog()`;
6. cada pieza sale peso × kilo y no queda rastro de la oferta, aunque el
   backend mande `of`;
7. cero POST.

Probada en la dirección contraria con bugs reinyectados, uno por vez en una
copia de la tienda: no se pliega nunca, se pliega desde 7, la elegida
desaparece al plegar, el botón se va de abajo del dedo, un redibujo pierde lo
desplegado, vuelve el orden por tanda y vuelve el precio con `of`. **Todos se
agarran.**

> [!warning] Sembrar `maleu_zone` no alcanza para TOCAR la tienda desde un test
> Falta la fecha, y el modal de zona queda abierto encima de todo. La primera
> versión de este test tocaba el calendario creyendo que tocaba una pieza. Los
> tests que llaman funciones no lo notan; uno que toca, sí. Hay que elegir zona
> y fecha como una persona (`ELEGIR_ZONA`, copiado de `verificar-paneles.js`)
> y cortar si el modal sigue abierto.

## La carne aparece al instante: en paralelo y con la copia de la última visita (11/9/2026)

Tadeo: *"cuando cargo la página, tarda 10 segundos en que aparezca la carne
como categoría y como producto"*. Tenía una causa concreta: `stock_full` y
`piezas_full` tardan **~4 s cada una** —el piso de cualquier consulta a Apps
Script— y la tienda las pedía **una detrás de la otra**: `fetchStock` esperaba
el stock y recién después pedía las piezas.

Medido contra el backend real, desde que arranca la página hasta que llegan las
piezas (3 vueltas, `tiempo_carne.js` en el scratchpad):

| | antes (maleu.com.ar) | ahora |
|---|---|---|
| primera visita | **8,9 s** | **5,6 s** |
| vuelve a entrar | **6,9 s** | **0,1 s** |

**En paralelo:** `fetchStock` arranca `_refrescarPiezas()` antes de pedir el
stock y la espera al final. Son dos endpoints distintos y ninguno necesita al
otro; que falle uno no frena al otro.

**La copia:** cada inventario que llega se guarda en `localStorage`
(`maleu_piezas_v1`), y al abrir la tienda la carne se dibuja de ahí antes de
preguntarle nada al backend. Cuando llega el de ahora se reemplaza sola. Importa
más de lo que parece: Carnes es la **tercera** categoría, y cuando aparecía a
los 10 s empujaba para abajo todo lo que el cliente ya estaba mirando.

> [!important] La copia vence a las 12 horas, y una rota se ignora
> La de la semana pasada son piezas que ya no existen: mostrarlas aunque sea
> unos segundos es prometer carne que no hay. Sin copia válida la tienda hace lo
> de siempre, esperar. Si el backend dice que no queda ninguna pieza, la copia se
> borra.

> [!danger] Lo que la copia habilita: elegir una pieza que ya se vendió
> En esos segundos se ve el inventario de la última visita. Si el cliente elige
> una pieza que otro se llevó mientras tanto, cuando llega el de ahora
> `_piezasConciliarCarrito` se la saca del carrito y lo dice: *"La pieza de
> 1,064 kg de Vacío ya se vendió y salió de tu carrito"*.
>
> Y no es sólo por la copia: vale para cada refresco (cada 60 s). Antes, una
> pieza que se vendía mientras el cliente tenía la tienda abierta —otro cliente,
> o Lucas desde el AUTOPEDIDO del ERP, que desde el v298 también la reserva—
> quedaba en su carrito, y el pedido entraba con una pieza que no existe.
>
> **Con un pedido en camino no se toca** (`_enviando`): la pieza que
> "desaparece" es la suya, que el backend acaba de marcar vendida.

### La red: `node _tools/verificar-carga-carne.js [ancho]`

**38 chequeos**, verdes a 390 y 1440px, con el backend contestado desde la
página y con demoras a propósito:

1. primera visita: las piezas se piden junto con el stock y ANTES de que vuelva,
   la carne se ve a los ~2 s de un backend que tarda 2, y queda la copia;
2. con copia: la carne sale sin esperar al backend, ordenada por peso; el
   cliente elige una pieza ya vendida, y cuando llega el inventario de ahora sale
   del carrito, con el aviso, y la copia se actualiza;
3. con un pedido en camino, el carrito no se toca;
4. sin piezas, la copia se borra;
5. una copia de hace 13 horas o rota no se usa;
6. los cortes sin stock (ver abajo): los cinco a la vista con el que hay
   primero, "Sin stock" en la foto y en el cuerpo, en chico, el tile contando
   lo elegible, el buscador encontrándolos; con todo agotado, los cinco; un
   refresco que falla no los borra; y con el backend caído desde el arranque,
   ninguno;
7. cero POST.

Probada en la dirección contraria con 5 bugs reinyectados: las piezas otra vez
después del stock, sin copia, la copia que no vence, el carrito que no se
concilia y el que se concilia con un pedido en camino. **Los 5 se agarran.** Y
el bloque 6, contra la tienda de antes (los cortes sin piezas desaparecían),
falla desde el primer chequeo.

## Los cortes sin stock se muestran, en chico y al final (11/9/2026)

Tadeo: *"si bien ya no hay algunos gustos de carne por no tener stock, estaría
bueno que avisemos"*. Hasta ese día un corte sin piezas **desaparecía**, y se
leía como *"acá no venden colita"*; ahora dice **Sin stock**, que se lee como
*"hoy no hay, vuelvo"*.

| | |
|---|---|
| Dónde va | al final de Carnes: el que entra tiene que ver primero lo que puede comprar |
| Cómo se ve | un renglón (147px a 390, contra 469 de uno con piezas): foto en gris con la chapita **Sin stock**, el nombre, el kilo y *"Sin stock por ahora. Reponemos la carne todas las semanas."* Sin descripción ni chips |
| El tile de Carnes | cuenta lo que se puede elegir (*"3 opciones"*), y con todo agotado dice *"Sin stock"* |
| El buscador | lo encuentra: buscar "picaña" trae la card agotada en vez de *"no encontramos nada"* |

> [!important] Solo cuando SABEMOS que no hay
> `piezasEstado` tiene ahora dos estados que antes eran uno: **`vacio`** (el
> backend contestó y no queda ninguna pieza: se muestran los cinco con "Sin
> stock") y **`sin-datos`** (no se pudo traer: no se muestra ningún corte).
> Afirmar "sin stock" sin haber mirado sería mentir.
>
> Y un refresco que falla **no borra un "Sin stock" que era cierto**: es la misma
> regla que ya protegía las piezas (`_piezasFallo`).

> [!warning] La firma del inventario arranca con "conocido / no"
> De *cargando* a *vacío* las piezas son las mismas —ninguna— pero la pantalla
> cambia. Sin esa marca en `_piezasFirma()`, el catálogo no se repintaba y los
> cortes agotados no aparecían nunca.

**No se promete un día** (*"vuelve el jueves"*): la carne se pide los martes y
llega los jueves, pero no se repone cada corte cada semana, y prometer una fecha
sería prometer por Lucas.

`verificar-navegacion.js` pasó a tener **tres** escenarios: con carne, con toda
la carne agotada (Carnes a la vista) y con el backend caído (Carnes no se
dibuja). Antes el "no se dibuja" era el inventario vacío.

## El 10% por superar $100.000 se dio de baja (11/9/2026)

Tadeo: *"saquemos el 10% off superando los $100.000 porque con la carne ahora es
muy fácil... saquemos ese descuento y tengamos la libertad en AUTOPEDIDO para
armar el descuento que queramos!"*. Con dos piezas de lomo ya se pasa el umbral,
y con el 10% encima la carne casi no deja nada. **El único descuento automático que
queda es el 10% en efectivo** (Home y los ex-Home de Pilar). Los descuentos
puntuales se arman a mano en el AUTOPEDIDO del ERP, que ya tenía % global, % por
categoría y regalo en pesos.

Se fue de los seis lugares donde vivía: el cálculo, su etiqueta, el renglón *"Estás
a $X de tener 10% OFF por superar los $100.000"* del carrito, el chip de la barra
de promo (y su aclaración *"No son acumulables"*, que ya no tiene de qué hablar) y
el cartel del medio de pago, que se escondía arriba de $100.000 y ahora recuerda el
efectivo en cualquier pedido. Las páginas estáticas no lo mencionaban.

> [!danger] El descuento lo recalcula el ERP: la tienda sola no lo puede sacar
> La salvaguarda de `_doPostHome` recalcula el descuento de cada pedido de la
> tienda con su propia regla. Con el umbral sacado solo de este lado, un pedido de
> $120.000 por transferencia se vería a $120.000 y el ERP lo guardaría a $108.000.
> Por eso **se publicó después del backend** (@582, el mismo día), y si el 10% por
> monto volviera algún día, tiene que volver en las dos puntas.

> [!important] Una pestaña vieja no le cobra de más a nadie
> Un cliente puede tener la tienda abierta desde antes del cambio y estar viendo
> todavía el 10%. La regla del ERP (`_descAutoPedido_`) acepta lo que manda la
> tienda **solo si es 0 o el 10% exacto del subtotal**: con eso, el que vio el
> descuento lo paga, y cualquier otro valor se corrige como siempre.
>
> De paso quedó alineado un desfasaje que existía antes: **Pilar en efectivo**.
> La tienda no le da el 10% a esa zona y el ERP se lo forzaba igual, así que
> guardaba 10% menos de lo que el cliente había visto. Ahora cada pantalla guarda
> lo que mostró.

> [!important] Los pedidos cargados antes conservan su descuento
> Al darlo de baja eran **tres** los pedidos reservados con el 10% por monto:
> Home **#931**, **#939** y **#944** (el mayor, de $217.400). El cobro y la
> edición del ERP los respetan — *"el precio que vale es el que ves en la tienda
> al momento de hacer el pedido"*, dicen los términos —, y **no por una fecha de
> corte**: el ERP los reconoce por lo que el pedido tiene guardado (el 10% exacto
> de su subtotal sin ser en efectivo). Si al editarlo el pedido baja de $100.000,
> pierde el descuento, igual que con la regla vieja. Eso lo resolvió Backend.

La red es **`node _tools/verificar-descuento.js [ancho]`**: un carrito de más de
$100.000 con carne, por transferencia (sin descuento en ningún lado, ni la palabra
"100.000"), en efectivo (el 10%), el JSON que se le manda al ERP (descuento 0 y
total = subtotal) y Pilar fuera de los ex-Home. **17 chequeos**, verdes a 390 y
1440px. Contra la tienda de antes da **10 rojos**. Corta todo POST dos veces,
adentro de la página y por CDP.

## Los datos del cliente quedan fijos, y ya no hacía falta pedir para eso (11/9/2026)

Iñaki, el hermano de Tadeo: *"¿hay que completar cada vez que entra a la página
los datos del cliente? La idea era que queden fijos"*. El mecanismo existía
—`loadClientData()` desde el 2026— pero tenía **dos agujeros**, y los dos se
midieron antes de tocar una línea.

> [!danger] 1. Los datos se guardaban SOLO al mandar el pedido
> El que completaba el formulario y no llegaba a enviarlo —porque se puso a
> pensarlo, porque lo interrumpieron, porque el pedido quedó sin confirmar— no
> dejaba nada guardado, y la vez siguiente escribía todo de nuevo. Y es el caso
> más común de todos: alguien que entra a mirar, carga sus datos y cierra.
>
> Ahora se guarda **a medida que se completa cada campo**, en `change` y
> `focusout`. **No en `input`**: guardando en cada tecla, un teléfono a medio
> escribir pisaría el que ya estaba.

> [!danger] 2. Al elegir la zona en el modal, la dirección no volvía
> `loadClientData()` corría **una sola vez**, en el top-level del script. Ahí
> `currentZone` todavía puede no existir —el cliente elige su zona en el modal,
> que es *después*—, y la función tiene un fallback que en ese caso carga solo
> nombre y teléfono (que se guardan aparte del barrio). Resultado medido: el
> nombre y el teléfono volvían, y **barrio, sub-barrio y lote había que
> escribirlos de nuevo teniéndolos guardados a mano**.
>
> Ahora la llama también `applyZone()`, que es el único lugar por el que pasan
> las dos puertas —el arranque con zona guardada y `setZone()` desde el modal—,
> así que una puerta nueva lo hereda sola.

> [!important] `loadClientData()` no pisa NUNCA un campo con algo escrito
> Es lo que la deja llamar más de una vez sin pensar en el orden: en el arranque
> los campos están vacíos y se comporta igual que siempre, y al elegir la zona
> completa lo que falta sin tocar lo que el cliente acaba de tipear. Sin eso,
> llamarla de nuevo le borraría lo escrito al que cambia de zona a mitad de camino.

**El guardado tiene una sola forma.** `guardarDatosCliente()` la usan el guardado
incremental y `enviarPedido` (que le pasa el día y el pago). Dos formas de
guardar el mismo dato es como se despegan — ya pasó cuatro veces en el ERP.

Y **un formulario vacío no se guarda**: pisaría con nada lo que ya había. Pasa al
cambiar de zona, que limpia los campos antes de que el cliente toque algo.

> [!note] El día y el pago siguen sin precargarse, a propósito
> El **pago** cambia en cada pedido y precargarlo sería decidir por el cliente.
> El **día** no se precarga tampoco: el que se ve sale de la fecha que eligió en
> el modal de esta visita, que es la que corresponde — una fecha de entrega vieja
> es justamente lo que no hay que ofrecer.

> [!bug] Con la fecha guardada y vigente, el día quedaba vacío (12/9/2026)
> Si la fecha que el cliente eligió sigue vigente, el modal **no se abre** — y el
> modal era el único que marcaba el día en el formulario. El botón *"Completar
> datos y pedir"* (`expandForm`) lo marcaba; **entrar desde el carrito
> (`goToForm`), no**. Resultado: el chip de arriba decía la fecha y el
> formulario pedía elegir el día otra vez.
>
> Ahora `goToForm` lo marca **sólo si el día está vacío**: elegir otro día en el
> formulario no cambia la fecha del modal, así que marcarlo siempre le pisaría
> lo que eligió al volver del carrito. `verificar-datos-cliente.js` prueba las
> dos cosas (33 chequeos).
>
> Lo destapó un rojo que **dependía del día**: el viernes a la noche la fecha
> guardada ya había pasado, el modal se abría y el test daba verde; el sábado a la
> tarde seguía vigente y daba rojo. Un test que cambia de color según la hora no
> está roto: está mirando algo que sólo pasa a esa hora.

### La red: `node _tools/verificar-datos-cliente.js [ancho]`

**Nada de esto se probaba, y por una razón de método:** todos los tests abren un
perfil de Chrome **nuevo**, así que la segunda visita —que es exactamente lo que
hay que medir— no existía en ninguna red. Este usa **un mismo perfil** para
varias visitas, como un cliente de verdad. **32 chequeos**, verdes a 390 y
1440px, tres corridas seguidas:

1. cliente nuevo: el formulario arranca vacío, completa, manda, y queda guardado;
2. vuelve: nombre, teléfono, barrio privado, sub-barrio y lote vuelven solos;
3. vuelve a elegir la zona en el modal teniendo los datos guardados ← el agujero 2;
4. toca "¿Dónde entregamos?" y reelige: no se pierde lo que ya estaba;
5. **otro navegador: completa y NO manda el pedido** ← el agujero 1, y al volver están todos.

Contra el `app.js` de antes del arreglo da **26 ok · 6 mal**, y los 6 rojos son
los dos agujeros. Se corre con `APP_JS=<ruta>`, que sirve otro `app.js`.

> [!danger] Cerrar Chrome a matarlo pierde el `localStorage`, y el test culpa a la tienda
> El `localStorage` se escribe a disco de forma **asíncrona**: con `proc.kill()`
> las últimas escrituras se pierden a veces, y entonces la visita siguiente lee
> vacío. Pasó: una corrida dio la visita 2 en rojo y la siguiente en verde **con
> el mismo código**, y el rojo parecía el bug que se venía a arreglar. Se cierra
> con `Browser.close` y se espera a que el proceso muera de verdad.

> [!warning] Y el primer rojo de todos fue un selector mío
> `f-barrio-privado` es el **Barrio Privado** (hoy con un solo valor, "Estancias
> del Pilar") y `f-barrio` el **Sub Barrio**, que se llena solo al elegir el
> primero. Puse "Golf" en el primero, la validación frenó el envío, no se guardó
> nada y **los 16 chequeos siguientes salieron en rojo** como si la tienda no
> guardara nada. El sub-barrio ahora se toma del desplegable real, así que el
> test no envejece cuando cambie la lista.

> [!note] Hallazgo de paso, sin tocar: `verificar-paneles` falla 1 de 46 por 25px
> *"al cerrar volvés donde estabas (1225, esperado 1200)"*, y **cambia de panel
> entre corridas** (el carrito una vez, el menú la otra). Verificado contra el
> `app.js` de HEAD: falla igual, o sea que es **preexistente e intermitente**, no
> de este cambio. No se tocó: el pedido era otro.

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

**El mensaje de WhatsApp lleva siempre el día de entrega**
(`Entrega: Viernes 12/09 · 19 a 21 hs`). La primera línea no se tocó: si alguna
regla de WATI la busca tal cual, se rompería sin avisar.

> [!important] La referencia va SOLO en el mensaje sin confirmar (12/9/2026)
> Del 11 al 12/9 el mensaje normal cerraba con `_Pedido web · K3P9Q_`. Tadeo,
> viéndolo llegar: *"eso queda feísimo, ¿por qué dice eso?"*. Tenía razón y
> además **sobraba**: desde el 11/9 un mensaje normal sale **únicamente con el
> pedido ya confirmado por el ERP**, así que no hay nada que cruzar.
>
> La referencia (5 caracteres del `clientOrderId`, se busca en la **col H de
> `Log Pedidos`**) quedó sólo en el mensaje del botón de los 25 s:
> *"⚠️ La web no llegó a confirmar este pedido (ref. K3P9Q)"*. Ahí sí sirve: para
> ver si un reintento lo metió después, sin depender del teléfono, que en el
> formulario viene mal tipeado seguido.

> [!danger] El mensaje no lleva emoji de 4 bytes (📅 📍 🎁 🥩 👤 💵…)
> Medido en WATI el 12/9/2026: de **8 pedidos confirmados** con el mismo código,
> **2 llegaron con `� Sábado 12/09`** y 6 sanos. **Depende del celular del cliente, no del código**: el archivo tenía
> el 📅 bien escrito y `encodeURIComponent` lo codifica bien. En esos mismos
> mensajes rotos, los caracteres simples `·` `•` `—` sí llegaron.
>
> Por eso el mensaje usa texto (`Entrega:`, `Dirección:`, `Pago:`) y viñetas, la
> carne va con la misma `•` que el resto, y el combo en negrita sin 🎁. El ⚠️ se
> queda: es U+26A0, un carácter simple. Ya había pasado con las banderas de los
> combos, y se arregló cambiándolas por 🎁 — que tiene el mismo problema.
>
> `verificar-envio.js` exige **cero caracteres por encima de U+FFFF** en los dos
> mensajes. Si alguna vez se quiere un emoji ahí, el test lo va a frenar, y es
> a propósito: en uno de cada cuatro celulares se ve roto.

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
>   **Al 12/9/2026 la referencia sólo viaja en los mensajes con "⚠️ La web no
>   llegó a confirmar"**, que son los únicos que la alarma tiene que mirar: un
>   mensaje normal sale sólo con el pedido confirmado. Se le avisó a Backend.

## Escaneo del domingo 13/9/2026: lo que las 21 redes no veían

Tadeo: *"escaneá la tienda online y ayudame a detectar bugs, fallas, mejoras.
Acordate que el cliente puede comprar tanto por el celular como por la
computadora"*. **Las 21 redes del repo dieron verde** antes de tocar nada. Todo lo
de abajo lo encontró recorrer maleu.com.ar como un cliente, a 390 y 1440px, un
domingo a las 5 de la mañana — que es justo el momento que ninguna red simulaba.

| Qué | Antes | Ahora |
|---|---|---|
| **Stock negativo del ERP** | Empanadas J&Q vino en −1: la card decía **"Últimas -1 unidades"** con "+ Agregar" prendido | se lee como 0: "Sin stock" |
| **"+ Agregar" sobre algo sin stock** | decía **"✓ agregado" sin agregar nada**, y mandaba un AddToCart a Meta y a GA | no lo agrega, avisa que no hay stock, y no mide nada |
| **"Últimas 1 unidades"** | | "Última unidad" |
| **El cartel del viernes** (Clubes en el hero, Pilar en el modal) | sábado y domingo: *"los pedidos de **este viernes ya cerraron**"* — con el viernes abierto hasta el jueves | dice las fechas: *"pedí hasta el jueves 17/9 a las 12 hs y entrás en el recorrido del viernes 18/9"* |
| **"Tadeo" en la tienda** | la chapita de "Otra zona de Pilar" y *"El vendedor es Tadeo Ustariz"* | "Maleu" y *"Te lo entrega Maleu"* |
| **Copiar el alias** | si el navegador no deja usar el portapapeles, el botón no hacía nada | prueba el método viejo, y si tampoco, lo dice con el alias escrito |
| **El método de pago** | "📲 Mercado Pago", con dos bancos y el alias del vendedor de Pilar | "📲 Transferencia" (el valor que viaja al ERP sigue siendo `Transferencia`) |
| **Los avisos largos** en el celular | `white-space:nowrap`: se salían por los dos costados | parten en dos renglones |
| **El subtítulo del formulario** | centrado y pegado al título | alineado con su título |
| **Los +/− del carrito** a 390px | 26px (la × de una pieza también) | 38px; los de la card, 40 |
| **El catálogo en la compu** | 900px y 3 columnas, con las categorías y "Lo más pedido" a 1100 y 4 | todo a 1100 y 4 |

### Sin stock para esa fecha, pero sí para otra

Un domingo a la mañana, eligiendo **"hoy"**, los cuatro "Lo más pedido" estaban en
gris: el freezer estaba vacío y el cartel decía la verdad. Pero para el viernes se
podía pedir cualquier cosa — entra en la orden de compra del jueves — y la tienda no
lo decía. **El botón gris era un callejón sin salida.**

Ahora, si hay una fecha de entrega más adelante en la que ese producto sí se puede
pedir, el botón la ofrece: **"Pedir para el vie 18"** (en un combo, "Armar para el
vie 18"). Al tocarlo pasa la entrega a esa fecha, agrega el producto y lo dice:
*"✓ Pizza Margarita agregado · tu entrega pasó al viernes 18/9"*.

> [!important] Cambia la fecha de TODO el pedido, y por eso se dice
> El botón nombra la fecha antes de tocarlo y el aviso la repite después, y el chip
> de arriba cambia. Mover la entrega para adelante **nunca achica un tope**: lo que
> ya estaba en el carrito sigue entrando. No te sube arriba de todo — seguís mirando
> el producto. Se mide en Analytics como `fecha_por_stock`.

> [!danger] La fecha sale de las MISMAS funciones que el calendario y el tope
> `_getNextDeliveryDatesGrouped` (lo que ofrece el calendario) y `getStockMode(iso)`
> (el tope para esa fecha). No puede ofrecer un día que el calendario no ofrece.
>
> **`getStockMode` aprendió a recibir una fecha, y llamada sin argumento hace
> exactamente lo mismo que antes.** Importa porque el ERP la saca de este archivo
> (`maleupedidos.github.io/_tools/probar-stock-modo.js`) y la compara con la de la
> tab «+»: corrido después del cambio, **0 diferencias en 8512 combinaciones**. Si
> la tocás, corré ese test.

Un combo se ofrece **solo para una fecha sin tope** (`ilimitado`): calcular si el
stock real o proyectado de cada gusto alcanza para otra fecha sería una segunda
copia de `comboBestMax`.

### El stock que manda el ERP es lo DISPONIBLE, y puede ser negativo

`stock_full.f` es físico menos reservado, así que un pedido reservado sin mercadería
en el freezer da **−1**. No es un dato roto: es una sobreventa. Para el cliente es 0,
y `_stockLimpio()` lo deja así en la única puerta por la que entra el stock
(`fetchStock`). Redondea los kilos al gramo de paso (`3.8900000000000006`).

### La red: `node _tools/verificar-sin-stock.js [ancho]`

**44 chequeos a 390px y 45 a 1440**, con el **reloj congelado** en el domingo
13/9/2026 05:00 — sin eso el resultado dependería del día en que se corre, y el caso
del domingo no se podría probar nunca un martes. El cartel del viernes se prueba en
los seis momentos de la semana moviendo ese reloj.

**Contra la tienda de antes da 34 rojos**, cada uno con el síntoma a la vista
(`"Últimas -1 unidades"`, `"✓ Empanadas Jamón y Queso x8 agregado"`, un aviso que se salía 99px por cada costado,
`"El vendedor es Tadeo Ustariz"`). Se corre con `RAIZ=<carpeta>`.

> [!warning] El test bloquea Analytics y Meta, y no es un detalle
> La primera corrida dio un POST "escapado" que era un hit de **Google Analytics**:
> el test bajaba `gtag` de internet y le sumaba visitas falsas a las métricas reales.
> Ahora `googletagmanager`, `google-analytics` y `facebook` se cortan por CDP; `gtag`
> y `fbq` quedan como colas y los eventos igual se pueden contar. **Las redes viejas
> (`verificar-descuento`, `verificar-envio`…) no lo hacen**: cada corrida suma
> visitas desde 127.0.0.1.

> [!note] Visto y NO tocado, a propósito
> · **El lunes 12/10/2026 es feriado** y el calendario lo ofrece para entregar.
>   **Se deja abierto, a propósito.** Hasta la tarde del 13/9 acá decía que el 1/5
>   "se bloqueó", y era falso: el comentario de `FERIADOS_BLOQUEADOS` en `app.js`
>   dice que ese viernes feriado **se entregó normal** ("es feriado pero buen
>   momento de ventas") y además se sumó una entrega extra el jueves 30/4. El 12/10
>   es el lunes de un fin de semana largo, con la gente en las casas de Estancias:
>   el mismo caso. Si Tadeo decide lo contrario, se agrega a `FERIADOS_BLOQUEADOS`.
> · **La barra pegada arriba ocupa 166px en el celular** (buscador + categorías +
>   la franja del 10%): un cuarto de la pantalla de un iPhone con la barra de Safari.
>   **Resuelto esa misma tarde**: la franja se esconde al bajar. Ver «La franja del 10%
>   se esconde al bajar».
> · En la compu el buscador pegado va de punta a punta mientras el catálogo va a
>   1100px. Se ve desparejo pero no traba nada.

## Un pedido tiene UNA fecha: se pregunta antes de moverla (13/9/2026, tarde)

Tadeo: *"soy de Estancias, pido para hoy domingo, pongo cosas que SÍ hay, y toco
'Pedir para el vie 18' en un pack que hoy no hay. ¿Cómo sigue? ¿Separa dos ventas?"*.

**No las separa.** El ERP guarda un pedido con un solo día de entrega, y el botón pasaba
**todo el carrito** al viernes con un aviso de 4 segundos. El que había elegido "hoy" se
enteraba —si se enteraba— mirando el chip de arriba.

| el carrito | qué pasa al tocar "Pedir para el vie 18" |
|---|---|
| **con algo** | se abre una hoja que pregunta: *"Para hoy no hay. Lo tenemos para el viernes 18/9. Cada pedido se entrega todo junto, en un solo viaje. Si lo sumás, lo que ya tenés en el carrito también pasa al viernes 18/9."* Botones **"Pasar todo al viernes 18/9"** / **"Seguir con mi pedido para hoy"** |
| **vacío** | **también pregunta**, hablando de la entrega: *"…Si lo pedís, tu entrega pasa al viernes 18/9, y lo que sumes después también va para ese día."* Botones **"Pasar mi entrega al viernes 18/9"** / **"Ver lo que hay para hoy"** |

Abajo dice cómo tener las dos cosas: dos pedidos, primero el de hoy. Lo mismo con "Armar
para el vie 18" de un combo.

> [!important] Con el carrito vacío también se pregunta, y no es exceso de celo
> La primera versión (mediodía del 13/9) seguía de un toque con el carrito vacío: *"no hay
> nada que perder"*. Tadeo lo dio vuelta esa misma tarde: *"quiero para hoy, pero ARRANCO
> agregando un producto que no tengo en stock, y automáticamente se me cambia de fecha"*.
> Lo que se pierde no es el carrito, es **la fecha que eligió**: todo lo que sume después,
> pensando que es para hoy, queda para el viernes, y el único rastro es el chip de arriba.

> [!important] Cerrar sin elegir nunca mueve la fecha
> La ×, tocar afuera y Escape son "seguir con lo de hoy". Se mide `fecha_por_stock_no`
> cuando alguien se queda con su fecha, además del `fecha_por_stock` de siempre.

> [!note] Por qué no se parte en dos pedidos solo
> Serían dos entregas, dos confirmaciones por WhatsApp, dos pagos y en Pilar dos envíos.
> Para el cliente es más confuso que la pregunta, y el ERP no tiene cómo atarlos.

Reusa el modal del combo (hoja desde abajo en el celular, centrada en la compu) con clases
propias para los botones (`.fecha-modal-si` / `-no`, 48px). Lo prueba
`_tools/verificar-sin-stock.js`: la pregunta con el carrito vacío (su texto, sus dos salidas
y el combo), la pregunta con el carrito lleno y sus tres salidas, el combo, y "Pasar todo".
Contra la versión que seguía de un toque con el carrito vacío da **8 rojos**.

### El chip de la barra en los barrios con vendedor decía "Tiempo agotado" un domingo

`_pilarRedCutoffChip` tenía el mismo error que `_cutoffNote` hasta esa mañana: sábado y
domingo decía *"Tiempo agotado esta semana"* con el viernes abierto. Ahora dice las
fechas (`_cutoffChipTexto`) y el test lo mira en los cuatro momentos de la semana.

### La foto de Carnes y la grilla de categorías

- La categoría Carnes usaba `carne-cortes.jpg`, una foto de stock que no es ningún corte
  de los que se venden. Ahora es **la colita**. `carne-cortes.jpg` sigue viva: es la foto
  de la picaña.
- En la compu las categorías eran 4 columnas fijas, y con las 9 de Estancias **Tortas
  quedaba sola en una tercera fila**. Ahora el ancho se elige por cantidad (`--cat-cols`):
  9 de a 3, 8 de a 4, 10 de a 5. Mientras la carne no carga son 8 y se ven de a 4.

### Los textos de las páginas, alineados con cómo funciona hoy

Tres cosas estaban **mal de hecho**, no de estilo, en Preguntas, Contacto y Términos:

| decía | es |
|---|---|
| *"Pagando en efectivo tenés 10% de descuento"*, sin zona | sólo **Estancias del Pilar, Los Alcanfores y Estancias del Río** (`cashDiscountActive`), y no en combos |
| *"Envío $5.000"* para todo Pilar | **$3.000** en barrios con vendedor y **sin costo** en los dos ex-Home (`getShipping`) |
| *"Todo llega congelado"* | la carne llega **fresca**, envasada al vacío |

Y de paso: la carne no aparecía en ninguna página (ahora está en Preguntas, Tips, Sobre
Nosotros y Términos), Clubes decía "en la cancha" y la tienda "en la puerta del club", el
formulario decía *"vos confirmás antes de que salga"* cuando desde el 11/9 el pedido se
registra al tocar el botón, y el título de la home era "Maleu Alimentos". Preguntas suma
*"¿Qué pasa si algo no hay para el día que elegí?"* y *"¿Puedo recibir una parte antes y
otra después?"*.

> [!warning] En Términos NO se tocó nada legal
> Sólo los datos que quedaron viejos (qué se vende, el 10%, el envío, la carne fresca en
> conservación) y "alimentos congelados" → "que necesitan frío" en la condición de
> devolución. El CUIT y la razón social siguen en pausa por decisión de Tadeo.

> [!note] Lo de guardar la carne es práctica general, no un dato de Lucas
> *"En la heladera hasta cocinarla, o en el freezer en su envase si la vas a usar más
> adelante"*. Ningún documento de Maleu dice cuánto dura; por eso no se escribió un plazo.

## "Lo que pediste la última vez" (13/9/2026, tarde)

Tadeo pidió las tres mejoras que más valían y la primera fue la recompra: el negocio vive
de que la casa vuelva, y la retención viene bajando (64 → 60 → 59 → 58%, medido en el
ERP). **Ya existía algo**: desde antes del 25/8 había un bloque "Tu último pedido" con
una lista de nombres y **un** botón, "Agregar todo de nuevo", metido arriba del catálogo.

**Antes de rehacerlo se midió si la gente repite**, sobre los 994 pedidos de Home y
Pilar, comparando cada uno con el anterior del mismo cliente (sin la carne):

| | |
|---|---|
| repite **los mismos productos** | **13,5%** (8,3% además con las mismas cantidades) |
| repite **la mitad o más** | 39% |
| repite **al menos uno** | **65%** |
| pedidos de la tienda (31/8 → 13/9) de gente que ya había comprado | **38 de 67** |

O sea que "agregar todo" le servía a pocos. Ahora, **arriba de las categorías**:

- **Las cards de siempre** (`productCardHTML`) con los productos del último pedido, de
  mayor a menor cantidad, hasta **4**. Stock, tope, "Pedir para el vie 18" y +/− salen
  de las mismas funciones que el catálogo; `renderCardFooter` ya pinta un producto que
  está más de una vez en la página.
- **"Agregar lo mismo · 5 productos · $104.000"**, sólo con dos productos o más. Suma
  **hasta** lo que pidió y no encima (si ya sumó una muzza tocando la card, "lo mismo"
  son dos), topea por el stock de la fecha, no suma lo agotado, y el botón cuenta lo
  que **va a** quedar. Con todo adentro dice *"✓ Ya está en tu carrito"*.
- **Los que no entran en las cards se nombran** ("Y también: …"): "Agregar lo mismo"
  los suma, y sumar algo que no se ve sería una sorpresa en el carrito.
- **La carne se dice y no se repite**: *"También llevaste carne: Vacío y Entraña"* +
  *"Elegir las piezas de hoy →"*. Cada pieza es única y la de la vez pasada ya no existe.
- **Dice de cuándo es**: *"Tu pedido del 11/9 · tocá lo que quieras repetir"*.
- Se esconde con una búsqueda puesta, y **no aparece en Clubes** (otro catálogo).
- **Si nada de ese pedido hay para la fecha elegida**, el botón ofrece la primera fecha
  en la que hay de todo: *"Agregar lo mismo para el vie 18 · 2 productos"*, por la misma
  pregunta que "Pedir para el vie 18" (`_preguntarOtraFecha`). Salió de verificar en
  vivo: el domingo 13/9 a la tarde el freezer real estaba vacío y el botón quedaba gris
  diciendo *"Para esta fecha no hay stock de ese pedido"* — el mismo callejón sin salida
  que se arregló esa mañana en las cards. La regla de "¿hay en ese modo?" es una sola
  (`_hayEnModo`) y la usan la card y el botón.
- Se mide `repetir_pedido` en Analytics; cada producto sumado cuenta como `add_to_cart`.

> [!important] Vive en el navegador y no en el ERP, a propósito
> Un endpoint que devuelva los pedidos de un teléfono sería una puerta a los pedidos de
> cualquiera: la tienda es pública y no tiene login. La contracara, aceptada: **en otro
> celular no aparece**. Se guarda al validar el formulario (`guardarUltimoPedido`, la
> misma costura que `guardarDatosCliente`) en `maleu_ultimo_pedido_v2`:
> `{t, zona, items:[{id,qty}], carne:[ids]}`.
>
> **El formato viejo sigue sirviendo** (`maleu_ultimo_pedido_pg`, una lista de
> `{id, qty}` sin fecha): los que ya compraron lo tienen guardado y la sección les
> aparece desde la primera visita, sin fecha. Ya no se exige la misma zona: lo que la
> zona no vende no se muestra, y listo.
>
> Un pedido de **solo combos no pisa** el anterior: los combos no se muestran acá (tienen
> su propio armado de gustos) y la sección quedaría vacía.

> [!warning] `[hidden]` no alcanza contra `display:grid`
> `.products-grid` declara `display:grid`, así que `#ultimo-productos[hidden]` necesita
> su regla con `!important`. Sin eso, un último pedido de solo carne dejaba la grilla
> vacía ocupando lugar.

**La red: `node _tools/verificar-ultimo-pedido.js [ancho]`**, 52 chequeos a 390 y 1440px
con el reloj congelado: cliente nuevo, el formato viejo, un pedido que hoy no hay entero
(la pregunta y sus dos salidas), un pedido de seis con carne y un agotado, "Agregar lo
mismo" con toques de verdad (dos veces, sacando algo y reponiéndolo), el buscador, el
guardado y Clubes. `CAPTURA=<carpeta>` guarda la sección. Con ocho bugs reinyectados de a
uno (sumar encima, ignorar el stock, no ordenar, no guardar la carne, el buscador sin
esconderla, ignorar el formato viejo, el botón sin repintarse con el carrito, y el botón
gris sin salida): **los ocho se agarran**.

## Las sugerencias del carrito: carne, y al revés (13/9/2026, tarde)

Tadeo, sobre la segunda mejora: *"que la sugerencia sea con algo que realmente tengamos,
¿entendés? Por ejemplo, ¿le sumás una pieza de colita de x peso?"*. Al 11/9/2026, **229 de
las 262 casas de Estancias nunca compraron carne** (medido en el ERP), y la carne va en la
misma entrega: no agrega un viaje.

Al final de la lista del carrito:

```
¿Le sumás carne?
Fresca, envasada al vacío, y va en la misma entrega.
[foto] Picaña   Pieza de 0,900 kg · $23.400    [+ Sumar]
[foto] Vacío    Pieza de 1,064 kg · $27.664    [+ Sumar]
               Ver todas las piezas →
```

- **Una pieza concreta del inventario**, del mismo `piezasDe()` que usa la grilla de Carnes,
  así que no puede ofrecer una que no existe ni una que ya está en el carrito. "+ Sumar" va
  por `togglePieza`, el mismo camino que la grilla.
- **La más chica de cada corte**: es el paso más fácil de dar. Y "Ver todas las piezas"
  cierra el carrito y lleva a Carnes para elegir otra.
- **Hasta dos cortes, de mayor a menor margen** (`SUG_CARNE_ORDEN`): sugerir primero lo que
  menos deja sería empujar justo la venta que menos conviene. **Los márgenes no están
  escritos en el código, a propósito: el repo es público.** Un corte nuevo entra al final.
- **Se repinta sola**: cuelga de `updateUI` (el carrito cambió) y de `renderCatalog` (llegó
  el inventario nuevo). Si la pieza sugerida se vende, al refresco siguiente ofrece otra.
- **Sale solo si** hay algo en el carrito, **no hay carne adentro** (el que ya eligió su
  pieza no necesita otra oferta) y la zona vende carne con piezas conocidas. En Pilar y en
  Clubes no aparece.
- **Se mide**: `sugerencia_carne_vista` una vez por visita (el denominador) y
  `sugerencia_carne` al sumar. La pieza cuenta además como `add_to_cart`.

### Y al revés: el que solo lleva carne

Tadeo, el mismo día: *"si la experiencia del cliente solo va por la carne y ve el carrito,
estaría bueno poner: ¿querés sumar algo más? Tenemos pizzas, sorrentinos, empanadas,
tartas, wraps"*. Misma caja y mismo lugar, con la regla dada vuelta:

```
¿Le sumás algo más?
También tenemos pizzas, sorrentinos, empanadas, tartas, wraps y postres.
Va todo en la misma entrega.
[foto] Pack Muzzarella x2     Para 3–4 personas · $17.000   [+ Sumar]
[foto] Empanadas Carne…       Para 2–4 personas · $20.000   [+ Sumar]
[foto] Sorrentinos Cordero…   Para 2–3 personas · $19.800   [+ Sumar]
                     Ver todo lo que tenemos →
```

- **Sale solo si el carrito tiene carne y nada más**: ni productos ni combos.
- **Tres productos de categorías distintas**, porque lo que se quiere decir es "tenemos de
  todo", no tres pizzas. Las categorías se agrupan para decirlas en una frase (`SUG_GRUPO`:
  pack e individuales son "pizzas", Franui y tortas son "postres"); una nueva entra con su
  nombre en minúscula.
- **Primero "Lo más pedido"** (`top:true`, que cura Tadeo), después el orden del catálogo.
- **Solo lo que se puede pedir para la fecha elegida**, con `getStockCap`: el mismo tope que
  "+ Agregar". Si la margarita no hay para hoy, ofrece otra pizza; y **cambia sola al cambiar
  la fecha** (cuelga también de `updateStockDisplay`).
- "+ Sumar" va por `addToCart`. En el celular el renglón es nombre y precio: el *"Para 3–4
  personas"* partía la línea en tres (`.sug-porc`, visible desde 481px).
- Se mide `sugerencia_maleu_vista` y `sugerencia_maleu`.

**Nunca salen las dos juntas**: una pide que no haya carne y la otra que haya solo carne.
Una sola función las pinta (`_pintarSugerencia`) y `data-tipo` dice cuál es.

**La red: `node _tools/verificar-sugerencias.js [ancho]`**, 44 chequeos a 390 y 1440px:
el carrito vacío; la de carne (orden, pieza más chica y su precio, "+ Sumar" con un toque de
verdad, sacarla y que vuelva, **la pieza que se vende y el inventario que llega**, "Ver todas
las piezas"); la de al revés (tres categorías, lo más pedido primero, **lo que no hay para
hoy no se ofrece y para el viernes sí**, carne con un combo, "Ver todo lo que tenemos"); y
los casos en que no va. De trece bugs reinyectados de a uno se agarran once. Los otros dos
**no pueden pasar en la tienda**, y está dicho en el test: el inventario ya llega ordenado
(`fetchPiezas`) y un carrito vacío no dibuja el lugar de la sugerencia.

## La franja del 10% se esconde al bajar, en el celular (13/9/2026, noche)

La barra pegada arriba medía **166px** a 390px —buscador 46, categorías 69, la franja del
10% 35—: un cuarto de la pantalla de un iPhone. Tadeo no la veía mal, y se hizo igual: la
franja **se esconde mientras el cliente baja y vuelve apenas sube**, o cuando la barra deja
de estar pegada. Lo que dice (el 10% en efectivo) se repite en el carrito. Con la franja
escondida la barra mide **131px**. **En la compu no cambia nada.**

> [!danger] No se achica la barra: se esconde una pieza superpuesta
> Achicar algo pegado arriba mueve todo lo de abajo mientras el dedo scrollea. Chrome lo
> compensa con el *scroll anchoring*; **Safari no lo tiene y la página salta 35px**. Por eso,
> desde 768px para abajo, la franja va `position:absolute; top:100%` debajo de la barra: la
> barra ocupa siempre lo mismo y la franja solo se desvanece (opacidad y `visibility`). Medido:
> una card se mueve exactamente lo que se scrolleó.

Tres cosas que había que acomodar por eso:

| | |
|---|---|
| **El hueco arriba del catálogo** | `.catalog::before` mide `--promo-h` (lo pone `updateCatNavTop`): con la barra quieta en su lugar, la franja taparía el título de la primera categoría |
| **`_stickyOffsetPx()`** | suma la franja cuando va superpuesta. Lo usan los botones de categoría y el buscador: al subir la franja reaparece, y sin contarla tapaba el título al que se iba (141px contra 166) |
| **El `top` que `updateCatNavTop` le ponía a la franja** | se sacó. No hacía nada con la franja sin posicionar; superpuesta la tiraba encima de las categorías |

- Solo con un movimiento de **8px o más**: el temblor del dedo no la hace parpadear.
- Una sola escucha de scroll, pasiva y de a un cuadro (`requestAnimationFrame`).
- `verificar-movil.js` medía "el resultado de la búsqueda queda debajo de la barra" sin la
  franja superpuesta: ahora la cuenta cuando está a la vista.

**La red: `node _tools/verificar-franja.js [ancho]`**, 14 chequeos a 390px y 4 a 1440px:
superpuesta, el título de la primera categoría, que se esconda al bajar sin que la página
salte, el temblor, que vuelva al subir pegada a la barra, ir a una categoría bajando y
subiendo, y que en la compu quede igual. Con seis bugs reinyectados (entre ellos achicar la
barra en vez de superponer): **los seis se agarran**. Contra la tienda anterior da 4 rojos.

## Las zonas del 14/9/2026: Estancias del Río con Estancias, y el miércoles en Pilar

Tadeo: *"En la primera opción que diga Estancias del Pilar y Estancias del Río. Son los 2
barrios a atacar, son muy parecidos y deberían ir juntos. Envío gratis. Lo mismo de
siempre. En la segunda, Pilar y Alrededores, sin Estancias del Río. Para esta opción
hacemos entregas los miércoles y los viernes. Y en otra zona de Pilar, para las entregas
que haga yo que no sean de mis vendedores, debería estar la carne con su stock"*.

| | antes | desde el 14/9/2026 |
|---|---|---|
| **Paso 1 del modal** | "Estancias del Pilar" | **"Estancias del Pilar y Estancias del Río"** · envío gratis · los cinco días |
| **Estancias del Río** | adentro de "Otra zona de Pilar", solo viernes, hoja Pilar | **zona Estancias**, cinco días, **hoja Home** con barrio "Estancias del Río" y sin sub barrio |
| **Los Alcanfores** | "Otra zona de Pilar", envío gratis y 10% | igual (queda solo en `BARRIOS_EX_HOME`) |
| **Lo que entrega Maleu en Pilar** ("Otra zona") | solo viernes | **miércoles y viernes** |
| **Barrios con vendedor** (Marcos, Fini, Rufo) | solo viernes | solo viernes |
| **La carne** | solo Estancias | Estancias **y "Otra zona de Pilar"**; nunca en un barrio con vendedor |
| **La foto de la categoría Carnes** | la colita cruda | carne a la parrilla, cortada (`categoria-carnes.jpg`, la pasó Tadeo) |

**No es un invento: es el diseño del 12/5/2026 que se había recortado.** El documento maestro
(`Cerebro Maleu\02-Operaciones\Tienda - Reglas de stock y horarios.md`, actualizado ese día)
ya decía "Pilar no-Red: Mié y Vie, mismas reglas que Home; Red: solo Vie", y el código
todavía tenía el filtro "barrio Red: solo viernes, no los miércoles". El 6/7/2026 se había
sacado el miércoles para todos. `getStockMode` **no se tocó**: un miércoles de Pilar se
arma con el freezer (stock real), igual que uno de Estancias. Por eso el test del ERP que
compara `getStockMode` con `npStockMode` de la tab «+» no se entera.

> [!important] Quién entrega lo decide `_pilarEntregaMaleu()`, y mira la ZONA
> Decide dos cosas que van juntas: el miércoles y la carne. Es `true` solo con la zona
> "Otra zona de Pilar" elegida en el modal y un barrio que no es de vendedor.
>
> No alcanza con `_pilarBarrioIsRed()`: reconoce un barrio de vendedor recién cuando llega
> `action=vendedores` de la planilla, y mientras tanto le diría "no es de vendedor" a un
> cliente de Fini — le ofrecería carne y miércoles. La zona está guardada desde el modal,
> así que no depende de ninguna respuesta. Sin zona elegida, `false`.

> [!danger] La carne en un barrio con vendedor se cobraría sin guardarse
> Un pedido de un barrio con vendedor va a la hoja **Red**, que no tiene columnas de carne:
> el pedido entraría, el total saldría bien y los kilos no caerían en ningún lado. Por eso:
> · los cortes llevan `sinVendedor:true` y `_productoBloqueadoPorBarrio` los saca del
>   catálogo, de las categorías, de las sugerencias y de los combos;
> · si el cliente cambia a un barrio con vendedor teniendo piezas en el carrito,
>   `_purgeCartBloqueados` las saca y lo dice (*"La carne la entregamos nosotros: en los
>   barrios con vendedor no está"*);
> · con carne, un barrio escrito a mano en "Otra zona" que coincide con uno de vendedor
>   **no** se manda al vendedor: lo entrega Maleu, que es lo que la pantalla le dijo.
>
> `verificar-pedido.js` cruza cada zona contra su hoja y ya no mira Red para lo marcado
> `sinVendedor`: eso lo prueba en la pantalla (vendedor sin carne, "Otra zona" con carne).

**Dos bugs que ya existían y aparecieron al probar esto:**

| | qué pasaba | cómo quedó |
|---|---|---|
| **El que volvía a Pilar encontraba el formulario sin su barrio** | `applyZone()` dibujaba el desplegable antes de cargar la zona guardada ("Elegí tu zona primero"), y el barrio guardado no tenía opción donde caer | el arranque llama a `renderPilarBarrios()` apenas carga la zona |
| **Una fecha guardada que ese barrio ya no ofrece se respetaba** | eligió un miércoles en "Otra zona", cambió a un barrio con vendedor, y el chip seguía diciendo "Mié 16/9" | `_loadSavedDate` exige que la fecha esté entre las que `_getNextDeliveryDatesGrouped` ofrece hoy (sirve también para un feriado que se bloquea después), y `_olvidarFecha()` limpia la de memoria antes del paso de fecha |

**La migración**: el que tenía "Estancias del Río" guardado en Pilar entra a Estancias con
barrio, lote, nombre y teléfono ya cargados, y se le borran la zona y el barrio de Pilar.

**El cartel del cierre** (`_cutoffNote`) para lo que entrega Maleu habla del miércoles: *"Entregamos
los miércoles y los viernes en Pilar y Alrededores. Para el viernes 18/9, pedí hasta el jueves
17/9 a las 12 hs"*; el jueves después de las 12, *"Pedí para el miércoles 23/9 o el viernes
25/9"*. Para un barrio con vendedor y para Clubes quedó igual.

Las páginas (Preguntas, Contacto, Términos, Sobre Nosotros) dicen lo mismo: Estancias del Pilar
y Estancias del Río juntas, Pilar miércoles y viernes (con vendedor, viernes), Los Alcanfores
sin envío, y la carne también en los barrios de Pilar que reparte Maleu.

**La red: `node _tools/verificar-zonas.js [ancho]`**, 64 chequeos a 390 y 1440px con el reloj
congelado en el lunes 14/9/2026 10:00: el paso 1; un pedido de Estancias del Río (hoja Home,
sin envío, 10%, con carne); "Otra zona" sin Estancias del Río; Pilar de Maleu con miércoles y
viernes en los dos calendarios, el hero, la carne y el pedido a la hoja Pilar con sus kilos y
piezas; el cartel del cierre en cuatro momentos; el cambio a un barrio con vendedor con carne
en el carrito; Los Alcanfores; la migración; el que vuelve a Pilar; Clubes. Contra la tienda de
antes da **28 rojos**. Actualizados: `verificar-pedido.js` (las tres zonas en pantalla) y
`verificar-sugerencias.js` (Pilar con vendedor sin carne, "Otra zona" con carne).

## La reserva de carne por kilo (17/9/2026)

Reunión de Tadeo con Lucas, 17/9/2026. Lucas: *"la carne me entra los viernes, y en la página
solo figura el stock que tenemos. Me gustaría que el cliente pueda reservar: no un peso exacto,
cierta cantidad de kilos"*. Y el porqué: la gente compra para el asado con tiempo, *"si no, van a
ver que hay solo entraña y se van a ir"*.

| el corte | qué ve el cliente |
|---|---|
| **con piezas** | la grilla de siempre, pieza por pieza |
| **sin piezas y con carne en camino** | **"Para reservar"**: *"Llega el viernes 18/9"*, el botón *"Reservar 1 kg · aprox. $26.000"* y después +/− de a medio kilo, hasta lo que queda |
| **sin piezas y sin nada en camino** (o con menos de 1 kg para reservar) | "Sin stock", como antes |

El pedido entra **a confirmar**. Cuando llega la carne, Lucas le asigna las piezas que más se
acercan, las pesa con "⚖️ Pesar la carne" del ERP y le confirma al cliente el peso y el precio.
El carrito, el resumen y el WhatsApp dicen **"Total aprox."**, y por transferencia se le pide
transferir cuando se confirme el total.

**El contrato con Backend** (acordado el 17/9/2026 con la sesión maleu-d7):

| | |
|---|---|
| `piezas_full._reserva` | `{ llega:'aaaa-mm-dd', cortes:{ abbr: kg } }`: los kilos que quedan para reservar de la compra cargada como **"Pedida"** en Compras Carne. El tope (`Config_Maleu > CARNE_RESERVA_PCT`, 80% de lo pedido **como supuesto**) y lo ya reservado los calcula el ERP. Sin compra en camino, la clave no va |
| cada reserva | un item `{ unidad:'kg', qty, precio, importe, piezas:[], reserva:true }` |
| el pedido | `reservaCarne: { llega, cortes:{ abbr: kg } }` |

**Lo que garantiza la tienda:**
- un corte va con piezas **o** con reserva, nunca las dos, porque la hoja tiene una sola columna de kilos por corte;
- la reserva se ofrece solo para cortes sin piezas;
- la entrega es el día que llega o uno posterior;
- desde 1 kg y de a medio kilo, porque una pieza envasada pesa de 1 a 2 kg.

> [!important] Sin `_reserva` la tienda queda exactamente como antes
> Por eso la tienda puede publicarse antes o después que el backend sin romper nada. Pero **no
> se publica hasta que Backend confirme `_reserva` vivo**: lo pidió así, y no tiene sentido sacar
> código que nadie puede usar. Las tiendas abiertas desde antes ignoran la clave solas
> (`_piezasLimpiar` salta todo lo que no sea un array).

> [!danger] Backend puso dos condiciones para prenderla, y tiene razón
> · **Retener las piezas de las reservas cuando se carga la tanda.** Si no, la tienda las
>   muestra todas y un cliente nuevo se lleva la que era de una reserva.
> · **El estado "Pedida" en Compras Carne.** El 16/9 Lucas cargó el pedido al proveedor (CC-0007) y
>   quedó "Recibida", o sea como deuda, con picaña y entraña que el proveedor avisó el 17/9 que no traía.
>   Sin "Pedida" se reservarían kilos de cortes que no vienen.

**En el carrito vive adentro de `piezaCart`**, con la clave `R:<abbr>` y `reserva:true`. Así el
total, el 10% en efectivo, los cupones, el píxel y "Lo que pediste la última vez" la cuentan sin
tocarlos. Lo que cambia es cómo se **dice** y qué viaja al ERP. Las funciones que la miran
aparte: `piezasEnCarrito` (no es una pieza), `_piezasConciliarCarrito` (no está en el
inventario), `piezasAgrupadas` (marca `reserva`) y el armado de `items` en `enviarPedido`.

**Cuando cambia algo, la tienda lo dice:**
- **Llegó la carne** (ahora hay piezas): la reserva sale y se avisa *"ahora podés elegir tu pieza"*.
- **Otros reservaron** lo que quedaba: la reserva se achica y se avisa.
- **Ya no hay `_reserva`**: la reserva sale y se avisa.
- **El cliente pasa a una fecha anterior a la llegada**: sale y se dice por qué.
- **Con un pedido en camino** no se toca nada.
- **El día del formulario**, que se elige aparte del chip, se controla al mandar.

**Cómo se nombra:** al cliente, **"reserva"**. No "orden de compra": en el ERP eso ya es lo que
se le manda al proveedor, y la misma palabra en las dos direcciones confunde. "Orden de venta" es
el término formal para hablarlo adentro.

**La red: `node _tools/verificar-reserva.js [ancho]`**, **75 chequeos** a 390 y 1440px, con el
reloj congelado en el martes 15/9/2026:
- sin `_reserva`, nada nuevo;
- la card, el tope, el carrito, el resumen, el pedido y su WhatsApp;
- una fecha antes de la llegada (pregunta, vuelve para atrás, el formulario);
- el inventario de ahora (menos kilos, llegó la carne, sin reserva, pedido en camino);
- la copia de la última visita;
- Pilar de Maleu.

Contra la tienda de antes, el test corta en el primer chequeo. Con siete errores reinyectados
de a uno (sin control de fecha al mandar, la reserva que queda cuando llega la carne, sin
`reserva:true`, sin tope, reservar un corte con piezas, la fecha anterior que no la saca, la
copia que no la guarda) **agarra los siete**. Los dos últimos no los veía la primera versión:
le faltaba un corte con piezas que además viniera en la compra, y un inventario sin piezas.

### La octava puerta (23/9/2026)

Esta rama se escribió el 17/9 y se rebasó el 23/9, el día que la tienda pasó a preguntar
la zona en el primer "+ Agregar". Ese cambio cerró **siete** puertas al carrito
(`_pedirZonaAntes`). La rama traía una **octava que ese día no existía**: `cambiarReserva`,
el +/- de medio kilo.

> [!danger] Sin la puerta, se reservan kilos sin haber dicho de dónde es
> El pedido se iría a la hoja equivocada, con el envío y el descuento de una zona que el
> cliente nunca eligió. Y peor: al retomar hay que chequear que el corte exista **en la
> zona elegida**, porque `_corteDe()` mira `PRODUCTOS` —el catálogo entero— y no el de la
> zona. Sin ese chequeo se podía reservar carne en **Clubes**, que no la vende.

Es la clase de agujero que sólo aparece al rebasar: una rama vieja no sabe de una regla que
nació después, y nada la avisa. Si aparece otra puerta al carrito, la cuenta es **ocho**.

## La tienda abre en el catálogo (23/9/2026)

Tadeo, mirando entrar a un cliente nuevo: *"es bastante difícil el flujo para alguien
que entra por primera vez, demasiada información 'de dónde sos', 'cuándo querés que te
entregue'… lo primero que quieren es ver qué vendo y qué precios tengo"*.

Hasta ese día el catálogo arrancaba **tapado** por el modal de bienvenida:

| | antes | ahora |
|---|---|---|
| Estancias | **2 pantallas** (zona → fecha) | **0** |
| Pilar | **4 pantallas** (zona → zona de Pilar → barrio → fecha) | **0** |
| la zona | antes de ver un precio | **en el primer "+ Agregar"** |
| el día | antes de ver un precio | **en el formulario** |

> [!important] La zona y la fecha son para ENTREGAR, no para MIRAR
> Preguntarlas antes es pedirle el domicilio a alguien que todavía no entró al local. Lo
> único que decide si se queda es qué vendemos y a cuánto, y eso es lo que tiene que
> estar en la primera pantalla.

### La zona provisoria

Mientras el cliente no elige, la tienda trabaja con `currentZone = 'estancias'` y
**`zonaProvisoria = true`**. Estancias es el catálogo más grande y de donde sale la mayor
parte de las ventas.

> [!danger] No se guarda en `localStorage`, a propósito
> El cliente no eligió nada: guardarla sería decidir por él, y el que vuelve entraría
> derecho a una zona que nunca dijo. `maleu_zone` se escribe recién en `setZone()`.

**Y todo lo que sería una afirmación sobre su zona se calla hasta que elija:**

| | por qué |
|---|---|
| los días de entrega del hero | serían los de Estancias, y puede ser de Pilar |
| la franja del **10% en efectivo** | es de Estancias y los dos ex-Home; en un barrio con vendedor **no aplica** |
| el chip 📍 | dice *"¿Dónde entregamos?"*, no una zona |

> [!danger] El 10% se apagó en `cashDiscountActive()`, no en la franja
> Por el descuento preguntan **tres** lugares: la franja de arriba, el incentivo del
> carrito y el cartel del medio de pago. La primera versión tapaba la franja en
> `updatePromoBar()` y **`updateUI()` se la volvía a encender dos líneas después** — el
> test lo agarró en la primera corrida. Es la lección de siempre de este repo: se arregla
> en la raíz, no en los call sites.

Sin fecha elegida `getStockMode()` devuelve **`ilimitado`**, así que el catálogo se ve
entero y **sin un solo "Sin stock"**. Es lo contrario del callejón sin salida del 13/9,
cuando un domingo con el freezer vacío los cuatro "Lo más pedido" estaban en gris.

### La zona se pregunta en el primer "+ Agregar"

`_pedirZonaAntes(seguir, motivo)` frena la acción, abre el modal y **retoma lo mismo**
cuando la zona queda completa (`_cerrarModalZona`). Sin subir el scroll: el cliente está
mirando ese producto.

> [!important] Antes de agregar, no después — `applyZone()` vacía el carrito
> Preguntar la zona después le borraría en la cara lo que acaba de sumar.

Las puertas cerradas son **seis**: `addToCart`, `togglePieza`, `openComboConfig`,
`addComboDefault`, `agregarLoMismo`, `goToForm` y —la última— `enviarPedido`. La puerta
va en la función que el cliente toca y **no adentro de `modifyCart`**: para retomar hay
que volver a hacer lo mismo que pidió, y eso sólo lo sabe la función de arriba.

> [!warning] Lo que la zona nueva no vende NO entra al carrito
> El caso real: entra por el catálogo provisorio de Estancias, toca un pack y elige
> **Clubes**, que tiene otro catálogo. Al retomar se chequea `_enLaZona(id)` y si no está
> se dice (*"⚠️ Pizza Margarita no lo tenemos en Clubes Deportivos"*).

### El día se elige en el formulario — y ahora SÍ es la fecha del pedido

> [!danger] `selectDayPicker` no movía `selectedDeliveryDate`. Era un agujero abierto.
> Elegir un día en el formulario marcaba los campos y el horario, **y nada más**: el tope
> de stock seguía calculado con la fecha del modal. O sea que se podía armar el carrito
> para el viernes (todo disponible) y pedir la entrega **para hoy** (freezer vacío), y el
> pedido entraba igual.
>
> Existía desde antes de este cambio y era raro —había que elegir la fecha en el modal y
> después otra en el formulario—. Con la fecha fuera de la entrada **pasó a estar en el
> camino principal**, así que se cerró: `selectDayPicker` llama a `setDeliveryDate(...,
> { sinScroll: true })`, y de ahí cuelgan `_ensureCartFitsDate` (recorta y avisa),
> `updateStockDisplay` y el chip de arriba.

El chip 📅 **invita cuando no hay fecha** (*"Elegí el día"*) en vez de esconderse: es el
único lugar donde el cliente ve que el día todavía está sin elegir, y por donde lo puede
elegir sin bajar hasta el formulario. Lo pinta `applyZone()`, que es por donde pasan
todas las puertas — antes lo pintaban sólo `_loadSavedDate` (y únicamente si encontraba
una) y `_olvidarFecha`, así que el cliente nuevo se quedaba con el *"📅 Fecha"* escrito a
mano en el HTML.

**El paso de fecha del modal sigue vivo**, con su calendario por zona y su cartel de
cierre; se llega desde el chip 📅. Su *"← Volver"* ahora **cierra**: mandarlo a reelegir
zona y barrio que ya tiene era devolverle el interrogatorio.

> [!note] El que vuelve no pierde nada
> Con zona guardada entra directo, igual que antes. Si su fecha sigue vigente se respeta;
> si venció —el caso común del que vuelve una semana después— **ya no se le abre el modal
> en "¿para cuándo?"**: ve el catálogo entero y el chip lo invita.

### Cómo se mide

| evento | cuándo |
|---|---|
| **`ver_catalogo`** | una vez por visita, cuando el catálogo queda a la vista. **Es el denominador** |
| `select_zone` | la zona elegida, con **`origen`**: `entrada` · `agregar` · `cartel` · `chip` · `enviar` |
| `zona_pedida` | la puerta frenó algo, con el `motivo` |

> [!important] `ViewContent` de Meta se mudó de `select_zone` a `ver_catalogo`
> El comentario viejo lo decía él mismo: *"el momento en que el visitante deja de mirar
> la portada y entra al catálogo"*. Ese momento ahora es **abrir la página**. Si se
> hubiera quedado colgado de `select_zone`, el público de remarketing se quedaría sólo
> con los que eligieron zona — justo los que este cambio dejó de exigir.

**Para medir si el cambio sirvió**, el número es `ver_catalogo` contra `select_zone` y
contra `purchase`. Antes del cambio no existía el denominador: el que se iba en el modal
no dejaba rastro ninguno.

### La red: `node _tools/verificar-entrada.js [ancho]`

**68 chequeos**, verdes a 390 y 1440px, con el reloj congelado el domingo 13/9/2026 05:00:
la primera pantalla (nada encima, 43 cards con precio, cero grises por fecha, el cartel
tocable, los dos chips, el hero y la franja callados, la zona sin guardar, `ver_catalogo`
una vez); el primer "+ Agregar" (pregunta, no agrega mientras pregunta, retoma, no sube el
scroll, el origen del evento); el día en el formulario (que sea la fecha del pedido, que
tope el stock y que recorte avisando); Clubes con un producto que no vende; Pilar
completando zona, barrio y sub barrio; el que vuelve con fecha vigente y con fecha
vencida; y cero POST.

Probada en la dirección contraria con **diez bugs reinyectados de a uno**: el modal que
vuelve a salir, la zona provisoria guardada, "+ Agregar" sin preguntar, la zona elegida
que no retoma, el hero y la franja hablando de más, `selectDayPicker` sin mover la fecha,
lo que la zona no vende entrando igual, el chip de fecha mudo y el cartel que no aparece.
**Los diez se agarran.**

> [!danger] El toque se mide DOS veces, y por un caso real
> Entre acomodar el scroll y soltar el click la página se sigue moviendo. En una corrida
> el toque al calendario del formulario **le cayó a una pieza de vacío y la sumó al
> carrito**, y el test culpaba a la tienda de no mover la fecha. Ahora se acomoda el
> scroll, se espera, y **recién ahí** se lee dónde quedó el elemento.

> [!warning] `goToForm()` hace `toggleCart()` sin preguntar
> Se llama siempre DESDE el carrito abierto, así que llamarla sola **lo abre**, y el
> carrito tapa medio formulario. Un test que la llame directo tiene que abrir el carrito
> antes.

### Las redes viejas: qué se tocó y qué no

Cinco ayudantes elegían la fecha en el paso que dejó de salir solo. Se les agregó
`showDateModal()` antes de leer el calendario —el mismo camino que le queda a una
persona—, y `verificar-datos-cliente` pasó a probar el flujo nuevo de punta a punta
(entra, toca "+ Agregar", le preguntan, elige, y lo que tocó se suma solo).

> [!note] Hallazgo de paso en `verificar-sugerencias`
> El escenario de Pilar **nunca elegía el sub barrio**: se quedaba en ese paso, el
> calendario no existía todavía, y por eso Pilar corría sin fecha y sin tope. Ahora
> completa el barrio como una persona.

## La venta es del que trajo al cliente, no del barrio (24/9/2026)

Tadeo, la noche anterior a la ruleta de Los Robles, después de la mesa de Grupo Matriz:
*"si una persona de Manzanares entra por la ruleta, le va a dirigir el pedido a Rufino, y
eso está mal, porque Rufino no hizo nada para conseguir este cliente. A los 3 vendedores
les pagamos lo que les pagamos porque ellos se mueven para conseguir clientes"*.

Hasta ese día la tienda ruteaba por **geografía**: barrio con vendedor → hoja `Red`, y el
vendedor cobra su 17% más los $3.000 del envío. Daba igual quién hubiera conseguido al
cliente. Ahora rutea por **quién lo trajo**, que es lo que se está pagando.

### Cuándo un cliente es nuestro

`_esNuestro()`, guardado en `localStorage` (`maleu_origen`). Se marca cuando llegó por un
canal de Maleu:

| | |
|---|---|
| **el cupón de la ruleta** (`RUL-…`) | el caso de Los Robles |
| **un link nuestro** con `?o=` / `?d=` / `?r=` | los mismos tres parámetros que ya usan los QR (`o` de dónde salió · `d` el lugar · `r` lucas/tadeo/joaco) |

> [!danger] El cupón marca cuando lo VALIDA EL BACKEND, no al leer la URL
> Si marcara con lo que dice la barra de direcciones, cualquiera que escriba
> `?cupon=RUL-LOQUESEA` le saca un cliente a un vendedor. Se marca adentro del `.then()`
> de `validarCupon`, con el código que el backend reconoció.

> [!important] El primero que lo trajo es el que vale
> `_guardarOrigenNuestro` no pisa lo que ya estaba. Es la contracara de lo que se le paga
> al vendedor: si el cliente es suyo lo es siempre, y si es nuestro, también. Y se queda
> guardado, así que el que compra a la semana siguiente sin el link sigue siendo nuestro.

### Qué cambia para ese pedido

El corte es **una sola línea**, en `_pilarBarrioIsRed()`:

> [!important] Esa función contesta "¿a este pedido lo atiende un vendedor?"
> No "¿este barrio queda en su zona?". De ella cuelgan los días de entrega, el envío, el
> alias al que se transfiere, el tope de stock y si se ofrece carne. Para un cliente que
> trajimos nosotros la respuesta es **no**, aunque viva en Manzanares. Se corta ahí, en la
> raíz, y no en los seis lugares que preguntan — la lección que este repo ya aprendió con
> los botones muertos del 10/9 y con la franja del 10% del 23/9.

| | barrio con vendedor | el mismo barrio, cliente nuestro |
|---|---|---|
| hoja | `Red`, con su vendedor | **`Pilar`, sin vendedor** |
| días | solo viernes | **miércoles y viernes** |
| carne | no (la hoja Red no tiene columnas) | **sí** |
| envío | $3.000, se lo queda el vendedor | **$5.000**, lo reparte Maleu |
| alias | el del vendedor | **el de Maleu** |

> [!warning] `_pilarEntregaMaleu()` exigía que la zona fuera "Otra zona de Pilar"
> Con `_pilarBarrioIsRed()` en falso y nada más, el de Manzanares salía de la hoja Red
> —bien— pero se quedaba con los viernes del vendedor y sin carne: media promesa. Lo
> encontró `verificar-vendedor.js` en su primera corrida.

> [!warning] El marcador tiene que existir ANTES de que la tienda dibuje nada
> La primera versión leía `?r=` al final de `app.js`, al lado del cupón, y para entonces
> `applyZone()` ya había dibujado el calendario con los días del vendedor. El bloque se
> mudó arriba, junto a las funciones que usa. Para el cupón —que llega por `fetch`, después
> del arranque— está `_repintarPorOrigen()`, que repinta lo que depende de quién entrega
> **sin llamar a `applyZone()`, que vacía el carrito**.

El pedido viaja con `origenDetalle` (*"evento · Los Robles · lucas"*), así el ERP sabe quién
lo trajo. El cupón ya viajaba aparte y se puede cruzar con el lead; un link con `?r=` no
tiene cupón y sin esto no dejaría rastro.

### Lo que falta, y es del ERP

> [!danger] Un cliente que YA le compra a un vendedor puede girar la ruleta igual
> `ruletaGirar` no le da premio a quien ya compró, y eso es lo que hace segura toda esta
> regla: **el cupón sólo existe para alguien que nunca nos compró**. El cruce
> (`LEADS_HOJAS_CRUCE_`) miraba **Home, Pilar y Clubes — no `Red`** hasta el 23/9/2026: un
> cliente de Rufo no figuraba como cliente, giraba, ganaba, y con esta regla su próximo
> pedido dejaba de ser de Rufo. **RESUELTO** por Backend ese mismo día (commit `7f52cd5`,
> publicado en @730): hoy el objeto incluye `'Red': 1`. Verificado el 29/9 contra el
> `Code.js` publicado.

### La red: `node _tools/verificar-vendedor.js [ancho]`

**31 chequeos** verdes a 390 y 1440px, con el reloj congelado el lunes 14/9/2026: el de
Manzanares sin marca sigue siendo de Rufo con su envío, sus viernes y sin carne (esa mitad
va **primera**, porque es la que protege al vendedor); el mismo barrio con `?r=lucas` pasa a
la hoja Pilar; la marca se queda y no se pisa; el cupón validado marca y uno inventado no;
Estancias no se entera; y cero POST.

Probada con **diez bugs reinyectados de a uno**, y **los diez se agarran**.

### El cupón de la ruleta: sólo desde el link, y no donde atiende un vendedor (24/9/2026)

Pedido de Backend para la acción de Los Robles, y **dos cosas estaban rotas para mañana**:

> [!danger] El link aceptaba `RUL-XXXX` y Backend emite `RULETA-XXXX`
> El filtro del auto-aplicado era `/^RUL-[A-Z0-9]{4,}$/`, así que un premio de la ruleta
> nueva entraba a la tienda y **no se aplicaba nada**: ni el descuento, ni la marca de "lo
> trajimos nosotros" —que cuelga del mismo bloque—. O sea que el cliente de Los Robles
> habría perdido su 15% **y** habría quedado como pedido de su vendedor. Hoy el filtro es
> `/^RUL(?:ETA)?-[A-Z0-9]{4,}$/`. Sigue siendo un filtro y no un "aceptá cualquier cosa":
> lo que llega por la URL se le manda al backend a validar.

> [!important] `cuponValeEnEstaZona()`: no vale donde el pedido lo atiende un vendedor
> Esos van a la hoja `Red`, que va sin descuentos, y el ERP los recalcularía igual — el
> cliente vería un total y la planilla guardaría otro. **Y el caso que parece una excepción
> no lo es**: el cliente que trajimos nosotros por la ruleta, aunque viva en el barrio de
> Rufo, no lo atiende un vendedor (`_pilarBarrioIsRed()` ya da false para él), así que su
> premio vale. Que las dos reglas cuelguen de la misma función es lo que las mantiene de
> acuerdo.

Cubre las tres puertas: el descuento, el envío gratis de un cupón ENVIO, y el premio REGALO.
Y **se dice**: un cupón que da cero sin explicar por qué es peor que ninguno.

> [!danger] Las DOS puertas están cerradas: hoy un cupón que no sea de la ruleta no entra
> El 23/9/2026 acá decía *"el link ya era la única puerta, que es justo lo que se pidió"*, y
> **era falso**. Es cierto que `applyCoupon()` y `#f-cupon` están en `app.js` sin markup en
> ninguna de las 11 páginas, o sea que el campo manual no existe. Lo que faltó juntar es la
> otra mitad: **el link filtra `/^RUL(?:ETA)?-…/` y sale con `return` sin avisar**. Las dos
> mitades estaban verificadas por separado y la conclusión de juntarlas nunca se sacó.
>
> Lo reprodujo la sesión de Wati con Tadeo en un pedido real: entró a
> `maleu.com.ar/?cupon=EMPA20`, sumó $18.000 de empanadas y pagó $18.000 + envío, **sin
> descuento y sin un cartel que dijera por qué**. Un cupón de campaña hoy es inaplicable.
>
> **Cuando se arregle, el filtro tiene que ser por FORMA y no por prefijo** (algo como
> `/^[A-Z0-9][A-Z0-9-]{2,23}$/`). Un prefijo no defiende de nada: quien quiera probar
> códigos arbitrarios manda `RUL-AAAA`, `RUL-AAAB`. El que decide si un cupón vale es el
> backend. Con un prefijo nuevo, el próximo tipo de cupón vuelve a chocar con lo mismo.

> [!danger] Y al abrirlo, ojo con `_guardarOrigenNuestro`: le saca clientes a los vendedores
> El bloque que valida el cupón marca al cliente como **"lo trajimos nosotros"**. Para la
> ruleta corresponde — esa persona vino por nosotros. Pero **las campañas de WATI le hablan
> a la base que YA nos conoce, y ahí adentro están los clientes de Rufo, Marcos y Fini**:
> ampliar el filtro sin tocar esto les transfiere clientes a Maleu en silencio, y son los
> mismos clientes por los que se les paga el 17%. El marcado se queda **sólo** para
> `RUL`/`RULETA`.

**El 15% del premio NO se suma al 10% de efectivo.** Tadeo subió el premio de 10% a 15%
**justamente para eso**: así el premio siempre vale más que el descuento que esa persona ya
tenía, y el techo queda en 15% en vez de 25%. Sale del campo `stack` del cupón, que Backend
emite en `false` y verificó en producción (`PCT 15 · Scope TODO · Stack No`).

> [!danger] Tres carteles le prometían un 10% que no iba a ver
> Con `stack:false` y scope TODO, el cupón cubre todo el carrito y el efectivo **no agrega
> nada**. Pero el cartel del formulario, el incentivo del carrito y la franja de arriba
> preguntaban `cashDiscountActive()` —"¿esta zona tiene el 10%?"— y no "¿a este carrito le
> suma algo?". El renglón del carrito llegaba a decir **"🎟️ RULETA-XXXX + 10% OFF Efectivo"
> descontando 15%**: nombraba un descuento que dio cero.
>
> Lo resuelve `ahorroPorEfectivo()`, que es la misma cuenta que `getCashDiscount()` pero sin
> mirar qué forma de pago está tildada — porque los tres carteles aparecen **antes** de que
> el cliente elija.

> [!warning] La franja del 10% tenía una SEGUNDA puerta en `updateUI()`
> Una copia de la regla que sólo miraba "carrito de sólo combos", y que volvía a encender la
> barra dos líneas después de que `updatePromoBar()` la apagara. Es la **tercera vez en el
> día** que aparece el mismo patrón: la primera fue la zona provisoria, la segunda el 10% de
> efectivo. Ahora `updateUI()` llama a `updatePromoBar()` y punto.

> [!note] De cinco bugs reinyectados se agarran cuatro, y el quinto no es alcanzable
> El guard del incentivo del carrito (`else if (!isCash && ahorroPorEfectivo() > 0)`) sólo se
> ejecuta cuando **no hay ningún descuento**; con el cupón puesto la rama de arriba ya dice
> "🎉 ¡Descuento aplicado!", que es cierto. Queda como defensa, no como algo probado — y
> decirlo es más útil que inflar el número.

Lo prueban **13 chequeos** dentro de `_tools/verificar-vendedor.js` (44 en total),
con **4 bugs del cupón y 4 del descuento reinyectados, y los 8 agarrados**.

### La rueda cuando cambia la lista de premios (24/9/2026)

Backend, al cargar los premios de Los Robles: *"cuando cargue los seis, la rueda va a pasar
de 5 a 6 casilleros sola, porque el servidor manda la lista"*. Es el día en que se nota si
algo quedó atado a la cantidad vieja.

**Está cubierto en el código** —`dibujar()`, `frenarEn()` y `casillero()` leen
`premios.length` en el momento— **y ahora también en la red**: el celular arranca con 5
guardados en `maleu_ruleta_premios`, el servidor manda 6 con una demora de 1,8 s, y se mide
que la rueda dibuje la copia primero, se repinte sola a 6 y frene donde corresponde.

> [!danger] El primer chequeo del ángulo no distinguía 5 casilleros de 6
> Con el premio del casillero 1, el centro cae en **108°** con 5 y en **90°** con 6: los dos
> caen en el mismo sexto, así que el test daba verde con la cuenta vieja adentro. Se cambió
> al **casillero 5, que con la lista vieja no existe** (330° contra 36°). De tres bugs
> reinyectados agarraba **uno**; ahora agarra **los tres**.

> [!important] El índice del premio puede venir de la lista vieja
> El backend arma `premio.i` cuando sortea, y entre eso y el frenado la lista puede haber
> cambiado. `casillero()` compara el **texto** antes de creerle al índice — si no, la rueda
> frenaría en un premio y el cartel diría otro. Hay un chequeo que manda `i:0` con el texto
> de empanadas y exige que frene en un casillero de empanadas.

> [!note] Dos rojos que no eran míos, heredados del commit de la ruleta de ese día
> `a6d2d98` cambió la ruleta para que se gire con el dedo (+142/−30 líneas) y **no tocó su
> red**, que siguió clickeando el botón viejo: 7 rojos sobre una ruleta que andaba. Ahora
> el test arma con el formulario y tira con *"No me sale, girala vos"*, que es el mismo
> camino y existe para el que no puede arrastrar. Y `verificar-paginas` marcaba el nombre de
> Tadeo en un comentario nuevo de `ruleta.html`. Los dos estaban publicados.

## Que la tienda no parezca hecha con IA (23/9/2026)

Tadeo, mandando una captura de somosmomento.com.ar —la tienda de Joaco, hecha en Tienda
Nube—: *"hoy en día maleu.com.ar se ve claramente que está hecha toda con IA… el box '¿a
dónde te lo llevamos?' o los carteles de 'armar mi pedido' y 'ver los combos', te das
cuenta de acá a la China. Quiero que se parezca a una tienda lo más HUMANA posible"*.

> [!important] El diagnóstico, en una frase
> La tienda estaba diseñada como **una página que te explica cómo usarla**, y una tienda
> es **un local que te muestra lo que vende**. Todo lo de abajo sale de ahí.

| El síntoma | Qué se hizo |
|---|---|
| **Emojis como iconografía** — 📍 📅 🛒 💵 🎁 ⏰ 📦 🚚 👥 🍳 | íconos SVG de trazo (`_ico()`) |
| **El carrito mostraba el emoji del producto** (🍕 en las tres pizzas) | la **foto real**, que ya estaba a un campo de distancia |
| **Dos botones en el hero**, apilados y los dos con flecha | ninguno: abajo están las categorías y los productos |
| **Una tarjeta para pedir la zona**: título con emoji, renglón que explicaba qué iba a pasar, y un botón relleno adentro | **una barra** de un renglón, con la acción subrayada |
| **La franja de arriba** en negrita, con un emoji por mensaje | mayúsculas, fina y espaciada, sin emoji |
| **El chip de Combos** con degradé naranja, sombra de color y salto al pasar el mouse | el mismo botón que los demás, en el marrón de la marca |
| **La chapita 🎁** sobre cada combo | dice **"COMBO"** |
| **"Confirmar pedido →"**, **"Completar datos y pedir →"** | sin flecha |

### Por qué los emojis son el detalle que más delata

**Un emoji no es un ícono.** Lo dibuja el sistema operativo: se ve distinto en cada
teléfono, en varios viene de otro color, y nunca hereda el color de la marca. Un ícono de
trazo hereda `currentColor` — en un chip naranja sale naranja, en uno marrón sale marrón —
y se escala con el texto porque mide en `em`.

Van **inline en `_ICONOS`**, no como archivo: son cuatro, pesan menos que la conexión que
habría que abrir para bajarlos, y tienen que estar dibujados cuando se pinta la primera
pantalla.

> [!warning] El texto de un chip va por `textContent`, nunca concatenado al HTML
> `_chipIcono(chip, ico, texto)` arma el ícono por `innerHTML` y el texto por
> `textContent`. No es ceremonia: varias de esas etiquetas son **nombres de barrio que
> llegan de la planilla** (`action=vendedores`), o sea de afuera del código. Antes eran
> `chip.textContent = '📍 ' + label`, que era seguro por accidente; pasar a `innerHTML`
> sin separarlo habría abierto una puerta que no existía.

### Lo que NO se tocó, y por qué

> [!note] El 🎂 de "¿Cuándo es tu cumpleaños?" se queda
> Es el único emoji que sobrevive en pantalla, y no es un descuido. Los que se fueron
> estaban **haciendo de ícono** en un botón, un chip o una etiqueta; ese es decorativo, en
> un bloque opcional y afectuoso. Sacarlo lo dejaba más frío sin ganar nada.

El **✓** de *"✓ Pizza Margarita agregado"* también: es un carácter tipográfico, no un
emoji de cuatro bytes, y se dibuja con la fuente de la página.

**El naranja de marca no se tocó** — sigue valiendo lo de «Escaneo general»: lo decide el
manual de marca con Juani Peña, no un rediseño al pasar.

### Lo que falta, y necesita una foto de Tadeo

**El hero sigue siendo un slogan sobre fondo crema.** Es lo que más lo diferencia de una
tienda de verdad: Momento abre con una foto a sangre. Las del catálogo no sirven — son
cuadradas o verticales y se recortan feo a lo ancho. Hace falta **una foto apaisada
pensada para eso**, y esa la saca Tadeo.

> [!tip] Cuando llegue, va con `python _tools/fotos-producto.py`
> Y hay que cuidar dos cosas que hoy están bien: el **CLS de la carga es 0** (una imagen
> sin `width`/`height` lo rompe), y el título encima de una foto necesita su capa oscura o
> deja de leerse en la mitad de las pantallas.

### Las redes

Ninguna red medía esto, y sigue sin haber una que mida "parece hecho con IA" — no es
medible. Lo que sí se comprobó es que un rediseño no rompió la tienda: **26 de las 27
redes en verde**, y la 27ª es `verificar-pixel-red`, que da 6 rojos desde un navegador
headless **desde antes de este cambio** y por el motivo que ya está escrito arriba — no
se puede usar para concluir nada desde ahí.

> [!warning] Un test atado a la redacción frena el copy
> `verificar-descuento` pedía el texto exacto *"10% OFF en efectivo"*, así que cambiar la
> franja a *"10% OFF pagando en efectivo"* lo puso en rojo **sin que el descuento hubiera
> cambiado**. Ahora pide `/10% OFF/` y `/efectivo/i`: que lo diga, no cómo lo dice. Si un
> chequeo se rompe al reescribir una frase y la plata no cambió, el que está mal es el
> chequeo.

> [!note] Un rojo preexistente que apareció de paso, y NO es de este cambio
> `verificar-datos-cliente` da **35 ok · 1 mal** en *"el día viene de la fecha que quedó
> elegida"*. **Medido contra HEAD limpio con `RAIZ=`: falla igual.** Es del cambio del
> 23/9 a la mañana: con la zona ya elegida el modal no se abre, así que en la segunda
> visita nunca se elige fecha, y el test todavía espera que el día venga puesto. El test
> quedó viejo, la tienda hace lo que tiene que hacer — el chip 📅 invita a elegirlo.

### El color de la ruleta: uno por premio, no por posición (24/9/2026)

Pedido de Backend, para Los Robles. Con los seis premios, los tres casilleros de "15% OFF"
caen en los índices 0, 2 y 4, y `COLORES[i % 4]` les daba naranja / marrón / naranja:
Tadeo preguntó por qué un 15% se veía distinto.

Ahora el color sale del **texto del premio**. Comprobado con la configuración de mañana:
los tres 15% en naranja, empanadas en crema, nada en marrón, y **cero pares pegados del
mismo color**, contando el que cierra la vuelta — que es lo que la guarda vieja de
`n % 2 === 1` intentaba cubrir y ya no hace falta.

> [!important] Dos gajos pegados del mismo premio SÍ comparten color, a propósito
> Es el mismo premio: verlo como una porción más grande dice la verdad — que hay más
> chances de que salga. Pintarlos distinto para que "no se toquen dos iguales" sería
> disimular la probabilidad real.

## El modal de zona pregunta dónde vivís (28/9/2026)

Tadeo, mirando la tienda en incógnito: *"que el modal de zona sea uno común y
corriente como cualquier otra tienda… arranquemos a comportarnos como una
tienda online seria y profesional"*. La referencia que puso fue Frizata.

> [!important] El problema no era el diseño, era la pregunta
> Hasta ese día el modal preguntaba **"¿sos de Estancias, de Pilar o de un
> club?"** — que es cómo organizamos **nosotros** el reparto. Alguien de El
> Lucero no tiene por qué saber que eso es "Tortugas y alrededores" y que lo
> atiende Marcos. Eran hasta **cuatro pantallas** antes de ver un precio.
>
> Ahora se pregunta lo único que el cliente sabe: **dónde vive**. Escribe su
> barrio y la tienda resuelve zona, zona de Pilar y sub barrio sola.

| | |
|---|---|
| Un campo | *"Ingresá tu dirección de envío"*, con la lista abajo |
| Cada barrio dice | **cuándo entregamos ahí**, y nada más |
| Al final, siempre | **"No encuentro mi barrio"** → lo escribe y lo entrega Maleu |

**La lista se DERIVA, no se escribe** (`_dirDestinos`): sale de
`BARRIOS_PILAR_MODAL` —la misma que arma el desplegable del formulario— más los
barrios que llegan de la planilla (`action=vendedores`). Una lista escrita a
mano sería una segunda copia esperando a quedar vieja el día que entre un
vendedor. Busca **sin acentos** ("rio" encuentra "Río") y los que **empiezan**
con lo tipeado van primero.

> [!note] El envío se sacó de la lista, y lo pidió Tadeo al verlo
> La primera versión decía también cuánto salía el envío de cada barrio:
> *"sacaría el envío, sólo mostraría los días de entrega"*. Tiene razón — el
> precio ahí es ruido, y es lo primero que lee alguien que todavía no miró un
> producto. El envío se ve igual en el carrito.

> [!danger] Clubes salió del modal: la tienda es 100% consumidor final
> Tadeo: *"para todo lo que sea B2B, Clubes, etc, deberíamos hacer nosotros el
> autopedido… que nos pidan las cantidades por WhatsApp"*.
>
> **La zona sigue viva y se entra por link directo** (`setZone('clubes')`): son
> **87 pedidos desde el 21/2/2026**, ~2 por semana, y a nadie que tenga el link
> guardado se le rompe la tienda. Lo que dejó de existir es la puerta pública.

**Una dirección que no reconocemos** cae en "Otra zona de Pilar": la entrega
Maleu, **miércoles y viernes** (decisión de Tadeo), y lo que el cliente escribió
queda cargado en `f-direccion`. No se lo deja comprar a ciegas: sin zona
conocida no sabríamos ni el envío ni el día.

### El agujero de plata que encontró una red al reescribirla

> [!danger] `_pilarBarrioIsRed()` no reconocía un barrio de vendedor hasta que contestaba la planilla
> Sus dos defensas miran el **barrio** ("El Lucero") y eso sólo se sabe cuando
> llega `action=vendedores`; la lista del código tiene las **zonas** ("Tortugas
> y alrededores"). En esos segundos —o si la consulta falla— un cliente de El
> Lucero pasaba por *"no es de vendedor"*: se le ofrecía carne y miércoles, y
> **su pedido se iba a la hoja Pilar en vez de a la Red**. La venta de Marcos,
> cobrada por nosotros.
>
> **Defensa 3: la zona canónica** (`selectedPilarZona`), que la escribe el
> buscador y no depende de ninguna respuesta del servidor.
>
> Lo encontró `verificar-entrada.js` al reescribirlo: ahí el backend está
> simulado y `barrioToVendedor` llega vacío, así que **el agujero se ve
> siempre**. En producción pasaba de a ratos, que es peor — se nota una vez cada
> tanto y no se puede reproducir.

### Cosas del mismo día

- **El barrio no se pregunta dos veces.** Lo elegido en el buscador queda
  marcado en el formulario. Pero **marcarlo no puede borrar el sub barrio**: el
  `change` de `f-barrio-privado` repuebla la lista y pisaba lo que
  `loadClientData` acababa de devolver. Se dispara sólo si el valor cambia. Lo
  agarró `verificar-datos-cliente.js`.
- **La tienda dice que te reconoce** (`_pintarSaludo`): *"Hola, Tadeo. Te lo
  llevamos a Champagnat Alto, Lote 289"*. Los datos volvían solos desde el
  11/9, pero en silencio. Lee **los campos**, no el `localStorage`, así dice lo
  que se va a mandar de verdad. Nació de una pregunta de Tadeo sobre cuentas de
  usuario — ver abajo.
- **`?nuevo=1` SÓLO EN LOCAL** para probar como cliente nuevo. En producción
  sería un link que le borra a cualquiera su nombre, su teléfono y su último
  pedido con sólo abrirlo.

> [!tip] Las redes entran por el buscador, como una persona
> Las ~20 que elegían zona tocando `#loc-step-zone .loc-btn` ahora escriben el
> barrio en `#dir-input` y tocan `#dir-lista .dir-op`. Si aparece otra que
> falla por esto, el helper `elegirBarrio(txt)` ya está en zonas, entrada,
> reserva y sugerencias: copialo.

## Cuando no alcanza el stock, se explica y se ofrece salida (28/9/2026)

Tadeo puso **15 Pizza Margarita para hoy**, el freezer tenía 7, la tienda
recortó a 7 y lo avisó con un toast que *"duró menos de un segundo"*.

**El recorte está bien** —no se puede vender lo que no hay— **lo que estaba mal
era cómo se contaba**. El cliente ve 7 donde puso 15 y no sabe si se equivocó él.

Ahora es una hoja que **se queda hasta que el cliente decide**, dice qué
producto y cuánto quedó, y si hay una fecha sin tope ofrece **"Pedir todo al
viernes"** — que repone las cantidades originales y mueve la entrega.

> [!important] Adentro había una venta
> El que quiere 15 pizzas las quiere igual. Es la diferencia entre vender 7 y
> vender 15, y antes se perdía en un cartel de un segundo.

> [!warning] Un cartel que se queda TAPA la pantalla, y los tests lo sufren
> Al publicarlo, `sin-stock` pasó a 10 rojos y `vigilante` a 10 — ninguno de la
> tienda: los tests seguían tocando botones sin cerrar el cartel. Si una red
> empieza a fallar con "nada tapa el botón" o se queda en "Enviando tu
> pedido…", fijate si quedó abierto `#recorte-modal` y cerralo con
> `recorteNo()`.

## El pedido se cierra en la tienda — PRENDIDO el 29/9/2026

Reunión de equipo del 28/9. Tadeo: *"no es real y profesional que el pedido de
un cliente lo dirija al WhatsApp… debemos tener una tienda online común y
corriente como cualquiera. Que el pedido termine en la tienda"*.

**Nació apagado el 28/9 y se prendió el 29/9 a las 18:40**, cuando las tres
condiciones que esperaba estuvieron cumplidas y verificadas. Lo que sigue son
las razones por las que esperó — valen como historia, no como estado.

> [!danger] Prenderlo solo rompe DOS cosas
> **1. El aviso a nosotros.** El ERP no avisaba de un pedido nuevo por ningún
> lado: **el aviso era el mensaje del cliente**. Backend lo resolvió el mismo
> día (`_avisarPedidoTienda_`).
>
> **2. La confirmación al cliente.** `_confirmarPedidoWA_` manda un **mensaje de
> sesión**, legítimo sólo porque el cliente acaba de escribirnos al saltar a
> `wa.me`. Sin ese salto la ventana de 24 h de Meta no se abre y el mensaje se
> rechaza **en silencio** — el mismo modo de falla que cuando murió el workspace
> de n8n el 31/8. Hace falta un **template de UTILITY aprobado**, y ninguno de
> los 50 de la cuenta sirve: son todos de MARKETING.

**Al 28/9/2026 el template está en Pending en Meta.** Lo cargó Tadeo a mano en
wati.io —crear templates **no se puede por API**, probado endpoint por endpoint
el 1/9— y tarda de minutos a 48 h.

**Cuando aprueben, son cinco minutos:**

1. Backend carga el nombre en `Config_Maleu` → `CONFIRMACION_WA_TEMPLATE`
   (vacío = mensaje de sesión, o sea lo de hoy). Tarda hasta 5 min en tomar.
2. Pedido de prueba con el número de Tadeo, **y lo mira en el celular**: un
   template puede salir "OK" y llegar mal formateado, y eso no lo ve ningún
   código.
3. Recién ahí: `CIERRE_EN_LA_TIENDA = true` **y el botón verde deja de ser de
   WhatsApp** — `.whatsapp-btn` hoy dice "Pedir por WhatsApp" con el logo, y
   pasa a "Confirmar mi pedido" en el naranja de la marca.

**El template quedó con parámetros CON NOMBRE** (WATI no usa posicionales):
`nombre`, `pedido`, `entrega`, `direccion`, `detalle`, `total`. Sin emojis, sin
el footer "Powered by wati.io", y `detalle` lleva **la lista completa** de
productos —no el conteo— porque sin el salto a WhatsApp el chat del cliente
tiene la confirmación y nada más.

> [!important] Si armar la pantalla falla, el pedido se cierra igual
> Lo encontró reinyectar un bug: cuando `_datosDelCierre` tira, el cliente
> quedaba en *"Registrando tu pedido…"* **para siempre**, con el pedido ya
> entrado al ERP — y lo que hace cualquiera ahí es mandarlo de nuevo. Es la
> misma regla que el backend aplica en tres lugares: nada de lo que viene
> después de guardar puede tumbar el pedido.

## Los avisos del ERP suenan en el celular (28/9/2026)

`Config_Maleu` → `AVISOS_CANAL` pasó de **`mail`** a **`telegram`**, con el bot
`@maleu_pedidos_bot` escribiendo en el grupo **"Pedidos Maleu"**
(`AVISOS_TG_CHAT = -5556938423`, Tadeo + Lucas + el bot).

**Por qué importaba hacerlo antes de sacar el WhatsApp:** el aviso de pedido
nuevo es lo único que va a avisar que entró una venta, y salía a dos casillas de
mail. El comentario del propio bloque de AVISOS lo dice desde el 2/9: las
alertas de este ERP siempre murieron porque escribían **en un lugar al que hay
que ir, y nadie fue**. Un viernes a las nueve de la noche un mail no levanta la
cabeza de nadie.

**El mail no se perdió como respaldo:** `_avisar_` manda por mail igual si
Telegram estaba elegido y falló. Por eso NO se dejó en `ambos` — dos avisos de
cada cosa terminan en que no se mira ninguno.

> [!warning] `api.telegram.org` no se alcanza desde el sandbox de Claude Code
> `curl` da 000. Para hablar con la API de Telegram desde acá hay que usar el
> navegador de Playwright, que sí sale. Así se verificaron `getMe`,
> `getUpdates` (para sacar el chat id) y un `sendMessage` de prueba.

> [!note] El bot no contesta nada, y está bien
> No es conversacional: es un emisor. Tadeo escribió `/start` en el grupo, no
> pasó nada y pensó que había fallado. Ese `/start` existe sólo para que el
> `getUpdates` deje ver el chat id — el bot está en modo privacidad
> (`can_read_all_group_messages: false`), que es lo correcto porque sólo tiene
> que escribir.

## Las cuentas de cliente se descartaron por ahora (28/9/2026)

Tadeo: *"un usuario no puede cada vez que entra a maleu.com.ar tener que
completar sus datos cada vez que entra, es un perno"*, y preguntó por el
registro con mail de Frizata (verificado: **email + contraseña**).

> [!important] Lo sentía roto porque estaba probando en incógnito
> Los datos vuelven solos desde el 11/9 y lo cubren 36 chequeos en verde. Lo que
> faltaba era **decirlo** → `_pintarSaludo`. Es el mismo patrón que con la carne
> esa misma tarde: **la forma de probar mostraba un problema que el cliente no
> tiene.**

**Se decidió NO hacer cuentas.** Mail + contraseña trae registro, verificación,
"olvidé mi contraseña" y guardar contraseñas de forma segura — un backend de
autenticación para mantener — y sobre todo es **fricción justo antes de
comprar**, cuando se le acababan de sacar cuatro pantallas a la entrada.

**Si algún día se hace, va por teléfono con código por WhatsApp**, no por mail:
el ERP indexa por teléfono, WATI habla por teléfono y el pedido entra por
teléfono. Y de paso cierra el agujero ya anotado — un endpoint que devuelva
pedidos por teléfono sería una puerta a los datos de cualquiera; **el código es
lo que lo cierra**. Tadeo: *"coincido que por ahora armar cuentas a clientes es
un quilombo y todavía no es urgente"*.

## El hero es una foto, no un slogan sobre fondo crema (28/9/2026)

Tadeo: *"vos tenés el acceso al Google Drive, así que ya podés meter dos, tres
fotos para que la gente ya mire"*. Era lo único que quedaba de la deuda del
23/9 —*"que la tienda no parezca hecha con IA"*—, y ahí quedó anotado el
porqué: **Momento abre con una foto a sangre y nosotros abríamos con texto.**

| | antes | ahora |
|---|---|---|
| la primera pantalla | un slogan centrado sobre crema | **tres fotos**, con el título encima |
| el alto | el del texto | 250px en el celular, 400 en la compu — **del CSS** |
| el CLS de la carga | 0 | **0**, medido cinco corridas seguidas |
| peso extra | — | **ninguno** |

> [!important] Las tres fotos son del catálogo, y por eso no pesan
> `sorrentinos-cordero-v2.jpg`, `pizza-margarita-cocida.jpg` y
> `categoria-carnes.jpg` **ya se bajaban** para las cards y los tiles de abajo.
> El navegador las pide una sola vez, así que la primera pantalla no cuesta un
> byte más. Ya están selladas en `IMG_V` por la misma razón.
>
> **No son fotos de ambiente pensadas para un hero**, y se nota: son fotos de
> producto recortadas. Cuando Tadeo saque las de verdad se cambian los tres
> `src` de `index.html` y listo — el resto no se toca.

> [!danger] El alto sale del CSS. Si alguien se lo saca, vuelve el salto
> Una foto sin lugar reservado empuja media página cuando termina de bajar:
> es el modo de falla número uno de un hero con imágenes, y Google lo
> penaliza. Acá el contenedor tiene alto propio y las fotos van
> `position:absolute` adentro, así que **no participan del flujo**.
>
> Medido con el control puesto: **sin el alto fijo el contenedor queda en 0px**
> y el test corta. Y contra la tienda de antes del carrusel el CLS también da
> 0 — o sea que el 0 de ahora no es del instrumento, es de la página.

**Los puntos nacieron mal y los agarró una red vieja.** Medían 24px y la regla
de este repo son **44** (la misma que se le aplicó a los controles del combo el
13/9/2026). Lo marcó `verificar-layout.js` sin que nadie lo tocara: *"mide 24px
de alto (mínimo 44)"*. Hoy el botón mide 44x44 y el punto que se ve, 7px.
Por eso el título subió a `bottom: 3.2rem`: con el área tocable de 44px desde
el borde, el dedo que apuntaba a la última línea le caía al carrusel.

**La cantidad de puntos sale de las fotos que haya** (`_heroArrancar` los
dibuja), no de un número escrito a mano. Es la lección de la ruleta cuando
pasó de 5 premios a 6: el día que sean dos fotos o cuatro, no hay que acordarse
de nada.

**Deja de girar solo apenas el cliente elige** una foto o desliza. Si eligió
una, moversela sola es pelearle. Y con la pestaña de fondo no gira, para que
no se acumulen vueltas para cuando vuelva.

**El deslizar sólo cuenta si el movimiento es más horizontal que vertical.**
Sin eso, el que scrollea la página con el dedo encima de la foto cambia de
slide sin querer.

**El velo no es decorativo.** Es un degradado oscuro de abajo hacia arriba
entre la foto y el título: sin él, el blanco se pierde en la foto de la pizza,
que tiene el fondo claro. El `span` de «Pensá en Maleu» va en `#FFC9A6` —el
naranja de marca aclarado— porque el `--orange` puro no se lee sobre foto.
**Eso no es tocar el color de marca**: el `--orange` no se movió.

### La red: `node _tools/verificar-hero.js [ancho]`

**25 chequeos**, verdes a 390 y 1440px: el alto propio (y que no cambie al
esconder las fotos), el CLS de la carga, que las tres fotos existan —un 404
deja el hero negro— con su `alt` y recortándose en vez de deformarse, un punto
por foto de 44px, el orden de las capas velo/título, la vuelta en los dos
sentidos, que el giro se detenga cuando el cliente elige, y cero POST.

Probada en la dirección contraria con **ocho bugs reinyectados de a uno**
—sacar el alto, una foto 404, una sin `alt`, sin velo, sin sombra, que siga
girando, `object-fit:fill`, y los puntos escritos a mano— y **los ocho se
agarran**. Se corre con `RAIZ=<carpeta>`.

> [!warning] `Fetch.enable` cuelga el test entero, y no lo dice
> La primera versión cortaba los POST con `Fetch.enable`, que **pausa cada
> request esperando que el test la conteste**. Sin manejar sus eventos, la
> página no carga nada y el test mide un hero vacío dando verde. Se cortan con
> `Network.setBlockedURLs`, que además saca Analytics y Meta — si no, cada
> corrida le suma visitas falsas a las métricas reales.

> [!note] El CLS midió 0,005 dos veces y 0 las cinco siguientes
> Las dos primeras lecturas fueron con el disco frío. No se repitió en cinco
> corridas seguidas y está veinte veces por debajo del umbral de Google, así
> que se deja medido y anotado en vez de perseguido. **Si alguna vez sube de
> 0,01, el test ahora dice qué elemento se movió** — no sólo cuánto.

### La grilla de categorías reserva su lugar (28/9/2026)

El `index.html` trae `#cat-tiles` **vacía** y el JS la llena. Entre el primer
pintado y ese momento la sección crece y empuja todo lo de abajo. Medido a
1440px: **de 0px a 456px**.

Se resuelve con `min-height`, igual que el carrusel del hero el mismo día. El
alto sale de **`--cat-filas`**, que pone `renderCatTiles()`; el CSS reserva
**3 filas por defecto**, que es el caso de Estancias (9 categorías de a 3) y de
donde sale la mayor parte de las visitas.

> [!danger] El salto NO se puede medir de forma repetible — la reserva sí
> El CLS de 0,3801 a 1440px aparecía **una de cada tres corridas**, y después
> **no volvió a salir en ocho seguidas**, ni con el arreglo ni sin él. Con una
> medición así no se puede demostrar nada: da verde igual estando roto.
>
> Lo que sí es determinista es preguntar por **la causa**: ¿la grilla vacía ya
> ocupa su lugar? Medido con una `.cat-tiles` vacía creada al vuelo:
>
> | | sin el arreglo | con el arreglo |
> |---|---|---|
> | grilla vacía, 1440px | **0 px** | **692 px** |
> | grilla vacía, 390px | **0 px** | **206 px** |
> | y con las filas de la zona | — | **igual que la llena, al píxel** |
>
> **La lección es sobre qué se mide.** Un síntoma intermitente no sirve de
> chequeo; la condición que lo causa, sí. Es lo mismo que ya está escrito para
> el píxel de Meta: cuando el instrumento no puede repetir el resultado, hay
> que mirar el dato desde otro ángulo.

> [!note] Queda un achique de 236px en los barrios con vendedor
> Son 8 categorías (sin carne) y el CSS reserva 3 filas hasta que el JS dice
> que son 2. Antes ese caso saltaba 456px, así que mejora, pero no es cero. Se
> arreglaría sabiendo la zona antes de que corra el JS, y eso no se puede: la
> zona vive en `localStorage` y la lee el JS.

### La chapita "Nuevo" salió de los cinco cortes de carne (28/9/2026)

La tenían desde el **10/9**: dieciocho días. Decisión de Tadeo al verlo en el
recorrido: *"sacala"*. Es la única chapita que hace que un cliente que ya
compró vuelva a mirar el catálogo — gastada deja de significar algo.

> [!note] Los 4 sorrentinos premium siguen con `nuevoEn:["estancias"]`
> Se abrieron a esa zona el **mismo 10/9**, así que tienen la misma edad. Se
> dejaron a propósito: no se preguntó por ellos. Si la regla es «a las dos
> semanas deja de ser nuevo», les toca también.

### La primera pantalla no muestra lo que esa zona no vende (28/9/2026)

Segundo hallazgo del simulador, entrando como un cliente de **El Lucero**: lo
primero que veía era el hero con una **foto de carne a la parrilla a toda
pantalla**, y abajo no hay categoría Carnes ni un solo corte. Los barrios con
vendedor van a la hoja `Red`, que **no tiene columnas de kilos**, así que la
carne no se les vende — está bien que no esté, lo que estaba mal era
prometerla arriba.

Lo resuelve `_heroSegunZona()`, colgado de **`applyZone()`** —por donde pasan
todas las puertas: la zona guardada, el modal y el cambio de barrio—, no de los
call sites. La foto se declara en el HTML con `data-cat="carne"`; para sumar
otra regla mañana alcanza con marcarla.

Tres cosas que el test comprueba y que son fáciles de romper:

- **si la activa queda escondida, se pasa a la primera que sí va** — si no, el
  hero se queda en negro;
- **los puntos se recalculan** (2 fotos → 2 puntos), y con una sola no se
  dibuja ninguno: un punto suelto invita a tocar algo que no hace nada;
- **si se escondieran todas, no se esconde ninguna.** Hoy no puede pasar, pero
  el día que sean dos fotos el código no miente.

`verificar-hero.js` pasó a **32 chequeos**, con el control puesto: antes de
exigir que la foto de carne no esté, exige que esa zona efectivamente no venda
carne.

> [!danger] La tienda salta 0,38 al cargar en la computadora — y NO es del hero
> Medido el 28/9/2026 a 1440px: **una de cada tres cargas** da un CLS de
> **0,3801**, casi cuatro veces el 0,1 que pide Google. El culpable es
> **`#cat-tiles-section`**, que pasa de 120 a **334px** de alto cuando se llena
> la grilla de categorías y empuja todo lo de abajo.
>
> **Es preexistente**: medido contra HEAD sin el carrusel, pasa igual (1 de 3
> en las dos ramas). Por eso el chequeo duro de `verificar-hero.js` es sobre
> **los elementos del hero**, y el total de la página sale como **aviso** con el
> culpable nombrado. Un rojo que aparece una de cada tres corridas por algo que
> no es del hero deja de mirarse, y entonces no sirve para nada.
>
> **RESUELTO ese mismo día**, reservando el alto de la grilla antes de llenarla,
> igual que el carrusel: ver «La grilla de categorías reserva su lugar», más
> abajo. Este aviso decía "queda abierto" y quedó contradiciendo a la sección que
> lo cerró — dos partes del mismo documento diciendo cosas distintas hacen perder
> más tiempo que no haber escrito ninguna.

## La tienda vendía entregas cuyo reparto ya había salido (28/9/2026)

Tadeo pidió que el simulador de experiencia de cliente lo hiciera yo, *"de
arriba hacia abajo, siempre poniéndote en el lugar del cliente"*. Esto salió en
el primer recorrido, a las 19:16 de un lunes, y es el agujero más caro que
tenía la tienda.

> [!danger] "HOY · 18 a 19 hs", ofrecido a las 19:16
> En Estancias el reparto del lunes es de 18 a 19. A las 19:16 la tienda
> seguía ofreciendo ese día, dejaba armar el carrito, elegirlo en el
> calendario y llegar al botón. El cliente paga por transferencia y espera
> una entrega que **no puede ocurrir**.

**El filtro existía y no hacía lo que decía.** En `_getNextDeliveryDatesGrouped`
había una línea comentada *"si la entrega ya terminó, saltar"*, que llamaba a
`_deliveryEndMs(iso)` — y esa función devolvía **la medianoche del día**. O sea
que preguntaba por el fin del *día*, no por el fin de la *entrega*: nunca sacaba
«hoy».

Es el patrón que este repo ya conoce: **el nombre de la función decía una cosa y
el cuerpo hacía otra**, y el call site le creyó al nombre. Por eso ahora se llama
**`_cierreDelDiaMs`**.

**Cuánto duraba el agujero**, con los horarios de Estancias (lun 18-19,
mié/vie/sáb 19-21, dom 11-13) aceptando siempre hasta medianoche:

| día | ventana en la que se vendía lo imposible |
|---|---|
| lunes | 6 h |
| miércoles · viernes · sábado | 5 h cada uno |
| **domingo** | **13 h** — se reparte a las 11 y se seguía vendiendo todo el día |
| | **~34 horas por semana** |

> [!important] El corte es el INICIO de la franja, no el final
> Si el reparto sale a las 18, pedir a las 18:30 tampoco llega. Lo que importa
> no es cuándo termina el recorrido, es **cuándo deja de poder entrar un pedido
> a ese recorrido**. Si algún día se arma más tarde, se corre el número; el
> lugar es uno solo.

> [!warning] Sin hora declarada no se inventa ninguna
> Pilar y Clubes dicen **"A coordinar"**, así que ahí se mantiene el día entero
> —lo que hacía antes— y el test lo comprueba. **Queda abierto para Tadeo:** si
> esas zonas tienen una hora de salida, se escribe en `horarios` y el corte sale
> solo. Mientras no se sepa, un miércoles a las 23 hs Pilar sigue aceptando
> «hoy».

### La red: `node _tools/verificar-horario.js`

**17 chequeos.** Mueve el reloj a los dos lados del corte de cada día —lunes
17:30 y 19:16 y 23:40, domingo 10:00 y 13:30, miércoles 18:45 y 21:30— porque
**es la única forma de probarlo: un martes al mediodía todo da verde igual**.
Contra la tienda de antes da **5 rojos**.

> [!danger] Los cuatro chequeos que importaban pasaban sin medir nada
> La primera versión preguntaba por `d.label === 'HOY'`, y el campo se llama
> `dayShort`. O sea que «¿está hoy?» daba **false siempre**, y los cuatro
> chequeos de *"NO se ofrece hoy"* pasaban con el bug puesto. **Los delataron
> los tres casos que esperaban lo contrario** — los que exigían que hoy SÍ
> estuviera. Sin esos tres, la red habría quedado verde sobre un agujero
> abierto.
>
> Es el mismo control que ya está escrito para `verificar-paneles`: antes de
> exigir que algo no aparezca, hay que exigir que en el caso anterior aparezca.

> [!note] Y de paso, dos trampas de este repo que volvieron a morder
> · **Backticks adentro de un template string**: rompieron el test con
>   `SyntaxError`. Ya estaba anotado; el comentario los tenía.
> · El `console.warn` de `fetchStock` se traga los fallos del refresco. Se vio
>   uno en producción durante el recorrido y **no es grave** —el stock anterior
>   queda y el siguiente refresco lo arregla—, pero conviene saber que existe:
>   medido en la sesión viva, `stockMap` tenía los 29 productos.

### Lo demás del primer recorrido

| | |
|---|---|
| el modal decía *"te mostramos los días y **el envío** de tu barrio"* | Tadeo sacó el envío de la lista el 28/9: el subtítulo prometía algo que ya no está. Ahora dice sólo los días |
| un **🥩** en el resumen del formulario | del rediseño del 23/9 quedó ese suelto. Es de 4 bytes, de los que se ven rotos en uno de cada cuatro celulares |
| la chapita **"Nuevo"** en los cortes de carne | lleva puesta desde el 10/9. **Es de Tadeo decidir cuándo sacarla**: es la única chapita que hace que un cliente frecuente vuelva a mirar el catálogo, y gastada deja de significar algo |

## El codigo del vendedor le deja el cliente A EL (28/9/2026)

Joaco rehizo la politica de ganancias de la Red (artifact *"Maleu Red: tu
negocio"*): se muere el 17% y pasa a ser un **monto fijo por unidad segun el
nivel del mes** (Inicial / Intermedio / Top, por venta mensual acumulada, y al
subir de nivel **se recalcula el mes entero**), mas los $3.000 de envio, las
propinas, y un **bono de $15.000** por cada cliente nuevo que entro con el
codigo del vendedor y hace su 2da compra dentro de 60 dias.

Ese bono se apoya en una sola cosa: que el pedido diga **quien trajo al
cliente**. Y eso no funcionaba.

> [!danger] Un codigo MARCOS10 no entraba, y salia en silencio
> El filtro del link era `/^RUL(?:ETA)?-[A-Z0-9]{4,}$/` y cualquier otra cosa
> salia con `return` **sin avisar**: ni descuento, ni aviso, ni registro. Es el
> mismo bug que el 24/9 dejo a un cliente real pagando **$18.000 sin su
> descuento** con `?cupon=EMPA20`.
>
> Hoy el filtro es **por forma** (`/^[A-Z0-9][A-Z0-9-]{2,23}$/`) y no por
> prefijo. Un prefijo no defiende de nada —quien quiera probar codigos manda
> `RUL-AAAA`, `RUL-AAAB`— y el que decide si un cupon vale es el backend.

**El contrato con Backend (@726):** `validarCupon` devuelve `vendedor` —el
`Usuario` de la hoja `Vendedores`— **solo cuando valida contra esa hoja**. Un
usuario mal tipeado o dado de baja no lo trae. O sea que si esta, es confiable.

> [!danger] La trampa esta en el `else`, y la levanto Backend
> Cuando la validacion no matchea, **el descuento sale igual** (un error de
> planilla no le puede costar el descuento al cliente). Entonces un codigo de
> vendedor que no valido **tambien llega sin el campo**, y escribir
> `if (d.vendedor) delVendedor() else deMaleu()` seria marcar "lo trajo Maleu"
> a un cliente que trajo el vendedor — **le sacaria la venta por un error de
> planilla**, que es justo lo que este codigo vino a evitar.
>
> Por eso la rama de *"es nuestro"* la dispara que el codigo **sea de la
> ruleta**, no la ausencia de `vendedor`.

| el cliente entra con | descuento | quien lo trajo |
|---|---|---|
| `MARCOS10` con `vendedor` | si | **el vendedor** |
| `MARCOS10` sin `vendedor` (fallo la validacion) | **si** | nadie — no se inventa ni se le quita |
| `RULETA-K3P9` | si | **Maleu** (regla del 24/9) |
| `EMPA20`, campaña de WATI | **si** — antes ni entraba | nadie: le habla a la base que **ya** nos conoce, con los clientes de los vendedores adentro |

**No se toca el ruteo por barrio.** Un cliente del barrio de Rufo que usa
`MARCOS10` sigue yendo a la hoja de Rufo, y el pedido viaja diciendo que lo
trajo Marcos (`vendedorTrajo`). **A quien se le paga lo decide el ERP**, que es
donde vive la liquidacion: resolverlo en el navegador del cliente seria repartir
plata de otros desde ahi. Que gane el codigo o el barrio lo decide Tadeo.

**El primero que lo trajo es el que vale**: si vuelve con el codigo de otro,
sigue siendo del que lo consiguio. Misma regla que `_guardarOrigenNuestro`.

### La red: `node _tools/verificar-cupon-vendedor.js [ancho]`

**17 chequeos** con el backend simulado: el codigo del vendedor, **el caso sin
`vendedor`** (que el descuento salga y que NO se marque nuestro), la ruleta, la
campaña, que no se pise al primero, y que una basura no se consulte. Contra la
tienda de antes da **4 rojos**. Cero POST.

> [!warning] Los scripts de `addScriptToEvaluateOnNewDocument` SE ACUMULAN
> El `localStorage.clear()` de una visita seguia corriendo en las siguientes,
> asi que *"el primero que lo trajo no se pisa"* medía sobre un storage recien
> borrado: **daba rojo culpando a la tienda de algo que hacia bien**. Hay que
> quitar el anterior con `Page.removeScriptToEvaluateOnNewDocument`.

> [!important] Que falta, y no es de la tienda
> · La **tabla de monto por producto x nivel** (29 x 3), el **nivel mensual con
>   recalculo retroactivo** y el **bono de $15.000** son del ERP. La hoja
>   `Vendedores` tiene **una sola** columna "Comisión %": no alcanza.
> · **La politica todavia no esta aprobada.** Comparado con el 17% de hoy sube
>   en pizzas, packs y tartas (+8% a +18%) y baja fuerte en lo caro de margen
>   fino: tortas **-83%**, entraña **-74%**, lomo **-73%**, brie y langostinos
>   **-68%**. En el "pedido tipo" de $92.000 da parecido, pero un vendedor con
>   mucha carne o torta en su mix va a cobrar bastante menos.
> · **Verificado**: los 34 precios del documento de Joaco coinciden uno por uno
>   con los de la tienda. Esta calculado sobre precios reales.

> [!important] LOS TRES CUPONES EXISTEN Y DAN 10% (verificado el 29/9/2026, 19:10)
> Acá decía que no existían y que el descuento estaba pendiente de Tadeo. **Es falso
> desde el 28/9**: Backend los creó en la hoja `Cupones` (filas 51-53) y contestan por
> el endpoint de producción:
>
> ```
> MARCOS10 -> ok:true · PCT 10 · TODO · stack:false · vendedor:"marcos"
> FINI10   -> ok:true · PCT 10 · TODO · stack:false · vendedor:"fini"
> RUFO10   -> ok:true · PCT 10 · TODO · stack:false · vendedor:"rufo"
> ```
>
> Sin vencimiento, segmento *"Red - codigo de vendedor"*. O sea que el descuento ya
> está decidido y el camino funciona de punta a punta.

> [!danger] Pero EN EL BARRIO DE UN VENDEDOR el código no descuenta nada
> `cuponValeEnEstaZona()` es `false` con `currentZone === 'pilar' && _pilarBarrioIsRed()`,
> porque los pedidos de la hoja `Red` van sin descuentos y el ERP los recalcularía: el
> cliente vería un total y la planilla guardaría otro. Está medido en el escenario 7 de
> `verificar-vendedor.js` — *"pero NO descuenta"* y *"se dice por qué, en vez de dar cero
> callado"*.
>
> **Y la atribución SÍ viaja igual**: `_vendedorQueTrajo()` lee el `localStorage` y no
> mira la zona, así que el pedido lleva `vendedorTrajo` lo mismo. El bono se puede
> pagar; lo que no llega es el 10%.
>
> | el cliente usa MARCOS10 y vive en | descuento | atribución |
> |---|---|---|
> | Estancias, o Pilar que entrega Maleu | **10%** | Marcos |
> | un barrio con vendedor (El Lucero, Manzanares…) | **0%**, dicho en pantalla | **Marcos igual** |
>
> **Es el caso central de la política nueva y hay que decidirlo, no arreglarlo al
> pasar**: el vendedor camina SU barrio, y ahí su código no tiene gancho. Cambiarlo
> pide las dos puntas — que el ERP acepte descuento en la hoja `Red` — y le baja el
> margen a esa venta. Es de Tadeo.

## El checkout en tres pasos (29/9/2026)

Tadeo, con el template de Meta recien aprobado: *"la etapa de completar sus
datos, despues la parte de pago, despues la parte de dia de entrega, y un boton
de Realizar Compra que se vaya como cargando hasta llegar a toda la barra... como
en Mercado Pago"*. Y: *"copialo identico a Frizata"*.

| | antes | ahora |
|---|---|---|
| el formulario | **una pantalla larga**: pago, direccion, telefono, dia, cumpleanios y boton | **tres pasos** con indicador |
| el orden | el pago primero | **datos - pago - entrega** |
| el que vuelve | veia todo igual | **arranca en el pago**: sus datos ya estan |
| el boton de comprar | a la vista desde el principio | **solo en el paso 3** |
| el total | solo en el resumen de arriba, que se va de pantalla | **un renglon fijo**, en los tres pasos |
| la barra del envio | **indeterminada**: un bloque deslizandose en loop | **dice cuanto falta** |

> [!danger] Frizata NO se copio identico, y es a proposito
> Se recorrio frizata.com hasta "Terminar compra": ahi abre un muro de **email y
> contraseña, sin salida de invitado** (buscado: no hay "continuar sin
> registrarme"). Copiarlo seria poner un registro justo antes de pagar —
> **exactamente lo que Tadeo descarto el 28/9**— y deshace las cuatro pantallas
> que se le sacaron a la entrada el 23/9.
>
> Frizata puede: el 100% de su venta es online y su cliente ya la conoce. El de
> Maleu entra por un link de WhatsApp de su vecina.

> [!important] El pago paso de primero a segundo, y la razon vieja habia caducado
> El comentario que estaba ahi decia: *"para que el cliente vea el 10% de efectivo
> antes de tipear cupon"*. **El campo de cupon manual ya no existe** — verificado,
> cero ocurrencias de `f-cupon` en las 11 paginas. Se saco con la ruleta.

> [!danger] NO hay una segunda validacion, y esto es lo que mas cuida la red
> `enviarPedido` **no se toco**: sigue siendo la ultima puerta. Lo que se agrego
> es `_coFaltaEnPaso(n, callado)`, con **las mismas condiciones**, para frenar
> antes. Que esten escritas dos veces es el riesgo conocido de este repo —dos
> formas de hacer lo mismo se despegan—, asi que el bloque D de
> `verificar-checkout.js` **vacia cada campo obligatorio de a uno y exige que
> LAS DOS lo frenen**, con su control: que con todo completo ninguna frene.

> [!warning] Si falta un campo de OTRO paso, `enviarPedido` lleva a ese paso
> Sin eso le hace `scrollIntoView` a un `display:none`: el cliente ve el
> formulario quieto, sin ninguna pista de que le falta algo. Se resuelve en el
> unico lugar por el que pasan todos los campos —el `if (primerInvalido)`— y no
> en los diez `primerInvalido=` de arriba.

> [!important] Los tres pasos viven en el DOM todo el tiempo
> Se tapan con `[hidden]`. Es lo que deja que `enviarPedido` lea los campos por
> id sin enterarse de en que paso estan, que lo escrito sobreviva al ir y volver,
> y que el calendario no se repinte. **No se movio ni un id ni un onclick.**

### La barra: no llega al final sola

Avanza hacia el 90% con una curva que se va frenando —rapido al principio, casi
quieta pasados los ~8 s que tarda el POST medido— y **el ultimo tramo lo completa
la confirmacion del ERP**. Una barra que se llena por su cuenta y despues espera
es la version bonita del bug que costo el pedido de $84.600 el 10/9.

> [!danger] Habia UNA BARRA YA PUESTA, y era indeterminada
> `.send-progress`: un bloque del 35% deslizandose en loop infinito, que se movia
> igual a los 2 s que a los 40. La primera version de esto agrego **una segunda
> barra** tres centimetros mas arriba. Se vio en una captura, no en un numero.
> Hoy hay una sola: se convirtio esa en determinada, y el test exige que sea una.

> [!danger] La barra mide con `performance.now()`, NO con `Date.now()`
> `Date.now()` contesta *"que hora es"*, que no es la misma pregunta que
> *"cuanto paso"*: salta si el sistema ajusta la hora, y **las redes de este repo
> congelan `Date` a proposito** para poder probar un domingo un martes. Con
> `Date.now()` la barra se quedaba clavada en 4% adentro de cualquiera de esos
> tests **y en produccion andaba bien** — el peor tipo de bug. Lo agarro
> `verificar-checkout.js` en su primera corrida.

### La red: `node _tools/verificar-checkout.js [ancho]`

**108 chequeos**, verdes a 390 y 1440px, con el reloj congelado el lunes
14/9/2026: un solo paso a la vista y el indicador marcandolo; "Continuar"
frenando lo incompleto con el foco donde falta; el boton de comprar solo en el 3;
volver sin perder lo escrito; no poder saltar a un paso que no se alcanzo; las
dos validaciones frenando los mismos campos; `enviarPedido` llevando al paso
escondido; el que vuelve arrancando en el pago; el total siguiendo al medio de
pago y saliendo de la misma cuenta que el carrito; la barra; y el cierre
completo con `?cierre=1`, hasta la pantalla de «Pedido #N confirmado», con el
control de que sin el parametro el boton sigue siendo el de WhatsApp.

Probada al reves con **ocho bugs reinyectados de a uno** —el boton de comprar a
la vista desde el paso 1, "Continuar" sin validar, volver borrando lo escrito,
saltar a un paso no alcanzado, `enviarPedido` sin llevar al paso, el que vuelve
arrancando en el 1, la barra llenandose sola y el total sin seguir al pago—:
**los ocho se agarran.**

> [!warning] `verificar-entrada.js` tocaba el calendario apenas abria el formulario
> Ese calendario ahora vive en el paso 3, asi que el toque le caia a un elemento
> de alto 0 y el test se cortaba. **Medido contra HEAD limpio antes de tocarlo**:
> ahi daba 67 ok / 0 mal, o sea que el rojo era mio. Se le agrego el recorrido de
> los pasos, como hace una persona. Es el mismo arreglo que se les hizo a cinco
> redes el 23/9. Si aparece otra que falla por esto, el bloque a copiar esta ahi.
>
> Las otras doce redes que se corrieron pasaron sin tocarlas: formulario,
> datos-cliente (36 ok, se le fue el rojo preexistente), envio, zonas, sin-stock,
> reserva, vendedor, pedido, sugerencias, descuento, paneles y llamadas. El unico
> rojo que queda es el de `verificar-ultimo-pedido` ("dice la carne que llevo"),
> **preexistente y medido contra HEAD: falla igual**. **CERRADO esa misma noche, y
> no era del test: la tienda perdia cortes** — ver la seccion mas abajo.

### La confirmacion ocupa la pantalla (29/9/2026, a la tarde)

Tadeo, despues de probar el cierre con `?cierre=1`: *"funciono el flujo! eso es
lo importante... me gustaria que cuando se realiza la compra, que adentro de la
misma tienda, no salga un cartel como estos, sino mas bien un html completo con
todo el detalle del pedido, ocupando toda la pantalla, y que tenga la opcion de
volver a la tienda, o la opcion de que tiene duda con el pedido"*.

| | antes | ahora |
|---|---|---|
| la confirmacion | un modal de 380px sobre fondo oscuro | **la pantalla entera**, fondo claro |
| el detalle | un renglon del `<dl>` con saltos de linea adentro | **una lista**, un producto por renglon con su precio |
| volver | un boton que decia «Listo» | **«Volver a la tienda»** |
| la duda | un link chiquito al pie, del tamanio de la letra chica | **un boton de 48px** |

**Solo en el estado `done`.** Mientras el pedido se registra sigue siendo el
cartel, y eso es correcto: ahi todavia se puede volver atras. `hideSendLoader`
saca la clase `pantalla` — sin eso, el proximo *"Registrando tu pedido…"*
saldria a pantalla completa sobre fondo claro, que es la cara del pedido YA
cerrado, y diria que termino algo que recien empieza.

> [!danger] El circulo del check quedo ovalado, y no lo dijo ningun numero
> La regla que centra el contenido (`.send-card > * { max-width:520px; width:100% }`)
> le pego tambien al `.send-loader`, que es **cuadrado de 84px**: quedo un ovalo
> de 84x72. Y despues de arreglarle el ancho seguia en 84x72, porque el card es
> una columna flex y le comia el alto — hizo falta `flex: 0 0 84px`.
>
> **Se vio en la captura de pantalla, no en una medicion.** Es la tercera vez
> que pasa en este repo: los carteles de stock del 10/9, la segunda barra de
> hoy a la mañana, y esto. Ahora el test lo mide (`loaderW === loaderH`).

### Dos textos y un logo

- **El cartel de zona** decia *"Entregamos en Estancias, Pilar y alrededores"*.
  Ahora dice **"Envios a Zona Norte"**: mas corto y no se queda viejo cada vez
  que entra un barrio.
- **El pie** decia **MALEU** en mayusculas. Ahora es el logo —`logo-maleu-blanco.png`,
  la version blanca, que es la que corresponde sobre el marron—. **El archivo ya
  estaba en el repo y sellado en `IMG_V` desde el 7/9, sin que lo usara ninguna
  pantalla.** Va con `width`/`height` y `aspect-ratio` para no mover nada
  mientras baja: el CLS de la carga esta en 0 y tiene que seguir ahi.

> [!warning] `index.html` ya no nombra al dueño, y conviene que siga asi
> `verificar-paginas.js` pasó de **9 a 13** problemas con los comentarios que se
> agregaron hoy: el archivo se publica entero en maleu.com.ar, comentarios
> incluidos. Se reescribieron como *"pedido del 29/9/2026"*; el porque completo
> vive en este archivo, que **no** se publica.
>
> Los **9 de `ruleta.html` son preexistentes** y Tadeo dijo que no importan. Lo
> que no puede pasar es que el numero crezca: una red que siempre da rojo deja
> de mirarse, y entonces no sirve para nada.

> [!note] Pendiente medido, y NO es de la tienda: el pedido tarda 7-9 s
> Tadeo: *"el boton de realizar la compra tardo unos buenos segundos"*. Medido
> contra produccion, **el piso de Apps Script es 0,3 s** (tres `GET stock_full`
> con `t` aleatorio: 0,406 · 0,291 · 0,277). O sea que **los segundos no son de
> la plataforma**: estan adentro de `doPost`.
>
> Ojo que esto **corrige lo que decian los dos CLAUDE.md**: el de Maleu habla de
> «~4 s cada una» y el de la tienda de «como minimo ~5 s». Con este numero, eso
> quedo viejo.
>
> Se le paso a Backend con dos preguntas: que hay entre que se escribe la fila y
> el `return` (los avisos y la confirmacion podrian ir despues), y si el LOCK de
> `doPost` se puede acotar a la escritura. **Del lado de la tienda no hay nada
> que achicar**: sale un solo POST, sin reintentos, y el test lo exige.

### Se prendió el 29/9/2026 a las 18:40

Las tres condiciones estaban, y la tercera es la que ningún código podía dar
por cumplida:

| | |
|---|---|
| el aviso a nosotros | `_avisarPedidoTienda_` + Telegram al grupo «Pedidos Maleu» (28/9) |
| el template de UTILITY | `confirmacion_pedido_tienda`, **aprobado por Meta** y cargado por Backend en `Config_Maleu` -> `CONFIRMACION_WA_TEMPLATE` (29/9) |
| **verlo en un celular** | Tadeo hizo **dos pedidos de verdad** con el flujo nuevo el 29/9 y vio llegar la confirmación a su teléfono, más el aviso de Telegram. Los dos los canceló la sesión Backend |

> [!important] Por qué el tercero no era ceremonia
> El cuerpo del template es **posicional** (`{{1}}..{{6}}`), pero WATI lleva
> aparte una lista `customParams` con el **nombre** de cada hueco, y los declara
> **en un orden distinto al del cuerpo**. Si mapea por nombre, perfecto; si
> mapeara por orden, el cliente leería *"¡Gracias Viernes 02/10!"*. Mirar el
> cuerpo no alcanza: eso solo se ve en la pantalla de un teléfono.

**Y se fue `?cierre=1`**, el parámetro que existía para probarlo sin prenderlo
para todos. Un parámetro muerto se lee como si hiciera algo. Si aparece un link
viejo con `?cierre=1`, hoy no hace nada: el flujo es ese para todo el mundo.

| | antes | ahora |
|---|---|---|
| el botón | «Pedir por WhatsApp», verde `#25D366`, con logo | **«Realizar mi compra»**, naranja de marca, sin logo |
| la nota | *"te llevamos a WhatsApp con el detalle"* | *"te mandamos la confirmación por WhatsApp"* |
| al confirmar | salta a `wa.me` | **se queda en la tienda**: «Pedido #N confirmado» |
| la confirmación | la escribía el cliente al caer en el chat | **la manda el ERP** por el template |

> [!important] El salto a `wa.me` sobrevive en dos lugares, los dos a propósito
> · **El fallback de los 45 s**, donde la web no pudo confirmar y el cliente
>   todavía necesita escribirnos él. Ese mensaje es el único que sigue vivo, y
>   es el que lleva la referencia para cruzar con `Log Pedidos`.
> · **El CONTROL de `verificar-envio`**, que apaga el interruptor desde la
>   página para probar que el mismo pedido **sí** se iría a WhatsApp. Sin ese
>   control, *"no fue a WhatsApp"* probaría que el pedido no salió.
>
> Por eso `CIERRE_EN_LA_TIENDA = false` sigue siendo un valor posible y el
> `msgNormal` sigue armándose, aunque hoy no le llegue a nadie.

#### El agujero que destapó el cambio: la reserva de carne en efectivo

> [!danger] "Aprox. $148.088" sin decir cuándo deja de ser aprox.
> Con carne reservada el total no es el final — la pieza se pesa cuando llega —
> y eso la tienda lo dice en el carrito, en el resumen y en el total del
> checkout. Lo que lo cerraba era el mensaje de WhatsApp: *"la carne reservada me
> la confirman cuando llegue (viernes 18/9)"*. **Con el pedido terminándose en
> la tienda, ese mensaje ya no existe.**
>
> En la pantalla de cierre la nota colgaba del **alias**, y **en efectivo no hay
> alias**: el bloque entero quedaba escondido. Hoy la nota sale igual, con la
> fecha (`cuandoRes`), sin importar cómo paga.

> [!warning] Y al arreglarlo apareció el patrón de siempre
> Un `else` colgado del alias **volvía a esconder el bloque dos líneas después
> de pintarlo**. Es el mismo modo de falla que la franja del 10% el 23/9, que
> `updateUI()` reencendía después de que `updatePromoBar()` la apagara. Ahora es
> `pago.hidden = !pago.firstChild`: escondido solo si no quedó nada adentro.

#### Las redes: once chequeos medían el DESTINO y no el hecho

Cinco redes usaban **la navegación a `wa.me`** como señal de *"el pedido se dio
por confirmado"*, porque el pedido terminaba ahí. Hoy la señal es la pantalla de
cierre (`.send-card.done`). Lo que esos escenarios miden —**tiempos y
reintentos**— no cambió: cambió de dónde sale el instante. Por eso hay **un solo
helper nuevo**, `cerroEn(est)`, y no once parches.

| red | cómo quedó |
|---|---|
| `verificar-envio` | **52 ok**. `ok6` perdió los 5 chequeos del texto del mensaje normal: hoy no le llega a nadie. El que sigue vivo es el del fallback, medido en el escenario "nunca" |
| `verificar-checkout` | **107 ok**. El bloque J corre **sin parámetro**, como el cliente |
| `verificar-reserva` | **75 ok**. Los cuatro chequeos del mensaje pasaron a la pantalla, y uno encontró el agujero de arriba |
| `verificar-vigilante` | confirma preguntando, y cierra en la tienda |
| `verificar-formulario` | con el POST cortado, la pantalla queda esperando y no navega |

> [!important] El control del bloque J cambió de forma, no se borró
> Antes era *"sin el parámetro el interruptor está apagado"*. Con el interruptor
> prendido eso ya no existe, y sin control leer «Realizar mi compra» probaría
> solamente que alguien lo escribió en el `index.html`. Ahora el control es al
> revés: **el HTML de fábrica todavía trae el botón de WhatsApp** y en pantalla
> quedó el otro — o sea que lo cambia el código.

En verde sin tocarlas: `pedido`, `zonas`, `vendedor`, `descuento`, `entrada`
(69), `sin-stock`, `datos-cliente`, `cupon-vendedor`, `sugerencias`,
`carga-carne`, `piezas`, `catering`, `hero`, `horario`, `llamadas` (410).

> [!note] Dos rojos preexistentes, medidos contra HEAD limpio (`RAIZ=`)
> `verificar-ultimo-pedido` (*"dice la carne que llevó"*) y `verificar-franja`
> (*"cualquier otro día están como siempre"*, intermitente). **El primero se cerró
> esa misma noche y NO era del test**: ver «"También llevaste carne" perdía la
> mitad». El de `verificar-franja` sigue abierto, medido contra HEAD limpio. Los 9 de
> `verificar-paginas` son los comentarios con el nombre de Tadeo en
> `ruleta.html`, y **no crecieron**.

### De paso, un texto que habia quedado a medias

El subtitulo del paso de direccion decia *"te mostramos los dias de entrega **y
el envio**"*. Tadeo saco el envio de la lista el 28/9 y ese dia se corrigio **el
otro** subtitulo, no este. Prometia algo que la pantalla ya no muestra.


## El checkout es su propia pantalla, con su URL (29/9/2026, a la tarde)

Tadeo: *"me gustaria que como primera pantalla el cliente pueda scrollear el
catalogo e ir pidiendo el carrito; una vez que confirma que ya esta, recien ahi
pasamos a un nuevo html... que no aparezca abajo para completar sus datos en la
misma pantalla"*.

Y cuando le pregunte si prefería una pagina aparte o que tapara la pantalla, lo
devolvio bien devuelto: *"¿una empresa que tiene tienda online se maneja con
paginas aparte o todo en una? te lo pregunto porque acordate que yo no soy
ningun mago"*. **La pregunta estaba mal planteada de mi lado**: las dos cosas no
se oponen. Una tienda seria tiene el checkout con **su propia URL** —sirve para
medir el embudo, para que ande el "atras" y para que Analytics lo cuente como
pantalla— **y eso no exige un archivo aparte**: Frizata es un solo archivo y su
URL va cambiando igual.

| | antes | ahora |
|---|---|---|
| la primera pantalla | catalogo **y el formulario desplegado abajo** apenas habia algo en el carrito | **solo el catalogo** |
| el checkout | una `<section>` mas de la pagina | **tapa la pantalla**, `position:fixed` |
| la URL | siempre la misma | **`maleu.com.ar/checkout`** |
| el "atras" del telefono | no hacia nada | **vuelve al catalogo**, donde estabas mirando |
| entrar | aparecia solo | desde el carrito o desde la barra de abajo |

> [!important] La URL cambia con `pushState`: NO se recarga nada
> La tienda sigue siendo un solo archivo. Partirla en dos duplicaria el
> catalogo, el carrito, el stock y las piezas de carne — y cada copia se
> despegaria de la otra, que es como se rompen las cosas en este repo.

> [!danger] `cerrarCheckout()` distingue quien lo cerro, y no es un detalle
> El estado se marca con `{co:1}`. Al cerrar desde el boton se llama a
> `history.back()`; al cerrar **por el popstate** no, porque ahi la entrada ya
> se fue y un `back()` de mas **sacaria al cliente de la tienda** creyendo que
> volvia al catalogo.
>
> Y el boton **no puede** hacer `pushState`: si no, el cliente tendria que
> tocar "atras" dos veces para salir. El test lo mide (`history.length` no
> crece).

### `404.html`: la tienda no tenia y mostraba la pagina de error de GitHub

> [!danger] Medido antes de tocar nada: `/loquesea` devolvia "Page not found · GitHub Pages"
> Con su logo y su tipografia. **Para una tienda con QR impresos y links viejos
> circulando por WhatsApp, eso es mandar al cliente a un sitio que no parece
> Maleu.** Ya pasaba antes de este cambio; lo que lo destapo fue querer usar
> `/checkout`.

GitHub Pages sirve **archivos, no rutas**: `/checkout` no es un archivo y por eso
daba 404. El `404.html` nuevo lo atrapa y lo devuelve a `/?ir=checkout`, que la
tienda retoma sola. Cualquier otra ruta equivocada va a la tienda a secas.

Redirige con **`location.replace` y no `href`**: asi la pagina de error no queda
en el historial y el "atras" no vuelve a caer en ella.

> [!important] Esto destapo que EL CARRITO NO SOBREVIVIA A UNA RECARGA — resuelto el 29/9/2026
> `cart` era `let cart = {}`: vivia en memoria y no se guardaba en ningun lado,
> asi que quien recargaba con el pedido armado lo perdia entero. **No lo abrio
> este cambio** —recargar siempre lo perdio— pero darle URL propia al checkout lo
> volvio facil de encontrar. Se cerro esa misma noche: ver **EL CARRITO SOBREVIVE
> A UNA RECARGA**, mas abajo.

### Lo que aparecio de paso

> [!danger] `verificar-formulario.js` contaba CUALQUIER POST como "el pedido salio"
> `abrirCheckout()` manda un `page_view` a Analytics, que es un POST, y el test
> lo leyo como un pedido escapado: rojo sobre un formulario que frenaba
> perfecto. Ahora cuenta solo los que van a `script.google`, y de paso **bloquea
> Analytics y Meta** — cada corrida le estaba sumando visitas falsas a las
> metricas reales desde 127.0.0.1, que es lo que el CLAUDE.md anoto el 13/9 y
> esta era una de las redes que faltaban.
>
> Efecto de paso: el chequeo que decia "3 POST al backend" ahora dice **1**, que
> es lo que la tienda garantiza de verdad.

La red del checkout paso a **108 chequeos** y se probo al reves con **trece bugs
reinyectados de a uno** —los ocho de la mañana mas el formulario apareciendo
abajo, la URL que no cambia, "Volver" agregando al historial, el "atras" que no
cierra y el scroll que no vuelve—: **los trece se agarran**.

### El checkout tapaba los carteles que el mismo abre (29/9/2026, a la noche)

> [!danger] Un pedido de 20 se recortaba a 4 EN SILENCIO
> Lo encontro Tadeo probando en produccion: *"me puse 20 paquetes de sorrentinos
> para manana miercoles... automaticamente se me puso cuatro unidades. Al cliente
> nunca se le dijo nada. Ni se le pregunto si quiere seguir. No hubo ninguna
> notificacion"*.
>
> **El cartel existia desde el 28/9 y SI se disparaba.** Lo que pasaba es que el
> checkout nacio con `z-index: 9500` y los carteles viven en `1000`
> (`.combo-modal-overlay`): salia detras de la pantalla del checkout.

El orden que tiene que cumplirse, de atras para adelante:

    catalogo  <  carrito (200)  <  CHECKOUT (300)  <  los carteles (1000)
              <  modal de zona (9999)  <  pantalla de envio (99999)

> [!important] Medir que el cartel SE DIBUJE no alcanza: hay que medir el orden
> Con el bug puesto, el chequeo *"SE LO DICE con un cartel"* **pasaba igual** —
> el cartel esta en el DOM y su `display` no es `none`, solo esta tapado. Un
> cartel invisible no tira ningun error y no cambia ningun numero: el carrito se
> recorta lo mismo y todo *"funciona"*.
>
> Lo unico que lo delata es comparar los dos `z-index`, y eso es lo que ahora
> hace el bloque L de `verificar-checkout.js`, reproduciendo el caso exacto:
> 20 en el carrito, 4 en el freezer, elegir la fecha con tope. Reinyectado el
> 9500, da **MAL** en ese chequeo y solo en ese.

## El telefono se completa con estructura (29/9/2026, a la noche)

Tadeo, despues de que el cierre en la tienda funcionara de punta a punta:
*"puede pasar que el cliente haya puesto mal o quiso abreviar su numero y se
olvida del codigo de area. Si no, no les va a llegar y LES PUEDE LLEGAR A UNA
PERSONA EQUIVOCADA Y DESCONOCIDA"*.

> [!danger] La validacion vieja era ">= 8 digitos", o sea casi nada
> Y en la planilla se ve el resultado: hay telefonos guardados como
> **`1554668949`** —el 15 de la telefonia vieja adelante, que a WhatsApp no
> llega— y otros de 10 digitos sin area. Mientras el pedido terminaba en
> WhatsApp daba igual, porque el cliente escribia el primero; **desde que la
> confirmacion sale sola, el numero mal escrito manda el pedido de una persona
> al telefono de otra.**

**La estructura.** En Argentina, area + abonado son **siempre 10 digitos**:

    11  + 36887500  = 10      CABA y GBA
    230 + 4421234   = 10      Pilar, Del Viso
    348 + 4471234   = 10      Escobar, Garin

Eso es lo que permite validar de verdad **sin una tabla de todas las areas del
pais**: se elige el area de una lista y se exige que el total sea 10.

    WhatsApp
    [ +54 9 ]  [ 11 v ]  [ 3688 7500 ]
    ✓ +54 9 11 36887500

Debajo, un renglon que dice como va quedando: el numero armado cuando esta
completo, o *"te faltan 4 numeros"* / *"te sobran 4"* mientras no.

> [!important] `f-telefono` sigue existiendo, oculto, y SIGUE SIENDO UNA ENTRADA
> Lo arma `_telArmar()`, asi que `enviarPedido`, `guardarDatosCliente`,
> `checkSaldoCliente` y `updateWhatsappCta` lo leen por id como siempre.
>
> Pero ademas `_telLocal()` lo toma como **respaldo** cuando los visibles estan
> vacios, porque hay tres cosas que lo escriben y ninguna es un test:
> `loadClientData` con el numero de una compra anterior, el autocompletado del
> navegador, y cualquier codigo que todavia no sepa de los dos campos nuevos.
> Ignorarlo seria tirar un numero bueno.
>
> **No debilita la validacion**: el hidden no tiene interfaz, asi que el cliente
> no puede escribir ahi, y lo que sale del respaldo pasa por el mismo filtro de
> 10 digitos. Un telefono corto guardado de antes se rechaza igual.

**Lo que se guarda cambio de forma**: ahora es `5491136887500` (el formato que
necesita WATI) en vez de lo que el cliente hubiera tipeado. Los guardados con
el formato viejo se reparten bien igual — `_telPoner` acepta `5491136887500`,
`11 3688-7500` y `1554668949`, que son las tres formas que hay en la planilla.

### Los tiempos, calibrados contra la medicion (no a ojo)

Tadeo: *"sigue tardando demasiado el boton. Aparece la descripcion fea esa de
esta tardando demasiado"*. Backend midio **326 pedidos** de `Log Pedidos`
restando los dos timestamps —no la columna "Tardo (min)", que viene redondeada
de a 6 segundos y con eso un p50 de 9 s y uno de 14 s se ven igual:

| | |
|---|---|
| p50 | **13 s** |
| p75 | 21 s |
| p90 | **59 s** |
| p95 | 128 s |
| **Pasan de 8 s** | **292 de 326 — el 90%** |

> [!danger] El cartel de "la conexion esta lenta" salia en 9 de cada 10 pedidos
> No avisaba de una excepcion: avisaba de lo normal. Un aviso que salta siempre
> deja de leerse, y encima asusta justo cuando el cliente acaba de apretar para
> pagar.

| | antes | ahora | por que |
|---|---|---|---|
| `SEND_LENTO_MS` | 8 s | **25 s** | arriba del p75 (21 s, todavia normal) |
| `SEND_FALLBACK_MS` | 25 s | **45 s** | a los 25 le ofrecia WhatsApp a 1 de cada 4 pedidos que iban a entrar bien |
| la curva de la barra | 90% a los ~8 s | **calibrada a 13 s** | llegaba al 87% y se quedaba clavada diez segundos |

> [!warning] Si el tiempo baja, estos numeros bajan con el
> La distancia entre 13 s (p50) y 59 s (p90) **huele a cola de Apps Script, no
> a trabajo**. Backend va a instrumentar `doPost` para saber el reparto: si son
> Telegram y WATI, se pueden mover a un trigger diferido; si es cola, ningun
> umbral la arregla. **Cuando eso cambie hay que volver a medir y recalibrar**,
> no dejar estos numeros holgados para siempre.

> [!important] Las redes LEEN los umbrales de `app.js`, no los repiten
> `verificar-envio` y `verificar-vigilante` los tenian escritos a mano y
> quedaron en rojo sobre una tienda que hacia lo correcto. Ahora salen de
> `/var SEND_(LENTO|FALLBACK)_MS = (\d+)/` sobre el archivo servido, y las
> ventanas de espera tambien: un fallback a los 45 s no se puede medir mirando
> durante 30.

> [!note] Un chequeo quedo DADO VUELTA, y es el control del cambio
> `verificar-envio` exigia que un backend que tarda 12 s disparara el aviso.
> Con el umbral nuevo lo correcto es que **no diga nada**: 12 s es lo normal.
> Ahora el chequeo pide el silencio.
>
> Y aparecio algo que antes no pasaba: **45 s es mas que el tope de 30 s por
> intento**, asi que cuando sale el cartel la tienda ya abandono el primer POST
> y esta en el segundo. El escenario "confirma con el cartel en pantalla" tuvo
> que reflejarlo: el primer POST cuelga y el segundo contesta 18 s despues.

### Las dos salidas que faltaban

**1. "Volver a la tienda" no volvia a la tienda.** Cerraba el overlay del
pedido y dejaba al cliente **en el checkout**, que desde esta tarde es una
vista que tapa la pantalla y seguia abierta atras — mirando un formulario de un
pedido que ya no existe, con el carrito vacio. Ahora cierra las dos cosas y
sube al principio: despues de comprar, la tienda arranca de arriba.

**2. La tercera opcion del cartel de recorte.** Tadeo: *"asi como me aparecio
la opcion de pedir para el viernes, faltaria la opcion de volver al catalogo y
completar con otras cosas"*. Las otras dos lo dejaban adentro del checkout —una
mueve la fecha, la otra se conforma—; faltaba la del que dice *"ok, entendi,
pero dejame llenar el pedido con otra cosa"*, **que es la que mas vende de las
tres**. `recorteAlCatalogo()` cierra el cartel y el checkout **sin mover la
fecha**: el cliente ya dijo que la queria, y el catalogo se topea solo contra
el stock de ese dia.

## La transferencia va a Maleu, no al alias del vendedor (30/9/2026)

Tadeo, mirando la tienda: *"siguen apareciendo los alias de los vendedores. Dijimos que
los ingresos en transferencia pasan por maleump o maleubru"*.

Hasta esa mañana, un cliente de un barrio con vendedor veía el **alias personal** del
vendedor —el que está en la col `Alias MP` de la hoja `Vendedores`— y le transfería a él.

| | antes | ahora |
|---|---|---|
| transferencia en un barrio con vendedor | el alias del vendedor | **maleump / maleubru** |
| efectivo | se lo paga al vendedor en la mano | **igual, no cambia** |
| la col `Alias MP` | la tienda la mostraba | se sigue recibiendo, **no se muestra** |

> [!important] Es UNA pregunta, y estaba contestada en CINCO lugares
> *"¿A qué alias transfiere el cliente?"* vivía en el cartel del formulario, la caja de
> alias, la pantalla de cierre, el mensaje de WhatsApp del fallback y el fallback de
> `copyAlias`. Ahora todos preguntan `_aliasParaTransferir()`. Si algún día se quiere
> volver al alias del vendedor para alguna zona, es esa función y nada más.

> [!danger] Y encontré dos de esos cinco recién por el control del test
> Después de "unificar", reinyecté el bug —devolver el alias del vendedor— y el test
> **pasó en verde**: la caja del formulario (`_pintarAliasMaleu`) seguía leyendo
> `ALIAS_MALEU` directo, así que no cambiaba con el bug puesto. Lo mismo el fallback de
> `copyAlias`. O sea que "lo resolví en la raíz" era falso y el chequeo lo demostró.
>
> **Un cambio que dice unificar no está unificado hasta que el control lo prueba.**

**Lo que NO cambió, y lo midió Backend:** el Portal Red del ERP **nunca** le mostró el
alias del vendedor al cliente. Le pedí que lo cambiara dando por hecho que sí, y me
corrigió con la medición: ese `aliasMp` va a la notificación interna al WhatsApp de
Tadeo, para que sepa de quién es el pedido. Lo que sí falta ahí es que el portal tenga
**dónde** decirle al cliente a dónde transferir — pantalla nueva, decisión de Tadeo.

> [!warning] Consecuencia operativa, abierta al 30/9/2026
> Con la transferencia entrando a Maleu, al vendedor hay que **liquidarle** su comisión
> más los $3.000 del envío en vez de que los descuente de lo que cobró. Backend y yo
> acordamos no tocar la liquidación hasta que Tadeo vuelva de las reuniones con la
> respuesta de por qué **55 de 106 pedidos de la Red entraron sin envío**: cambiarla
> ahora sería construir sobre un supuesto que él está yendo a verificar.

## Los barrios del modal son barrios, no nuestras zonas (30/9/2026)

Tadeo, mirando la lista: *"sacá tortugas y alrededores y ayres y alrededores. Ayres del
Pilar ya está como opción, y deberías agregar Tortugas Country"*.

Esos dos aparecían porque `_dirDestinos` agrega los barrios que llegan de la planilla y
no están en la lista del código — y **la primera entrada de la col `Barrios` de cada
vendedor es su zona canónica**. Nadie vive en "Ayres y alrededores": es como agrupamos
nosotros el reparto.

- La zona canónica dejó de ser un destino elegible (`_dirNorm(v.barrio) === _dirNorm(v.zonaCanon)`).
- **Manzanares se escribió en su propio `subBarriosList`**, porque es un barrio de verdad
  además de dar nombre a la zona. Esa diferencia no se deduce de los datos: hay que declararla.
- **Tortugas Country** entró al `subBarriosList` de Tortugas.

> [!danger] Agregar un barrio al código sin agregarlo a la planilla le saca la venta al vendedor
> `_pilarBarrioIsRed()` tiene cuatro defensas y decía *"lo atiende un vendedor"* por la
> zona canónica — viernes, sin carne, envío $3.000. Pero **`vendedorMatch` tenía una
> sola**: `barrioToVendedor[barrio]`, que sale de la col `Barrios`. Con "Tortugas Country"
> en el código y no en la planilla, **la pantalla decía una cosa y el pedido se iba a la
> hoja `Pilar`**: la venta de Marcos, cobrada por nosotros, sin que nadie se entere.
>
> Las dos preguntas —*"¿lo atiende un vendedor?"* y *"¿cuál?"*— tienen que estar de
> acuerdo, así que ahora comparten el respaldo por zona (`_vendedorDeBarrio`).
>
> **Igual se cargó en la planilla** (`Vendedores!D2`, con el OK de Tadeo): el respaldo es
> una red, no la forma correcta de dar de alta un barrio.

> [!important] La hoja `Vendedores` tiene cache de 30 minutos — lo midió Backend
> `vendedores` está en `LECTURAS_CACHEABLES` con `LECTURAS_SEG = 1800`, y **editar la hoja
> a mano no invalida nada**: la invalidación cuelga de las escrituras que pasan por el
> backend. Por eso `action=vendedores` seguía devolviendo el valor viejo después de
> escribir. La salida es **`?action=vendedores&fresh=1`**, que saltea la copia y guarda la
> nueva.
>
> **Vale para dar de alta un vendedor:** después de cargar su fila hay que pegarle una vez
> a `&fresh=1` o la tienda puede no verlo por media hora.

### Los chequeos: escenario 10 de `verificar-vendedor.js` (73 en total)

La lista sin las dos zonas y con los tres barrios; **el pedido de "Tortugas Country"
yéndose a la hoja Red a nombre de Marcos**; y el alias de Maleu en un barrio con vendedor,
con su control de que el vendedor simulado **sí tiene alias cargado** — con el fixture en
`''` el bug no era reproducible y el chequeo pasaba por la razón equivocada.

Tres bugs reinyectados de a uno: **los tres se agarran** (2, 1 y 3 rojos).

> [!danger] Dos de esos tres pasaron en verde primero, y las dos veces era el chequeo
> · **El de Tortugas Country llamaba a `_vendedorDeBarrio()` directo.** Con el bug puesto
>   en el call site de `enviarPedido`, la función seguía contestando bien. Lo que cuida la
>   plata no es que la función conteste: es **a qué hoja se va el pedido**. Ahora se manda
>   el pedido y se mira el canal del POST.
> · **El del alias usaba "Tortugas Country"**, que no está en el desplegable del formulario
>   —se llena desde la planilla— así que `_barrioPilarTieneVendedor()` daba null y el bug
>   no se activaba. Se mide con El Lucero.

> [!note] Y el helper para mandar un pedido ya existía en esa red
> Escribí uno nuevo (`armarYEnviar`) y no funcionaba: le faltaba el recorrido del checkout,
> que desde el 29/9 es su propia pantalla. `mandar()` y `ultimoPost()` ya estaban ahí, ya
> lo resolvían y ya estaban probados por el escenario 1. Se borró el mío.

## `verificar-llamadas.js` no entendía las expresiones regulares (30/9/2026)

> [!danger] Su resultado dependía de cuántas comillas tuviera un comentario
> `limpiar()` vaciaba comentarios y strings, pero no literales de regex. En
> `b.val.replace(/'/g, "…")` tomaba la comilla de adentro de la regex como apertura de
> string, y **desde ahí todo el resto del archivo quedaba analizado con la paridad
> corrida**. Medido: pasaba en la línea 2900 y pasaba **igual en HEAD**, desde hacía
> tiempo.
>
> El síntoma es traicionero porque no es estable: lo que decide de qué lado cae cada
> string es cuántas comillas haya después. Apareció al tocar `app.js` como dos "llamadas a
> algo que no existe" —`_wireCtaRefresh()` y un `not()` que venía de un `:not()` adentro de
> un selector— **sobre código que nadie había tocado**. Y lo que importa es la otra
> dirección: podía estar **tapando una llamada muerta de verdad**.

Ahora `limpiar()` reconoce regex: una barra abre una sólo si lo anterior no puede terminar
una expresión (después de un identificador, un número, `)` o `]` es una división), respeta
las clases `[...]` y vuelve a código ante un salto de línea, para no arrastrar el error
hasta el final si se equivocó.

**Y de paso salió otro que ese desfasaje venía tapando:** `function foo(` se contaba como
una llamada. Importa para las funciones que se declaran y se invocan en el acto
—`(function foo() {…})()`—, cuyo nombre nunca llega a `existe` porque esa regex pide que
`function` arranque la línea. Se excluye igual que `set`/`get`.

**405 llamadas, todas existen**, con y sin los cambios del día. Probado al revés con dos
botones muertos reinyectados —uno en un `onclick` del HTML y otro en `app.js`—: **los dos
se agarran**.

> [!warning] Comentar un bloque de código con `/* */` rompe este análisis
> Un comentario de bloque no anida: si el código comentado trae otro `/* */` adentro, el
> primer cierre interno termina el comentario y el resto queda como código suelto.
> **Se borra, no se comenta** — el historial de git es para eso.

## Los tres rojos que quedaban: cero (29/9/2026, a la noche)

Al terminar la noche del 29/9 las **32 redes están en verde**, salvo los 9 problemas de
`verificar-paginas` que son comentarios con el nombre de Tadeo en `ruleta.html` y que él
dijo que no importan. Los tres rojos que estaban anotados como preexistentes se cerraron,
y **dos de los tres eran de la tienda, no de los tests**:

| el rojo | qué era |
|---|---|
| `verificar-ultimo-pedido` · *"dice la carne que llevó"* | **la tienda**: perdía los cortes que hoy no están a la vista |
| `verificar-ruleta` · 2 chequeos | **la tienda**: el premio no se decía en ninguna parte (y los chequeos medían el WhatsApp, que ya no llega) |
| `verificar-franja` · *"cualquier otro día están como siempre"* | **el test**: medía `#pago-hint` sin abrir el checkout |

### El de la franja: un cartel que vive adentro del checkout

`#pago-hint` está dentro del checkout, y desde el 29/9 a la tarde el checkout es **su
propia pantalla** (`position: fixed`). Con el checkout cerrado ese cartel tiene
`offsetParent === null`, así que se medía como escondido siempre.

> [!danger] Y los otros tres chequeos de ese bloque pasaban por la razón equivocada
> Los tres momentos que exigen que el cartel **no** hable del 10% (el día de la ruleta, y
> esa noche hasta las 23:59) daban verde porque el cartel era invisible por otro motivo:
> **con el cartel roto habrían dado verde igual**. Es la regla que este repo ya tiene
> escrita dos veces — antes de exigir que algo no aparezca, hay que exigir que en el caso
> anterior aparezca — y acá el único chequeo que lo exigía era justamente el que fallaba.
>
> Ahora el test abre el checkout y va al paso del pago antes de medir, así que los cuatro
> momentos miden de verdad. **19 ok** a 390px.

> [!important] Estuvo mudo tres días porque `chk` tiraba el tercer argumento
> `const chk = (ok, t) => ...`: varios chequeos de esa red ya le pasaban un `extra` con
> lo medido, y se descartaba. O sea que el rojo decía *"y cualquier otro día están como
> siempre"* y nada más — no había con qué diagnosticarlo, y quedó anotado como
> "intermitente" sin que nadie supiera qué medía. Con el `extra` impreso, la primera
> corrida dijo `{"franja":true,"hint":false,...}` y el diagnóstico salió solo.
>
> **Un rojo mudo no se puede arreglar.** Si una red no imprime lo que midió, eso es lo
> primero que hay que arreglar, antes del rojo.

## "También llevaste carne" perdía la mitad (29/9/2026, a la noche)

> [!danger] El rojo que llevaba dos días anotado como preexistente tenía razón
> `verificar-ultimo-pedido` daba **1 mal** en *"dice la carne que llevó"* desde el
> 29/9 a la tarde, y quedó escrito como preexistente sin medir por qué. Medido ahora:
> **la tienda perdía cortes.**
>
> `_ultimoItems` resolvía la carne contra `getActiveProducts()`, que saca los cortes sin
> piezas cuando hay piezas de otro corte. Con piezas sólo de Vacío, el cliente que había
> llevado **Vacío y Entraña** leía *"También llevaste carne: Vacío"*.

**Lo que llevó la vez pasada es su historia y no cambia con el freezer de hoy**: ahora
sale de `PRODUCTOS`. Lo que sí se respeta es la zona — en un barrio con vendedor la carne
no se vende, así que nombrarla sería ofrecer algo que ahí no existe.

**Y el botón "Elegir las piezas de hoy" ahora sale sólo si la categoría Carnes está a la
vista.** Sin eso lleva a una sección que no existe y no pasa nada: *"un botón que no hace
nada es peor que no tener botón: el cliente concluye que la tienda está rota"* — el
comentario por el que existe `getCategoriasVisibles`. Decirle **qué** llevó es cierto
igual; ofrecerle **ir** sólo tiene sentido si hay adónde.

La red pasó a **56 chequeos** con un escenario nuevo, y sus dos bugs reinyectados —la
carne desde `activos`, y el botón sin guarda— **se agarran los dos**.

> [!important] El control de ese escenario me corrigió en la primera corrida
> Lo escribí con el inventario **vacío**, esperando que la categoría Carnes no estuviera.
> Está: desde el 11/9/2026 `vacio` y `sin-datos` son dos estados distintos, y con el
> vacío los cinco cortes se muestran diciendo "Sin stock". Para que Carnes no se dibuje,
> el inventario tiene que **fallar**. El chequeo del control —*"no se pudo traer el
> inventario (sin-datos, no vacío)"*— es el que lo dejó a la vista.

> [!warning] Un escenario que apaga algo tiene que devolver el estado
> El mío dejaba la página sin carne, y el escenario siguiente se rompía buscando un botón
> que yo había hecho desaparecer a propósito (`Cannot read properties of null`). Se cierra
> reabriendo normal al final. Si una red empieza a romperse en un escenario que no tocaste,
> mirá qué dejó puesto el anterior.

## El premio de la ruleta no se decía en ninguna parte (29/9/2026, a la noche)

> [!danger] El que ganaba un premio no lo veía confirmado en ningún lado
> Hasta el 29/9 el mensaje de WhatsApp cerraba con *"🎁 Premio de la ruleta
> (RUL-AB12): 6 empanadas de regalo"*, y eso servía para dos cosas: que el cliente vea
> que su premio se aplicó, y —dice el comentario del test que lo cuidaba— *"así el que
> arma el pedido lo suma"*.
>
> Con el pedido cerrándose en la tienda, **ese mensaje ya no le llega a nadie**. Y el
> premio no estaba en ningún otro lugar: no en la pantalla de cierre, no en `detalle`
> (un regalo no es un item del carrito) y no entre los seis parámetros del template de
> WATI (`nombre`, `pedido`, `entrega`, `direccion`, `detalle`, `total`).

Es **el mismo agujero que el de la reserva de carne en efectivo**, del mismo día: algo
que sólo se decía en el WhatsApp y se quedó sin lugar donde decirse cuando el WhatsApp
dejó de existir. Ahora la pantalla de cierre lo dice, **primero y no al pie**: el que
ganó algo entra a confirmar mirando si se lo aplicaron.

    TU PREMIO     6 empanadas de regalo · RUL-AB12
    ENTREGA       Viernes 02/10 · 19 a 21 hs
    DIRECCIÓN     …
    TOTAL         $46.500 · Transferencia

Va por `_sendDoneFila`, o sea por `textContent`: el texto del premio lo escribe Backend
en la hoja `Cupones`, así que viene de afuera del código. Y **no lleva caja propia** —con
el naranja de marca alcanza—: otra caja en esa pantalla competiría con la del alias, que
es la que el cliente necesita para pagar.

> [!important] Y no se nombra un premio que no se aplicó
> Un premio con mínimo sin alcanzar no viaja con el pedido (no se gasta) y **tampoco
> aparece en la confirmación**: decirle "tu premio" a alguien que no llegó al mínimo es
> prometerle algo que no va a recibir. `_premioActivo()` es la misma función que decide
> las dos cosas, así que no pueden desacordarse.

> [!important] Lo encontró adaptar dos chequeos, no buscarlo
> `verificar-ruleta.js` daba **2 rojos** desde el cambio del cierre, los dos porque usaban
> la navegación a `wa.me` como señal de *"el pedido se cerró"* — el mismo caso de los once
> chequeos de cinco redes que se adaptaron ese día, que no se habían mirado acá. Al
> cambiar la señal por la pantalla de cierre, el chequeo del premio siguió en rojo: y esa
> vez **era la tienda**.
>
> Hoy son **37 ok**, con un chequeo que pide que el premio se diga (no la frase exacta: el
> texto lo escribe Backend) y otro que exige que un premio no aplicado no se nombre.
> Reinyectando el bug —`premio: null`— el primero da MAL y sólo ése.

## Un vendedor nuevo entra sin tocar el código (29/9/2026, a la noche)

Hasta esta noche, sumar un vendedor eran **dos pasos que tenían que salir juntos**: su
fila en la hoja `Vendedores` y su zona escrita en `BARRIOS_PILAR_MODAL`. Si salía sólo
la fila quedaba una ventana en la que la tienda conocía su barrio pero no sabía que era
de vendedor. **Hoy alcanza con la fila.**

> [!danger] El agujero, medido: las tres defensas no cubren a un vendedor nuevo
> `_pilarBarrioIsRed()` contesta *"¿a este pedido lo atiende un vendedor?"*, y de ahí
> cuelgan los días de entrega, el envío, el alias al que se transfiere, el tope de stock
> y si se ofrece carne. Sus tres defensas son:
>
> | | mira | sirve para un vendedor nuevo |
> |---|---|---|
> | 1 | el barrio en `barrioToVendedor` | **sí, pero recién cuando contesta la planilla** |
> | 2 | la lista `BARRIOS_PILAR_MODAL` | no: su zona no está escrita ahí |
> | 3 | su zona canónica contra esa misma lista | **no, por lo mismo** |
>
> O sea que en los segundos que tarda `action=vendedores`, el cliente que **vuelve** —con
> su barrio ya guardado en el navegador— pasaba por *"no es de vendedor"*: se le ofrecía
> carne y miércoles, y si mandaba el pedido ahí **se iba a la hoja `Pilar` en vez de a la
> `Red`**. La venta del vendedor, cobrada por nosotros. Es el mismo agujero que se cerró
> el 28/9 para los tres de hoy (la defensa 3), reabierto para el cuarto.

**La cuarta defensa: `maleu_vendedores` se lee al arrancar.** La clave ya se guardaba en
cada visita y ya se usaba de respaldo cuando el fetch falla; lo único que faltaba era
leerla **antes** de esperar la respuesta, que es donde está la ventana. Es el mismo
patrón que la copia de piezas y la del carrito.

**Vence a los 7 días**, holgado a propósito: la copia se reescribe en cada visita, así que
sólo alcanza a alguien que no entró en una semana — y a ese la respuesta de ahora lo
corrige a los segundos igual. El error que este plazo podría causar (decir que un barrio
es de un vendedor que se fue) es mucho menos grave que el que evita.

> [!important] De paso, el armado de `barrioToVendedor` estaba escrito DOS veces
> Una copia en el camino feliz y otra en el `catch`. Ahora los tres caminos —la
> respuesta, la copia al arrancar y la copia cuando el fetch falla— pasan por
> `_vendedoresPoner(lista)`.

**Su zona en `BARRIOS_PILAR_MODAL` sigue valiendo la pena, pero ya no es bloqueante.** Le
da el nombre lindo de la zona, la chapita con su nombre y sus sub-barrios en el buscador
desde la primera visita. Sin eso, el cliente lo encuentra igual —`_dirDestinos` agrega
los barrios que llegan de la planilla— y su pedido cae en la hoja correcta.

> [!note] El cliente NUEVO de ese vendedor queda cubierto solo
> En su primera visita no tiene copia, pero tampoco puede elegir un barrio que la tienda
> todavía no conoce: el buscador los saca de `barrioToVendedor`. Si escribe su barrio a
> mano cae en "Otra zona de Pilar" y lo entrega Maleu — que es lo que la pantalla le
> dijo, y la misma decisión que ya estaba tomada para los otros tres.

**Lo prueba el escenario 9 de `node _tools/verificar-vendedor.js`** (55 chequeos en
total): un cuarto vendedor cuya zona no está en el código, con su barrio yendo a la Red,
sin carne, sólo viernes y con el envío de $3.000; después **la ventana**, con la
respuesta de la planilla demorada 4 s, donde su barrio ya es de vendedor por la copia.

> [!important] Y su control, sin el cual los tres chequeos de la ventana no probarían nada
> La misma navegación **sin** la copia guardada: ahí `esRed` da **false** y el agujero se
> ve. Después se espera a que conteste la planilla y se comprueba que se corrige solo —
> la copia acelera, no reemplaza.

## El carrito sobrevive a una recarga (29/9/2026, a la noche)

Los tres carritos —`cart`, `comboCart` y `piezaCart`— eran `{}` en memoria. El que
recargaba la tienda con el pedido armado lo perdía entero y sin un aviso. Y no hace
falta que recargue a propósito: alcanza un "atrás" de más, o que el sistema cierre la
pestaña de fondo para liberar memoria, que en un iPhone pasa todo el tiempo.

| | antes | ahora |
|---|---|---|
| recargar con el pedido armado | **se perdía todo** | vuelve igual, con su total |
| el combo con sus gustos | se perdía | vuelve con los gustos elegidos |
| la pieza de carne | se perdía | vuelve, con su peso y su precio |
| cuándo se ve | — | **al instante**, sin esperar al backend |

Vive en `localStorage` (`maleu_carrito_v1`), no en el ERP, por lo mismo que "Lo que
pediste la última vez": la tienda es pública y no tiene login, y un endpoint que
devuelva el carrito de un teléfono sería una puerta a los datos de cualquiera.

> [!important] Se guarda desde `updateUI()`, que es la raíz
> Hay **treinta** lugares que tocan los tres carritos. Colgar el guardado de cada
> uno es exactamente cómo los botones dejaron de andar el 10/9 y cómo los carteles
> de stock se borraban solos: siempre falta uno. Todo cambio del carrito termina
> repintándolo, o sea que termina en `updateUI()`.

> [!warning] La copia se lee al arrancar a una variable, ANTES de `applyZone()`
> `applyZone()` vacía los tres carritos, y en el arranque corre antes de que se los
> pueda restaurar. Si la restauración leyera el `localStorage` en ese momento, el
> arranque se pisaría su propia copia. Por eso `_cartLeerCopia()` se llama junto a
> `_piezasLeerCopia()`, arriba de todo, y sólo deja lo leído en `_cartCopia`.

**Vence a las 12 horas**, el mismo plazo que la copia de piezas y por el mismo motivo:
adentro puede haber una pieza de carne que ya se vendió y cantidades armadas contra un
freezer que cambió. Lo que aguanta más que eso no es un carrito, es un recuerdo.

**Cada cosa vuelve sólo si todavía se puede pedir en esa zona.** Un producto que salió
del catálogo, un combo dado de baja o —el que cuesta plata— **un corte de carne en un
barrio con vendedor**: esos pedidos van a la hoja `Red`, que no tiene columnas de kilos,
así que la carne se cobraría y no se guardaría en ningún lado.

> [!important] El stock NO se chequea al restaurar, y no es un olvido
> Cuando la restauración corre, `fetchStock` todavía no volvió. El tope lo aplica
> `fetchStock` cuando llega, que ya recortaba el carrito. Es la misma división que con
> las piezas: se dibujan de la copia y se concilian con `_piezasConciliarCarrito`
> cuando llega el inventario de ahora.
>
> De paso, **ese aviso ahora dice qué y cuánto**. Decía *"Tu carrito fue ajustado al
> stock disponible"* con la duración por default de 800 ms — el cliente veía 7 donde
> había puesto 15 y no sabía si se había equivocado él. Es la lección del cartel de
> recorte del 28/9 aplicada a este camino; queda como aviso y no como cartel, porque
> esto corre solo cada 60 s y un cartel que pide una decisión saltando sin que el
> cliente toque nada es peor que el problema.

**Lo que no se guarda acá**: la zona (la escribe `setZone`), la fecha (`_loadSavedDate`)
ni los datos del cliente (`guardarDatosCliente`). Cada cosa la sigue guardando quien ya
la guardaba — dos formas de guardar el mismo dato es como se despegan las cosas acá.

### La red: `node _tools/verificar-carrito.js [ancho]`

**35 chequeos**, verdes a 390 y 1440px, con el reloj congelado el martes 15/9/2026:
la recarga inmediata (productos, combo con gustos y pieza de carne, el total, el badge,
la barra de abajo y la card mostrando su cantidad); una copia de 13 horas que no se usa
—con su control de 11 horas, que sí—; una copia de otra zona; un producto que ya no
existe; **la carne en un barrio con vendedor**; el cliente sin zona elegida; el vaciado;
una copia rota; y cero POST.

**Ninguna red podía ver esto**, y por una razón de método: todas abren un perfil de
Chrome nuevo y navegan una vez, así que la segunda visita no existía. Es la misma razón
por la que `verificar-datos-cliente.js` tuvo que nacer el 11/9. Acá se resuelve con el
PREP: siembra el `localStorage` una sola vez por `n=`, así que volver a navegar a la
misma URL es **una recarga de verdad**.

Probada al revés con **siete bugs reinyectados de a uno** —sin vencimiento, sin mirar la
zona, sin filtrar lo que la zona no vende, guardando con la zona provisoria, sin borrar
la copia al vaciar, sin repintar, y sin guardar—: **los siete se agarran**. Contra la
tienda de antes da **17 rojos**. Se corre con `RAIZ=<carpeta>`.

> [!danger] Dos de los siete pasaron en verde primero, y las dos veces era el instrumento
> **1. El badge se repintaba por casualidad.** Sacando el repintado de la restauración,
> el numerito del carrito y la barra de abajo seguían bien: los vuelve a pintar
> `_formObs`, un `IntersectionObserver` que observa el formulario para otra cosa y se
> dispara solo al arrancar. Lo que queda mal son **las cards**: la del producto que está
> en el carrito sigue diciendo "+ Agregar" con dos unidades adentro. O sea que el badge
> no servía para medir el repintado, y está anotado en el código para que nadie saque esa
> llamada creyéndola redundante.
>
> **2. El backend simulado contestaba más rápido que lo que se quería medir.** Con las
> respuestas al instante, `fetchVendedores` repinta el catálogo a los pocos milisegundos
> y tapa la falta. En producción Apps Script tarda segundos, y son esos segundos los que
> el cliente pasa mirando su pedido: hay que ponerle demora (`&demora=1500`). **El
> instrumento tiene que ser más lento que lo que mide, no más rápido.**
>
> **3. Y uno de los dos bugs no era alcanzable por el camino que lo medía.** El de la
> zona provisoria pasaba porque con zona provisoria el carrito está *siempre* vacío —la
> puerta del primer "+ Agregar" lo impide—, así que la rama del carrito vacío borraba
> igual y la defensa no se ejercitaba nunca. El test le mete algo a la fuerza: esa
> defensa cuida de un camino futuro que agregue antes de preguntar la zona.

### `diagnostico-vivo.js` medía un caso que ya no existía

Estaba listado como herramienta vigente y **daba rojos que no eran de la tienda**.
Buscaba `?autopedido=1` (eliminado el 8/9/2026), `MODO_AUTOPEDIDO`, `_zonaPermite()` y
un `#banner-autopedido` que no existen; elegía la zona tocando un botón del modal viejo
—desde el 28/9 el modal es un buscador de dirección— y terminaba preguntando si cuatro
sorrentinos estaban en Estancias, que se abrieron el 10/9/2026. **No estaba viejo: era
el script de un problema resuelto tres veces.**

Reescrito el 29/9/2026 para lo único que ninguna red local puede contestar: **cómo está
lo que hay publicado ahora**. Entra a `maleu.com.ar` como una persona, escribe su barrio
en el buscador, y reporta el `?v=` del `app.js` servido, cuántos productos y combos hay,
si el cierre en la tienda está prendido, los umbrales del envío, la primera pantalla sin
zona elegida, el stock y las piezas que devolvió el ERP, las próximas fechas de entrega
y las excepciones de consola. Es **de sólo lectura**: corta todo POST por CDP y bloquea
Analytics y Meta, para no sumarle una visita falsa a las métricas de verdad.

Se corre con `node _tools/diagnostico-vivo.js`, y `URL=` / `BARRIO=` lo apuntan a otro
lado. **No reemplaza a las redes** —ellas prueban casos que en producción no se pueden
provocar— ni a `probar-cache.js`, que es el único que contesta si el navegador del
cliente recibe el código de ahora.

## La zona de Tigre, y los días que salen del vendedor (30/9/2026)

Fede D'Andrea arrancó ese día. Tadeo pasó sus **34 barrios** y son **Tigre**
—Santa Bárbara, Nordelta, Talar del Lago, Pacheco, Rincón de Milberg—, no Pilar.
Eso confirmó lo que había quedado abierto en su reunión.

**Quedan adentro de la zona `pilar` igual**, y no es pereza: desde el 28/9 el
cliente no elige zona —escribe su barrio y la tienda la deduce—, así que el
nombre interno no se le muestra. Lo que sí le llega es el ruteo, y es el mismo
que el de los otros tres vendedores: hoja `Red`, envío $3.000, sin carne.

> [!important] `region` existe para los textos, no para el ruteo
> Sin ella, el cartel de cierre le diría *"en Pilar y Alrededores"* a alguien de
> Nordelta. **El día que Tigre necesite su propio envío, sus propios días o su
> propio canal, deja de alcanzar y pasa a ser una zona de `ZONAS`.** No forzarlo
> desde la card.

**La zona canónica es "Santa Bárbara", no "Tigre y alrededores".** Tadeo, al
verlo: *"no sirve el 'y alrededores'. nosotros nos manejamos por barrio
privado"*. Tiene que ser **igual a la primera entrada** de su col `Barrios` en
la hoja `Vendedores`, que es de donde sale `zonaCanon`.

> [!danger] Esa primera entrada NO es decorativa: es la dirección de retiro
> `_dirVendedorRed` (Code.js) devuelve `barrios[0]` y la escribe en la col
> "Dirección" de la Orden de Compra. Con la zona canónica primera funcionaba de
> casualidad; con la lista en A-Z puro, la OC de Fede habría dicho **"Altamira"**
> — un barrio cualquiera de los 34, no donde retira. Sin error y sin que nadie
> lo note hasta que alguien vaya a buscar mercadería al lugar equivocado. Lo
> encontró Backend al sacar la zona canónica.
>
> Por eso **el A-Z de la tienda se aplica sobre una COPIA**: el orden en que la
> lista está declarada significa algo.

### Una zona fuera del área de Maleu no se ofrece si nadie la cubre

> [!danger] El agujero, medido el mismo día: la pantalla prometía un vendedor y el pedido se iba a la hoja Pilar
> Una zona marcada `isRed` hace que `_pilarBarrioIsRed()` diga "lo atiende un
> vendedor" —sus días, sin carne, envío $3.000—, pero **quién** sale de la hoja
> `Vendedores`. Si el vendedor no está cargado ahí, `vendedorMatch` queda en
> `null` y `enviarPedido` cae en `canal: z.canal` = **Pilar**. O sea que Maleu
> quedaba comprometido a entregar en Nordelta.
>
> Es el mismo modo de falla que "Tortugas Country" esa misma mañana —barrio en
> el código y no en la planilla— pero una zona entera en vez de un barrio.

Lo cierra **`_barrioOculto`**, que ya existía como gancho devolviendo `false`.

> [!important] Sólo las zonas con `region`, y es la diferencia que importa
> Una zona de **Pilar** sin vendedor **no se esconde**: ahí Maleu entrega igual
> —miércoles y viernes, es su propia zona— así que esconderla sería perder la
> venta en vez de protegerla. **Es el caso de Fini, que se va a fines de enero:
> Ayres tiene que seguir comprando aunque su fila no esté.**
>
> Con `region` es al revés: si nadie la atiende, no hay quien entregue.
>
> Y si `barrioToVendedor` está vacío —los primeros segundos de una primera
> visita— no se esconde ninguna: esa ventana la cubre la copia de la última
> visita (`maleu_vendedores`).

**Consecuencia práctica, y por eso se pudo publicar antes que la fila:** la zona
aparece sola el día que su vendedor existe, y desaparece sola si lo dan de baja.

### Los días salen del vendedor, no de la zona

Tadeo: *"los de federico son entregas viernes y sábados a coordinar"*. Se lo
prometieron en su reunión y era lo único de esa charla que la tienda no podía
cumplir: los días salían de la **zona** y el sábado no existía en Pilar para
nadie.

Ahora cada zona de vendedor declara los suyos (`dias` en la card) y **sin ese
campo son viernes** — que es lo que hacían los otros tres, así que el campo
nuevo no le cambió el día a nadie.

> [!danger] El calendario del formulario tenía una SEGUNDA COPIA del criterio
> `_zoneHorariosForDayPicker` devolvía `z.horarios` tal cual para lo que entrega
> Maleu, y su comentario decía *"mismo criterio que el calendario del modal"*
> mientras se escribía aparte. Al sumar el sábado a la zona —hizo falta para que
> el calendario supiera qué horario decir— el modal lo filtraba bien y **éste lo
> dejaba pasar: "Otra zona de Pilar" quedaba ofreciendo sábados**, donde Maleu no
> reparte. Lo agarró `verificar-zonas` en la primera corrida.
>
> Los dos caminos salen ahora de `_diasDeZonaRed()`. Y los textos también
> (`_diasEnPalabras`), porque el renglón del buscador y el hero son dos lugares
> más donde el mismo hecho podía decirse distinto.

### La lista de barrios: agrupada por zona, A-Z adentro

Con 55 destinos, el orden en que están declarados en el código no es un orden
para nadie. El A-Z puro duró unas horas: Tadeo lo vio en la tienda y arriba de
todo le quedaban "Ayres del Pilar", "Azzurra" y "Cerrillos", con **Estancias del
Pilar —de donde sale la mayor parte de la venta— séptimo**, enterrado entre
barrios de vendedores.

    ESTANCIAS   Estancias del Pilar · Estancias del Río
    PILAR       Ayres del Pilar · Azzurra · … (18)
    TIGRE       Altamira · Barbarita · … (34)

**Una persona reconoce su zona antes que su barrio.** El encabezado la orienta y
el A-Z la deja encontrar adentro. Estancias va primero por mercado, no por
abecedario; un grupo nuevo cae al final.

> [!important] Los encabezados van SOLO con la lista completa
> Buscando, el orden deja de ser el de la lista —los que **empiezan** con lo
> escrito van primero— y un encabezado arriba de un resultado de otra zona
> mentiría.

El renglón de cada barrio habla de **días y nada más**. Decía *"Entregas los
viernes a coordinar"*, que quedaba torpe y le sumaba ruido a los tres que antes
decían sólo "Entregas los viernes": el horario sale en el calendario, que es
donde el cliente elige. Misma decisión que tomó Tadeo el 28/9 al sacar el envío
de esta lista.

### La red: escenario 11 de `verificar-vendedor.js` (86 chequeos)

Con su vendedor y sin él. Los barrios se ofrecen, el orden agrupado, los
encabezados, que buscando no haya ninguno, el pedido yéndose a la hoja `Red`, y
**el control de que el sábado es sólo de él** —ni los otros vendedores ni los
barrios de Maleu lo tienen—. Y el control al revés: sin su fila en la planilla,
los barrios de Tigre no se ofrecen y los de Pilar siguen estando.

## La carne en la Red: por qué sigue bloqueada (30/9/2026)

Tadeo: *"que a toda la tienda online le aparezcan las piezas de carne… ¡que los
vendedores también puedan vender carne!"*. Y después: *"la carne es producto de
Maleu. Los vendedores tienen que vender todo el catálogo"*.

**No se habilitó, y no es prudencia: la hoja `Red` no tiene columnas de kilos.**
Medido en `Code.js`: los cinco cortes (CCo, CEn, CLo, CPi, CVa) no están en su
contrato de columnas. Home los tiene en 71-75 y Pilar en 69-74; Red no.

> [!danger] Habilitarla sin eso cobra el pedido y no guarda los kilos
> Es el modo de falla que ya está anotado arriba: si el id no tiene columna en la
> hoja de ese canal, el backend **lo cobra y no lo escribe**. Sin error, sin log.
> Y con carne es peor: la pieza se marca vendida y después no aparece en ningún
> pedido, así que dos clientes se pueden llevar la misma.

Lo tiene Backend, y al medirlo apareció que es más de lo que parecía: a Red le
falta también la columna **Pesaje**, y el manejo por pieza que Home y Pilar sí
tienen.

**Cuando confirme que está vivo**, del lado de la tienda es sacar el bloqueo de
`_productoBloqueadoPorBarrio` y ajustar sus tests. No antes.

### Y apareció una regla de la escala que no estaba escrita en ningún lado

La escala de comisiones de la Red **paga una parte del margen de cada producto,
y esa parte baja cuando el margen baja.** Medido cruzando la hoja `Productos`
contra los 87 montos:

| margen del producto | se lleva el vendedor |
|---|---|
| 35% o más | **44% del margen** (los 15, exacto) |
| 28-35% | 42-43% |
| 22-28% | 24-37% |
| menos de 22% (las tres tortas) | **14%** |

Explica los números que parecían arbitrarios: **los $750 de la torta no son un
castigo, son el 14% de su margen.** Y 18 de los 29 no suben por nivel — lo de
margen flaco paga lo mismo en Inicial que en Top.

> [!warning] Se interpola producto por producto, NO por "banda"
> Derivé la comisión de los cinco cortes aplicándoles un 24% parejo —el de los
> sorrentinos premium— y **estaba mal**: picaña y vacío dejan 31% y 30%, casi lo
> mismo que las empanadas comunes (34%), que se llevan 43%. Con 24% cobraban la
> mitad sin motivo. Me corrigió Backend midiendo, e interpolando cada corte entre
> los dos productos **reales** que lo rodean por margen.
>
> Los montos que quedaron, elegidos por Tadeo: Picaña $3.500/kg · Vacío $3.350 ·
> Colita $1.700 · Lomo $1.400 · Entraña $1.000.

**La unidad de la carne ES el kilo** (la hoja `Productos` los tiene con
`Unidad = kg`), así que la escala no necesita una forma de pago nueva.

> [!note] Los precios y costos NO se escriben acá
> Este archivo no se publica, pero la regla del repo es la del CLAUDE.md de
> Maleu: nada de costos ni márgenes absolutos en el repo. Los números de arriba
> son porcentajes y montos de comisión, no costos; **el costo de un producto se
> busca en la hoja `Productos`.**

## Lo que NO está acá

- **Las reglas de la tienda** (stock, cutoffs, zonas, días de entrega): están en
  `Cerebro Maleu\06-Claude Code\Tienda - Reglas de stock y horarios.md`.
  Releelo antes de tocar nada de stock u horarios.
- **El ERP**: está en `..\maleupedidos.github.io\`.
