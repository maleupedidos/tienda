/**
 * LOS PRECIOS VIENEN DE LA PLANILLA — en vivo (14/10/2026).
 *
 *   node _tools/verificar-precios-vivo.js [390|1440]      (contra maleu.com.ar)
 *   BASE=http://127.0.0.1:8191 node _tools/verificar-precios-vivo.js 390
 *
 * Abre la tienda DE VERDAD, sin simular el backend, y mira:
 *   · que app.js publicado ya no tenga precios escritos;
 *   · que mientras no llegan, ninguna card muestre un numero (solo «$…»);
 *   · que cuando llegan, CADA producto y CADA combo tenga el precio que dice
 *     `stock_full` (Productos!I y la hoja «Precios Combos»), sin excepcion;
 *   · que agregar al carrito ande y el total sea ese precio;
 *   · sin scroll horizontal.
 * No manda ningun pedido: solo lee.
 */
'use strict';
const path = require('path');
const { abrir, evaluar } = require(path.join(__dirname, '..', '..', 'maleupedidos.github.io', '_tools', 'pruebas', 'cdp.js'));
const BASE = process.env.BASE || 'https://maleu.com.ar';
const ANCHO = Number(process.argv[2]) || 390;
const API = 'https://script.google.com/macros/s/AKfycbxmrG5YVSshcYezk8lXFx_uxb7NFGcb9EfTXc7dsIN4rZyj73CET4mk_aKPFPDY2wNi/exec';
let ok = 0, mal = 0;
const chk = (n, c, d) => { if (c === true) { ok++; console.log('  ok   ' + n); } else { mal++; console.log('  MAL  ' + n + (d !== undefined ? '\n         ' + JSON.stringify(d).slice(0, 400) : '')); } };
const pausa = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('\n== Tienda: precios desde la planilla, en vivo (' + BASE + ', ' + ANCHO + ' px) ==\n');
  const cli = await abrir();
  await cli.enviar('Page.enable'); await cli.enviar('Runtime.enable');
  await cli.enviar('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: 844, deviceScaleFactor: 1, mobile: ANCHO < 600 });
  /* Lo que muestran las cards ANTES de que llegue stock_full: se demora la respuesta 3 s. */
  await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: `window.__err=[];window.addEventListener('error',function(e){window.__err.push(e.message)});
    (function(){var o=window.fetch;window.fetch=function(u,x){var s=String((u&&u.url)||u);var p=o.apply(this,arguments);
      if(s.indexOf('action=stock_full')>=0&&!window.__demorado){window.__demorado=1;return p.then(function(r){return new Promise(function(ok){setTimeout(function(){ok(r)},3000)})});}
      return p;};})();` });
  await cli.enviar('Page.navigate', { url: BASE + '/?v=' + Date.now() });
  for (let i = 0; i < 60; i++) { if (await evaluar(cli, "document.querySelectorAll('.product-price').length>5")) break; await pausa(250); }
  const antes = await evaluar(cli, `(function(){ var t=[].slice.call(document.querySelectorAll('.product-price')).map(function(x){return x.textContent;});
    return { n:t.length, conNumero:t.filter(function(x){return /\\d/.test(x);}).slice(0,5), listos: typeof _preciosListos!=='undefined'?_preciosListos:'no-existe' }; })()`);
  chk('la tienda publicada es la nueva (tiene _preciosListos)', antes.listos !== 'no-existe', antes);
  chk('mientras no llegan, ninguna card muestra un número (' + antes.n + ' cards)', antes.n > 5 && antes.conNumero.length === 0 && antes.listos === false, antes);
  /* La zona como si el cliente ya la hubiera elegido: la puerta que se mide es la de precios. */
  const bloq = await evaluar(cli, `(function(){ currentZone='estancias'; zonaProvisoria=false; try{applyZone();}catch(e){}
    cart={}; var r=addToCart(19); var t=document.querySelector('.toast, #toast'); return { r:r, cant:cart[19]||0, toast: t?t.textContent:'' }; })()`);
  chk('y agregar antes de que lleguen no deja (avisa «Cargando los precios»)', bloq.cant === 0 && bloq.r === false, bloq);
  for (let i = 0; i < 80; i++) { if (await evaluar(cli, "typeof _preciosListos!=='undefined'&&_preciosListos===true")) break; await pausa(250); }
  const full = JSON.parse(require('child_process').execSync('curl -sL "' + API + '?action=stock_full&_=' + Date.now() + '"').toString());
  const r = await evaluar(cli, `(function(){
    var mal=[];
    PRODUCTOS.forEach(function(p){ var a=PROD_ABBR[p.id]||p.abbr; mal.push([p.id,a,p.precio]); });
    var cb=COMBOS.map(function(c){return [c.id,c.precio];});
    var t=[].slice.call(document.querySelectorAll('.product-price')).map(function(x){return x.textContent;});
    return { listos:_preciosListos, prods:mal, combos:cb, sinNumero:t.filter(function(x){return !/\\d/.test(x);}).length, n:t.length,
      ancho:document.documentElement.scrollWidth, err:(window.__err||[]).slice(0,3) }; })()`);
  chk('los precios llegan', r.listos === true);
  const difP = r.prods.filter(([id, a, p]) => !(full[a] && full[a].pv === p));
  chk('los ' + r.prods.length + ' productos tienen el precio de Productos!I', difP.length === 0, difP);
  const difC = r.combos.filter(([id, p]) => !(full._combos && full._combos[id] === p));
  chk('los ' + r.combos.length + ' combos tienen el de «Precios Combos»', difC.length === 0, difC);
  chk('y ninguna card quedó en «$…»', r.sinNumero === 0, r.sinNumero + ' de ' + r.n);
  chk('sin scroll horizontal', r.ancho <= ANCHO, r.ancho);
  /* Agregar un producto: el total del carrito es su precio. Necesita zona: se elige Estancias como lo haria el cliente. */
  const a = await evaluar(cli, `(function(){ try{ currentZone='estancias'; zonaProvisoria=false;
      var p=PROD_MAP[19]; cart={}; var r=addToCart(19); return { r:r, cant:cart[19]||0, total: (typeof cartTotal==='function'?cartTotal():null), precio:p.precio, zona:currentZone }; }catch(e){ return {err:e.message}; } })()`);
  chk('agregar al carrito anda y suma el precio de la planilla', a.cant === 1 && (a.total === null || a.total === a.precio) && a.precio === full.PMu.pv, a);
  chk('sin errores', JSON.stringify(r.err) === '[]', r.err);
  await evaluar(cli, "try{cart={};localStorage.removeItem('maleu_carrito_v1');}catch(e){} 1");
  cli.matar();
  console.log('\n  ' + ok + ' ok · ' + mal + ' mal\n');
  process.exit(mal ? 1 : 0);
})().catch(e => { console.error('EXPLOTO: ' + e.message); process.exit(1); });
