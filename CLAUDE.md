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
