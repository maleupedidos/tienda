# -*- coding: utf-8 -*-
"""Las fotos de entrana y vacio que paso Tadeo, al formato del catalogo.

En el celular la card de carne muestra la foto en 16:9 (.carne-card
.product-thumb tiene aspect-ratio:16/9) con object-fit:cover. O sea que lo que
importa es que el corte quede centrado en una franja horizontal.
"""
import io, os, sys
from PIL import Image

SUB = r"C:\Users\tadeu\.claude\uploads\990d6a28-342a-4b1b-9161-1562b5b5fb80"
DEST = r"C:\Tadeo Ustariz\Trabajo\Grupo Matriz\Maleu\tienda\img"
TMP = r"C:\Users\tadeu\AppData\Local\Temp\claude\c--Tadeo-Ustariz-Trabajo-Grupo-Matriz-Maleu-tienda\990d6a28-342a-4b1b-9161-1562b5b5fb80\scratchpad"

ANCHO = 1100          # alcanza para retina en una card de ~360px
RATIO = 16.0 / 9.0


def recortar(im, ratio):
    """Recorte centrado al ratio pedido, sin deformar."""
    w, h = im.size
    if w / float(h) > ratio:          # sobra a lo ancho
        nw = int(round(h * ratio)); nh = h
    else:                              # sobra a lo alto
        nw = w; nh = int(round(w / ratio))
    x = (w - nw) // 2
    y = (h - nh) // 2
    return im.crop((x, y, x + nw, y + nh))


def procesar(origen, salida, etiqueta):
    im = Image.open(origen)
    if im.mode != "RGB":
        im = im.convert("RGB")
    antes = im.size
    im = recortar(im, RATIO)
    im = im.resize((ANCHO, int(round(ANCHO / RATIO))), Image.LANCZOS)
    # Calidad la mas alta que entre por debajo de 100 KB, como las demas.
    for q in (86, 82, 78, 74, 70):
        im.save(salida, "JPEG", quality=q, optimize=True, progressive=True)
        kb = os.path.getsize(salida) / 1024.0
        if kb <= 100:
            break
    print("  %-10s %sx%s -> %sx%s  calidad %d  %.0f KB" %
          (etiqueta, antes[0], antes[1], im.size[0], im.size[1], q, kb))
    return salida


print("Generando:")
e = procesar(os.path.join(SUB, "7a9be690-image.png"), os.path.join(TMP, "carne-entrana.jpg"), "entrana")
v = procesar(os.path.join(SUB, "d7cd0425-image.png"), os.path.join(TMP, "carne-vacio.jpg"), "vacio")

# Una tira comparativa para mirarla antes de publicar: la generica de hoy
# arriba, las dos nuevas abajo.
gen = Image.open(os.path.join(DEST, "carne-cortes.jpg")).convert("RGB")
gen = recortar(gen, RATIO).resize((ANCHO, int(ANCHO / RATIO)), Image.LANCZOS)
ims = [("HOY (la misma en los 5 cortes)", gen),
       ("ENTRANA nueva", Image.open(e)),
       ("VACIO nuevo", Image.open(v))]
alto = sum(i.size[1] for _, i in ims) + 20 * (len(ims) - 1)
tira = Image.new("RGB", (ANCHO, alto), (255, 255, 255))
y = 0
for _, i in ims:
    tira.paste(i, (0, y)); y += i.size[1] + 20
tira.save(os.path.join(TMP, "comparacion.jpg"), "JPEG", quality=84, optimize=True)
print("\nComparacion en comparacion.jpg")
