#!/usr/bin/env node
/**
 * Corta si la tienda llama a una funcion que no existe.
 *
 * Su `limpiar()` vacia comentarios, strings Y expresiones regulares. Lo ultimo
 * se agrego el 30/9/2026: sin eso, una regex con una comilla adentro —como
 * `replace(/'/g, "…")`— corria la paridad de todo el resto del archivo, y el
 * resultado de esta red pasaba a depender de cuantas comillas tuviera un
 * comentario. Podia inventar llamadas muertas o tapar una de verdad.
 *
 * POR QUE EXISTE. El 10/9/2026, escribiendo la venta de carne por pieza,
 * llame a `updateCart()` de memoria. Esa funcion NO EXISTE en este archivo: la
 * que actualiza el carrito se llama `updateUI()`.
 *
 *     node --check app.js   ->  pasa. Es sintaxis perfecta.
 *     el cache-buster       ->  pasa.
 *     el navegador          ->  ReferenceError, y recien al TOCAR la pieza.
 *
 * O sea que el unico sintoma era que el cliente tocaba una pieza y no pasaba
 * nada. Lo agarro una prueba en el navegador de casualidad, porque ejercitaba
 * ese boton; si la prueba hubiera mirado otra cosa, salia publicado.
 *
 * El ERP tiene esta red desde el 26/8/2026 (`_tools/verificar.js`) y esta
 * anotado por que: "un onclick que llama a algo inexistente parsea perfecto y
 * no tira ni un error en consola". La tienda no la tenia.
 *
 * ⚠ LA PRIMERA VERSION DE ESTE ARCHIVO DIO 96 FALSOS POSITIVOS, todos palabras
 * adentro de comentarios seguidas de un parentesis — `la carne (Carnes)` se
 * leia como una llamada a `Carnes()`. Un instrumento con ese ruido no se usa
 * nunca, asi que el orden importa y es este:
 *
 *     1. sacar los handlers que viven DENTRO de strings   (antes de limpiar)
 *     2. recien ahi borrar comentarios y strings
 *     3. y sobre eso buscar las llamadas
 *
 * Uso:  node _tools/verificar-llamadas.js
 * Sale con codigo 1 si encuentra alguna.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const APP = path.join(RAIZ, 'app.js');
const HTML = path.join(RAIZ, 'index.html');

const src = fs.readFileSync(APP, 'utf8');
const html = fs.readFileSync(HTML, 'utf8');

/* ── 1. Los handlers escritos adentro de strings de JS ───────────────
   Van PRIMERO porque el paso siguiente borra los strings. Es justo el caso
   que al ERP le costo 311 botones muertos en 2025: la pantalla se dibuja
   desde JS y el `onclick` viaja adentro de un string. */
const handlers = [];
for (const m of html.matchAll(/\bon[a-z]+\s*=\s*"([^"]*)"/g)) handlers.push(m[1]);
for (const m of src.matchAll(/\bon[a-z]+\s*=\s*\\?["']([^"'\\]{0,300}?)\\?["']/g)) handlers.push(m[1]);

/* ── 2. Limpiar app.js: fuera comentarios y strings ──────────────────
   Se reemplaza por espacios del mismo largo para no mover los numeros de
   linea: un error que apunta a la linea equivocada es peor que no tenerlo. */
function limpiar(txt) {
  let out = '';
  let i = 0;
  const n = txt.length;
  let modo = 'codigo';   // codigo | linea | bloque | regex | ' | " | `
  /* Dentro de una clase de caracteres —[^/]— la barra NO cierra la regex. */
  let enClase = false;
  /* LAS EXPRESIONES REGULARES TAMBIEN SE VACIAN (30/9/2026).

     Sin esto, `b.val.replace(/'/g, "…")` abria un string con la comilla de
     adentro de la regex, y **desde ahi todo el resto del archivo quedaba
     analizado con la paridad corrida**. Medido ese dia: pasaba en la linea 2900
     y pasaba igual desde mucho antes. El sintoma es traicionero porque no es
     estable — lo que decide de que lado cae cada string es cuantas comillas
     haya despues—, asi que la red podia inventar llamadas muertas (salieron
     `_wireCtaRefresh()` y un `not()` que venia de un `:not()` adentro de un
     selector) o, mucho peor, TAPAR una de verdad.

     Una barra abre regex solo si lo de antes no puede terminar una expresion:
     despues de un identificador, un numero, `)` o `]` es una division. */
  const abreRegex = () => {
    let j = out.length - 1;
    while (j >= 0 && /\s/.test(out[j])) j--;
    if (j < 0) return true;
    const p = out[j];
    if (/[A-Za-z0-9_$)\]]/.test(p)) {
      /* `return /re/` y `typeof`/`case` si abren, aunque terminen en letra. */
      const palabra = out.slice(Math.max(0, j - 9), j + 1).match(/[A-Za-z_$][\w$]*$/);
      return !!palabra && ['return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'instanceof']
        .indexOf(palabra[0]) >= 0;
    }
    return true;
  };
  while (i < n) {
    const c = txt[i], d = txt[i + 1];
    if (modo === 'codigo') {
      if (c === '/' && d === '/') { modo = 'linea'; out += '  '; i += 2; continue; }
      if (c === '/' && d === '*') { modo = 'bloque'; out += '  '; i += 2; continue; }
      if (c === '/' && abreRegex()) { modo = 'regex'; enClase = false; out += ' '; i++; continue; }
      if (c === "'" || c === '"' || c === '`') { modo = c; out += ' '; i++; continue; }
      out += c; i++; continue;
    }
    if (modo === 'regex') {
      if (c === '\\') { out += '  '; i += 2; continue; }
      if (c === '[') { enClase = true; out += ' '; i++; continue; }
      if (c === ']') { enClase = false; out += ' '; i++; continue; }
      /* Una regex no puede tener un salto de linea sin escapar: si aparece uno,
         lo que se abrio no era una regex. Se vuelve a codigo para no arrastrar
         el error hasta el final del archivo, que es justo lo que se vino a
         arreglar. */
      if (c === '\n') { modo = 'codigo'; enClase = false; out += '\n'; i++; continue; }
      if (c === '/' && !enClase) { modo = 'codigo'; out += ' '; i++; continue; }
      out += ' '; i++; continue;
    }
    if (modo === 'linea') {
      if (c === '\n') { modo = 'codigo'; out += '\n'; i++; continue; }
      out += ' '; i++; continue;
    }
    if (modo === 'bloque') {
      if (c === '*' && d === '/') { modo = 'codigo'; out += '  '; i += 2; continue; }
      out += (c === '\n' ? '\n' : ' '); i++; continue;
    }
    // dentro de un string
    if (c === '\\') { out += '  '; i += 2; continue; }
    if (c === modo) { modo = 'codigo'; out += ' '; i++; continue; }
    out += (c === '\n' ? '\n' : ' '); i++;
  }
  return out;
}

const codigo = limpiar(src);

/* ── 3. Lo que EXISTE ────────────────────────────────────────────────
   Se busca sobre el ORIGINAL: una funcion declarada es una funcion declarada
   aunque este cerca de un comentario. */
const existe = new Set();
for (const m of src.matchAll(/(?:^|\n)\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) existe.add(m[1]);
for (const m of src.matchAll(/(?:^|\n)\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/g)) existe.add(m[1]);
for (const m of src.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)) existe.add(m[1]);
/* Los PARAMETROS tambien existen (11/9/2026): un callback que llega por
   parametro — `function (alTocar) { alTocar(); }` — se marcaba como llamada a
   algo inexistente. Se toman los de `function x(a, b)`, `function (a)`,
   `(a, b) =>` y `a =>`; los desestructurados y los default, por su nombre. */
const agregarParams = (lista) => lista.split(',').forEach((p) => {
  const n = p.replace(/=.*$/s, '').replace(/[{}\[\]\s.]/g, '');
  if (/^[A-Za-z_$][\w$]*$/.test(n)) existe.add(n);
});
for (const m of src.matchAll(/function\s*[A-Za-z_$]?[\w$]*\s*\(([^)]*)\)/g)) agregarParams(m[1]);
for (const m of src.matchAll(/\(([^()]*)\)\s*=>/g)) agregarParams(m[1]);
for (const m of src.matchAll(/(?:^|[^\w$.])([A-Za-z_$][\w$]*)\s*=>/g)) existe.add(m[1]);
for (const m of html.matchAll(/(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) existe.add(m[1]);
for (const m of html.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\()/g)) existe.add(m[1]);

/* Lo que trae el navegador. Cada uno esta porque el codigo lo usa de verdad,
   no "por si acaso". */
const DE_AFUERA = new Set([
  'fetch','setTimeout','setInterval','clearTimeout','clearInterval','requestAnimationFrame',
  'encodeURIComponent','decodeURIComponent','parseInt','parseFloat','isNaN','isFinite',
  'String','Number','Boolean','Array','Object','JSON','Math','Date','RegExp','Error','Promise','Map','Set','Symbol',
  'alert','confirm','prompt','open','close','focus','blur','scrollTo','scrollBy','matchMedia',
  'getComputedStyle','structuredClone','queueMicrotask','btoa','atob','gtag',
  /* Los dos los define el <head> del index.html, no app.js: gtag es la cola
     de GA4 y fbq la del pixel de Meta. app.js las llama guardadas con un
     typeof, asi que si el head no cargara no revienta nada. */
  'fbq',
  'require','module','exports','console',
  'Intl','URL','URLSearchParams','FormData','Blob','File','FileReader','AbortController','Image','Audio',
  'CustomEvent','Event','MutationObserver','IntersectionObserver','ResizeObserver',
  // palabras clave que van seguidas de parentesis
  'if','for','while','switch','catch','return','typeof','function','new','do','else','try',
  'in','of','delete','void','await','yield','case','throw','with','super','this','instanceof'
]);

/* ── 4. Lo que se LLAMA ──────────────────────────────────────────────
   Sobre el codigo ya limpio, y solo `foo(` que no venga precedido de un punto
   (eso seria un metodo: `x.foo()` lo resuelve el objeto, no el scope). */
const llamadas = new Map();
codigo.split('\n').forEach((linea, i) => {
  for (const m of linea.matchAll(/(^|[^\w$.])([A-Za-z_$][\w$]*)\s*\(/g)) {
    /* `{ set innerHTML(v) {...} }` y `get foo()` se escriben igual que una
       invocacion. Se miran las letras de antes para distinguirlos. */
    const antes = linea.slice(0, m.index + m[1].length);
    if (/(?:^|[^\w$])(?:set|get)\s+$/.test(antes)) continue;
    /* `function foo(` es una DECLARACION, no una invocacion. Importa para las
       funciones que se declaran y se llaman en el acto —`(function foo() {…})()`—,
       cuyo nombre nunca llega a `existe` porque esa regex pide que `function`
       arranque la linea. Salio a la luz el 30/9/2026, al arreglar el analizador
       de regex: el desfasaje que ese bug producia lo venia tapando. */
    if (/(?:^|[^\w$])function\s+$/.test(antes)) continue;
    if (!llamadas.has(m[2])) llamadas.set(m[2], i + 1);
  }
});
handlers.forEach(h => {
  for (const m of h.matchAll(/(^|[^\w$.])([A-Za-z_$][\w$]*)\s*\(/g)) {
    if (!llamadas.has(m[2])) llamadas.set(m[2], 0);
  }
});

/* ── 5. El cruce ─────────────────────────────────────────────────────── */
const muertas = [];
for (const [nombre, linea] of llamadas) {
  if (existe.has(nombre) || DE_AFUERA.has(nombre)) continue;
  muertas.push({ nombre, linea });
}

if (!muertas.length) {
  console.log('  ok   ' + llamadas.size + ' llamadas distintas, todas existen');
  process.exit(0);
}

console.error('');
console.error('  ⚠  HAY ' + muertas.length + ' LLAMADA(S) A ALGO QUE NO EXISTE');
console.error('');
muertas.sort((a, b) => a.linea - b.linea).forEach(m => {
  console.error('       ' + (m.linea ? 'app.js:' + m.linea : '(en un handler)').padEnd(18) + m.nombre + '()');
});
console.error('');
console.error('  Esto parsea perfecto y revienta recien cuando alguien toca ese boton.');
console.error('  Si el nombre es correcto y viene del navegador, agregalo a DE_AFUERA.');
console.error('');
process.exit(1);
