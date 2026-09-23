/**
 * El unico descuento automatico es el 10% en efectivo (11/9/2026).
 *
 *   node _tools/verificar-descuento.js [ancho]      (390 por defecto)
 *
 * POR QUE EXISTE. Hasta el 11/9/2026 la tienda tenia DOS descuentos
 * automaticos: 10% en efectivo y 10% por superar $100.000. Tadeo dio de baja
 * el segundo: "saquemos el 10% off superando los $100.000 porque con la carne
 * ahora es muy facil". Con dos piezas de lomo ya se pasa el umbral.
 *
 * El descuento vive en SEIS lugares de la pantalla (el total, su etiqueta, el
 * incentivo del carrito, el cartel del medio de pago, la barra de promo y el
 * resumen) y en el JSON que se le manda al ERP. Si uno se queda con la regla
 * vieja, el cliente ve un numero y paga otro — y ningun otro test mira esto.
 *
 * QUE HACE. Abre la tienda en un Chrome de verdad con un carrito de mas de
 * $100.000 (productos + una pieza de carne) y verifica:
 *   · por transferencia: sin descuento en ningun lado, ni la palabra "100.000";
 *   · en efectivo: el 10%, con su etiqueta;
 *   · el JSON del pedido por transferencia: descuento 0 y total = subtotal;
 *   · en Pilar (fuera de los ex-Home): ningun descuento, ni la barra de promo.
 *
 * Todo POST se corta DOS veces: adentro de la pagina (el fetch queda colgado y
 * sendBeacon devuelve false) y por CDP, fuera de ella. Ningun test puede meter
 * un pedido en la planilla — ya paso el 11/9/2026 con "Prueba Escaneo".
 *
 * Con RAIZ=<carpeta> corre contra otra copia de la tienda (para la direccion
 * contraria: contra la tienda de antes tiene que fallar).
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(process.env.RAIZ || path.join(__dirname, '..'));
const ANCHO = Number(process.argv[2] || 390);
const ALTO = ANCHO < 700 ? 844 : 900;
const PUERTO = 8700 + Math.floor(Math.random() * 90);
const RED = '\x1b[31m', VER = '\x1b[32m', DIM = '\x1b[2m', RST = '\x1b[0m';
const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

/* Una pieza de lomo de 2,330 kg: con ella sola ya son $76.890. */
const PIEZAS = { CLo: [{ id: 'LOM-01', kg: 2.33 }] };

function servir() {
  return new Promise((listo, fallo) => {
    const srv = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/') rel = '/index.html';
      const abs = path.join(RAIZ, rel);
      if (!abs.startsWith(RAIZ) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
        res.writeHead(404); res.end('no esta'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream',
                           'Cache-Control': 'no-store' });
      fs.createReadStream(abs).pipe(res);
    });
    srv.on('error', fallo);
    srv.listen(PUERTO, '127.0.0.1', () => listo(srv));
  });
}

function cdp(url) {
  const ws = new WebSocket(url);
  let id = 0; const pend = new Map(); const oyentes = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) {
      const { ok, mal } = pend.get(m.id); pend.delete(m.id);
      m.error ? mal(new Error(m.error.message)) : ok(m.result);
    } else if (m.method) oyentes.forEach((f) => f(m));
  });
  return {
    listo: new Promise((r) => ws.addEventListener('open', r)),
    on: (f) => oyentes.push(f),
    enviar: (m, p) => new Promise((ok, mal) => {
      const i = ++id; pend.set(i, { ok, mal });
      ws.send(JSON.stringify({ id: i, method: m, params: p || {} }));
    }),
  };
}

async function esperarPagina(puerto) {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + puerto + '/json/list');
      const p = (await r.json()).find((x) => x.type === 'page' && x.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl;
    } catch (e) { /* todavia no */ }
    await new Promise((s) => setTimeout(s, 250));
  }
  throw new Error('Chrome no abrio');
}
const dormir = (ms) => new Promise((s) => setTimeout(s, ms));

/* El backend, desde la pagina: stock sin topes (asi el carrito se arma igual
   cualquier dia), una pieza de lomo, y el POST guardado y colgado. */
const PREP = `(function () {
  try { localStorage.clear(); localStorage.setItem('maleu_zone', 'estancias'); } catch (e) {}
  window.__post = null;
  navigator.sendBeacon = function () { return false; };
  var orig = window.fetch;
  window.fetch = function (url, opts) {
    var u = String(url);
    if (opts && String(opts.method || '').toUpperCase() === 'POST') {
      window.__post = String(opts.body || '');
      return new Promise(function () {});
    }
    if (u.indexOf('action=piezas_full') >= 0) {
      return Promise.resolve(new Response(${JSON.stringify(JSON.stringify(PIEZAS))},
        { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    if (u.indexOf('action=stock_full') >= 0) {
      return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return orig.apply(this, arguments);
  };
})();`;

const ELEGIR_ZONA = `(async function () {
  var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };
  var z = [].slice.call(document.querySelectorAll('#loc-step-zone .loc-btn'))
    .filter(function (b) { return (b.getAttribute('onclick') || '').indexOf('estancias') >= 0; })[0];
  if (z) { z.click(); await dormir(400); }
  var f = document.querySelector('#loc-dates-grid button:not([disabled])');
  if (f) f.click();
  await dormir(400);
  var ov = document.getElementById('loc-overlay');
  return !!(ov && getComputedStyle(ov).display !== 'none');
})()`;

/* Arma el carrito: la pieza de lomo y packs de muzza hasta pasar $120.000. */
const ARMAR = `(function () {
  togglePieza('CLo', 'LOM-01');
  for (var i = 0; i < 12 && descontableSubtotal() < 120000; i++) addToCart(5);
  return JSON.stringify({ sub: descontableSubtotal(), piezas: Object.keys(piezaCart).length, packs: cart[5] || 0 });
})()`;

/* Elige un medio de pago como una persona y devuelve lo que se ve. */
const PAGAR = (valor) => `(function () {
  var r = document.querySelector('input[name="pago"][value="${valor}"]');
  r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true }));
  if (typeof updateUI === 'function') updateUI();
  if (typeof updatePromoBar === 'function') updatePromoBar();
  if (typeof updateFormSummary === 'function') updateFormSummary();
  var vis = function (id) { var e = document.getElementById(id); return !!(e && e.style.display !== 'none' && getComputedStyle(e).display !== 'none'); };
  var txt = function (id) { var e = document.getElementById(id); return e ? e.textContent : ''; };
  var promo = document.getElementById('promo-bar');
  return JSON.stringify({
    sub: descontableSubtotal(), desc: getTotalDiscount(), etiqueta: getDiscountLabel(),
    filaDesc: vis('cart-discount-row'), incentivo: vis('cart-incentive') ? txt('cart-incentive') : '',
    hint: vis('pago-hint'), promo: promo && promo.style.display !== 'none' ? promo.textContent : '',
    resumen: txt('form-summary') || (document.querySelector('.form-summary') || {}).textContent || '',
    toda: document.body.innerText
  });
})()`;

/* Completa el formulario y aprieta el boton, por transferencia. */
const MANDAR = `(async function () {
  var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };
  document.getElementById('f-nombre').value = 'PRUEBA Automatica';
  document.getElementById('f-telefono').value = '1155038905';
  var bp = document.getElementById('f-barrio-privado');
  bp.value = 'Estancias del Pilar'; bp.dispatchEvent(new Event('change'));
  await dormir(120);
  var ba = document.getElementById('f-barrio');
  ba.value = ba.options[1] ? ba.options[1].value : ''; ba.dispatchEvent(new Event('change'));
  document.getElementById('f-lote').value = '999';
  var dia = document.querySelector('#day-picker .dp-cell.available');
  if (!dia) return JSON.stringify({ error: 'el calendario no ofrece ningun dia' });
  dia.click();
  await dormir(150);
  var tr = document.querySelector('input[name="pago"][value="Transferencia"]');
  tr.checked = true; tr.dispatchEvent(new Event('change', { bubbles: true }));
  await dormir(200);
  enviarPedido();
  for (var i = 0; i < 40 && !window.__post; i++) await dormir(100);
  return window.__post || JSON.stringify({ error: 'no salio el pedido' });
})()`;

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-desc-'));
  const puertoCdp = 9800 + Math.floor(Math.random() * 90);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil,
    '--window-size=' + ANCHO + ',' + ALTO, 'about:blank'], { stdio: 'ignore' });

  let mal = 0, bien = 0;
  const chk = (ok, t) => { ok ? bien++ : mal++; console.log('  ' + (ok ? VER + 'ok   ' : RED + 'MAL  ') + RST + t); };

  try {
    const cli = cdp(await esperarPagina(puertoCdp));
    await cli.listo;
    await cli.enviar('Page.enable');
    await cli.enviar('Runtime.enable');
    await cli.enviar('Emulation.setDeviceMetricsOverride',
      { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: ANCHO < 700 });
    /* El segundo seguro: todo POST a Apps Script y todo salto a WhatsApp se
       corta afuera de la pagina, desde antes de la primera navegacion. */
    const escapados = [];
    await cli.enviar('Fetch.enable', { patterns: [{ urlPattern: '*script.google.com*' },
      { urlPattern: '*wa.me*' }, { urlPattern: '*whatsapp*' }] });
    cli.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      const r = m.params.request;
      try {
        if (r.method !== 'POST' && !/wa\.me|whatsapp/.test(r.url)) {
          await cli.enviar('Fetch.continueRequest', { requestId: m.params.requestId });
          return;
        }
        escapados.push(r.method + ' ' + r.url.slice(0, 60));
        await cli.enviar('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'BlockedByClient' });
      } catch (e) { /* la pagina ya se fue */ }
    });
    const ev = async (e) => {
      const r = await cli.enviar('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error(String((d.exception && (d.exception.description || d.exception.value)) || d.text).slice(0, 200));
      }
      return r.result.value;
    };
    const esperar = async (expr, ms) => {
      for (let i = 0; i < ms / 100; i++) { if (await ev(expr).catch(() => false)) return true; await dormir(100); }
      return false;
    };

    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: PREP });
    await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?d=' + Date.now() });
    await esperar("typeof PRODUCTOS !== 'undefined' && !!document.getElementById('loc-step-zone')", 15000);
    if (await ev(ELEGIR_ZONA)) throw new Error('el modal de zona y fecha sigue abierto');
    if (!(await esperar("typeof hayPiezas === 'function' && hayPiezas()", 8000))) throw new Error('no llego la pieza de lomo');

    const armado = JSON.parse(await ev(ARMAR));
    console.log(DIM + '  carrito: $' + armado.sub + ' — ' + armado.packs + ' packs de muzza y ' + armado.piezas + ' pieza de lomo' + RST);
    chk(armado.sub >= 120000 && armado.piezas === 1, 'el carrito pasa los $100.000 y lleva carne');

    console.log('\n' + DIM + '== Por transferencia ==' + RST);
    const tr = JSON.parse(await ev(PAGAR('Transferencia')));
    chk(tr.desc === 0, 'no hay descuento (' + tr.desc + ')');
    chk(tr.etiqueta === '', 'ninguna etiqueta de descuento ("' + tr.etiqueta + '")');
    chk(!tr.filaDesc, 'el carrito no dibuja la fila de descuento');
    chk(/efectivo/i.test(tr.incentivo) && /10%/.test(tr.incentivo),
        'el carrito recuerda el efectivo, aunque el pedido sea grande: "' + tr.incentivo.trim() + '"');
    chk(tr.hint, 'y el cartel del medio de pago tambien');
    /* Se pide QUE LO DIGA, no las palabras exactas: el 23/9/2026 la franja
       paso a 'pagando en efectivo' (y a mayusculas por CSS) y este chequeo se
       puso en rojo sin que el descuento hubiera cambiado. Un test atado a la
       redaccion frena el copy, que es justo lo que tiene que poder moverse. */
    chk(/10% OFF/.test(tr.promo) && /efectivo/i.test(tr.promo) && !/100\.000/.test(tr.promo) && !/acumulables/i.test(tr.promo),
        'la barra de promo dice el efectivo y nada de "$100.000" ni "no acumulables"');
    chk(!/100\.000|\+\$100K/.test(tr.toda), 'la palabra "100.000" no aparece en ninguna parte de la pagina');

    console.log('\n' + DIM + '== En efectivo ==' + RST);
    const ef = JSON.parse(await ev(PAGAR('Efectivo')));
    chk(ef.desc === Math.round(ef.sub * 0.10), 'el 10%: ' + ef.desc + ' sobre ' + ef.sub);
    chk(ef.etiqueta === '10% OFF Efectivo', 'con su etiqueta ("' + ef.etiqueta + '")');
    chk(ef.filaDesc, 'y la fila de descuento en el carrito');

    console.log('\n' + DIM + '== El pedido que se le manda al ERP, por transferencia ==' + RST);
    const crudo = await ev(MANDAR);
    let post = null;
    try { post = JSON.parse(crudo); } catch (e) { /* abajo */ }
    chk(!!post && !post.error, 'sale el pedido (' + (post && post.error ? post.error : 'ok') + ')');
    if (post && !post.error) {
      chk(Number(post.descuento) === 0, 'descuento: ' + post.descuento);
      chk(Number(post.total) === Number(post.subtotalSinDescuento) + Number(post.envio || 0),
          'total = subtotal (' + post.total + ' = ' + post.subtotalSinDescuento + ')');
      chk(post.pago === 'Transferencia', 'pago: ' + post.pago);
    }

    console.log('\n' + DIM + '== Pilar, fuera de los ex-Home ==' + RST);
    const pil = JSON.parse(await ev(`(function () {
      currentZone = 'pilar';
      var r = document.querySelector('input[name="pago"][value="Transferencia"]');
      r.checked = true;
      return JSON.stringify({ exHome: _pilarBarrioEsExHome(), desc: getTotalDiscount(), activos: discountsActive() });
    })()`));
    chk(!pil.exHome && pil.desc === 0 && !pil.activos,
        'un pedido grande por transferencia no tiene ningun descuento automatico (' + JSON.stringify(pil) + ')');

    chk(escapados.length === 0, 'no se escapo ningun POST ni salto a WhatsApp (' + escapados.length + ')');
  } catch (e) {
    mal++;
    console.log('  ' + RED + 'ROTO ' + RST + e.message);
  } finally {
    try { proc.kill(); } catch (e) {}
    srv.close();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }
  console.log('\n' + (mal ? RED : VER) + bien + ' ok · ' + mal + ' mal' + RST + '  (' + ANCHO + 'px)');
  process.exit(mal ? 1 : 0);
}

main();
