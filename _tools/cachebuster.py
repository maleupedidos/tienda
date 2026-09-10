# -*- coding: utf-8 -*-
"""El ?v= de la tienda se calcula solo, desde el contenido del archivo.

El 1/9/2026 Tadeo no veia el modo autopedido recien publicado. La causa no era
el codigo: era que `index.html` carga `app.js?v=20260819-1` — un cache-buster
FIJO desde el 19/8 — y GitHub Pages sirve app.js con `Cache-Control: max-age=14400`
(4 horas). El navegador tenia guardada exactamente esa URL y no la volvia a pedir.

O sea que CUALQUIER cambio a app.js — un precio incluido — podia tardar hasta 4
horas en llegarle a un cliente, o no llegar nunca mientras no se tocara el ?v=.

Y era invisible desde aca: verificar con `curl` o con el cache desactivado dice
que el servidor tiene el archivo nuevo, que es una pregunta distinta de si el
navegador lo recibe.

Ahora el ?v= es el hash del contenido: cambia solo cuando el archivo cambia, y
el workflow lo actualiza en cada push.
"""
import hashlib
import io
import os
import re
import sys

# La raiz sale de donde vive ESTE archivo (_tools/ cuelga de la raiz del repo),
# no de una ruta escrita a mano.
#
# Hasta el 2/9/2026 aca decia r'c:\Tadeo Ustariz\...\tienda', o sea la ruta de la
# compu de Tadeo. En el runner de Ubuntu esa carpeta no existe, asi que el paso
# del workflow venia fallando SIEMPRE con FileNotFoundError — y como el ?v= se
# actualizaba a mano corriendolo local, el fallo pasaba por un job en rojo que
# nadie miraba mientras el ?v= igual quedaba bien.
#
# El costo real: cada push que tocaba app.js o styles.css se publicaba con el
# ?v= viejo. El navegador cachea por URL exacta y GitHub Pages sirve esos dos
# archivos con max-age=14400 (4 horas), asi que el cambio podia no llegarle al
# cliente. Es exactamente el bug que este script vino a resolver.
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IDX = os.path.join(RAIZ, 'index.html')


def hash_de(nombre):
    """md5 del contenido, con los finales de linea normalizados a LF.

    Sin normalizar, el MISMO archivo da dos hashes distintos: en Windows el
    working copy tiene CRLF y en el runner de Ubuntu el checkout viene con LF.
    El 2/9/2026 eso hizo que el workflow cambiara el ?v= de app.js de 867da4ad
    a 84081e7d SIN que app.js hubiera cambiado — o sea 200KB que todos los
    clientes volvian a descargar al pedo, y un commit de correccion del bot
    cada vez que alguien corria este script a mano en Windows.

    Con la normalizacion, Windows y Linux dan identico (verificado: los dos
    dan 84081e7d y 9e636333), asi que el ?v= cambia solo cuando el contenido
    cambia de verdad.
    """
    with open(os.path.join(RAIZ, nombre), 'rb') as f:
        return hashlib.md5(f.read().replace(b'\r\n', b'\n')).hexdigest()[:8]


def hash_bytes(b):
    return hashlib.md5(b.replace(b'\r\n', b'\n')).hexdigest()[:8]


def sellar_imagenes():
    """El mismo ?v= del script, pero para las fotos.

    Sin esto, cambiar una foto no se ve: GitHub Pages las sirve con
    max-age=14400, y el navegador cachea por URL EXACTA. Medido el 10/9/2026
    contra maleu.com.ar despues de optimizarlas: la misma URL daba 222.347
    bytes sin query (la vieja) y 113.648 con una query nueva.

    Escribe dos cosas:
      · el mapa IMG_V de app.js, entre sus anclajes
      · el ?v= de cada `img/...` que aparezca en un .html

    El hash sale del archivo, asi que una foto que no cambio conserva su ?v= y
    el cliente no la vuelve a bajar.
    """
    carpeta = os.path.join(RAIZ, 'img')
    if not os.path.isdir(carpeta):
        return 0
    hashes = {}
    for nombre in sorted(os.listdir(carpeta)):
        ruta = os.path.join(carpeta, nombre)
        if not os.path.isfile(ruta):
            continue
        with open(ruta, 'rb') as f:
            hashes[nombre] = hash_bytes(f.read())

    tocados = 0

    # 1. el mapa de app.js
    app = os.path.join(RAIZ, 'app.js')
    if os.path.exists(app):
        s = io.open(app, encoding='utf-8', newline='').read()
        ini, fin = '/* IMG_V:INICIO */', '/* IMG_V:FIN */'
        i, j = s.find(ini), s.find(fin)
        if i >= 0 and j > i:
            cuerpo = ',\n'.join('  "%s": "%s"' % (n, h) for n, h in sorted(hashes.items()))
            nuevo = ini + '\nvar IMG_V = {\n' + cuerpo + '\n};\n' + fin
            if s[i:j + len(fin)] != nuevo:
                s = s[:i] + nuevo + s[j + len(fin):]
                tmp = app + '.tmp'
                io.open(tmp, 'w', encoding='utf-8', newline='').write(s)
                os.replace(tmp, app)
                print('  ok  %-12s %d fotos selladas en IMG_V' % ('app.js', len(hashes)))
                tocados += 1
            else:
                print('  =   %-12s IMG_V ya estaba al dia (%d fotos)' % ('app.js', len(hashes)))
        else:
            print('X no encontre los anclajes IMG_V en app.js')

    # 2. los <img src="img/..."> y los href de los .html
    pat = re.compile(r'(img/)([A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp|svg|gif|ico))(\?v=[a-f0-9]*)?')
    for nombre in sorted(os.listdir(RAIZ)):
        if not nombre.endswith('.html'):
            continue
        ruta = os.path.join(RAIZ, nombre)
        s = io.open(ruta, encoding='utf-8', newline='').read()

        def rep(m):
            archivo = m.group(2)
            h = hashes.get(archivo)
            # og:image y twitter:image van SIN query: las lee el robot que arma
            # la previsualizacion, una sola vez, y algunos scrapers viejos se
            # marean con el parametro.
            return m.group(1) + archivo + (('?v=' + h) if h else '')

        nuevo = pat.sub(rep, s)
        # las meta de compartir se dejan como estaban
        nuevo = re.sub(r'(property="og:image"[^>]*content="[^"]*?img/[A-Za-z0-9._-]+)\?v=[a-f0-9]*', r'\1', nuevo)
        nuevo = re.sub(r'(name="twitter:image"[^>]*content="[^"]*?img/[A-Za-z0-9._-]+)\?v=[a-f0-9]*', r'\1', nuevo)
        if nuevo != s:
            tmp = ruta + '.tmp'
            io.open(tmp, 'w', encoding='utf-8', newline='').write(nuevo)
            os.replace(tmp, ruta)
            print('  ok  %-12s fotos selladas' % nombre)
            tocados += 1
    return tocados


def main():
    # PRIMERO las fotos: sellarlas modifica app.js, asi que su hash tiene que
    # calcularse DESPUES o el ?v= del script queda describiendo la version vieja.
    sellar_imagenes()

    # TODAS las paginas, no solo el index.
    #
    # Hasta el 10/9/2026 esto solo miraba index.html, y las otras seis cargaban
    # `styles.css?v=a7236ffa` — un hash de hace semanas — porque nadie se los
    # tocaba nunca. O sea que un cambio de CSS se veia en la tienda y NO en
    # Sobre Nosotros, Contacto o Preguntas Frecuentes, hasta que al cliente se
    # le venciera el cache. Exactamente el bug que este script vino a resolver,
    # escondido en las paginas que nadie mira antes de publicar.
    hashes = {a: hash_de(a) for a in ('app.js', 'styles.css') if os.path.exists(os.path.join(RAIZ, a))}
    tocados = 0
    for nombre in sorted(os.listdir(RAIZ)):
        if not nombre.endswith('.html'):
            continue
        ruta = os.path.join(RAIZ, nombre)
        s = io.open(ruta, encoding='utf-8', newline='').read()
        antes = s
        for archivo, attr in (('app.js', 'src'), ('styles.css', 'href')):
            h = hashes.get(archivo)
            if not h:
                continue
            # con ?v= o sin el: una pagina nueva puede no traerlo todavia
            pat = re.compile(r'(' + attr + r'="' + re.escape(archivo) + r')(\?v=[^"]*)?(")')
            m = pat.search(s)
            if not m:
                continue          # esa pagina no carga ese archivo, y esta bien
            viejo = (m.group(2) or '')[3:]
            if viejo != h:
                print('  ok  %-22s %-11s %s -> %s' % (nombre, archivo, viejo or '(sin ?v=)', h))
            s = pat.sub(lambda mm: mm.group(1) + '?v=' + h + mm.group(3), s, count=1)
        if s != antes:
            tmp = ruta + '.tmp'
            io.open(tmp, 'w', encoding='utf-8', newline='').write(s)
            os.replace(tmp, ruta)
            tocados += 1

    print('%d pagina(s) actualizada(s)' % tocados if tocados else 'el ?v= de los scripts ya estaba al dia')
    return 0


sys.exit(main())
