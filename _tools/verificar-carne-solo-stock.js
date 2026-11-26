const conPrecios = require('./precios-prueba.js');   /* los precios vienen de stock_full desde el 14/10/2026 */
/**
 * LA CARNE ES SOLO STOCK, PARA CUALQUIER FECHA (26/11/2026).
 *
 *   node _tools/verificar-carne-solo-stock.js [ancho]      (390 por defecto)
 *
 * Tadeo, por el Organizador: «todo lo de Carnes —cortes y embutidos— es solo stock: si no hay, la tienda no lo
 * ofrece; nunca una compra contra pedido». Los cortes ya iban por pieza. El chorizo y la morcilla seguían el modo de
 * la fecha: para una entrega de la semana que viene (modo «ilimitado») salían sin tope, y el pedido de Borja del Sel
 * (Home #2591) entró con 2 chorizos y 1 morcilla a orden de compra. Del lado de la base lo cierra la palanca
 * CATEGORIAS_SOLO_STOCK = Tortas,Tartas,Carnes.
 *
 * Con el reloj congelado el domingo 13/9/2026 y la entrega el viernes 25/9 (ilimitado): chorizo en 0 dice «Sin stock»
 * y no entra, morcilla en 2 topea en 2 (también al recortar el carrito), ninguno ofrece otra fecha, y una pizza en 0
 * se sigue pudiendo pedir (el control de que no se topeó todo). Contra la tienda de antes da rojo. Cero POST.
 * El arnés (servidor, Chrome, reloj, backend simulado) es el de verificar-sin-stock.js.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(process.env.RAIZ || path.join(__dirname, '..'));
const ANCHO = Number(process.argv[2] || 390);
const ALTO = ANCHO < 700 ? 844 : 900;
const PUERTO = 8600 + Math.floor(Math.random() * 90);
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

/* Domingo 13/9/2026 05:00 en Argentina = 08:00 UTC. */
const DOMINGO = Date.UTC(2026, 8, 13, 8, 0, 0);
const HORA = (d, h) => Date.UTC(2026, 8, d, h + 3, 0, 0);

/* El stock que manda el ERP. Todo con 50, salvo los casos que se prueban. */
const ABBRS = ['PMu', 'PMa', 'PJyQ', 'PCC', 'PJyM', 'PPM', 'PPJyQ', 'PPCyQ', 'SQB', 'SL', 'SCo',
  'SPyP', 'SJyQ', 'SE', 'SCa', 'ECaC', 'EJyQ', 'ECyQ', 'EV', 'TG', 'TLC', 'TC', 'F', 'TP', 'TJyQ',
  'TCa', 'TV', 'RC', 'RP', 'CCo', 'CEn', 'CLo', 'CPi', 'CVa'];
const STOCK = {};
ABBRS.forEach((a) => { STOCK[a] = { f: 50, p: 50 }; });
STOCK.Cho = { f: 0, p: 0 };                       // chorizo: no hay
STOCK.Mor = { f: 2, p: 2 };                       // morcilla: quedan 2
STOCK.PMa = { f: 0, p: 0 };                       // una pizza agotada: para la semana que viene se puede pedir igual
/* Los tres packs de pizza en 0: el combo "Noche en Casa" (un pack a elegir)
   queda sin stock para hoy. */
STOCK.PPM = { f: 0, p: 0 }; STOCK.PPJyQ = { f: 0, p: 0 }; STOCK.PPCyQ = { f: 0, p: 0 };
STOCK.CLo = { f: 3.8900000000000006, p: 3.8900000000000006 };

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

/* Antes de que arranque la tienda: el reloj, el backend y los espias. */
const PREP = '(function () {' +
  'try { localStorage.clear(); } catch (e) {}' +
  'var RD = Date; window.__ahora = ' + DOMINGO + ';' +
  'function FD() {' +
  '  if (!(this instanceof FD)) return new RD(window.__ahora).toString();' +
  '  if (arguments.length === 0) return new RD(window.__ahora);' +
  '  var a = [null].concat([].slice.call(arguments));' +
  '  return new (Function.prototype.bind.apply(RD, a))();' +
  '}' +
  'FD.prototype = RD.prototype; FD.now = function () { return window.__ahora; };' +
  'FD.UTC = RD.UTC; FD.parse = RD.parse; window.Date = FD;' +
  'window.__post = 0; navigator.sendBeacon = function (u, d) { if (String(u).indexOf("script.google") < 0) return false; window.__post++; (window.__posts = window.__posts || []).push("beacon " + String(u).slice(0, 80)); return false; };' +
  'var orig = window.fetch;' +
  'var json = function (o) { return Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { "Content-Type": "application/json" } })); };' +
  'window.fetch = function (url, opts) {' +
  '  var u = String(url);' +
  '  if (opts && String(opts.method || "").toUpperCase() === "POST" && u.indexOf("script.google") >= 0) { window.__post++; (window.__posts = window.__posts || []).push(u.slice(0, 80) + " " + String(opts.body || "").slice(0, 160)); return new Promise(function () {}); }' +
  '  if (u.indexOf("action=stock_full") >= 0) return json(' + JSON.stringify(conPrecios(STOCK)) + ');' +
  '  if (u.indexOf("action=piezas_full") >= 0) return json({});' +
  /* (26/11) La tienda lee stock, piezas y vendedores primero de la base (_deLaBaseOApps) y cae a Apps Script si falla: */
  /* se hace fallar la base para que lea lo simulado de esta prueba, no lo real. */
  '  if (u.indexOf("/rpc/tienda_stock") >= 0 || u.indexOf("/rpc/tienda_piezas") >= 0 || u.indexOf("/rpc/tienda_vendedores") >= 0) return Promise.reject(new Error("la prueba simula Apps Script"));' +
  '  if (u.indexOf("script.google") >= 0) return json({ ok: true });' +
  '  return orig.apply(this, arguments);' +
  '};' +
  '})();';

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-carnestock-'));
  const puertoCdp = 9400 + Math.floor(Math.random() * 90);
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
    const escapados = [];
    /* Analytics y Meta se bloquean: una corrida de prueba no puede sumar
       visitas ni AddToCart falsos a las metricas reales. Sin sus scripts,
       `gtag` y `fbq` quedan como colas y los eventos igual se pueden contar. */
    await cli.enviar('Fetch.enable', { patterns: [{ urlPattern: '*script.google.com*' },
      { urlPattern: '*wa.me*' }, { urlPattern: '*whatsapp*' }, { urlPattern: '*googletagmanager*' },
      { urlPattern: '*google-analytics*' }, { urlPattern: '*facebook*' }] });
    cli.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      const r = m.params.request;
      try {
        if (/googletagmanager|google-analytics|facebook/.test(r.url)) {
          await cli.enviar('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'BlockedByClient' });
          return;
        }
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
    const tocar = async (sel) => {
      const pos = JSON.parse(await ev('(function () {' +
        'var e = document.querySelector(' + JSON.stringify(sel) + '); if (!e) return "null";' +
        'var r0 = document.documentElement.style.scrollBehavior; document.documentElement.style.scrollBehavior = "auto";' +
        'e.scrollIntoView({ block: "center" }); document.documentElement.style.scrollBehavior = r0;' +
        'var r = e.getBoundingClientRect(); var x = r.left + r.width / 2, y = r.top + r.height / 2;' +
        'var en = document.elementFromPoint(x, y);' +
        'return JSON.stringify({ x: x, y: y, libre: !!en && (en === e || e.contains(en)), alto: Math.round(r.height), texto: e.innerText });' +
        '})()'));
      if (!pos) return null;
      await dormir(200);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cli.enviar('Input.dispatchMouseEvent', { type, x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
      }
      return pos;
    };


    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: PREP });
    await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?d=' + Date.now() });
    if (!(await esperar("typeof PRODUCTOS !== 'undefined' && !!document.getElementById('loc-step-zone')", 15000))) {
      throw new Error('la tienda no arranco');
    }

    /* Estancias, entrega el viernes 25/9: con el domingo 13/9 congelado es la semana que viene, o sea modo «ilimitado». */
    const abierto = await ev('(async function () {' +
      'var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };' +
      'var i = document.getElementById("dir-input"); i.value = "Estancias del Pilar"; dirBuscar();' +
      'await dormir(200);' +
      'var z = document.querySelector("#dir-lista .dir-op"); z.click(); await dormir(500);' +
      'showDateModal(); await dormir(300);' +
      'var f = document.querySelector("#loc-dates-grid button[onclick*=\'2026-09-25\']"); if (f) f.click();' +
      'await dormir(500); var ov = document.getElementById("loc-overlay"); return !!(ov && getComputedStyle(ov).display !== "none");' +
      '})()');
    if (abierto) throw new Error('no se pudo elegir Estancias para el viernes 25/9');
    const idDe = async (abbr) => ev('(function () { for (var k in PROD_ABBR) if (PROD_ABBR[k] === "' + abbr + '") return String(k); return null; })()');
    const idCho = await idDe('Cho'), idMor = await idDe('Mor'), idPMa = await idDe('PMa');
    if (!idCho || !idMor || !idPMa) throw new Error('el catalogo no tiene chorizo, morcilla o la pizza (' + [idCho, idMor, idPMa] + ')');
    if (!(await esperar('stockMap[' + JSON.stringify(idCho) + '] !== undefined', 8000))) throw new Error('no llego el stock');
    await dormir(400);

    console.log(DIM + '== La carne es solo stock, para cualquier fecha (viernes de la semana que viene) ==' + RST);
    const modo = await ev('JSON.stringify({ modo: getStockMode(), fecha: selectedDeliveryDate })');
    const m = JSON.parse(modo);
    /* El control: si la fecha no quedó en «ilimitado», lo de abajo no prueba nada. */
    chk(m.modo === 'ilimitado' && m.fecha === '2026-09-25', 'la fecha es la semana que viene y el modo es ilimitado (' + modo + ')');

    const info = async (id) => JSON.parse(await ev('(function () {' +
      'var c = document.querySelector("#catalogo .product-card[data-id=\'' + id + '\']") || document.querySelector(".product-card[data-id=\'' + id + '\']");' +
      'var b = c && c.querySelector(".product-footer button"); var s = c && c.querySelector("[data-stock]");' +
      'return JSON.stringify({ hay: !!c, badge: s ? s.textContent : "", boton: b ? b.textContent : "", deshab: !!(b && b.disabled),' +
      '  otraFecha: c ? c.querySelectorAll(".add-btn-otra-fecha").length : 0, cap: getStockCap("' + id + '") });' +
      '})()'));
    const cho = await info(idCho), mor = await info(idMor), pma = await info(idPMa);
    chk(cho.hay, 'el chorizo esta en el catalogo');
    chk(cho.cap === 0, 'chorizo sin stock: tope 0 aunque la fecha sea ilimitada (tope ' + cho.cap + ')');
    chk(/Sin stock/.test(cho.badge) || /Sin stock/.test(cho.boton), 'el chorizo dice «Sin stock» (' + JSON.stringify(cho) + ')');
    chk(cho.deshab || cho.otraFecha === 0 && /Sin stock/.test(cho.boton), 'el boton del chorizo no deja agregar');
    chk(cho.otraFecha === 0 && (await ev('_fechaConStock("' + idCho + '")')) === null, 'al chorizo no se le ofrece «Pedir para otra fecha»');
    chk(mor.cap === 2, 'morcilla: tope 2, lo que hay en el freezer (tope ' + mor.cap + ')');
    chk(/Últimas 2/.test(mor.badge), 'la morcilla dice «Últimas 2 unidades» (' + mor.badge + ')');
    chk(pma.cap === null && !pma.deshab, 'una pizza en 0 se puede pedir igual para la semana que viene (control: no se topeó todo)');

    /* Agregar chorizo no hace nada; la morcilla llega hasta 2 y no más. */
    const cart = JSON.parse(await ev('(function () {' +
      'try { addToCart("' + idCho + '"); } catch (e) {}' +
      'for (var i = 0; i < 4; i++) { try { addToCart("' + idMor + '"); } catch (e) {} }' +
      'return JSON.stringify({ cho: cart["' + idCho + '"] || 0, mor: cart["' + idMor + '"] || 0 });' +
      '})()'));
    chk(cart.cho === 0, 'agregar chorizo sin stock no lo suma (' + cart.cho + ')');
    chk(cart.mor === 2, 'cuatro toques a la morcilla suman 2 (' + cart.mor + ')');

    /* Un carrito que ya tenía 3 morcillas: al cambiar la fecha se recorta a 2. */
    const rec = await ev('(function () { cart["' + idMor + '"] = 3; _ensureCartFitsDate(); try { recorteNo(); } catch (e) {} return cart["' + idMor + '"] || 0; })()');
    chk(rec === 2, 'un carrito con 3 morcillas se recorta a 2 con la fecha ilimitada (' + rec + ')');

    const posts = await ev('window.__post');
    chk(posts === 0 && escapados.length === 0, 'no salio ningun POST ni salto a WhatsApp (' + posts + '/' + escapados.length + ')');
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
