/**
 * Que no se publique una nota interna en una pagina que ve el cliente.
 *
 *   node _tools/verificar-paginas.js
 *
 * POR QUE EXISTE. El 10/9/2026 quedo publicado en maleu.com.ar, arriba de todo
 * en "Sobre Nosotros", un recuadro amarillo que decia:
 *
 *     "Tadeo: este texto lo escribi yo con los datos que tengo (2021, el
 *      8/8/2023...). La historia es tuya y la voz tambien — leelo y decime
 *      que cambiar."
 *
 * Y en "Ser parte de Maleu", otro que exponia que las condiciones del vendedor
 * —cuanto se gana— todavia no estaban definidas.
 *
 * Lo peor es que ESTABA PREVISTO. El CSS de esos recuadros tenia escrito, de
 * puño y letra: *"van bien visibles a proposito: un borrador que no se
 * distingue del texto final se publica sin querer"*. Se publico igual, y lo
 * encontro Tadeo leyendo su propia tienda.
 *
 * La leccion: **un aviso VISIBLE no es una red.** Hay que mirarlo para que
 * sirva, y nadie mira las paginas secundarias antes de un push que iba de otra
 * cosa. Una red corta sola.
 *
 * Ninguna de las otras herramientas agarra esto: el HTML es valido, el JS
 * parsea, los botones existen, el pedido llega al Sheets. **Un texto para
 * adentro es sintacticamente perfecto.**
 *
 * Sale con codigo 1 si encuentra algo.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const RED = '\x1b[31m', VER = '\x1b[32m', DIM = '\x1b[2m', RST = '\x1b[0m';

/* Alta senal y poco ruido: cosas que en una tienda no tienen NINGUNA razon de
   estar. Nada de heuristicas de estilo — un test que marca prosa legitima se
   ignora en dos dias. */
const MARCAS = [
  { re: /class\s*=\s*["'][^"']*borrador/i,  que: 'un recuadro de borrador' },
  { re: /\bTadeo\b|\bUstariz\b/,            que: 'el nombre del dueño en el texto' },
  { re: /falta(n)?\s+definir/i,             que: 'un "falta definir" a la vista del cliente' },
  /* Con `\bTODO\b` esto marcaba "MÉTODO": en JS la tilde NO es un caracter de
     palabra, asi que la E acentuada abre un limite y "TODO" queda suelto. Un
     test que marca la palabra "metodo" en una tienda de comida es puro ruido y
     se ignora en dos dias. Con \p{L} la letra acentuada cuenta como letra. */
  { re: /(?<!\p{L})(TODO|FIXME|XXX)(?!\p{L})/u, que: 'una marca de trabajo pendiente' },
  { re: /lorem ipsum/i,                     que: 'texto de relleno' },
  { re: /\bchanga\b/i,                      que: '"changa" — no es como se cuenta la marca' },
  { re: /pendiente de revisar|sin revisar|revisar esto/i, que: 'una nota de revision' },
  { re: /\[\s*(completar|definir|poner|revisar)[^\]]*\]/i, que: 'un placeholder entre corchetes' },
];

/* Solo lo que se sirve. `_tools` es interno y ahi SI se puede nombrar a Tadeo:
   los comentarios de las herramientas cuentan por que existe cada cosa. */
function paginas() {
  return fs.readdirSync(RAIZ)
    .filter((f) => f.endsWith('.html'))
    .map((f) => path.join(RAIZ, f));
}

/* Se mira el archivo entero, comentarios incluidos. Un `<!-- Tadeo: ... -->`
   no se ve en pantalla pero viaja igual: cualquiera abre "ver codigo fuente",
   y este repo ademas es publico en GitHub. */
function revisar(file) {
  const src = fs.readFileSync(file, 'utf8');
  const lineas = src.split(/\r?\n/);
  const hallazgos = [];
  lineas.forEach((ln, i) => {
    MARCAS.forEach((m) => {
      if (m.re.test(ln)) {
        hallazgos.push({ linea: i + 1, que: m.que, texto: ln.trim().replace(/\s+/g, ' ').slice(0, 95) });
      }
    });
  });
  return hallazgos;
}

function main() {
  const archivos = paginas();
  if (!archivos.length) { console.error('No encontre ninguna pagina .html'); process.exit(1); }

  let malas = 0;
  archivos.forEach((f) => {
    const h = revisar(f);
    if (!h.length) return;
    malas += h.length;
    console.log(RED + '  MAL  ' + path.basename(f) + RST);
    h.forEach((x) => {
      console.log('         linea ' + x.linea + ' — ' + x.que);
      console.log(DIM + '         ' + x.texto + RST);
    });
  });

  if (malas) {
    console.log(RED + '\n' + malas + ' cosa(s) para adentro en paginas que ve el cliente' + RST);
    console.log(DIM + 'Un borrador se deja SIN COMMITEAR, no se marca con un recuadro amarillo:\n' +
                'eso ya se probo y se publico igual (10/9/2026).' + RST);
    process.exit(1);
  }
  console.log(VER + '  ok   ' + RST + 'las ' + archivos.length + ' paginas hablan solo para el cliente');
}

main();
