/**
 * Las sugerencias del carrito (13/9/2026): carne, y al reves.
 *
 *   node _tools/verificar-sugerencias.js [ancho]      (390 por defecto)
 *
 * POR QUE EXISTE. Tadeo: "que la sugerencia sea con algo que realmente
 * tengamos: le sumás una pieza de colita de x peso". El carrito ofrece una
 * pieza CONCRETA del inventario, y lo que se rompe sin ningun error es
 * justamente eso: ofrecer una pieza que no existe, una que ya esta en el
 * carrito, o carne en una zona que no la vende.
 *
 * Mide:
 *   1. con el carrito vacio no sugiere nada;
 *   2. con algo en el carrito: dos cortes en el orden de margen, la pieza MAS
 *      CHICA de cada uno, su peso y su precio, y un corte agotado no aparece;
 *   3. "+ Sumar" con un toque de verdad: la pieza entra por togglePieza, la
 *      grilla de Carnes la marca, la sugerencia se va, y se mide;
 *   4. al sacarla vuelve, y si esa pieza se vende y llega el inventario nuevo,
 *      ofrece la siguiente;
 *   5. todo agotado, o un barrio de Pilar con vendedor: no sugiere carne. En lo
 *      que entrega Maleu en Pilar ("Otra zona") SI, desde el 14/9/2026;
 *   6. "Ver todas las piezas" cierra el carrito y lleva a Carnes;
 *   7. AL REVES — Tadeo: "si el cliente solo va por la carne, poner ¿queres
 *      sumar algo mas? tenemos pizzas, sorrentinos...". Con solo carne en el
 *      carrito ofrece tres productos de categorias distintas, primero lo mas
 *      pedido y SOLO lo que se puede pedir para la fecha elegida; cambia al
 *      cambiar la fecha, y no sale con un combo ni con productos adentro.
 *
 * El RELOJ va congelado (domingo 13/9/2026 05:00), todo POST se corta dos veces
 * y Analytics y Meta se bloquean. Con RAIZ=<carpeta> corre contra otra copia.
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

const DOMINGO = Date.UTC(2026, 8, 13, 8, 0, 0);
const ABBRS = ['PMu', 'PMa', 'PJyQ', 'PCC', 'PJyM', 'PPM', 'PPJyQ', 'PPCyQ', 'SQB', 'SL', 'SCo',
  'SPyP', 'SJyQ', 'SE', 'SCa', 'ECaC', 'EJyQ', 'ECyQ', 'EV', 'TG', 'TLC', 'TC', 'F', 'TP', 'TJyQ',
  'TCa', 'TV', 'RC', 'RP', 'CCo', 'CEn', 'CLo', 'CPi', 'CVa'];
const STOCK = {};
ABBRS.forEach((a) => { STOCK[a] = { f: 50, p: 50 }; });
/* Para "al reves": la margarita y los sorrentinos de jamon y queso son "Lo mas
   pedido" y HOY no hay. La sugerencia tiene que ofrecer otra pizza y otros
   sorrentinos, y para el viernes (sin tope) volver a esos dos. */
STOCK.PMa = { f: 0, p: 0 };
STOCK.SJyQ = { f: 0, p: 0 };

/* La picaña y el vacio son los dos primeros del orden, y el lomo esta agotado.
   La picaña de 0,900 viene segunda a proposito, pero OJO: fetchPiezas ordena el
   inventario al recibirlo, asi que lo que se prueba es la cadena entera (llega
   desordenado, se ofrece la mas chica), no el sort de la sugerencia. Sacar ese
   sort no rompe nada y este test no lo marca; es un seguro, no la regla.
   Lo mismo con el carrito vacio: sin productos, el carrito no dibuja el lugar
   donde va la sugerencia. */
const PIEZAS = {
  CPi: [{ id: 'P-0101', kg: 1.16 }, { id: 'P-0102', kg: 0.9 }],
  CVa: [{ id: 'P-0201', kg: 1.241 }, { id: 'P-0202', kg: 1.064 }],
  CCo: [{ id: 'P-0301', kg: 1.221 }],
  CEn: [{ id: 'P-0401', kg: 1.163 }],
};

const APP = fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8');
const idDe = (nombre) => Number((APP.match(new RegExp('\\{\\s*id:(\\d+),\\s*cat:"[^"]+",\\s*nombre:"' + nombre)) || [])[1]);
const idPMu = idDe('Pizza Muzzarella');
const ID = { PMa: idDe('Pizza Margarita'), PPM: idDe('Pack Muzzarella'), SJyQ: idDe('Sorrentinos Jam'),
  SCo: idDe('Sorrentinos Cordero'), ECaC: idDe('Empanadas Carne') };
const precio = (ab) => Number((APP.match(new RegExp('abbr:"' + ab + '"[^\\n]*?precio:(\\d+)')) || [])[1]);

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

/* El inventario vive en window.__piezas para poder cambiarlo a mitad de la
   prueba (la pieza que se vende). ?p=vacio arranca sin ninguna pieza. */
const PREP = '(function () {' +
  'try { localStorage.clear(); } catch (e) {}' +
  'window.__piezas = /[?&]p=vacio/.test(location.search) ? {} : ' + JSON.stringify(PIEZAS) + ';' +
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
  '  if (u.indexOf("action=piezas_full") >= 0) return json(window.__piezas);' +
  '  if (u.indexOf("script.google") >= 0) return json({ ok: true });' +
  '  return orig.apply(this, arguments);' +
  '};' +
  '})();';

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  if (!idPMu || !precio('CPi') || !precio('CVa')) { console.error('No encontre los productos en app.js'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-sugcarne-'));
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
    const tocar = async (sel) => {
      const pos = JSON.parse(await ev('(function () {' +
        'var e = document.querySelector(' + JSON.stringify(sel) + '); if (!e) return "null";' +
        'e.scrollIntoView({ block: "center" });' +
        'var r = e.getBoundingClientRect(); var x = r.left + r.width / 2, y = r.top + r.height / 2;' +
        'var en = document.elementFromPoint(x, y);' +
        'return JSON.stringify({ x: x, y: y, libre: !!en && (en === e || e.contains(en)), alto: Math.round(r.height) });' +
        '})()'));
      if (!pos) return null;
      await dormir(200);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cli.enviar('Input.dispatchMouseEvent', { type, x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
      }
      await dormir(300);
      return pos;
    };
    const abrir = async (zona, extra, pilarZona) => {
      await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?t=' + Date.now() + (extra || '') });
      if (!(await esperar("typeof PRODUCTOS !== 'undefined' && !!document.getElementById('loc-step-zone')", 15000))) {
        throw new Error('la tienda no arranco');
      }
      await ev('(async function () {' +
        'var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };' +
        'var z = [].slice.call(document.querySelectorAll("#loc-step-zone .loc-btn")).filter(function (b) { return (b.getAttribute("onclick") || "").indexOf(' + JSON.stringify(zona) + ') >= 0; })[0];' +
        'z.click(); await dormir(500);' +
        'if (' + JSON.stringify(zona) + ' === "pilar") { var o = document.querySelector(' + JSON.stringify(pilarZona || '#loc-overlay button[onclick*=__otro__]') + '); if (o) { o.click(); await dormir(400); } }' +
        'var f = document.querySelector("#loc-dates-grid button[onclick*=\'2026-09-\']"); if (f) f.click();' +
        '})()');
      await esperar('Object.keys(stockMap).length > 5', 10000);
      await esperar('piezasEstado !== "cargando"', 10000);
      await dormir(400);
    };
    const sug = async () => JSON.parse(await ev('(function () {' +
      'var s = document.getElementById("cart-sug");' +
      'var vis = !!s && !s.hidden && s.getBoundingClientRect().height > 0;' +
      'var filas = s ? [].map.call(s.querySelectorAll(".sug-fila"), function (f) {' +
      '  var b = f.querySelector(".sug-btn");' +
      '  return { txt: f.innerText.replace(/\\s+/g, " ").trim(), boton: b ? b.getAttribute("onclick") : "", alto: b ? Math.round(b.getBoundingClientRect().height) : 0 }; }) : [];' +
      'var ver = s && s.querySelector(".sug-ver");' +
      'var body = document.getElementById("cart-body");' +
      'return JSON.stringify({ vis: vis, tipo: s ? s.getAttribute("data-tipo") : "", filas: filas, ver: ver ? Math.round(ver.getBoundingClientRect().height) : 0,' +
      '  desborde: body.scrollWidth - body.clientWidth, abierto: document.getElementById("cart-sidebar").classList.contains("open") });' +
      '})()'));
    const eventos = async () => ev('JSON.stringify((window.dataLayer || []).filter(function (a) { return a && a[0] === "event"; }).map(function (a) { return a[1]; }))');
    const abrirCarrito = async () => { if (!(await ev('document.getElementById("cart-sidebar").classList.contains("open")'))) await ev('toggleCart()'); await dormir(450); };
    const cerrarCarrito = async () => { if (await ev('document.getElementById("cart-sidebar").classList.contains("open")')) await ev('toggleCart()'); await dormir(450); };
    const ars = (n) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: PREP });

    /* ── 1. CARRITO VACIO ───────────────────────────────────────────── */
    console.log(DIM + '== Estancias, carrito vacio ==' + RST);
    await abrir('estancias');
    chk(await ev('hayPiezas()'), 'llego el inventario de carne (sin esto lo de abajo no mide nada)');
    await abrirCarrito();
    let s = await sug();
    chk(s.abierto && !s.vis, 'con el carrito vacio no sugiere nada');
    await cerrarCarrito();

    /* ── 2. CON ALGO EN EL CARRITO ──────────────────────────────────── */
    console.log('\n' + DIM + '== Con una pizza en el carrito ==' + RST);
    await ev('addToCart("' + idPMu + '")');
    await abrirCarrito();
    s = await sug();
    chk(s.vis && s.tipo === 'carne', 'aparece la sugerencia de carne');
    chk(s.filas.length === 2, 'con dos cortes (' + s.filas.length + ')');
    const pic = s.filas[0] || { txt: '', boton: '' }, vac = s.filas[1] || { txt: '', boton: '' };
    chk(/Picaña/.test(pic.txt) && /Vacío/.test(vac.txt), 'primero la picaña y despues el vacio, por margen ("' + pic.txt.slice(0, 20) + '" / "' + vac.txt.slice(0, 20) + '")');
    chk(/P-0102/.test(pic.boton) && /Pieza de 0,900 kg/.test(pic.txt), 'de la picaña ofrece la MAS CHICA, 0,900 kg, aunque no venga primera');
    chk(pic.txt.indexOf(ars(0.9 * precio('CPi'))) >= 0, 'con su precio: ' + ars(0.9 * precio('CPi')) + ' ("' + pic.txt + '")');
    chk(/P-0202/.test(vac.boton) && vac.txt.indexOf(ars(1.064 * precio('CVa'))) >= 0, 'del vacio, la de 1,064 kg a ' + ars(1.064 * precio('CVa')));
    chk(!/Lomo/.test(JSON.stringify(s.filas)), 'el lomo agotado no aparece');
    chk(s.filas.every((f) => f.alto >= 44) && s.ver >= 44, 'los botones miden ' + s.filas.map((f) => f.alto).join('/') + ' y ' + s.ver + 'px');
    chk(s.desborde <= 0, 'no se sale del carrito a lo ancho (' + s.desborde + 'px)');
    chk((await eventos()).split('sugerencia_carne_vista').length === 2, 'se mide que se vio, una vez');
    await cerrarCarrito(); await abrirCarrito();
    chk((await eventos()).split('sugerencia_carne_vista').length === 2, 'y abrir el carrito otra vez no la cuenta de nuevo');

    /* ── 3. + SUMAR ─────────────────────────────────────────────────── */
    console.log('\n' + DIM + '== + Sumar ==' + RST);
    const t = await tocar('#cart-sug .sug-fila .sug-btn');
    chk(t && t.libre, 'el "+ Sumar" no lo tapa nada');
    const st = JSON.parse(await ev('JSON.stringify({ piezas: Object.keys(piezaCart), grilla: !!document.querySelector("#catalog-root .pz-fila.elegida"), carro: document.getElementById("cart-body").innerText })'));
    chk(st.piezas.length === 1 && st.piezas[0] === 'P-0102', 'entra la pieza de 0,900 kg (' + st.piezas.join(',') + ')');
    chk(st.grilla, 'y la grilla de Carnes la marca como elegida');
    chk(/Picaña/.test(st.carro) && /0,900 kg/.test(st.carro), 'el carrito la muestra');
    s = await sug();
    chk(!s.vis, 'con carne en el carrito la sugerencia se va');
    chk(/sugerencia_carne"/.test(await eventos()) || /"sugerencia_carne"/.test(await eventos()), 'se mide "sugerencia_carne"');

    /* ── 4. SACARLA, Y QUE SE VENDA ─────────────────────────────────── */
    console.log('\n' + DIM + '== Sacarla, y que se venda ==' + RST);
    await ev('togglePieza("CPi", "P-0102")');
    await dormir(200);
    s = await sug();
    chk(s.vis && /P-0102/.test((s.filas[0] || {}).boton), 'al sacarla, la sugerencia vuelve con la misma pieza');
    await ev('(async function () { delete window.__piezas.CPi; window.__piezas.CPi = [{ id: "P-0101", kg: 1.16 }]; await _refrescarPiezas(); })()');
    await dormir(300);
    s = await sug();
    chk(s.vis && /P-0101/.test((s.filas[0] || {}).boton) && /1,160 kg/.test((s.filas[0] || {}).txt),
        'si la de 0,900 se vende, al llegar el inventario ofrece la de 1,160 ("' + ((s.filas[0] || {}).txt || '') + '")');
    await ev('(async function () { delete window.__piezas.CPi; await _refrescarPiezas(); })()');
    await dormir(300);
    s = await sug();
    chk(s.vis && /Vacío/.test((s.filas[0] || {}).txt) && /Colita/.test((s.filas[1] || {}).txt),
        'sin picaña, pasa al vacio y la colita (' + s.filas.map((f) => f.txt.split(' Pieza')[0]).join(' / ') + ')');

    /* ── 6. VER TODAS LAS PIEZAS ────────────────────────────────────── */
    await tocar('#cart-sug .sug-ver');
    await dormir(1200);
    const ir = JSON.parse(await ev('(function () { var c = document.getElementById("cat-carnes"); var r = c.getBoundingClientRect();' +
      'return JSON.stringify({ abierto: document.getElementById("cart-sidebar").classList.contains("open"), top: Math.round(r.top), alto: window.innerHeight }); })()'));
    chk(!ir.abierto && ir.top >= -5 && ir.top < ir.alto / 2, '"Ver todas las piezas" cierra el carrito y lleva a Carnes (' + ir.top + 'px)');

    /* ── 7. AL REVES: SOLO CARNE EN EL CARRITO ─────────────────────── */
    console.log('\n' + DIM + '== Al reves: solo carne en el carrito ==' + RST);
    await abrir('estancias');
    await ev('togglePieza("CVa", "P-0202")');
    await abrirCarrito();
    const maleu = async () => JSON.parse(await ev('(function () { var el = document.getElementById("cart-sug");' +
      'return JSON.stringify({ vis: !!el && !el.hidden, tipo: el ? el.getAttribute("data-tipo") : "", txt: el ? el.innerText.replace(/\\s+/g, " ") : "",' +
      ' ids: el ? [].map.call(el.querySelectorAll(".sug-btn"), function (b) { return Number((b.getAttribute("onclick").match(/\\d+/) || [])[0]); }) : [],' +
      ' altos: el ? [].map.call(el.querySelectorAll(".sug-btn, .sug-ver"), function (b) { return Math.round(b.getBoundingClientRect().height); }) : [],' +
      ' desborde: document.getElementById("cart-body").scrollWidth - document.getElementById("cart-body").clientWidth }); })()'));
    let mm = await maleu();
    chk(mm.vis && mm.tipo === 'maleu' && /¿Le sumás algo más\?/.test(mm.txt), 'con solo carne aparece "¿Le sumás algo más?"');
    chk(/También tenemos pizzas, sorrentinos, empanadas, tartas, wraps y postres\. Va todo en la misma entrega\./.test(mm.txt),
        'dice todo lo que hay: "' + (mm.txt.match(/También tenemos[^.]*\./) || [''])[0] + '"');
    chk(JSON.stringify(mm.ids) === JSON.stringify([ID.PPM, ID.ECaC, ID.SCo]),
        'tres de categorias distintas, primero lo mas pedido y SOLO lo que hay hoy: pack muzza, empanadas de carne, sorrentinos de cordero (' + mm.ids.join(',') + ')');
    chk(mm.ids.indexOf(ID.PMa) < 0 && mm.ids.indexOf(ID.SJyQ) < 0, 'la margarita y los de jamon y queso, sin stock para hoy, no se ofrecen');
    if (ANCHO > 480) chk(/Para 3–4 personas · \$17\.000/.test(mm.txt), 'con para cuantos y el precio');
    else chk(/Pack Muzzarella x2 \$17\.000/.test(mm.txt) && !/personas/.test(mm.txt), 'en el celular, nombre y precio: el para cuantos partia el renglon en tres');
    chk(mm.altos.length === 4 && mm.altos.every((h) => h >= 44), 'los botones miden ' + mm.altos.join('/') + 'px');
    chk(mm.desborde <= 0, 'no se sale del carrito a lo ancho (' + mm.desborde + 'px)');
    chk((await eventos()).split('sugerencia_maleu_vista').length === 2, 'se mide que se vio');

    const tm = await tocar('#cart-sug .sug-btn');
    chk(tm && tm.libre, 'el "+ Sumar" no lo tapa nada');
    chk((await ev('cart[' + ID.PPM + ']')) === 1, 'suma el pack de muzza');
    mm = await maleu();
    chk(!mm.vis, 'con algo de Maleu en el carrito, la sugerencia se va');
    chk(/"sugerencia_maleu"/.test(await eventos()), 'se mide "sugerencia_maleu"');
    await ev('changeQty("' + ID.PPM + '", -1)');
    mm = await maleu();
    chk(mm.vis && mm.tipo === 'maleu', 'al sacarlo vuelve');

    /* Otra fecha, otro tope: para el viernes no hay tope y vuelven los mas pedidos. */
    await ev('setDeliveryDate("2026-09-18", "Viernes", { sinScroll: true })');
    await dormir(300);
    mm = await maleu();
    chk(JSON.stringify(mm.ids) === JSON.stringify([ID.PMa, ID.SJyQ, ID.ECaC]),
        'para el viernes ofrece la margarita, los de jamon y queso y las empanadas (' + mm.ids.join(',') + ')');

    /* Carne y un combo: el combo ya es de Maleu. Se pone directo en comboCart
       (armarlo por el modal de gustos no es lo que se mide aca). */
    const conCombo = await ev('(function () { var c = getActiveCombos()[0]; if (!c) return 0; comboCart["t"] = { comboId: c.id, qty: 1, comp: {}, picks: [] }; updateUI(); return Object.keys(comboCart).length; })()');
    mm = await maleu();
    chk(conCombo === 1 && !mm.vis, 'carne y un combo: no sugiere, el combo ya es de Maleu');
    await ev('comboCart = {}; updateUI()');
    chk((await maleu()).vis, 'y al sacar el combo vuelve');

    await tocar('#cart-sug .sug-ver');
    await dormir(1200);
    const irTodo = JSON.parse(await ev('(function () { var a = document.getElementById("productos-ancla"); var r = a.getBoundingClientRect();' +
      'return JSON.stringify({ abierto: document.getElementById("cart-sidebar").classList.contains("open"), top: Math.round(r.top), alto: window.innerHeight }); })()'));
    chk(!irTodo.abierto && irTodo.top > -40 && irTodo.top < irTodo.alto / 2, '"Ver todo lo que tenemos" cierra el carrito y lleva al catalogo (' + irTodo.top + 'px)');
    await ev('togglePieza("CVa", "P-0202")');
    await ev('try { if (Object.keys(piezaCart).length) Object.keys(piezaCart).forEach(function (k) { togglePieza(piezaCart[k].abbr, k); }); } catch (e) {}');

    /* ── 5. CUANDO NO VA ────────────────────────────────────────────── */
    console.log('\n' + DIM + '== Cuando no va ==' + RST);
    await ev('changeQty("' + idPMu + '", -1); togglePieza("CVa", "P-0202")');
    await abrirCarrito();
    s = await sug();
    chk(s.tipo !== 'carne' && (await ev('cartCount()')) > 0 && (await ev('piezasAgrupadas().length')) === 1, 'con solo carne en el carrito no sugiere MAS carne (sugiere: ' + (s.tipo || 'nada') + ')');
    await cerrarCarrito();

    await abrir('estancias', '&p=vacio');
    await ev('addToCart("' + idPMu + '")');
    await abrirCarrito();
    s = await sug();
    chk(await ev('piezasEstado === "vacio" && cartCount() > 0') && !s.vis, 'con toda la carne agotada (y una pizza en el carrito) no sugiere');
    await cerrarCarrito();

    /* Pilar tiene dos casos desde el 14/9/2026: lo que entrega Maleu vende carne,
       un barrio con vendedor no (sus pedidos van a la hoja Red, sin columnas de
       carne). */
    await cerrarCarrito();
    await abrir('pilar', '', '#loc-overlay button[onclick*=Tortugas]');
    const zona = await ev('currentZone');
    await ev('(function () { var p = getActiveProducts().filter(function (x) { return !esPorPeso(x); })[0]; addToCart(String(p.id)); })()');
    await abrirCarrito();
    s = await sug();
    chk(zona === 'pilar' && !s.vis && (await ev('cartCount()')) > 0 && (await ev('hayPiezas()')), 'en un barrio de Pilar con vendedor, que no vende carne, no sugiere aunque haya piezas y algo en el carrito (zona ' + zona + ')');
    await cerrarCarrito();
    await abrir('pilar');
    await ev('(function () { var p = getActiveProducts().filter(function (x) { return !esPorPeso(x); })[0]; addToCart(String(p.id)); })()');
    await abrirCarrito();
    s = await sug();
    chk(s.vis && s.tipo === 'carne', 'en lo que entrega Maleu en Pilar SI sugiere carne (' + (s.vis ? s.tipo : 'no se ve') + ')');

    const posts = await ev('window.__post');
    chk(posts === 0 && escapados.length === 0, 'no salio ningun POST ni salto a WhatsApp (' + posts + '/' + escapados.length + ')');

    if (process.env.CAPTURA) {
      await abrir('estancias');
      await ev('addToCart("' + idPMu + '"); addToCart("' + idPMu + '")');
      await abrirCarrito();
      await ev('(function () { var b = document.getElementById("cart-body"); b.scrollTop = b.scrollHeight; })()');
      await dormir(700);
      const img = await cli.enviar('Page.captureScreenshot', { format: 'png' });
      fs.mkdirSync(process.env.CAPTURA, { recursive: true });
      fs.writeFileSync(path.join(process.env.CAPTURA, 'sugerencia-carne-' + ANCHO + '.png'), Buffer.from(img.data, 'base64'));
      await ev('cart = {}; togglePieza("CVa", "P-0202")');
      await dormir(500);
      await ev('(function () { var b = document.getElementById("cart-body"); b.scrollTop = b.scrollHeight; })()');
      await dormir(700);
      const img2 = await cli.enviar('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(process.env.CAPTURA, 'sugerencia-maleu-' + ANCHO + '.png'), Buffer.from(img2.data, 'base64'));
    }
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
