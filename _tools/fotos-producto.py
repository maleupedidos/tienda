# -*- coding: utf-8 -*-
"""Una foto de producto al formato del catalogo.

    python _tools/fotos-producto.py ORIGEN img/carne-colita.jpg
    python _tools/fotos-producto.py ORIGEN img/carne-vacio.jpg --extender --filas 90:950

En el celular la card de carne muestra la foto en 16:9 (.carne-card
.product-thumb tiene aspect-ratio:16/9) con object-fit:cover. O sea que lo que
importa es que el corte quede entero en una franja horizontal.

Dos formas de llegar a 16:9:
  · RECORTE (por defecto): se corta arriba y abajo, centrado. Sirve cuando la
    foto ya es apaisada (3:2, 4:3) y la pieza no toca los bordes.
  · --extender: para una foto CUADRADA o vertical, donde el recorte le come
    las puntas a la pieza. En vez de cortar la pieza se agranda el fondo: cada
    costado se arma con el color del borde de su lado, fila por fila, y la foto
    se funde con un degrade. Sirve si el fondo es liso (marmol, mesada) y la
    pieza NO toca los bordes laterales — si los toca, el costado sale del color
    de la carne. Mirá siempre el resultado antes de publicar.
    `--filas A:B` recorta antes esas filas del original, para acercar la pieza.

Sale a 1100x619 (alcanza para retina en una card de ~360px) y con la calidad
mas alta que entre por debajo de 100 KB, como el resto de img/. Despues hay que
correr `python _tools/cachebuster.py` para sellar la foto en IMG_V.
"""
import argparse, os
from PIL import Image, ImageFilter

ANCHO = 1100
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


def extender(im, ratio, borde=120):
    """Lleva la foto a `ratio` agrandando el fondo a los costados."""
    w, h = im.size
    nw = int(round(h * ratio))
    if nw <= w:
        return recortar(im, ratio)
    x0 = (nw - w) // 2

    def panel(x_a, x_b):
        # El color del borde, fila por fila, desenfocado en vertical para que
        # una veta del marmol no se estire como una raya.
        col = im.crop((x_a, 0, x_b, h)).resize((1, h), Image.BOX)
        col = col.resize((8, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(40)).resize((1, h), Image.BOX)
        return col.resize((nw, h), Image.BILINEAR)

    # Debajo de todo el lienzo, un degrade del color del borde izquierdo al del
    # derecho: el borde difuminado de la foto se funde con eso y no con negro.
    rampa = Image.linear_gradient("L").rotate(90).resize((nw, h))
    lienzo = Image.composite(panel(w - 10, w), panel(0, 10), rampa)
    mascara = Image.new("L", (w, h), 255)
    px = mascara.load()
    for x in range(borde):
        a = int(255 * x / float(borde))
        for y in range(h):
            px[x, y] = a
            px[w - 1 - x, y] = a
    lienzo.paste(im, (x0, 0), mascara)
    return lienzo


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("origen")
    ap.add_argument("destino")
    ap.add_argument("--extender", action="store_true")
    ap.add_argument("--filas", help="A:B, filas del original que se conservan antes de encuadrar")
    a = ap.parse_args()

    im = Image.open(a.origen)
    if im.mode != "RGB":
        im = im.convert("RGB")
    antes = im.size
    if a.filas:
        y0, y1 = [int(v) for v in a.filas.split(":")]
        im = im.crop((0, y0, im.size[0], y1))
    im = extender(im, RATIO) if a.extender else recortar(im, RATIO)
    im = im.resize((ANCHO, int(round(ANCHO / RATIO))), Image.LANCZOS)
    for q in (86, 82, 78, 74, 70):
        im.save(a.destino, "JPEG", quality=q, optimize=True, progressive=True)
        kb = os.path.getsize(a.destino) / 1024.0
        if kb <= 100:
            break
    print("%s  %sx%s -> %sx%s  calidad %d  %.0f KB" %
          (os.path.basename(a.destino), antes[0], antes[1], im.size[0], im.size[1], q, kb))


if __name__ == "__main__":
    main()
