/**
 * "Lo que pediste la última vez" (13/9/2026).
 *
 *   node _tools/verificar-ultimo-pedido.js [ancho]      (390 por defecto)
 *
 * POR QUE EXISTE. La tienda tenia desde antes del 25/8/2026 un bloque "Tu
 * último pedido" con UN boton, "Agregar todo de nuevo". Medido el 13/9/2026
 * sobre 994 pedidos de Home y Pilar, solo el 13,5% repite los mismos productos
 * que la vez anterior, y el 65% repite al menos uno: el boton le servia a pocos.
 * Ahora son las cards de siempre con los productos del ultimo pedido, y
 * "Agregar lo mismo" queda para el que repite todo.
 *
 * Lo que mide, porque se puede romper sin ningun error:
 *   1. sin pedido guardado no aparece nada;
 *   2. el formato de antes (lo tienen guardado los que ya compraron) sirve;
 *   3. con un pedido de 6 productos: cuatro cards de mayor a menor cantidad,
 *      los otros dos nombrados, la carne dicha y no repetida, un producto
 *      agotado con su "Pedir para…", y las dos copias de una card (esta
 *      seccion y el catalogo) diciendo lo mismo;
 *   4. "Agregar lo mismo" suma HASTA lo que pidio (no encima), respeta el stock,
 *      no suma lo agotado, se puede tocar dos veces sin duplicar, y el boton
 *      vuelve si se saca algo del carrito;
 *   5. el buscador la esconde;
 *   6. al mandar se guarda el pedido nuevo con la carne, y uno de solo combos
 *      no pisa el anterior;
 *   7. en Clubes, que tiene otro catalogo, no aparece.
 *
 * El RELOJ va congelado (domingo 13/9/2026 05:00) y todo POST se corta dos
 * veces, adentro de la pagina y por CDP. Analytics y Meta se bloquean. Con
 * RAIZ=<carpeta> corre contra otra copia de la tienda (contra la de antes
 * tiene que fallar).
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

const DOMINGO = Date.UTC(2026, 8, 13, 8, 0, 0);   // 13/9/2026 05:00 AR
const PEDIDO_T = Date.UTC(2026, 8, 11, 22, 30, 0); // viernes 11/9 19:30 AR

const ABBRS = ['PMu', 'PMa', 'PJyQ', 'PCC', 'PJyM', 'PPM', 'PPJyQ', 'PPCyQ', 'SQB', 'SL', 'SCo',
  'SPyP', 'SJyQ', 'SE', 'SCa', 'ECaC', 'EJyQ', 'ECyQ', 'EV', 'TG', 'TLC', 'TC', 'F', 'TP', 'TJyQ',
  'TCa', 'TV', 'RC', 'RP', 'CCo', 'CEn', 'CLo', 'CPi', 'CVa'];
const STOCK = {};
ABBRS.forEach((a) => { STOCK[a] = { f: 50, p: 50 }; });
STOCK.PMa = { f: 0, p: 0 };   // agotado para hoy
STOCK.TP = { f: 1, p: 1 };    // pidio 3 y hay 1
STOCK.PJyQ = { f: 0, p: 0 };  // con la margarita: un pedido que hoy no hay entero
const PIEZAS = { CVa: [{ id: 'P-0901', kg: 1.2 }, { id: 'P-0902', kg: 1.45 }] };

/* Los ids salen del catalogo, no escritos a mano: si cambian, el test no
   envejece en silencio. */
const APP = fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8');
const IDS = {};
[['PMa', 'Pizza Margarita'], ['PMu', 'Pizza Muzzarella'], ['SJyQ', 'Sorrentinos Jam'], ['PJyQ', 'Pizza Jamón y Queso'],
 ['ECaC', 'Empanadas Carne'], ['TP', 'Tarta Pollo'], ['RC', 'Wrap Carne'], ['PPM', 'Pack Muzzarella']].forEach(([ab, nom]) => {
  const re = new RegExp('\\{\\s*id:(\\d+),\\s*cat:"[^"]+",\\s*nombre:"' + nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const m = APP.match(re);
  if (!m) throw new Error('no encontre ' + nom + ' en PRODUCTOS');
  IDS[ab] = Number(m[1]);
});
IDS.CVa = Number((APP.match(/\{\s*id:(\d+),\s*abbr:"CVa"/) || [])[1]);
IDS.CEn = Number((APP.match(/\{\s*id:(\d+),\s*abbr:"CEn"/) || [])[1]);

const VIEJO = [{ id: IDS.PMu, qty: 2 }, { id: IDS.ECaC, qty: 1 }];
const V2 = { t: PEDIDO_T, zona: 'estancias', carne: [IDS.CVa, IDS.CEn], items: [
  { id: IDS.PMa, qty: 1 }, { id: IDS.PMu, qty: 2 }, { id: IDS.TP, qty: 3 },
  { id: IDS.ECaC, qty: 1 }, { id: IDS.SJyQ, qty: 2 }, { id: IDS.RC, qty: 1 }] };
const AGOTADO = { t: PEDIDO_T, zona: 'estancias', carne: [], items: [{ id: IDS.PMa, qty: 1 }, { id: IDS.PJyQ, qty: 2 }] };

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

/* Antes de que arranque la tienda: el reloj, el backend, y lo que haya
   guardado segun ?s= en la URL. Una sola inyeccion que lee la URL: si se
   agregaran varias, se acumulan y envuelven el fetch dos veces. */
const PREP = '(function () {' +
  'try { localStorage.clear(); } catch (e) {}' +
  'var s = (location.search.match(/[?&]s=([a-z0-9]+)/) || [])[1];' +
  'try {' +
  '  if (s === "viejo") localStorage.setItem("maleu_ultimo_pedido_pg", ' + JSON.stringify(JSON.stringify(VIEJO)) + ');' +
  '  if (s === "v2") localStorage.setItem("maleu_ultimo_pedido_v2", ' + JSON.stringify(JSON.stringify(V2)) + ');' +
  '  if (s === "agotado") localStorage.setItem("maleu_ultimo_pedido_v2", ' + JSON.stringify(JSON.stringify(AGOTADO)) + ');' +
  '} catch (e) {}' +
  'var RD = Date; window.__ahora = ' + DOMINGO + ';' +
  'function FD() {' +
  '  if (!(this instanceof FD)) return new RD(window.__ahora).toString();' +
  '  if (arguments.length === 0) return new RD(window.__ahora);' +
  '  var a = [null].concat([].slice.call(arguments));' +
  '  return new (Function.prototype.bind.apply(RD, a))();' +
  '}' +
  'FD.prototype = RD.prototype; FD.now = function () { return window.__ahora; };' +
  'FD.UTC = RD.UTC; FD.parse = RD.parse; window.Date = FD;' +
  'window.__post = 0; navigator.sendBeacon = function (u) { if (String(u).indexOf("script.google") >= 0) window.__post++; return false; };' +
  'var orig = window.fetch;' +
  'var json = function (o) { return Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { "Content-Type": "application/json" } })); };' +
  'window.fetch = function (url, opts) {' +
  '  var u = String(url);' +
  '  if (opts && String(opts.method || "").toUpperCase() === "POST" && u.indexOf("script.google") >= 0) { window.__post++; return new Promise(function () {}); }' +
  '  if (u.indexOf("action=stock_full") >= 0) return json(' + JSON.stringify(STOCK) + ');' +
  '  if (u.indexOf("action=piezas_full") >= 0) return json(' + JSON.stringify(PIEZAS) + ');' +
  '  if (u.indexOf("script.google") >= 0) return json({ ok: true });' +
  '  return orig.apply(this, arguments);' +
  '};' +
  '})();';

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-ultimo-'));
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
    /* Un toque de verdad, en el centro del elemento: si algo lo tapa, el
       toque le cae a otro y el test lo dice. */
    const tocar = async (sel) => {
      const pos = JSON.parse(await ev('(function () {' +
        'var e = document.querySelector(' + JSON.stringify(sel) + '); if (!e) return "null";' +
        'var r0 = document.documentElement.style.scrollBehavior; document.documentElement.style.scrollBehavior = "auto";' +
        'e.scrollIntoView({ block: "center" }); document.documentElement.style.scrollBehavior = r0;' +
        'var r = e.getBoundingClientRect(); var x = r.left + r.width / 2, y = r.top + r.height / 2;' +
        'var en = document.elementFromPoint(x, y);' +
        'return JSON.stringify({ x: x, y: y, libre: !!en && (en === e || e.contains(en)), alto: Math.round(r.height) });' +
        '})()'));
      if (!pos) return null;
      await dormir(150);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cli.enviar('Input.dispatchMouseEvent', { type, x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
      }
      await dormir(250);
      return pos;
    };
    const abrir = async (semilla, zona) => {
      await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?s=' + semilla + '&t=' + Date.now() });
      if (!(await esperar("typeof PRODUCTOS !== 'undefined' && !!document.getElementById('loc-step-zone')", 15000))) {
        throw new Error('la tienda no arranco');
      }
      await ev('(async function () {' +
        'var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };' +
        'var z = [].slice.call(document.querySelectorAll("#loc-step-zone .loc-btn")).filter(function (b) { return (b.getAttribute("onclick") || "").indexOf(' + JSON.stringify(zona) + ') >= 0; })[0];' +
        'z.click(); await dormir(500);' +
        /* La fecha ya no se pregunta al entrar (23/9/2026): el paso sigue vivo
           pero se llega desde el chip 📅. El test la elige por ese camino, que
           es el que le queda a una persona. */
        'showDateModal(); await dormir(300);' +
        'var f = document.querySelector("#loc-dates-grid button[onclick*=\'2026-09-13\']"); if (f) f.click();' +
        '})()');
      await esperar('Object.keys(stockMap).length > 5', 10000);
      await esperar('typeof piezasEstado === "undefined" || piezasEstado !== "cargando"', 10000);
      await dormir(500);
    };
    const estado = async () => JSON.parse(await ev('(function () {' +
      'var sec = document.getElementById("ultimo-section");' +
      /* Sin la seccion (la tienda de antes) devuelve todo vacio: asi el test
         marca cada rojo en vez de reventar en el primero. */
      'if (!sec) return JSON.stringify({ existe: false, vis: false, cards: [], sub: "", pie: "", boton: "", botonOff: null, botonAlto: 0, viejo: !!document.getElementById("repeat-block") });' +
      'var vis = !sec.hidden && getComputedStyle(sec).display !== "none" && sec.getBoundingClientRect().height > 0;' +
      'var cards = [].map.call(sec.querySelectorAll(".product-card"), function (c) { return Number(c.getAttribute("data-id")); });' +
      'var boton = sec.querySelector(".ultimo-todo");' +
      'return JSON.stringify({ existe: true, vis: vis, cards: cards,' +
      '  sub: (document.getElementById("ultimo-sub") || {}).textContent || "",' +
      '  pie: (document.getElementById("ultimo-pie") || {}).innerText || "",' +
      '  boton: boton ? boton.textContent : "", botonOff: boton ? boton.disabled : null,' +
      '  botonAlto: boton ? Math.round(boton.getBoundingClientRect().height) : 0,' +
      '  viejo: !!document.getElementById("repeat-block") });' +
      '})()'));
    const carrito = async () => JSON.parse(await ev('JSON.stringify(cart)'));

    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: PREP });

    /* ── 1. CLIENTE NUEVO ───────────────────────────────────────────── */
    console.log(DIM + '== Cliente nuevo ==' + RST);
    await abrir('nada', 'estancias');
    let e = await estado();
    chk(e.existe, 'la seccion existe en la pagina (sin esto lo de abajo no mide nada)');
    chk(!e.vis, 'sin pedido guardado no aparece');
    chk(!e.viejo, 'el bloque viejo "Tu último pedido" ya no esta');

    /* ── 2. EL FORMATO DE ANTES ─────────────────────────────────────── */
    console.log('\n' + DIM + '== Lo guardado antes del 13/9 ==' + RST);
    await abrir('viejo', 'estancias');
    e = await estado();
    chk(e.vis, 'con el formato viejo aparece');
    chk(e.cards.length === 2 && e.cards[0] === IDS.PMu, 'con sus dos productos, el de mas cantidad primero (' + e.cards.join(',') + ')');
    chk(/^Tocá lo que quieras repetir/.test(e.sub), 'sin fecha, porque no se guardaba: "' + e.sub + '"');
    chk(/Agregar lo mismo · 2 productos · \$42\.400/.test(e.boton), 'el boton: "' + e.boton + '"');

    /* ── 2b. NADA DE ESE PEDIDO HAY PARA HOY ────────────────────────── */
    /* Lo que paso en maleu.com.ar el domingo 13/9: el freezer vacio y el
       boton gris, sin salida. Tiene que ofrecer la fecha en la que hay todo, y
       pasar por la misma pregunta que "Pedir para el vie 18". */
    console.log('\n' + DIM + '== Nada de ese pedido hay para hoy ==' + RST);
    await abrir('agotado', 'estancias');
    e = await estado();
    chk(/Agregar lo mismo para el vie 18 · 2 productos/.test(e.boton) && !e.botonOff,
        'el boton ofrece la fecha en la que hay todo: "' + e.boton + '"');
    const modal = async () => ev('(function () { var m = document.getElementById("fecha-modal"); return !!m && m.style.display === "flex"; })()');
    await tocar('#ultimo-section .ultimo-todo');
    chk(await modal(), 'pregunta antes de mover la fecha');
    const txtModal = await ev('(document.getElementById("fecha-modal") || {}).innerText || ""');
    chk(/Lo que pediste la última vez/.test(txtModal) && /Para hoy no hay/.test(txtModal), 'la pregunta dice de que habla ("' + txtModal.split('\n').slice(0, 3).join(' / ') + '")');
    await tocar('.fecha-modal-no');
    chk((await ev('selectedDeliveryDate')) === '2026-09-13' && Object.keys(await carrito()).length === 0,
        '"Ver lo que hay para hoy" deja la fecha y no suma nada');
    await tocar('#ultimo-section .ultimo-todo');
    await tocar('.fecha-modal-si');
    await dormir(300);
    const cF = await carrito();
    chk((await ev('selectedDeliveryDate')) === '2026-09-18', 'con "Pasar mi entrega" la fecha pasa al viernes 18');
    chk(cF[IDS.PMa] === 1 && cF[IDS.PJyQ] === 2, 'y suma lo mismo (' + JSON.stringify(cF) + ')');
    const avisoF = await ev('document.getElementById("toast").textContent');
    chk(/Sumamos 2 productos de tu último pedido · tu entrega pasó al viernes 18\/9/.test(avisoF), 'el aviso dice las dos cosas: "' + avisoF + '"');
    e = await estado();
    chk(e.botonOff && /Ya está en tu carrito/.test(e.boton), 'y el boton queda en "Ya está en tu carrito"');

    /* ── 3. UN PEDIDO DE SEIS, CON CARNE Y UNO AGOTADO ─────────────── */
    console.log('\n' + DIM + '== Un pedido de seis productos y carne ==' + RST);
    await abrir('v2', 'estancias');
    e = await estado();
    chk(e.vis, 'aparece');
    chk(JSON.stringify(e.cards) === JSON.stringify([IDS.TP, IDS.PMu, IDS.SJyQ, IDS.PMa]),
        'cuatro cards, de mayor a menor cantidad (' + e.cards.join(',') + ')');
    chk(/^Tu pedido del 11\/9 · tocá lo que quieras repetir/.test(e.sub), 'dice de cuando es: "' + e.sub + '"');
    chk(/Y también: Empanadas Carne a Cuchillo x8 ×1 · Wrap Carne ×1/.test(e.pie), 'nombra los dos que no entran en las cards');
    chk(/También llevaste carne: Vacío y Entraña\./.test(e.pie), 'dice la carne que llevo');
    chk(!e.cards.includes(IDS.CVa) && !e.cards.includes(IDS.CEn), 'y no la repite como card: cada pieza es unica');
    chk(/Agregar lo mismo · 5 productos · \$104\.000/.test(e.boton),
        'el boton cuenta lo que va a sumar: sin la margarita agotada y la tarta hasta el stock ("' + e.boton + '")');
    chk(e.botonAlto >= 44, 'el boton mide ' + e.botonAlto + 'px');
    /* CAPTURA=<carpeta>: la seccion entera, para mirarla. Los numeros no dicen
       si se ve bien. */
    if (process.env.CAPTURA) {
      const r = JSON.parse(await ev('(function () { var s = document.getElementById("ultimo-section");' +
        'document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY - 8);' +
        'var b = s.getBoundingClientRect(); return JSON.stringify({ y: b.top + window.scrollY, h: b.height, w: document.documentElement.clientWidth }); })()'));
      await dormir(900);
      const img = await cli.enviar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
        clip: { x: 0, y: r.y, width: r.w, height: Math.min(r.h, 2400), scale: 1 } });
      fs.mkdirSync(process.env.CAPTURA, { recursive: true });
      fs.writeFileSync(path.join(process.env.CAPTURA, 'ultimo-pedido-' + ANCHO + '.png'), Buffer.from(img.data, 'base64'));
    }

    const pma = JSON.parse(await ev('(function () {' +
      'var sec = document.querySelector("#ultimo-section .product-card[data-id=\'' + IDS.PMa + '\'] .product-footer");' +
      'var cat = document.querySelector("#catalog-root .product-card[data-id=\'' + IDS.PMa + '\'] .product-footer");' +
      'return JSON.stringify({ sec: sec ? sec.innerText : "", cat: cat ? cat.innerText : "" });' +
      '})()'));
    chk(/Pedir para/.test(pma.sec) && pma.sec === pma.cat, 'la margarita agotada ofrece otra fecha, igual que en el catalogo ("' + pma.sec.replace(/\s+/g, ' ') + '")');

    /* Un "+ Agregar" de la seccion, con un toque de verdad. */
    const t1 = await tocar('#ultimo-section .product-card[data-id="' + IDS.PMu + '"] .add-btn');
    chk(t1 && t1.libre, 'el "+ Agregar" de la seccion no lo tapa nada');
    let c = await carrito();
    chk(c[IDS.PMu] === 1, 'suma una muzzarella');
    const copias = await ev('[].map.call(document.querySelectorAll(".product-card[data-id=\'' + IDS.PMu + '\'] .card-qty-val"), function (x) { return x.textContent; }).join(",")');
    chk(/^1(,1)+$/.test(copias), 'y todas las copias de la card dicen 1 (' + copias + ')');

    /* ── 4. AGREGAR LO MISMO ────────────────────────────────────────── */
    console.log('\n' + DIM + '== Agregar lo mismo ==' + RST);
    const t2 = await tocar('#ultimo-section .ultimo-todo');
    chk(t2 && t2.libre, 'el boton no lo tapa nada');
    c = await carrito();
    chk(c[IDS.PMu] === 2, 'la muzzarella queda en 2, lo que pidio, y no en 3 (' + c[IDS.PMu] + ')');
    chk(c[IDS.TP] === 1, 'la tarta, hasta el stock que hay (' + c[IDS.TP] + ')');
    chk(!c[IDS.PMa], 'la margarita agotada no se suma');
    chk(c[IDS.SJyQ] === 2 && c[IDS.ECaC] === 1 && c[IDS.RC] === 1, 'los otros, con su cantidad (incluidos los que no se ven)');
    const aviso = await ev('document.getElementById("toast").textContent');
    chk(/Sumamos 5 productos de tu último pedido · 1 no hay para esta fecha/.test(aviso), 'el aviso: "' + aviso + '"');
    e = await estado();
    chk(e.botonOff && /Ya está en tu carrito/.test(e.boton), 'el boton pasa a "Ya está en tu carrito" (' + e.boton + ')');
    await ev('agregarLoMismo()');
    chk(JSON.stringify(await carrito()) === JSON.stringify(c), 'llamarlo otra vez no duplica nada');
    const eventos = await ev('JSON.stringify((window.dataLayer || []).filter(function (a) { return a && a[0] === "event"; }).map(function (a) { return a[1]; }))');
    chk(/repetir_pedido/.test(eventos), 'se mide "repetir_pedido" en Analytics');
    await ev('cardChangeQty("' + IDS.SJyQ + '", -1)');
    e = await estado();
    chk(!e.botonOff && /Agregar lo mismo/.test(e.boton), 'si saca un sorrentino, el boton vuelve (' + e.boton + ')');
    await ev('agregarLoMismo()');
    chk((await carrito())[IDS.SJyQ] === 2, 'y lo repone');

    /* La carne: el boton lleva a elegir las piezas de hoy. */
    await tocar('#ultimo-section .ultimo-carne-btn');
    await dormir(900);
    const carne = JSON.parse(await ev('(function () { var s = document.getElementById("cat-carnes"); if (!s) return "null";' +
      'var r = s.getBoundingClientRect(); return JSON.stringify({ top: Math.round(r.top), alto: window.innerHeight }); })()'));
    chk(carne && carne.top >= -5 && carne.top < carne.alto / 2, 'el boton de la carne lleva a Carnes (' + (carne ? carne.top : 'sin seccion') + 'px)');

    /* ── 5. EL BUSCADOR ─────────────────────────────────────────────── */
    await ev('(function () { var i = document.getElementById("buscador-input") || document.querySelector(".buscador input"); i.value = "tarta"; i.dispatchEvent(new Event("input", { bubbles: true })); })()');
    await dormir(400);
    e = await estado();
    chk(!e.vis, 'con una busqueda puesta, la seccion se esconde');
    const cuenta = JSON.parse(await ev('JSON.stringify({ txt: (document.getElementById("buscador-info") || {}).textContent || "",' +
      ' vis: document.querySelectorAll("#catalog-root .product-card:not(.busq-oculto)").length })'));
    const nCuenta = Number((cuenta.txt.match(/(\d+) productos? coincid/) || [])[1]);
    chk(nCuenta > 0 && nCuenta === cuenta.vis, 'y la cuenta del buscador es la del catalogo, sin las cards de la seccion (' + nCuenta + ' / ' + cuenta.vis + ')');
    await ev('limpiarBusqueda()');
    await dormir(300);
    chk((await estado()).vis, 'al limpiar vuelve');

    const med = JSON.parse(await ev('(function () {' +
      'var g = document.getElementById("ultimo-productos");' +
      'return JSON.stringify({ cols: getComputedStyle(g).gridTemplateColumns.split(" ").length,' +
      '  desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,' +
      '  carneBtn: Math.round(document.querySelector("#ultimo-section .ultimo-carne-btn").getBoundingClientRect().height) });' +
      '})()'));
    chk(med.cols === (ANCHO >= 900 ? 4 : 2), 'la grilla va a ' + med.cols + ' columnas');
    chk(med.carneBtn >= 44, 'el boton de la carne mide ' + med.carneBtn + 'px');
    chk(med.desborde <= 0, 'nada se sale a lo ancho (' + med.desborde + 'px)');

    /* ── 6. AL MANDAR SE GUARDA ─────────────────────────────────────── */
    console.log('\n' + DIM + '== Se guarda el pedido nuevo ==' + RST);
    chk(await ev('enviarPedido.toString().indexOf("guardarUltimoPedido()") >= 0'), 'enviarPedido guarda el ultimo pedido');
    const guardado = JSON.parse(await ev('(function () {' +
      'cart = {}; cart[' + IDS.PPM + '] = 4; piezaCart = {};' +
      'togglePieza("CVa", "P-0902");' +
      'guardarUltimoPedido();' +
      'var g = JSON.parse(localStorage.getItem("maleu_ultimo_pedido_v2"));' +
      'renderCatalog();' +
      'return JSON.stringify(g);' +
      '})()'));
    chk(guardado && guardado.t === DOMINGO && guardado.items.length === 1 && guardado.items[0].id === IDS.PPM && guardado.items[0].qty === 4,
        'guarda los productos con su cantidad y la hora (' + JSON.stringify(guardado && guardado.items) + ')');
    chk(guardado && JSON.stringify(guardado.carne) === JSON.stringify([IDS.CVa]), 'y el corte de carne, no la pieza');
    e = await estado();
    chk(e.cards.length === 1 && e.cards[0] === IDS.PPM && /13\/9/.test(e.sub), 'la seccion muestra el pedido nuevo (' + e.cards.join(',') + ' · ' + e.sub + ')');
    const soloCombos = await ev('(function () { cart = {}; piezaCart = {}; guardarUltimoPedido();' +
      'return JSON.parse(localStorage.getItem("maleu_ultimo_pedido_v2")).items[0].id; })()');
    chk(soloCombos === IDS.PPM, 'un pedido sin productos sueltos ni carne (solo combos) no pisa el anterior');

    /* ── 7. CLUBES ──────────────────────────────────────────────────── */
    console.log('\n' + DIM + '== Clubes, otro catalogo ==' + RST);
    await abrir('v2', 'clubes');
    e = await estado();
    chk(!e.vis, 'en Clubes no aparece: sus productos son otros');

    const posts = await ev('window.__post');
    chk(posts === 0 && escapados.length === 0, 'no salio ningun POST ni salto a WhatsApp (' + posts + '/' + escapados.length + ')');
  } catch (err) {
    mal++;
    console.log('  ' + RED + 'ROTO ' + RST + err.message);
  } finally {
    try { proc.kill(); } catch (e) {}
    srv.close();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }
  console.log('\n' + (mal ? RED : VER) + bien + ' ok · ' + mal + ' mal' + RST + '  (' + ANCHO + 'px)');
  process.exit(mal ? 1 : 0);
}

main();
