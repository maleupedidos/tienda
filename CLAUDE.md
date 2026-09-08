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

## Los 4 sorrentinos que esta tienda NO muestra

**Cuatro sorrentinos tienen `zonas:["pilar"]`**: Queso Brie, Langostinos al
Azafrán, Pollo y Puerro y Espinaca. En Estancias no se venden, así que
`_zonaPermite` los filtra.

Un cliente de Estancias los puede pedir igual — pasó el 1/9/2026 con Javier
Galarraga, 3 Espinaca. **Ese pedido se carga desde el ERP**, en la tab
AUTOPEDIDO de Ruta: ahí están en un bloque «por encargo» que dice que no salen
del freezer y qué origen corresponde.

> [!warning] Existió `?autopedido=1` y se eliminó el 8/9/2026
> Del 1/9 al 8/9 ese parámetro mostraba el catálogo completo acá. No andaba mal
> — el problema era que convertía a la tienda en una **segunda pantalla para
> cargar pedidos**, en paralelo a la del ERP. Dos caminos para lo mismo se
> despegan solos, y este no tenía los controles del otro: ni el stock del
> freezer, ni el origen, ni «ya me pagó», ni el resumen para WhatsApp.
>
> Si aparece un link viejo con `?autopedido=1`, hoy **no hace nada**: el
> parámetro se ignora y la tienda filtra por zona como siempre.

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
