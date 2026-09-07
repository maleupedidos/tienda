#!/usr/bin/env node
/**
 * Corta si algún producto sigue con el precio provisorio puesto.
 *
 * Por qué existe: el 7/9/2026 entró la categoría Carnes con los cinco cortes
 * de Diagonal y precios inventados por mí, porque los reales los tienen Tadeo
 * y Lucas. Un precio inventado es sintácticamente perfecto: node --check pasa,
 * la tienda arranca, no hay botón muerto y no se desborda nada. Lo único que
 * hace es cobrar mal.
 *
 * Ya pasó algo así el 3/9/2026 en el ERP: la tabla de precios del AUTOPEDIDO
 * quedó un mes desfasada de la hoja Productos y se cobraron dos pedidos de
 * menos. De ahí salió `_tools/precios.js` allá y este de acá.
 *
 * Uso:  node _tools/precios-pendientes.js
 * Sale con código 1 si encuentra alguno.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const APP = path.join(RAIZ, 'app.js');

const src = fs.readFileSync(APP, 'utf8');

// Cada línea de producto es una sola línea del array, así que alcanza con
// recorrerlas: no hace falta parsear el JS.
const pendientes = [];
src.split('\n').forEach((linea, i) => {
  if (!/precioProvisorio\s*:\s*true/.test(linea)) return;
  const nombre = (linea.match(/nombre\s*:\s*"([^"]+)"/) || [])[1] || '(sin nombre)';
  const precio = (linea.match(/precio\s*:\s*(\d+)/) || [])[1] || '?';
  pendientes.push({ linea: i + 1, nombre, precio });
});

if (!pendientes.length) {
  console.log('  ok   ningún producto tiene el precio provisorio puesto');
  process.exit(0);
}

console.error('');
console.error('  ⚠  HAY ' + pendientes.length + ' PRODUCTO(S) CON PRECIO PROVISORIO');
console.error('');
pendientes.forEach(p => {
  console.error('       app.js:' + p.linea + '  ' + p.nombre.padEnd(12) +
                '  $' + Number(p.precio).toLocaleString('es-AR'));
});
console.error('');
console.error('  Esos precios los inventé yo. Antes de publicar, poné los que');
console.error('  te pasen Tadeo y Lucas, y sacá el flag `precioProvisorio`.');
console.error('');
process.exit(1);
