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


def main():
    s = io.open(IDX, encoding='utf-8', newline='').read()
    antes = s
    for archivo, attr in (('app.js', 'src'), ('styles.css', 'href')):
        h = hash_de(archivo)
        pat = re.compile(r'(' + attr + r'="' + re.escape(archivo) + r'\?v=)([^"]*)(")')
        m = pat.search(s)
        if not m:
            print('X no encontre el %s de %s' % (attr, archivo)); return 1
        if m.group(2) == h:
            print('  =   %-12s ya estaba en %s' % (archivo, h))
        else:
            print('  ok  %-12s %s -> %s' % (archivo, m.group(2), h))
        s = pat.sub(lambda mm: mm.group(1) + h + mm.group(3), s, count=1)

    if s == antes:
        print('sin cambios'); return 0
    tmp = IDX + '.tmp'
    io.open(tmp, 'w', encoding='utf-8', newline='').write(s)
    os.replace(tmp, IDX)
    print('index.html actualizado')
    return 0


sys.exit(main())
