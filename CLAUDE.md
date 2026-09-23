# Contexto — la tienda online de Maleu

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
> (con el 10% la entraña ya deja 2% y el lomo 4%); y el precio tiene que quedar
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
y con el 10% la entraña deja 2% de margen. **El único descuento automático que
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
> Home **#931**, **#939** y **#944** (Inés Canale, $217.400). El cobro y la
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
> **2 llegaron con `� Sábado 12/09`** y 6 sanos (Laura Álvarez Costa y Clara
> Gimenez). **Depende del celular del cliente, no del código**: el archivo tenía
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
> · **El estado "Pedida" en Compras Carne.** El 16/9 Lucas cargó el pedido a Caco (CC-0007) y
>   quedó "Recibida", o sea como deuda, con picaña y entraña que Caco avisó el 17/9 que no traía.
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
> regla: **el cupón sólo existe para alguien que nunca nos compró**. Pero el cruce
> (`LEADS_HOJAS_CRUCE_`) mira **Home, Pilar y Clubes — no `Red`**. O sea que un cliente de
> Rufo no figura como cliente, gira, gana, y con esta regla su próximo pedido dejaría de ser
> de Rufo. Es la misma injusticia dada vuelta. Agregar `Red` al cruce es de Backend.

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

## Lo que NO está acá

- **Las reglas de la tienda** (stock, cutoffs, zonas, días de entrega): están en
  `Cerebro Maleu\06-Claude Code\Tienda - Reglas de stock y horarios.md`.
  Releelo antes de tocar nada de stock u horarios.
- **El ERP**: está en `..\maleupedidos.github.io\`.
