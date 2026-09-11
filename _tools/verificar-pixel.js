/**
 * Los 4 eventos del pixel de Meta salen de verdad, y con lo que Meta necesita.
 *
 *   node probar-pixel.js            (local)
 *   URL=https://maleu.com.ar node probar-pixel.js
 *
 * COMO MIDE. No reemplaza `fbq`: deja que se instale el stub REAL del head y
 * bloquea la descarga de `fbevents.js`. Asi la cola (`fbq.queue`) nunca se
 * vacia y se puede leer entera — y de paso se prueba el camino de verdad, que
 * es justamente que los eventos se encolen mientras el script viaja.
 *
 * El POST del pedido se intercepta: no sale a internet y no toca la planilla.
 */
const http = require('http'); const fs = require('fs'); const os = require('os');
const path = require('path'); const { spawn } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = Number(process.env.PUERTO || 8203);
const BASE = process.env.URL || ('http://127.0.0.1:' + PUERTO);
/* El ID sale del index.html: escrito a mano aca se despegaria del que de
   verdad esta instalado, y el test pasaria mirando un pixel que no existe. */
const PIXEL = (function () {
  const h = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
  const m = h.match(/fbq\(\s*'init'\s*,\s*'(\d+)'/);
  if (!m) { console.error('No encontre el fbq(init) en index.html'); process.exit(1); }
  return m[1];
})();
const VER = '\x1b[32m', RED = '\x1b[31m', DIM = '\x1b[2m', RST = '\x1b[0m';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];

let ok = 0, mal = 0;
const chk = (c, m) => { if (c) { ok++; console.log(VER + '  ok   ' + RST + m); }
                        else { mal++; console.log(RED + '  MAL  ' + m + RST); } };

function cdp(url) {
  const ws = new WebSocket(url); let id = 0; const pend = new Map();
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result); } });
  const listo = new Promise((r, j) => { ws.addEventListener('open', r);
    ws.addEventListener('error', () => j(new Error('no conecta con Chrome'))); });
  return { listo, enviar: (m, p) => new Promise((res, rej) => {
    const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }) };
}

/* Bloquea fbevents.js (para conservar la cola), anota que se PIDIO, y corta el
   POST del pedido. Nada de esto toca a `fbq`: el stub del head se instala solo. */
const PREP = `(function () {
  window.__fbPedidos = 0;
  var crear = document.createElement.bind(document);
  document.createElement = function (tag) {
    var el = crear(tag);
    if (String(tag).toLowerCase() === 'script') {
      var propio = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
      Object.defineProperty(el, 'src', {
        configurable: true,
        get: function () { return propio.get.call(this); },
        set: function (v) {
          if (String(v).indexOf('connect.facebook.net') >= 0) { window.__fbPedidos++; return; }
          propio.set.call(this, v);
        }
      });
    }
    return el;
  };
  navigator.sendBeacon = function () { return false; };
  var orig = window.fetch;
  window.fetch = function (url, opts) {
    if (opts && String(opts.method || '').toUpperCase() === 'POST') {
      window.__post = String(opts.body || '');
      return new Promise(function () {});
    }
    return orig.apply(this, arguments);
  };
})();`;

const ev = async (cli, e) => {
  const r = await cli.enviar('Runtime.evaluate', { returnByValue: true, awaitPromise: true, expression: e });
  if (r.exceptionDetails) throw new Error(String(e).slice(0, 70) + ' -> ' + r.exceptionDetails.text);
  return r.result.value;
};
/* La cola de fbq, en algo legible. */
const cola = async (cli) => JSON.parse(await ev(cli,
  "JSON.stringify((window.fbq && fbq.queue ? Array.prototype.slice.call(fbq.queue) : []).map(function(a){return Array.prototype.slice.call(a);}))"));
const evento = (q, nombre) => q.filter((a) => a[0] === 'track' && a[1] === nombre).pop();

(async () => {
  const srv = http.createServer((rq, rs) => {
    const f = path.join(RAIZ, decodeURIComponent(rq.url.split('?')[0]).replace(/^\//, '') || 'index.html');
    fs.readFile(f, (e, d) => {
      if (e) { rs.writeHead(404); return rs.end(); }
      rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); rs.end(d);
    });
  }).listen(PUERTO);

  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-px-'));
  const puertoCdp = 9300 + Math.floor(Math.random() * 200);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil,
    '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 80 && !wsUrl; i++) {
    try { const r = await fetch('http://127.0.0.1:' + puertoCdp + '/json/list');
      const p = (await r.json()).find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (p) wsUrl = p.webSocketDebuggerUrl; } catch (e) {}
    await new Promise((s) => setTimeout(s, 250));
  }
  const cli = cdp(wsUrl); await cli.listo;
  await cli.enviar('Page.enable'); await cli.enviar('Runtime.enable');
  await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: PREP });

  try {
    await cli.enviar('Page.navigate', { url: BASE + '/index.html?px=' + Date.now() });
    for (let i = 0; i < 120; i++) {
      if (await ev(cli, "typeof fbq === 'function' && typeof setZone === 'function'")) break;
      await new Promise((s) => setTimeout(s, 250));
    }

    // ── El codigo base ──────────────────────────────────────────────
    console.log('\n' + DIM + 'EL CODIGO BASE' + RST);
    let q = await cola(cli);
    const init = q.filter((a) => a[0] === 'init').pop();
    chk(!!init && String(init[1]) === PIXEL, 'arranca con el conjunto ' + PIXEL + ' (arranca con ' + (init ? init[1] : 'ninguno') + ')');
    chk(!!evento(q, 'PageView'), 'manda el PageView de entrada');
    chk(await ev(cli, "Array.prototype.some.call(document.querySelectorAll('noscript'), function(n){return n.textContent.indexOf('facebook.com/tr') >= 0;})"),
      'deja el <noscript> para quien tenga el JS apagado');
    /* Y que ese <noscript> no haya partido el head: un <img> ahi adentro lo
       cierra, y todo lo de abajo se iria al body. */
    chk(await ev(cli, "!!document.head.querySelector('script') && document.head.querySelectorAll('noscript').length === 0"),
      'el <noscript> esta en el body, asi que el <head> quedo entero');

    // ── ViewContent: entra al catalogo ──────────────────────────────
    console.log('\n' + DIM + 'VER PRODUCTO — elige zona y entra al catalogo' + RST);
    await ev(cli, "setZone('estancias')");
    await new Promise((s) => setTimeout(s, 600));
    q = await cola(cli);
    const vc = evento(q, 'ViewContent');
    chk(!!vc, 'sale ViewContent al entrar a la tienda');
    chk(!!vc && vc[2] && vc[2].content_type === 'product', 'ViewContent va como content_type=product');

    // Elegir la fecha para poder comprar.
    await ev(cli, "(function(){var g=document.getElementById('loc-dates-grid');if(!g)return;" +
      "var b=Array.prototype.slice.call(g.querySelectorAll('button')).filter(function(x){return !x.disabled;})[0];if(b)b.click();})()");
    await new Promise((s) => setTimeout(s, 1500));

    // ── AddToCart ───────────────────────────────────────────────────
    console.log('\n' + DIM + 'AGREGAR AL CARRITO' + RST);
    const precio = await ev(cli, "(function(){var p=PRODUCTOS.filter(function(x){return x.id===11;})[0];return p?p.precio:0;})()");
    await ev(cli, "cart = {}; addToCart(11);");
    await new Promise((s) => setTimeout(s, 400));
    q = await cola(cli);
    const atc = evento(q, 'AddToCart');
    chk(!!atc, 'sale AddToCart');
    const a = (atc && atc[2]) || {};
    chk(a.value === precio, 'AddToCart lleva el precio ($' + a.value + ', el producto vale $' + precio + ')');
    chk(a.currency === 'ARS', 'AddToCart dice la moneda: ' + a.currency + ' — sin eso Meta no puede calcular el retorno');
    chk(Array.isArray(a.content_ids) && a.content_ids[0] === '11',
      'AddToCart dice QUE producto (content_ids=' + JSON.stringify(a.content_ids) + ')');

    // ── InitiateCheckout ────────────────────────────────────────────
    console.log('\n' + DIM + 'INICIAR COMPRA' + RST);
    await ev(cli, "addToCart(11); goToForm();");
    await new Promise((s) => setTimeout(s, 500));
    q = await cola(cli);
    const ic = evento(q, 'InitiateCheckout');
    const i = (ic && ic[2]) || {};
    chk(!!ic, 'sale InitiateCheckout al ir al formulario');
    chk(i.value > 0 && i.currency === 'ARS', 'InitiateCheckout lleva valor y moneda ($' + i.value + ' ' + i.currency + ')');
    chk(Array.isArray(i.contents) && i.contents.length > 0 && i.contents[0].quantity === 2,
      'InitiateCheckout lleva el carrito con cantidades (' + JSON.stringify(i.contents) + ')');

    // ── Purchase ────────────────────────────────────────────────────
    console.log('\n' + DIM + 'COMPRAR' + RST);
    await ev(cli, `(function(){
      document.getElementById('f-nombre').value = 'PRUEBA Pixel';
      document.getElementById('f-telefono').value = '1155038905';
      var bp = document.getElementById('f-barrio-privado');
      bp.value = 'Estancias del Pilar'; bp.dispatchEvent(new Event('change'));
    })()`);
    await new Promise((s) => setTimeout(s, 300));
    await ev(cli, `(function(){
      var ba = document.getElementById('f-barrio');
      ba.value = ba.options[1] ? ba.options[1].value : ''; ba.dispatchEvent(new Event('change'));
      document.getElementById('f-lote').value = '999';
      var dia = document.querySelector('#day-picker .dp-cell.available'); if (dia) dia.click();
    })()`);
    await new Promise((s) => setTimeout(s, 400));
    await ev(cli, "(function(){var e=document.querySelector('input[name=\"pago\"][value=\"Efectivo\"]')||document.querySelector('input[name=\"pago\"]');e.checked=true;e.dispatchEvent(new Event('change'));})()");
    await new Promise((s) => setTimeout(s, 400));
    await ev(cli, "enviarPedido()");
    for (let k = 0; k < 40 && !(await ev(cli, "!!window.__post")); k++) await new Promise((s) => setTimeout(s, 150));

    q = await cola(cli);
    const pu = evento(q, 'Purchase');
    const p = (pu && pu[2]) || {};
    chk(!!pu, 'sale Purchase al enviar el pedido');
    chk(p.value > 0 && p.currency === 'ARS', 'Purchase lleva el total y la moneda ($' + p.value + ' ' + p.currency + ')');
    chk(Array.isArray(p.contents) && p.contents.length > 0, 'Purchase lleva lo comprado (' + JSON.stringify(p.contents) + ')');

    const post = JSON.parse(await ev(cli, "window.__post"));
    const opts = pu && pu[3];
    chk(!!opts && opts.eventID === post.clientOrderId,
      'el Purchase viaja con el MISMO id que el pedido (' + (opts ? opts.eventID : 'ninguno') + ') — sin eso, el dia que el ERP mande la compra por su cuenta, Meta contaria la venta dos veces');
    chk(Math.abs(Number(p.value) - Number(post.total)) < 2,
      'el valor del evento es el total que se cobra ($' + p.value + ' vs $' + post.total + ')');

    /* Que se haya PEDIDO fbevents.js. Se mide al final a proposito: sale al
       primer toque o 800 ms despues del load, asi que preguntarlo apenas
       arranca la pagina es medir la propia impaciencia del test. */
    const ped = await ev(cli, "window.__fbPedidos");
    chk(ped >= 1, 'se pidio fbevents.js, asi que la cola se va a vaciar de verdad (' + ped + ' pedido/s)');

    // Que ningun evento de medicion haya volteado el pedido.
    chk(!!post.clientOrderId && Array.isArray(post.items) && post.items.length > 0,
      'el pedido sale entero igual: medir no lo rompio');

    // ── Y que nada de esto haya roto GA4 ────────────────────────────
    console.log('\n' + DIM + 'GA4 SIGUE ANDANDO' + RST);
    const dl = JSON.parse(await ev(cli, "JSON.stringify((window.dataLayer||[]).map(function(a){return Array.prototype.slice.call(a);}))"));
    const nombres = dl.filter((x) => x[0] === 'event').map((x) => x[1]);
    chk(nombres.indexOf('purchase') >= 0, 'GA4 sigue recibiendo el purchase (' + nombres.join(', ') + ')');
    chk(nombres.indexOf('add_to_cart') >= 0, 'GA4 sigue recibiendo el add_to_cart');

  } catch (e) {
    mal++; console.log(RED + '  MAL  el test se corto: ' + e.message + RST);
  } finally { proc.kill(); srv.close(); }

  console.log('\n' + (mal ? RED : VER) + ok + ' ok · ' + mal + ' mal' + RST);
  process.exit(mal ? 1 : 0);
})();
