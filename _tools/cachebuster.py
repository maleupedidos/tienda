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

RAIZ = r'c:\Tadeo Ustariz\Trabajo\Grupo Matriz\Maleu\tienda'
IDX = os.path.join(RAIZ, 'index.html')


def hash_de(nombre):
    with open(os.path.join(RAIZ, nombre), 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


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
