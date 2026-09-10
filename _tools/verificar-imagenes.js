/**
 * Que ninguna foto falte, y que ninguna vuelva a pesar de mas.
 *
 *   node _tools/verificar-imagenes.js
 *
 * POR QUE EXISTE. Dos formas de romper la tienda con una imagen, y las dos son
 * silenciosas:
 *
 *   1. UNA REFERENCIA ROTA. El catalogo nombra la foto de cada producto por
 *      string (`img:"wrap-carne.jpg"`). Si el archivo no esta —se renombro, se
 *      convirtio de PNG a JPG y quedo una referencia vieja— el navegador
 *      muestra el hueco del alt y sigue como si nada: no hay error de JS, el
 *      pedido se puede hacer igual, y en un test headless casi no se nota.
 *      Paso el 10/9/2026 al pasar los 4 sorrentinos de PNG a JPEG.
 *
 *   2. UNA FOTO QUE PESA DE MAS. El 10/9/2026 la primera visita se bajaba
 *      1.741 KB, de los cuales 1.372 eran fotos: cuatro sorrentinos en PNG de
 *      ~900 KB cada uno, y el resto en 1024 px cuando la card los muestra a
 *      279. Nadie lo mira porque la tienda se ve igual — se ve igual pero
 *      tarda 3,1 s en 4G, y eso se paga cuando el trafico es pago.
 *
 * El tope no es un numero inventado: la card mide 279x349 css px en TODOS los
 * anchos (medido de 390 a 1920), o sea 558x698 en pantalla retina. Con 10% de
 * margen, ninguna foto de producto necesita mas de ~620x770.
 *
 * Sale con codigo 1 si algo falta o se paso de peso.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const IMG = path.join(RAIZ, 'img');
const RED = '\x1b[31m', VER = '\x1b[32m', AMA = '\x1b[33m', DIM = '\x1b[2m', RST = '\x1b[0m';

/* Topes en KB. Generosos a proposito: esto no esta para pelear 5 KB, esta para
   que no vuelva a entrar un PNG de 900. */
const TOPE_FOTO = 160;
const TOPE_LOGO = 40;
/* La imagen de compartir es 1200x630 y NO la baja ningun cliente: solo el robot
   que arma la previsualizacion de WhatsApp o Facebook. */
const EXCEPCIONES = { 'og-maleu.jpg': 220, 'favicon.png': 999, 'logo-maleu-blanco.png': 999 };

function referencias() {
  const vistos = new Map();   // archivo -> [donde]
  const anotar = (f, donde) => {
    if (!vistos.has(f)) vistos.set(f, []);
    if (vistos.get(f).indexOf(donde) < 0) vistos.get(f).push(donde);
  };
  const archivos = fs.readdirSync(RAIZ).filter((f) => /\.(html|js|css)$/.test(f))
    .concat(['app.js', 'styles.css'].filter((f) => fs.existsSync(path.join(RAIZ, f))));
  new Set(archivos).forEach((nombre) => {
    const src = fs.readFileSync(path.join(RAIZ, nombre), 'utf8');
    /* Todo lo que apunte a img/ desde un src, un href, un url() de CSS o el
       campo `img:` del catalogo. */
    const re = /img\/([A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp|svg|gif|ico))/g;
    let m;
    while ((m = re.exec(src)) !== null) anotar(m[1], nombre);
    /* El catalogo nombra la foto SIN la carpeta: img:"wrap-carne.jpg".
       Las DOS comillas: los productos usan dobles y los combos simples
       (`img: 'combo-finde.jpg'`). Con solo las dobles, los 5 combos salian
       como huerfanos — y un huerfano falso es peligroso: invita a borrar una
       foto que la tienda si esta usando. */
    const re2 = /\bimg\s*:\s*["']([A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp))["']/g;
    while ((m = re2.exec(src)) !== null) anotar(m[1], nombre);
  });
  return vistos;
}

function main() {
  if (!fs.existsSync(IMG)) { console.error('No existe la carpeta img/'); process.exit(1); }
  const enDisco = new Set(fs.readdirSync(IMG));
  const refs = referencias();
  let malas = 0;

  /* 1. referencias rotas */
  refs.forEach((donde, archivo) => {
    if (!enDisco.has(archivo)) {
      malas++;
      console.log(RED + '  MAL  ' + RST + 'falta img/' + archivo + DIM + '  (lo nombra ' + donde.join(', ') + ')' + RST);
    }
  });

  /* 2. peso */
  const gordas = [];
  enDisco.forEach((archivo) => {
    if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(archivo)) return;
    const kb = fs.statSync(path.join(IMG, archivo)).size / 1024;
    const esLogo = /^logo|^favicon/.test(archivo);
    const tope = EXCEPCIONES[archivo] || (esLogo ? TOPE_LOGO : TOPE_FOTO);
    if (kb > tope) gordas.push({ archivo, kb, tope });
  });
  gordas.sort((a, b) => b.kb - a.kb).forEach((g) => {
    malas++;
    console.log(RED + '  MAL  ' + RST + 'img/' + g.archivo + ' pesa ' + g.kb.toFixed(0) +
      ' KB y el tope es ' + g.tope + DIM + '  (achicala: la card la muestra a 279x349 css)' + RST);
  });

  /* 3. lo que esta en disco y no lo nombra nadie: no rompe, pero se avisa */
  const huerfanas = [];
  enDisco.forEach((a) => { if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(a) && !refs.has(a)) huerfanas.push(a); });

  const totalKb = [...enDisco].reduce((s, a) => s + fs.statSync(path.join(IMG, a)).size, 0) / 1024;
  if (malas) {
    console.log(RED + '\n' + malas + ' problema(s) con las imagenes' + RST);
    process.exit(1);
  }
  console.log(VER + '  ok   ' + RST + refs.size + ' fotos referenciadas, todas existen y ninguna se pasa de peso' +
              DIM + '  (img/ pesa ' + totalKb.toFixed(0) + ' KB)' + RST);
  if (huerfanas.length) {
    console.log(AMA + '  aviso' + RST + ' no las nombra ninguna pagina: ' + huerfanas.join(', ') +
                DIM + ' — no se descargan, pero si no se usan mas se pueden borrar' + RST);
  }
}

main();
