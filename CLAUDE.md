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
>   Achicarla es una decisión de diseño con la promo del efectivo en el medio.
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

**La red: `node _tools/verificar-ultimo-pedido.js [ancho]`**, 44 chequeos a 390 y 1440px
con el reloj congelado: cliente nuevo, el formato viejo, un pedido de seis con carne y un
agotado, "Agregar lo mismo" con toques de verdad (dos veces, sacando algo y reponiéndolo),
el buscador, el guardado y Clubes. `CAPTURA=<carpeta>` guarda la sección. Con siete bugs
reinyectados de a uno (sumar encima, ignorar el stock, no ordenar, no guardar la carne, el
buscador sin esconderla, ignorar el formato viejo, el botón sin repintarse con el
carrito): **los siete se agarran**.

## Lo que NO está acá

- **Las reglas de la tienda** (stock, cutoffs, zonas, días de entrega): están en
  `Cerebro Maleu\06-Claude Code\Tienda - Reglas de stock y horarios.md`.
  Releelo antes de tocar nada de stock u horarios.
- **El ERP**: está en `..\maleupedidos.github.io\`.
