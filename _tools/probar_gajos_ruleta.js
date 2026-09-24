/**
 * Los gajos de la ruleta, proporcionales al peso. (24/9/2026)
 *
 *   node _tools/probar_gajos_ruleta.js
 *
 * Saca `gajos()` del `ruleta.html` REAL y le prueba la matematica. Existe
 * porque esta funcion decide DOS cosas a la vez y si se desincronizan el
 * problema no se ve como un error:
 *
 *   · como se dibuja cada gajo, y
 *   · donde frena la flecha (`frenarEn` la llama tambien).
 *
 * Si los angulos no cerraran en 360, o si el centro de un gajo no cayera
 * adentro del gajo, la rueda frenaria **mostrando un premio y entregando
 * otro** — delante de la persona, en el puesto. No tira ningun error: la
 * flecha simplemente apunta al lugar equivocado.
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SRC = path.join(__dirname, '..', 'ruleta.html');
const src = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');

let ok = 0, mal = 0;
const chk = (c, t, d) => {
  if (c === true) { ok++; console.log('  ok   ' + t); }
  else { mal++; console.log('  MAL  ' + t + (d !== undefined ? '\n         -> ' + JSON.stringify(d) : '')); }
};

function sacar(nombre) {
  const i = src.indexOf('\n  function ' + nombre + '(');
  if (i < 0) throw new Error('no encuentro ' + nombre + ' en ruleta.html');
  let j = src.indexOf('{', i), n = 0, k = j;
  for (; k < src.length; k++) { if (src[k] === '{') n++; else if (src[k] === '}') { n--; if (n === 0) break; } }
  return src.slice(i + 1, k + 1);
}

const ctx = { console, Math, Number, Array, Object };
vm.createContext(ctx);
vm.runInContext(
  'var premios = [];\n' +
  (src.match(/\n  var GAJO_MIN = \d+;/) || [''])[0] + '\n' +
  sacar('gajos') + '\n' +
  'function conPremios(ps){ premios = ps; return gajos(); }', ctx);

const P = (peso, txt) => ({ txt: txt || ('p' + peso), peso: peso });
const suma = g => g.reduce((a, x) => a + x.ang, 0);
const cierra = g => Math.abs(suma(g) - 360) < 0.001;
/* El centro tiene que caer ADENTRO de su gajo: es lo que hace que la flecha
   pare donde dice el dibujo. */
const centrosAdentro = g => g.every(x => x.mid > x.ini - 0.001 && x.mid < x.ini + x.ang + 0.001);
const pegados = g => g.every((x, i) => i === 0 || Math.abs(x.ini - (g[i - 1].ini + g[i - 1].ang)) < 0.001);

console.log('\n== Los gajos de la ruleta ==\n');

console.log('-- lo que pidio Tadeo: 10 y 10 grandes, 15 y empanadas medianos, nada chico --');
const hoy = ctx.conPremios([P(25, '10%'), P(20, '15%'), P(25, '10%'), P(20, 'Empanadas'), P(10, 'Nada')]);
chk(cierra(hoy), 'los cinco gajos cierran la vuelta completa', suma(hoy));
chk(pegados(hoy), 'y van pegados, sin huecos ni superposiciones');
chk(centrosAdentro(hoy), 'el centro de cada gajo cae adentro de su gajo');
chk(Math.abs(hoy[0].ang - 90) < 0.01 && Math.abs(hoy[2].ang - 90) < 0.01,
  'los dos del 10% miden 90 grados cada uno (25 de 100)', [hoy[0].ang, hoy[2].ang]);
chk(Math.abs(hoy[1].ang - 72) < 0.01 && Math.abs(hoy[3].ang - 72) < 0.01,
  'el 15% y las empanadas miden 72, iguales entre si y MAS CHICOS que el 10%', [hoy[1].ang, hoy[3].ang]);
chk(Math.abs(hoy[4].ang - 36) < 0.01 && hoy[4].ang < hoy[1].ang,
  '"Nada" mide 36: el mas chico de todos', hoy[4].ang);
chk(hoy[0].ang > hoy[1].ang && hoy[1].ang > hoy[4].ang,
  'el orden de tamanos es el que pidio: 10% > 15% = empanadas > nada');

console.log('\n-- sin pesos: partes iguales, como antes --');
const sinP = ctx.conPremios([{ txt: 'a' }, { txt: 'b' }, { txt: 'c' }]);
chk(cierra(sinP) && sinP.every(x => Math.abs(x.ang - 120) < 0.001),
  'tres premios sin peso dan tres gajos de 120 (la copia de emergencia)', sinP.map(x => x.ang));
const cero = ctx.conPremios([P(0), P(0)]);
chk(cierra(cero) && cero.every(x => Math.abs(x.ang - 180) < 0.001),
  'todos en cero tampoco rompe: se reparten iguales', cero.map(x => x.ang));

console.log('\n-- el piso: un premio muy chico no queda invisible --');
const finito = ctx.conPremios([P(97), P(1), P(1), P(1)]);
chk(cierra(finito), 'con pesos extremos la vuelta sigue cerrando en 360', suma(finito));
chk(finito.slice(1).every(x => x.ang >= 21.999),
  'los de peso 1 llegan al piso de 22 grados en vez de ser una astilla', finito.map(x => +x.ang.toFixed(2)));
chk(finito[0].ang > finito[1].ang * 3,
  'y el grande sigue siendo MUCHO mas grande: el piso no aplana la rueda', +finito[0].ang.toFixed(2));
chk(centrosAdentro(finito) && pegados(finito), 'y los centros siguen adentro de su gajo');

console.log('\n-- muchos premios: el piso no puede hacer que no cierre --');
const muchos = ctx.conPremios(Array.from({ length: 20 }, (_, i) => P(i === 0 ? 200 : 1)));
chk(cierra(muchos), '20 premios, casi todos por debajo del piso: igual cierra en 360', suma(muchos));
chk(centrosAdentro(muchos) && pegados(muchos), 'y siguen pegados y con sus centros adentro');

console.log('\n-- un premio solo --');
const uno = ctx.conPremios([P(7)]);
chk(cierra(uno) && Math.abs(uno[0].ang - 360) < 0.001, 'un premio unico ocupa la rueda entera', uno[0].ang);

console.log('\n-- la rueda vacia no revienta --');
const vacia = ctx.conPremios([]);
chk(Array.isArray(vacia) && vacia.length === 6 && Math.abs(vacia[0].ang - 60) < 0.001,
  'sin premios devuelve SEIS gajos iguales: los mismos que dibuja la rueda generica', vacia.map(x => x.ang));
/* Los dos numeros tienen que ser el mismo. Si `dibujar` pide 6 y `gajos`
   devuelve 1, el bucle lee G[1].ang de undefined y la rueda no se dibuja: una
   pantalla vacia, sin error a la vista. */
chk(/var n = premios.length \|\| 6, G = gajos\(\)/.test(src) && /premios.length \|\| 6, i, out/.test(src),
  'y ese 6 es el MISMO que usa dibujar(): si alguien cambia uno, este assert cae');

console.log('\n  ' + ok + ' ok · ' + mal + ' mal\n');
process.exit(mal ? 1 : 0);
