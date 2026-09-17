/**
 * La reserva de carne por kilo (17/9/2026).
 *
 *   node _tools/verificar-reserva.js [ancho]      (390 por defecto)
 *
 * QUE SE PIDIO (reunion de Tadeo con Lucas, 17/9/2026): la carne llega los
 * viernes y la tienda solo muestra las piezas que ya hay. Para un corte sin
 * piezas, el cliente tiene que poder RESERVAR kilos, con tope en lo que Lucas le
 * pidio al proveedor, y el pedido entra "a confirmar": cuando llega se pesa y se
 * le confirma el peso y el precio.
 *
 * El contrato con Backend: `piezas_full._reserva` = {llega, cortes:{abbr:kg}};
 * cada reserva viaja como item {unidad:'kg', qty, piezas:[], reserva:true} y el
 * pedido lleva reservaCarne = {llega, cortes}.
 *
 * QUE MIRA:
 *   · sin `_reserva` la tienda queda exactamente como hoy (sale dormida);
 *   · con `_reserva`: los cortes sin piezas se reservan, los que tienen piezas se
 *     eligen como siempre, y uno con menos de 1 kg para reservar dice "Sin stock";
 *   · la card: el boton, el medio kilo, el tope, sacarla;
 *   · el carrito, el resumen y el total dicen "aprox.";
 *   · el pedido que sale y su WhatsApp;
 *   · una fecha anterior a la llegada: pregunta antes de moverla, y si el cliente
 *     vuelve para atras, la reserva sale y se dice; el dia del formulario tambien
 *     se controla al mandar;
 *   · el inventario de ahora: menos kilos, llego la carne, ya no hay reserva, y
 *     con un pedido en camino no se toca nada;
 *   · la copia de la ultima visita trae la reserva;
 *   · Pilar de Maleu tambien reserva.
 *
 * El RELOJ va congelado en el martes 15/9/2026 10:00 de Argentina. El backend se
 * contesta adentro de la pagina; ademas, por CDP, todo lo que vaya a Apps Script
 * se corta y se cuenta como escapado. WhatsApp se simula. Analytics y Meta se
 * bloquean. Con RAIZ=<carpeta> corre contra otra copia.
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

/* Hora de Argentina (UTC-3) de un dia de septiembre de 2026. */
const AR = (dia, hora, min) => Date.UTC(2026, 8, dia, hora + 3, min || 0, 0);
const MARTES = AR(15, 10);

const ABBRS = ['PMu', 'PMa', 'PJyQ', 'PCC', 'PJyM', 'PPM', 'PPJyQ', 'PPCyQ', 'SQB', 'SL', 'SCo',
  'SPyP', 'SJyQ', 'SE', 'SCa', 'ECaC', 'EJyQ', 'ECyQ', 'EV', 'TG', 'TLC', 'TC', 'F', 'TP', 'TJyQ',
  'TCa', 'TV', 'RC', 'RP', 'CCo', 'CEn', 'CLo', 'CPi', 'CVa'];
const STOCK = {};
ABBRS.forEach((a) => { STOCK[a] = { f: 50, p: 50 }; });
/* La entraña tiene una pieza Y viene en la compra: se elige por pieza, no se
   reserva (un corte va con piezas o con reserva, nunca las dos). Colita, lomo y
   vacio se reservan. La picaña trae 0,7 kg, menos que el minimo: "Sin stock". */
const RESERVA = { llega: '2026-09-18', cortes: { CCo: 20, CEn: 10, CLo: 16, CVa: 12, CPi: 0.7 } };
const PIEZAS = { CEn: [{ id: 'ENT-01', kg: 1.163 }], _reserva: RESERVA };
const VENDEDORES = { vendedores: [
  { nombre: 'Marcos', wa: '5491100000001', alias: '', barrios: ['Tortugas y alrededores', 'El Lucero'] },
] };

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

/* Antes de que arranque la tienda: la semilla del localStorage (una vez por
   navegacion), el reloj, y el backend contestado adentro de la pagina.
   `window.__piezasResp` es lo que contesta piezas_full: el test lo cambia para
   simular que llego otro inventario. `demora` retrasa esa respuesta. */
const PREP = '(function () {' +
  'var q = location.search, m = /[?&]semilla=([^&]+)/.exec(q), nn = /[?&]n=(\\d+)/.exec(q);' +
  'var rp = /[?&]resp=([^&]+)/.exec(q), dm = /[?&]demora=(\\d+)/.exec(q);' +
  'if (m && sessionStorage.getItem("__semilla") !== (nn ? nn[1] : "") + m[1]) {' +
  '  sessionStorage.setItem("__semilla", (nn ? nn[1] : "") + m[1]);' +
  '  try { localStorage.clear(); var s = JSON.parse(decodeURIComponent(m[1]));' +
  '    Object.keys(s).forEach(function (k) { localStorage.setItem(k, typeof s[k] === "string" ? s[k] : JSON.stringify(s[k])); }); } catch (e) {}' +
  '}' +
  'var RD = Date; window.__ahora = ' + MARTES + ';' +
  'function FD() {' +
  '  if (!(this instanceof FD)) return new RD(window.__ahora).toString();' +
  '  if (arguments.length === 0) return new RD(window.__ahora);' +
  '  var a = [null].concat([].slice.call(arguments));' +
  '  return new (Function.prototype.bind.apply(RD, a))();' +
  '}' +
  'FD.prototype = RD.prototype; FD.now = function () { return window.__ahora; };' +
  'FD.UTC = RD.UTC; FD.parse = RD.parse; window.Date = FD;' +
  'window.__piezasResp = rp ? JSON.parse(decodeURIComponent(rp[1])) : ' + JSON.stringify(PIEZAS) + ';' +
  'var demora = dm ? +dm[1] : 0;' +
  'window.__posts = []; navigator.sendBeacon = function (u, d) { window.__posts.push({ beacon: true, body: String(d || "") }); return false; };' +
  'var orig = window.fetch;' +
  'var json = function (o) { return Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { "Content-Type": "application/json" } })); };' +
  'window.fetch = function (url, opts) {' +
  '  var u = String(url);' +
  '  if (opts && String(opts.method || "").toUpperCase() === "POST" && u.indexOf("script.google") >= 0) {' +
  '    var body = String(opts.body || ""); window.__posts.push({ body: body });' +
  '    var d = {}; try { d = JSON.parse(body); } catch (e) {}' +
  '    return d.action ? json({ ok: true }) : json({ ok: true, n: "999" });' +
  '  }' +
  '  if (u.indexOf("action=stock_full") >= 0) return json(' + JSON.stringify(STOCK) + ');' +
  '  if (u.indexOf("action=piezas_full") >= 0) {' +
  '    var r = JSON.parse(JSON.stringify(window.__piezasResp));' +
  '    return demora ? new Promise(function (ok) { setTimeout(function () { ok(json(r)); }, demora); }) : json(r);' +
  '  }' +
  '  if (u.indexOf("action=vendedores") >= 0) return json(' + JSON.stringify(VENDEDORES) + ');' +
  '  if (u.indexOf("script.google") >= 0) return json({ ok: true });' +
  '  return orig.apply(this, arguments);' +
  '};' +
  '})();';

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-reserva-'));
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
    const escapados = [], whatsapps = [];
    await cli.enviar('Fetch.enable', { patterns: [{ urlPattern: '*script.google.com*' },
      { urlPattern: '*wa.me*' }, { urlPattern: '*whatsapp*' }, { urlPattern: '*googletagmanager*' },
      { urlPattern: '*google-analytics*' }, { urlPattern: '*facebook*' }] });
    cli.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      const r = m.params.request;
      try {
        if (/^https:\/\/wa\.me\/\d/.test(r.url)) {
          whatsapps.push(r.url);
          await cli.enviar('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 200,
            responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
            body: Buffer.from('<p>whatsapp simulado</p>').toString('base64') });
          return;
        }
        if (/script\.google/.test(r.url)) escapados.push(r.method + ' ' + r.url.slice(0, 70));
        await cli.enviar('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'BlockedByClient' });
      } catch (e) { /* la pagina ya se fue */ }
    });
    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: PREP });

    const ev = async (e) => {
      const r = await cli.enviar('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error(String((d.exception && (d.exception.description || d.exception.value)) || d.text).slice(0, 240));
      }
      return r.result.value;
    };
    const esperar = async (expr, ms) => {
      for (let i = 0; i < ms / 100; i++) { if (await ev(expr).catch(() => false)) return true; await dormir(100); }
      return false;
    };
    /* Un toque de verdad en el centro del elemento: si algo lo tapa, el toque le
       cae a otro y el test lo dice. */
    const tocar = async (sel) => {
      const pos = JSON.parse(await ev('(function () {' +
        'var e = document.querySelector(' + JSON.stringify(sel) + '); if (!e) return "null";' +
        'document.documentElement.style.scrollBehavior = "auto"; e.scrollIntoView({ block: "center" });' +
        'var r = e.getBoundingClientRect(); var x = r.left + r.width / 2, y = r.top + r.height / 2;' +
        'var en = document.elementFromPoint(x, y);' +
        'return JSON.stringify({ x: x, y: y, libre: !!en && (en === e || e.contains(en)) });' +
        '})()'));
      if (!pos) return false;
      await dormir(150);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cli.enviar('Input.dispatchMouseEvent', { type, x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
      }
      await dormir(450);
      return pos.libre;
    };
    let nav = 0;
    const abrir = async (semilla, extra) => {
      await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?n=' + (++nav) +
        '&semilla=' + encodeURIComponent(JSON.stringify(semilla || {})) + (extra || '') });
      if (!(await esperar("typeof PRODUCTOS !== 'undefined' && !!document.getElementById('loc-step-zone')", 15000))) {
        throw new Error('la tienda no arranco');
      }
      await dormir(300);
    };
    const listos = async () => {
      await esperar('Object.keys(stockMap).length > 5', 10000);
      await esperar('typeof piezasEstado !== "undefined" && piezasEstado !== "cargando"', 10000);
      await dormir(300);
    };
    const estancias = async (iso, dia, resp) => {
      await abrir({}, resp ? '&resp=' + encodeURIComponent(JSON.stringify(resp)) : '');
      /* Desde el 23/9/2026 la tienda abre en el catalogo y el modal no sale
         solo. Se abre desde el chip de arriba, que es lo que le queda a alguien
         que no toco "+ Agregar" todavia. */
      await ev('(function () { if (typeof zonaProvisoria !== "undefined" && zonaProvisoria) showZoneModal("chip"); })()');
      await dormir(300);
      if (!(await tocar('#loc-step-zone .loc-btn[onclick*="estancias"]'))) throw new Error('no se pudo tocar Estancias');
      await ev('setDeliveryDate(' + JSON.stringify(iso) + ', ' + JSON.stringify(dia) + ')');
      await listos();
    };
    const card = (abbr) => '.carne-card[data-id="' + abbr + '"]';
    const idDe = async (abbr) => ev('_corteDe(' + JSON.stringify(abbr) + ').id');
    const cardSel = async (abbr) => card(await idDe(abbr));
    const toastTxt = async () => ev('document.getElementById("toast").textContent');
    const reserva = async (abbr) => JSON.parse(await ev('JSON.stringify(reservaEnCarrito(' + JSON.stringify(abbr) + '))'));
    const precioKg = async (abbr, kg) => ev('piezaPrecio(_corteDe(' + JSON.stringify(abbr) + '), ' + kg + ')');
    const nuevoInventario = async (resp) => {
      await ev('window.__piezasResp = ' + JSON.stringify(resp) + '; _refrescarPiezas().then(function () { return true; })');
      await dormir(300);
    };

    /* ── 1. SIN `_reserva`: LA TIENDA QUEDA COMO HOY ─────────────────── */
    console.log(DIM + '== Sin _reserva, la tienda queda como hoy ==' + RST);
    await estancias('2026-09-18', 'Viernes', { CEn: [{ id: 'ENT-01', kg: 1.163 }] });
    const dormida = JSON.parse(await ev('JSON.stringify({ res: document.querySelectorAll(".reserva-card, .res-caja").length, grises: document.querySelectorAll(".carne-card.agotada").length, info: reservaInfo, tile: ([].filter.call(document.querySelectorAll(".cat-tile"), function (t) { return /Carnes/.test(t.textContent); })[0] || {}).textContent })'));
    chk(dormida.res === 0 && dormida.info === null, 'no se ofrece reservar nada (' + dormida.res + ' cajas)');
    chk(dormida.grises === 4, 'los cuatro cortes sin piezas dicen "Sin stock" (' + dormida.grises + ')');
    chk(/1 opci[oó]n/.test(dormida.tile || ''), 'el tile de Carnes cuenta 1 opcion ("' + dormida.tile + '")');

    /* ── 2. CON `_reserva`: QUE SE VE ─────────────────────────────────── */
    console.log('\n' + DIM + '== Con _reserva: los cortes sin piezas se reservan ==' + RST);
    await estancias('2026-09-18', 'Viernes');
    const vista = JSON.parse(await ev('(function () {' +
      'var sec = document.getElementById("cat-carnes");' +
      'var cards = sec ? [].map.call(sec.querySelectorAll(".carne-card"), function (c) { var p = PROD_MAP[c.getAttribute("data-id")]; return p.abbr + (c.classList.contains("reserva-card") ? ":R" : c.classList.contains("agotada") ? ":X" : ":P"); }) : [];' +
      'var tile = [].filter.call(document.querySelectorAll(".cat-tile"), function (t) { return /Carnes/.test(t.textContent); })[0];' +
      'return JSON.stringify({ cards: cards, tile: tile ? tile.textContent : "" }); })()'));
    chk(JSON.stringify(vista.cards.map((c) => c.split(':')[1])) === JSON.stringify(['P', 'R', 'R', 'R', 'X']),
        'primero la entraña con su pieza, despues los tres que se reservan y al final la picaña (' + vista.cards.join(' ') + ')');
    chk(vista.cards.indexOf('CPi:X') >= 0, 'la picaña, con 0,7 kg para reservar (menos del minimo), dice "Sin stock"');
    chk(/4 opciones/.test(vista.tile), 'el tile de Carnes cuenta 4 opciones ("' + vista.tile + '")');
    const sEnt = await cardSel('CEn');
    const ent = JSON.parse(await ev('(function () { var c = document.querySelector(' + JSON.stringify(sEnt) + ');' +
      'var antes = cartCount(); cambiarReserva("CEn", 0.5);' +
      'return JSON.stringify({ piezas: c.querySelectorAll(".pz-fila").length, caja: !!document.querySelector(' + JSON.stringify(sEnt + ' .res-caja') + '), max: reservaMaxKg(_corteDe("CEn")), sumo: cartCount() - antes }); })()'));
    chk(ent.piezas === 1 && !ent.caja && ent.max === 0, 'la entraña tiene pieza y viene en la compra: se elige la pieza, no se reserva (' + JSON.stringify(ent) + ')');
    chk(ent.sumo === 0, 'y aunque se pida reservarla, no entra nada al carrito');
    const sVac = await cardSel('CVa');
    const cVac = JSON.parse(await ev('(function () { var c = document.querySelector(' + JSON.stringify(sVac) + ');' +
      'return JSON.stringify({ chapa: (c.querySelector(".chapa-prod") || {}).textContent, t: (c.querySelector(".res-t") || {}).textContent,' +
      ' boton: (c.querySelector(".res-btn") || {}).textContent, gris: getComputedStyle(c.querySelector(".product-thumb-img")).filter }); })()'));
    chk(cVac.chapa === 'Para reservar', 'la chapita dice "Para reservar" ("' + cVac.chapa + '")');
    chk(cVac.t === 'Llega el viernes 18/9', 'dice cuando llega ("' + cVac.t + '")');
    const p1 = await precioKg('CVa', 1);
    chk(cVac.boton === 'Reservar 1 kg · aprox. $' + p1.toLocaleString('es-AR'), 'el boton dice cuanto y cuanto sale ("' + cVac.boton + '")');
    chk(!/grayscale/.test(cVac.gris || ''), 'la foto va en color: se puede comprar (' + cVac.gris + ')');

    /* ── 3. LA CARD: RESERVAR, MEDIO KILO, TOPE, SACAR ──────────────────── */
    console.log('\n' + DIM + '== La card: reservar, de a medio kilo, el tope ==' + RST);
    chk(await tocar(sVac + ' .res-btn'), 'el boton "Reservar" se toca');
    let rv = await reserva('CVa');
    chk(rv && rv.kg === 1 && rv.reserva === true && rv.precio === p1, 'entra 1 kg al carrito (' + JSON.stringify(rv) + ')');
    chk(/Reservaste 1 kg de/.test(await toastTxt()), 'y se dice ("' + (await toastTxt()) + '")');
    chk(await tocar(sVac + ' .card-qty-btn:not(.remove)'), 'el "+" se toca');
    rv = await reserva('CVa');
    const p15 = await precioKg('CVa', 1.5);
    const pie = await ev('document.querySelector(' + JSON.stringify(sVac + ' .res-pie') + ').textContent');
    chk(rv.kg === 1.5 && rv.precio === p15, 'suma medio kilo (' + rv.kg + ' kg, $' + rv.precio + ')');
    chk(/1,5 kg/.test(pie) && pie.indexOf('aprox. $' + p15.toLocaleString('es-AR')) >= 0, 'la card dice el peso y el precio aproximado ("' + pie + '")');
    await ev('cambiarReserva("CVa", 20)');
    rv = await reserva('CVa');
    const tope = JSON.parse(await ev('JSON.stringify({ mas: document.querySelector(' + JSON.stringify(sVac + ' .card-qty-btn:not(.remove)') + ').disabled, aviso: !!document.querySelector(' + JSON.stringify(sVac + ' .res-tope') + ') })'));
    chk(rv.kg === 12, 'no pasa de lo que queda para reservar (' + rv.kg + ' de 12 kg)');
    chk(tope.mas && tope.aviso, 'el "+" se apaga y dice que es todo lo que queda');
    chk(await tocar(sVac + ' .card-qty-btn.remove'), 'el "−" se toca');
    chk((await reserva('CVa')).kg === 11.5, 'resta medio kilo');
    await ev('cambiarReserva("CVa", -20)');
    chk((await reserva('CVa')) === null, 'bajando del minimo la reserva sale del carrito');
    chk(/Reservar 1 kg/.test(await ev('document.querySelector(' + JSON.stringify(sVac) + ').textContent')), 'y vuelve el boton "Reservar"');

    /* ── 4. EL CARRITO, EL RESUMEN Y EL PEDIDO ───────────────────────── */
    console.log('\n' + DIM + '== El carrito, el resumen, el pedido y su WhatsApp ==' + RST);
    await ev('cambiarReserva("CVa", 0.5); cambiarReserva("CVa", 0.5); cambiarReserva("CLo", 0.5); cambiarReserva("CLo", 1); togglePieza("CEn", "ENT-01"); addToCart(11)');
    await ev('toggleCart()');
    await dormir(500);
    const carrito = JSON.parse(await ev('JSON.stringify({ lineas: [].map.call(document.querySelectorAll(".cart-item-reserva"), function (l) { return l.textContent; }), total: document.getElementById("cart-total").previousElementSibling.textContent })'));
    chk(carrito.lineas.length === 2, 'el carrito tiene las dos reservas (' + carrito.lineas.length + ')');
    chk(carrito.lineas.some((l) => /Reserva de 1,5 kg/.test(l) && /aprox\./.test(l) && /Llega el viernes 18\/9/.test(l)), 'cada una dice los kilos, "aprox." y cuando llega');
    chk(carrito.total === 'Total aprox.', 'el total dice "Total aprox." ("' + carrito.total + '")');
    const idVa = await idDe('CVa');
    chk(await tocar('.cart-item-reserva button[onclick*="CVa"][aria-label="Medio kilo más"]'), 'el "+" del carrito se toca');
    chk((await reserva('CVa')).kg === 2, 'y suma medio kilo (' + (await reserva('CVa')).kg + ')');
    await tocar('.cart-item-reserva button[onclick*="CVa"][aria-label="Medio kilo menos"]');
    chk((await reserva('CVa')).kg === 1.5, 'el "−" resta (' + (await reserva('CVa')).kg + ')');
    await ev('toggleCart()');
    await dormir(400);
    const resumen = await ev('document.getElementById("form-summary").textContent');
    chk(/reserva de 1,5 kg/.test(resumen) && /reserva de 2 kg/.test(resumen), 'el resumen del formulario nombra las reservas');
    chk(/Total aprox\./.test(resumen) && /La carne reservada llega el viernes 18\/9/.test(resumen), 'y dice "Total aprox." y cuando llega');
    const hint = await ev('(function () { var t = document.querySelector("input[name=pago][value=Transferencia]"); t.checked = true; t.dispatchEvent(new Event("change", { bubbles: true })); updateUI(); return document.querySelector("#mp-alias .mp-alias-hint").textContent; })()');
    chk(/transferí cuando te confirmemos el total/.test(hint), 'por transferencia: transferir cuando se confirme el total ("' + hint + '")');
    const esp = JSON.parse(await ev('(async function () {' +
      'var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };' +
      'var c = { "f-nombre": "PRUEBA Reserva", "f-telefono": "1155038905", "f-lote": "77" };' +
      'var bp = document.getElementById("f-barrio-privado"); bp.value = "Estancias del Río"; bp.dispatchEvent(new Event("change", { bubbles: true }));' +
      'Object.keys(c).forEach(function (id) { var e = document.getElementById(id); e.value = c[id]; e.dispatchEvent(new Event("change", { bubbles: true })); });' +
      'var ef = document.querySelector("input[name=pago][value=Efectivo]"); ef.checked = true; ef.dispatchEvent(new Event("change", { bubbles: true }));' +
      'await dormir(200);' +
      'var e = { sub: cartTotal(), desc: getTotalDiscount(), pVa: reservaEnCarrito("CVa").precio, pLo: reservaEnCarrito("CLo").precio, fecha: document.getElementById("f-dia-fecha").value };' +
      'enviarPedido();' +
      'for (var i = 0; i < 30 && !window.__posts.some(function (p) { return !p.beacon; }); i++) await dormir(100);' +
      'e.post = (window.__posts.filter(function (p) { return !p.beacon; })[0] || {}).body || "";' +
      'return JSON.stringify(e); })()'));
    let ped = null;
    try { ped = JSON.parse(esp.post); } catch (e) { /* sin pedido */ }
    chk(!!ped, 'sale el pedido');
    if (ped) {
      const carne = (ped.items || []).filter((it) => it.unidad === 'kg');
      const va = carne.filter((it) => it.abbr === 'CVa')[0] || {};
      const lo = carne.filter((it) => it.abbr === 'CLo')[0] || {};
      const en = carne.filter((it) => it.abbr === 'CEn')[0] || {};
      chk(va.reserva === true && va.qty === 1.5 && Array.isArray(va.piezas) && va.piezas.length === 0 && va.importe === esp.pVa && va.id === idVa,
          'el vacio va como reserva: 1,5 kg, sin piezas, con su importe (' + JSON.stringify(va) + ')');
      chk(lo.reserva === true && lo.qty === 2, 'el lomo tambien (' + lo.qty + ' kg)');
      chk(!en.reserva && JSON.stringify(en.piezas) === '["ENT-01"]', 'la entraña va con su pieza, como siempre (' + JSON.stringify(en.piezas) + ')');
      chk(JSON.stringify(ped.reservaCarne) === JSON.stringify({ llega: '2026-09-18', cortes: { CVa: 1.5, CLo: 2 } }), 'el pedido dice de que compra es la reserva (' + JSON.stringify(ped.reservaCarne) + ')');
      chk(ped.canal === 'Home' && ped.fechaEntrega === '2026-09-18', 'a la hoja Home, para el viernes 18 (' + ped.canal + ', ' + ped.fechaEntrega + ')');
      chk(Number(ped.descuento) === Math.round(esp.sub * 0.1) && Math.abs(ped.total - (esp.sub - esp.desc)) < 2, 'el 10% en efectivo incluye la carne estimada (' + ped.descuento + ' de ' + esp.sub + ', total ' + ped.total + ')');
    }
    await esperar('false', 2500);
    const wa = whatsapps.length ? decodeURIComponent(whatsapps[whatsapps.length - 1].split('text=')[1] || '') : '';
    chk(!!wa, 'el ERP confirma y sale el WhatsApp');
    chk(/^Hola! Quiero hacer un pedido:/.test(wa), 'con la primera linea de siempre');
    chk(/Vac[ií]o\s+—\s+reserva de 1,5 kg · aprox\. \$/.test(wa), 'el vacio dice "reserva de 1,5 kg · aprox."');
    chk(/\*Total: \$[\d.]+\* \(aprox\.\)/.test(wa), 'el total dice "(aprox.)"');
    chk(/La carne reservada me la confirman cuando llegue \(viernes 18\/9\)\./.test(wa), 'y que la carne se confirma cuando llegue');
    chk(![...wa].some((c) => c.codePointAt(0) > 0xFFFF), 'sin emoji de 4 bytes');

    /* ── 5. UNA FECHA ANTES DE QUE LLEGUE ─────────────────────────────── */
    console.log('\n' + DIM + '== Una fecha antes de que llegue la carne ==' + RST);
    await estancias('2026-09-16', 'Miércoles');
    const sVac2 = await cardSel('CVa');
    const btnOtra = await ev('(function () { var b = document.querySelector(' + JSON.stringify(sVac2 + ' .res-btn') + '); return b ? b.className + "|" + b.textContent : ""; })()');
    chk(/add-btn-otra-fecha/.test(btnOtra) && /Reservar para el vie 18$/.test(btnOtra), 'el miercoles 16 el boton ofrece el viernes ("' + btnOtra.split('|')[1] + '")');
    chk(await tocar(sVac2 + ' .res-btn'), 'se toca');
    const modal = await ev('(function () { var m = document.getElementById("fecha-modal"); return m && m.style.display === "flex" ? m.textContent : ""; })()');
    chk(/Lo tenemos para el viernes 18\/9/.test(modal), 'pregunta antes de mover la entrega ("' + modal.slice(0, 70) + '")');
    await tocar('#fecha-modal .fecha-modal-no');
    chk(await ev('selectedDeliveryDate') === '2026-09-16' && (await reserva('CVa')) === null, 'quedarse con el miercoles no cambia nada');
    await tocar(sVac2 + ' .res-btn');
    await tocar('#fecha-modal .fecha-modal-si');
    chk(await ev('selectedDeliveryDate') === '2026-09-18' && ((await reserva('CVa')) || {}).kg === 1, 'pasar al viernes: la entrega es el 18 y entra 1 kg');
    chk(/pas[oó] al viernes 18\/9/.test(await toastTxt()), 'y se dice que la entrega cambio ("' + (await toastTxt()) + '")');
    await ev('setDeliveryDate("2026-09-16", "Miércoles")');
    await dormir(200);
    chk((await reserva('CVa')) === null, 'volver al miercoles saca la reserva');
    chk(/no la podemos llevar/.test(await toastTxt()), 'y lo dice ("' + (await toastTxt()) + '")');
    chk(/Reservar para el vie 18/.test(await ev('document.querySelector(' + JSON.stringify(sVac2) + ').textContent')), 'la card vuelve a ofrecer el viernes');
    await ev('setDeliveryDate("2026-09-18", "Viernes"); cambiarReserva("CVa", 0.5)');
    const frenado = JSON.parse(await ev('(async function () {' +
      'var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };' +
      'var bp = document.getElementById("f-barrio-privado"); bp.value = "Estancias del Río"; bp.dispatchEvent(new Event("change", { bubbles: true }));' +
      '["f-nombre:PRUEBA Fecha", "f-telefono:1155038905", "f-lote:9"].forEach(function (x) { var k = x.split(":"); var e = document.getElementById(k[0]); e.value = k[1]; e.dispatchEvent(new Event("change", { bubbles: true })); });' +
      'var ef = document.querySelector("input[name=pago][value=Efectivo]"); ef.checked = true; ef.dispatchEvent(new Event("change", { bubbles: true }));' +
      'document.getElementById("f-dia").value = "Miércoles"; document.getElementById("f-dia-fecha").value = "2026-09-16";' +
      'var antes = window.__posts.length; enviarPedido(); await dormir(600);' +
      'return JSON.stringify({ posts: window.__posts.length - antes, toast: document.getElementById("toast").textContent, enviando: _enviando }); })()'));
    chk(frenado.posts === 0 && !frenado.enviando, 'con el miercoles elegido en el formulario el pedido no sale (' + frenado.posts + ' POST)');
    chk(/eleg[ií] ese d[ií]a o uno posterior/.test(frenado.toast), 'y se dice por que ("' + frenado.toast + '")');

    /* ── 6. EL INVENTARIO DE AHORA ───────────────────────────────────── */
    console.log('\n' + DIM + '== Llega el inventario de ahora ==' + RST);
    await estancias('2026-09-18', 'Viernes');
    await ev('cambiarReserva("CVa", 0.5); cambiarReserva("CVa", 2)');
    chk((await reserva('CVa')).kg === 3, 'reserva 3 kg de vacio');
    await nuevoInventario({ CEn: [{ id: 'ENT-01', kg: 1.163 }], _reserva: { llega: '2026-09-18', cortes: { CCo: 20, CLo: 16, CVa: 2 } } });
    chk((await reserva('CVa')).kg === 2, 'otros reservaron y quedan 2 kg: la reserva se ajusta (' + (await reserva('CVa')).kg + ')');
    chk(/quedan 2 kg/.test(await toastTxt()), 'y se dice ("' + (await toastTxt()) + '")');
    /* Llegan piezas de vacio y la compra todavia lo nombra: el corte ya tiene
       piezas, asi que se elige pieza por pieza y la reserva sale igual. */
    await nuevoInventario({ CEn: [{ id: 'ENT-01', kg: 1.163 }], CVa: [{ id: 'VAC-01', kg: 1.064 }, { id: 'VAC-02', kg: 1.241 }], _reserva: { llega: '2026-09-18', cortes: { CCo: 20, CLo: 16, CVa: 12 } } });
    const llego = JSON.parse(await ev('JSON.stringify({ r: reservaEnCarrito("CVa"), piezas: document.querySelectorAll(' + JSON.stringify(sVac + ' .pz-fila') + ').length, caja: !!document.querySelector(' + JSON.stringify(sVac + ' .res-caja') + '), toast: document.getElementById("toast").textContent })'));
    chk(llego.r === null && llego.piezas === 2 && !llego.caja, 'llego la carne: la reserva sale y el vacio muestra sus piezas (' + llego.piezas + ' piezas)');
    chk(/Lleg[oó] la carne/.test(llego.toast) && /eleg/.test(llego.toast), 'y se dice que ahora se elige la pieza ("' + llego.toast + '")');
    await ev('cambiarReserva("CLo", 0.5)');
    await nuevoInventario({ CEn: [{ id: 'ENT-01', kg: 1.163 }] });
    const sin = JSON.parse(await ev('JSON.stringify({ r: reservaEnCarrito("CLo"), info: reservaInfo, gris: document.querySelectorAll(".carne-card.agotada").length, toast: document.getElementById("toast").textContent })'));
    chk(sin.r === null && sin.info === null && sin.gris === 4, 'sin `_reserva`: la reserva sale y los cortes vuelven a "Sin stock" (' + sin.gris + ')');
    chk(/Ya no se puede reservar/.test(sin.toast), 'y se dice ("' + sin.toast + '")');
    await nuevoInventario(PIEZAS);
    await ev('cambiarReserva("CCo", 0.5); _enviando = true');
    await nuevoInventario({ CEn: [{ id: 'ENT-01', kg: 1.163 }] });
    chk(((await reserva('CCo')) || {}).kg === 1, 'con un pedido en camino, el carrito no se toca');
    await ev('_enviando = false');

    /* ── 7. LA COPIA DE LA ULTIMA VISITA ─────────────────────────────── */
    console.log('\n' + DIM + '== La copia de la ultima visita trae la reserva ==' + RST);
    /* Sin ninguna pieza: es el caso en que la copia existe SOLO por la reserva. */
    await nuevoInventario({ _reserva: RESERVA });
    const copia = await ev('localStorage.getItem("maleu_piezas_v1")');
    chk(/"llega":"2026-09-18"/.test(copia || ''), 'sin ninguna pieza, la copia igual guarda la reserva');
    await abrir({ maleu_zone: 'estancias', maleu_piezas_v1: JSON.parse(copia),
      maleu_delivery_date: { iso: '2026-09-18', dayName: 'Viernes', flexible: false, zone: 'estancias', ts: 1 } }, '&demora=5000');
    await esperar('document.querySelectorAll(".reserva-card").length > 0', 2000);
    const conCopia = JSON.parse(await ev('JSON.stringify({ n: document.querySelectorAll(".reserva-card").length, estado: piezasEstado })'));
    chk(conCopia.n === 4, 'con el backend tardando 5 s, los cortes para reservar ya se ven (' + conCopia.n + ', entraña incluida: en la copia no tiene piezas)');

    /* ── LA OCTAVA PUERTA: reservar sin haber elegido zona ──────────
       El 23/9/2026 la tienda paso a preguntar la zona en el primer "+ Agregar".
       Esta rama venia de antes y traia una puerta al carrito que ese dia no
       existia: el +/- de medio kilo. Sin la puerta, alguien reserva kilos sin
       haber dicho de donde es y el pedido se va a la hoja equivocada. */
    console.log('\n' + DIM + '== Reservar sin haber elegido zona ==' + RST);
    await abrir({}, '&resp=' + encodeURIComponent(JSON.stringify(PIEZAS)));
    await listos();
    const prov = await ev('typeof zonaProvisoria !== "undefined" && zonaProvisoria === true');
    chk(prov, 'entra con la zona provisoria, sin modal (sin esto lo de abajo no mide nada)');
    const abiertoAntes = await ev('!document.getElementById("loc-overlay").classList.contains("hidden")');
    await ev('cambiarReserva("CVa", 1)');
    await dormir(400);
    const tras = JSON.parse(await ev('JSON.stringify({' +
      ' abierto: !document.getElementById("loc-overlay").classList.contains("hidden"),' +
      ' paso: document.getElementById("loc-step-zone").style.display,' +
      ' enCarrito: Object.keys(piezaCart).length })'));
    chk(abiertoAntes === false && tras.abierto === true && tras.paso !== 'none',
        'reservar kilos abre la pregunta de la zona', JSON.stringify(tras));
    chk(tras.enCarrito === 0, 'y mientras pregunta no reserva nada', String(tras.enCarrito));
    await tocar('#loc-step-zone .loc-btn[onclick*="estancias"]');
    await dormir(600);
    const rTras = await ev('JSON.stringify(reservaEnCarrito("CVa"))');
    chk(rTras && rTras !== 'null', 'al elegir la zona se retoma la reserva que habia pedido', String(rTras).slice(0, 90));
    /* Y en una zona que no vende carne no se reserva nada, aunque el corte
       exista en PRODUCTOS: `_corteDe` mira el catalogo entero, no el de la zona. */
    await abrir({}, '&resp=' + encodeURIComponent(JSON.stringify(PIEZAS)));
    await listos();
    await ev('cambiarReserva("CVa", 1)');
    await dormir(400);
    await tocar('#loc-step-zone .loc-btn[onclick*="clubes"]');
    await dormir(700);
    const club = JSON.parse(await ev('JSON.stringify({ zona: currentZone, res: Object.keys(piezaCart).length,' +
      ' toast: document.getElementById("toast").textContent })'));
    chk(club.zona === 'clubes' && club.res === 0, 'en Clubes no se reserva carne, que no vende', JSON.stringify(club));
    chk(/no lo tenemos/i.test(club.toast), 'y se dice por que', '"' + club.toast + '"');

    /* ── 8. PILAR DE MALEU ───────────────────────────────────────────── */
    console.log('\n' + DIM + '== "Otra zona de Pilar" tambien reserva ==' + RST);
    await abrir({ maleu_zone: 'pilar', maleu_pilar_zona: { val: '__otro__', nombre: 'Otra zona de Pilar', ts: 1 },
      maleu_pilar_barrio: { val: 'Pilara', nombre: 'Pilara', ts: 1 },
      maleu_delivery_date: { iso: '2026-09-16', dayName: 'Miércoles', flexible: false, zone: 'pilar', ts: 1 } });
    await listos();
    const pil = JSON.parse(await ev('JSON.stringify({ n: document.querySelectorAll(".reserva-card").length, boton: (document.querySelector(".reserva-card .res-btn") || {}).textContent })'));
    chk(pil.n === 3 && /Reservar para el vie 18/.test(pil.boton || ''), 'el miercoles 16 ofrece reservar para el viernes 18 (' + pil.n + ', "' + pil.boton + '")');

    chk(escapados.length === 0, 'nada salio hacia Apps Script (' + escapados.join(', ') + ')');
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
