/**
 * La tienda abre en el catalogo: la zona se pregunta cuando hace falta.
 *
 *   node _tools/verificar-entrada.js [ancho]        (390 por defecto)
 *
 * POR QUE EXISTE. Hasta el 23/9/2026 el catalogo arrancaba tapado por el modal
 * de bienvenida: zona, y despues fecha. Para alguien de Estancias eran 2
 * pantallas antes de ver un precio; para alguien de Pilar, 4 (zona, zona de
 * Pilar, barrio, fecha). Tadeo, mirando entrar a un cliente nuevo: "es bastante
 * dificil el flujo... demasiada informacion 'de donde sos', 'cuando queres que
 * te entregue'. Lo primero que quieren es ver que vendo y que precios tengo".
 *
 * Lo que este test defiende, que es lo que se puede volver a romper solo:
 *
 *   1. Que la primera pantalla sea el CATALOGO CON PRECIOS, sin nada encima y
 *      sin un solo "Sin stock" — mientras no hay fecha elegida el modo es
 *      'ilimitado' y se ve todo.
 *   2. Que mientras la zona es PROVISORIA la tienda no afirme nada sobre ella:
 *      ni los dias de entrega del hero, ni la franja del 10% (que en un barrio
 *      con vendedor no aplica), ni un chip que diga una zona que el cliente no
 *      eligio. Y que NO se guarde en localStorage.
 *   3. Que el primer "+ Agregar" pregunte la zona ANTES de agregar —applyZone()
 *      vacia el carrito, asi que preguntar despues le borraria en la cara lo que
 *      acaba de sumar—, y que al elegirla se retome eso mismo sin subirlo
 *      arriba de todo.
 *   4. Que lo que la zona nueva no vende NO entre al carrito: el caso real es
 *      entrar por el catalogo provisorio de Estancias, tocar un pack y elegir
 *      Clubes, que tiene otro catalogo.
 *   5. Que el dia elegido en el FORMULARIO sea la fecha del pedido. Hasta hoy
 *      no lo era: `selectDayPicker` no movia `selectedDeliveryDate`, asi que se
 *      podia armar el carrito para el viernes (todo disponible) y pedir la
 *      entrega para hoy (freezer vacio). Con la fecha fuera de la entrada, ese
 *      agujero paso de raro a estar en el camino principal.
 *   6. Que el que vuelve con su zona guardada siga entrando directo.
 *
 * El RELOJ va congelado (domingo 13/9/2026 05:00): sin eso "hoy" cambia de
 * significado segun el dia en que se corra el test.
 *
 * Todo POST se corta DOS veces, adentro de la pagina y por CDP. Analytics y
 * Meta se bloquean para no sumarle visitas falsas a las metricas de verdad.
 * Con RAIZ=<carpeta> corre contra otra copia de la tienda.
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

/* Domingo 13/9/2026 05:00 en Argentina = 08:00 UTC. */
const DOMINGO = Date.UTC(2026, 8, 13, 8, 0, 0);

/* El stock que manda el ERP. Todo con 50 salvo la margarita, que va en 0 para
   probar el tope: en 'ilimitado' se puede sumar, y al elegir "hoy" en el
   formulario tiene que salir del carrito avisando. */
const ABBRS = ['PMu', 'PMa', 'PJyQ', 'PCC', 'PJyM', 'PPM', 'PPJyQ', 'PPCyQ', 'SQB', 'SL', 'SCo',
  'SPyP', 'SJyQ', 'SE', 'SCa', 'ECaC', 'EJyQ', 'ECyQ', 'EV', 'TG', 'TLC', 'TC', 'F', 'TP', 'TJyQ',
  'TCa', 'TV', 'RC', 'RP', 'CCo', 'CEn', 'CLo', 'CPi', 'CVa'];
const STOCK = {};
ABBRS.forEach((a) => { STOCK[a] = { f: 50, p: 50 }; });
STOCK.PMa = { f: 0, p: 0 };

const PIEZAS = { CVa: [{ id: 'VAC-01', kg: 1.064 }, { id: 'VAC-02', kg: 1.241 }] };

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

/* Antes de que arranque la tienda: la semilla del localStorage, el reloj, el
   backend simulado y los espias. La semilla se siembra una sola vez por
   navegacion (el numero `n` la distingue): sin eso, la recarga que hace la
   tienda volveria a sembrar lo que el test acaba de cambiar. */
const PREP = '(function () {' +
  'var m = /[?&]semilla=([^&]+)/.exec(location.search), nn = /[?&]n=(\\d+)/.exec(location.search);' +
  'if (m && sessionStorage.getItem("__semilla") !== (nn ? nn[1] : "") + m[1]) {' +
  '  sessionStorage.setItem("__semilla", (nn ? nn[1] : "") + m[1]);' +
  '  try { localStorage.clear(); } catch (e) {}' +
  '  var d = JSON.parse(decodeURIComponent(m[1]));' +
  '  for (var k in d) { try { localStorage.setItem(k, typeof d[k] === "string" ? d[k] : JSON.stringify(d[k])); } catch (e) {} }' +
  '}' +
  'var RD = Date; window.__ahora = ' + DOMINGO + ';' +
  'function FD() {' +
  '  if (!(this instanceof FD)) return new RD(window.__ahora).toString();' +
  '  if (arguments.length === 0) return new RD(window.__ahora);' +
  '  var a = [null].concat([].slice.call(arguments));' +
  '  return new (Function.prototype.bind.apply(RD, a))();' +
  '}' +
  'FD.prototype = RD.prototype; FD.now = function () { return window.__ahora; };' +
  'FD.UTC = RD.UTC; FD.parse = RD.parse; window.Date = FD;' +
  'window.__post = 0; window.__err = [];' +
  'addEventListener("error", function (e) { window.__err.push(String(e.message).slice(0, 120)); });' +
  'navigator.sendBeacon = function (u) { if (String(u).indexOf("script.google") < 0) return false; window.__post++; return false; };' +
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
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-entrada-'));
  const puertoCdp = 9500 + Math.floor(Math.random() * 90);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil,
    '--window-size=' + ANCHO + ',' + ALTO, 'about:blank'], { stdio: 'ignore' });

  let mal = 0, bien = 0;
  const chk = (ok, t, extra) => {
    ok ? bien++ : mal++;
    console.log('  ' + (ok ? VER + 'ok   ' : RED + 'MAL  ') + RST + t + (extra ? DIM + '  (' + extra + ')' + RST : ''));
  };
  const cortar = (m) => { console.log('\n' + RED + 'CORTADO: ' + m + RST); mal++; };

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
    /* Un toque de verdad, con el mouse de Chrome en el centro del elemento: si
       algo lo tapa, el toque le cae a otro — que es justo lo que hay que saber
       de un cartel nuevo metido entre el hero y el catalogo. */
    const _irA = (sel) => '(function () {' +
      'var e = document.querySelector(' + JSON.stringify(sel) + '); if (!e) return "null";' +
      'var r0 = document.documentElement.style.scrollBehavior; document.documentElement.style.scrollBehavior = "auto";' +
      'e.scrollIntoView({ block: "center" }); document.documentElement.style.scrollBehavior = r0;' +
      'return "ok"; })()';
    const _donde = (sel) => '(function () {' +
      'var e = document.querySelector(' + JSON.stringify(sel) + '); if (!e) return "null";' +
      'var r = e.getBoundingClientRect(); var x = r.left + r.width / 2, y = r.top + r.height / 2;' +
      'var en = document.elementFromPoint(x, y);' +
      'return JSON.stringify({ x: x, y: y, libre: !!en && (en === e || e.contains(en)), alto: Math.round(r.height),' +
      ' encima: en ? (en.className || en.tagName) : "" });' +
      '})()';
    /* SE MIDE DOS VECES, y no es exceso de celo. Entre acomodar el scroll y
       soltar el click la pagina se sigue moviendo (el catalogo termina de
       pintarse, llega el inventario de carne), asi que las coordenadas leidas
       antes de esperar apuntan a otro lado: en una corrida el toque al
       calendario del formulario le cayo a una pieza de vacio y la sumo al
       carrito. Se acomoda el scroll, se espera, y RECIEN AHI se lee donde
       quedo. */
    const tocar = async (sel) => {
      if ((await ev(_irA(sel))) === 'null') return null;
      await dormir(350);
      const pos = JSON.parse(await ev(_donde(sel)));
      if (!pos) return null;
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cli.enviar('Input.dispatchMouseEvent', { type, x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
      }
      await dormir(500);
      return pos;
    };
    const eventos = (n) => '(window.dataLayer || []).filter(function (x) { return x && x[0] === "event" && x[1] === ' + JSON.stringify(n) + '; }).length';
    const ultimoEvento = (n) => '(function () { var l = (window.dataLayer || []).filter(function (x) { return x && x[0] === "event" && x[1] === ' + JSON.stringify(n) + '; }); return JSON.stringify(l.length ? l[l.length - 1][2] : null); })()';
    const abierto = 'document.getElementById("loc-overlay") && !document.getElementById("loc-overlay").classList.contains("hidden") && getComputedStyle(document.getElementById("loc-overlay")).display !== "none"';
    const visible = (sel) => '(function () { var e = document.querySelector(' + JSON.stringify(sel) + ');' +
      ' return !!e && !e.hidden && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().height > 0; })()';

    let nav = 0;
    const abrir = async (semilla) => {
      await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?n=' + (++nav) +
        '&semilla=' + encodeURIComponent(JSON.stringify(semilla || {})) });
      if (!(await esperar("typeof PRODUCTOS !== 'undefined' && !!document.getElementById('loc-step-zone')", 15000))) {
        throw new Error('la tienda no arranco');
      }
      await esperar('Object.keys(stockMap).length > 5', 12000);
      await esperar('typeof piezasEstado !== "undefined" && piezasEstado !== "cargando"', 12000);
      await dormir(400);
    };

    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: PREP });

    /* ── 1. LA PRIMERA PANTALLA ───────────────────────────────────── */
    console.log('\n' + DIM + '== Lo primero que ve el que entra por primera vez ==' + RST);
    await abrir({});
    chk(!(await ev(abierto)), 'el catalogo esta a la vista: nada encima');

    const portada = JSON.parse(await ev('(function () {' +
      'var cards = [].slice.call(document.querySelectorAll(".product-card"));' +
      'var conPrecio = cards.filter(function (c) { return /\\$\\s?[0-9]/.test(c.innerText); });' +
      'var prim = conPrecio[0] ? Math.round(conPrecio[0].getBoundingClientRect().top + window.pageYOffset) : -1;' +
      'return JSON.stringify({ cards: cards.length, conPrecio: conPrecio.length, primero: prim,' +
      '  alto: window.innerHeight, scrollable: document.documentElement.scrollHeight - window.innerHeight });' +
      '})()'));
    chk(portada.conPrecio >= 20, 'se ven los productos con su precio', portada.conPrecio + ' cards');
    chk(portada.primero > 0 && portada.primero < portada.alto * 3,
        'el primer precio esta a menos de tres pantallas de scroll', portada.primero + 'px de ' + portada.alto);

    const modo = await ev('getStockMode()');
    chk(modo === 'ilimitado', 'sin fecha elegida el catalogo se ve entero (modo "' + modo + '")');
    /* Los cortes de carne sin piezas SI dicen "Sin stock", y esta bien: eso no
       lo decide la fecha sino el inventario. Lo que no puede haber es un gris
       POR LA FECHA, que es lo que veia el que entraba eligiendo "hoy". */
    const grises = await ev('[].slice.call(document.querySelectorAll(".product-card:not(.carne-card)")).filter(function (c) { return /Sin stock/i.test(c.innerText); }).length');
    chk(grises === 0, 'y ninguna card dice "Sin stock" por la fecha', grises + ' grises');

    chk(await ev(visible('#zona-cta')), 'se ve el cartel "¿A donde te lo llevamos?"');
    const cta = await tocar('#zona-cta');
    chk(!!cta && cta.libre, 'y nada lo tapa: el toque le cae a el');
    chk(await ev(abierto), 'tocarlo abre el modal de zona');
    chk(await ev('document.getElementById("loc-step-zone").style.display !== "none"'), 'en el paso 1, el de la zona');
    await ev('_setOverlay(false)');
    await dormir(200);

    const chips = JSON.parse(await ev('JSON.stringify({ zona: document.getElementById("zone-chip").textContent,' +
      ' fecha: document.getElementById("date-chip").textContent,' +
      ' fechaVis: getComputedStyle(document.getElementById("date-chip")).display !== "none" })'));
    chk(/D[oó]nde entregamos/.test(chips.zona), 'el chip de arriba PREGUNTA la zona, no afirma una', '"' + chips.zona + '"');
    chk(chips.fechaVis && /Eleg[ií] el d[ií]a/.test(chips.fecha), 'y el de fecha invita a elegir el dia', '"' + chips.fecha + '"');

    const calla = JSON.parse(await ev('JSON.stringify({' +
      ' hero: getComputedStyle(document.getElementById("hero-delivery")).display,' +
      ' sched: getComputedStyle(document.getElementById("hero-schedule")).display,' +
      ' promo: getComputedStyle(document.getElementById("promo-bar")).display })'));
    chk(calla.hero === 'none' && calla.sched === 'none',
        'el hero no promete dias de una zona que el cliente no eligio', JSON.stringify(calla));
    chk(calla.promo === 'none',
        'y la franja del 10% se calla: en un barrio con vendedor no aplica');

    chk(await ev('localStorage.getItem("maleu_zone") === null'),
        'la zona provisoria NO se guarda: el cliente todavia no eligio nada');
    chk(await ev(eventos('ver_catalogo')) === 1, 'se mide "ver_catalogo" una vez');
    chk(await ev(eventos('select_zone')) === 0, 'y todavia no se midio ningun "select_zone"');

    /* ── 2. EL PRIMER "+ AGREGAR" ─────────────────────────────────── */
    console.log('\n' + DIM + '== El primer "+ Agregar": ahi si se pregunta la zona ==' + RST);
    const idPMu = await ev('(function () { for (var k in PROD_ABBR) if (PROD_ABBR[k] === "PMu") return String(k); return null; })()');
    const selBtn = '.product-card[data-id="' + idPMu + '"] .add-btn';
    const antes = await tocar(selBtn);
    chk(!!antes && antes.libre, 'el "+ Agregar" de una card se toca');
    const yTras = await ev('Math.round(window.pageYOffset)');
    chk(await ev(abierto), 'y se abre el modal preguntando la zona');
    chk(await ev('document.getElementById("loc-step-zone").style.display !== "none"'), 'en el paso 1, de nuevo');
    chk(await ev('cartCount()') === 0, 'y mientras pregunta NO agrego nada');
    chk(await ev(eventos('zona_pedida')) === 1, 'se mide "zona_pedida"');

    chk(!!(await tocar('#loc-step-zone .loc-btn[onclick*="estancias"]')), 'el boton de Estancias se toca');
    chk(!(await ev(abierto)), 'el modal se cierra');
    chk(await ev('cartCount()') === 1, 'y entra lo que habia tocado', 'carrito ' + (await ev('cartCount()')));
    chk(/agregado/.test(await ev('document.getElementById("toast").textContent')), 'y lo dice',
        '"' + (await ev('document.getElementById("toast").textContent')) + '"');
    const yDespues = await ev('Math.round(window.pageYOffset)');
    chk(Math.abs(yDespues - yTras) < 80,
        'no te sube arriba de todo: seguis mirando ese producto', yTras + ' → ' + yDespues);

    const traszona = JSON.parse(await ev('JSON.stringify({ chip: document.getElementById("zone-chip").textContent,' +
      ' cta: (function () { var e = document.getElementById("zona-cta"); return !!e && !e.hidden; })(),' +
      ' promo: getComputedStyle(document.getElementById("promo-bar")).display,' +
      ' hero: getComputedStyle(document.getElementById("hero-delivery")).display !== "none" || getComputedStyle(document.getElementById("hero-schedule")).display !== "none",' +
      ' guardada: localStorage.getItem("maleu_zone") })'));
    chk(!/D[oó]nde entregamos/.test(traszona.chip), 'ahora el chip dice la zona', '"' + traszona.chip + '"');
    chk(traszona.cta === false, 'el cartel se fue');
    chk(traszona.promo !== 'none', 'y aparece la franja del 10%, que ahora SI corresponde');
    chk(traszona.hero === true, 'el hero ya puede decir los dias');
    chk(traszona.guardada === 'estancias', 'la zona quedo guardada', String(traszona.guardada));
    const origen = JSON.parse(await ev(ultimoEvento('select_zone')) || 'null') || {};
    chk(origen.origen === 'agregar', 'y "select_zone" viaja con el origen, para poder medir el cambio',
        JSON.stringify(origen));

    /* Otra card: la primera ya cambio su "+ Agregar" por los +/-. */
    const idPJyQ = await ev('(function () { for (var k in PROD_ABBR) if (PROD_ABBR[k] === "PJyQ") return String(k); return null; })()');
    await tocar('.product-card[data-id="' + idPJyQ + '"] .add-btn');
    chk(await ev('cartCount()') === 2, 'el segundo "+ Agregar", en otra card, ya no pregunta nada',
        'carrito ' + (await ev('cartCount()')));
    chk(await ev(eventos('zona_pedida')) === 1, 'y no se vuelve a medir "zona_pedida"');

    /* ── 3. EL DIA SE ELIGE EN EL FORMULARIO, Y AHI TOPEA ─────────── */
    console.log('\n' + DIM + '== El dia se elige en el formulario, y esa ES la fecha del pedido ==' + RST);
    const idPMa = await ev('(function () { for (var k in PROD_ABBR) if (PROD_ABBR[k] === "PMa") return String(k); return null; })()');
    chk(await ev('addToCart(' + JSON.stringify(idPMa) + ') === true'),
        'sin fecha se puede sumar la margarita, que hoy no hay en el freezer');
    /* Como una persona: se abre el carrito y desde ahi se va al formulario.
       goToForm() hace toggleCart() porque siempre se llama DESDE el carrito
       abierto; llamandola sola, lo abre — y el carrito tapa medio formulario. */
    await ev('toggleCart(); goToForm();');
    await dormir(900);
    chk(!(await ev('document.getElementById("cart-sidebar").classList.contains("open")')),
        'el carrito se cierra al ir al formulario');
    chk(await ev('document.querySelectorAll("#day-picker .dp-cell.available").length > 0'),
        'el formulario tiene su calendario');
    chk(await ev('!document.getElementById("f-dia").value'),
        'y arranca sin dia puesto: no se decide por el cliente');

    const hoy = await tocar('#day-picker .dp-cell.available[data-fecha="2026-09-13"]');
    chk(!!hoy && hoy.libre, 'el domingo 13 se toca en el calendario del formulario, y el toque le cae a el',
        hoy ? JSON.stringify(hoy) : 'no esta la celda');
    await dormir(600);
    const trasDia = JSON.parse(await ev('JSON.stringify({ fecha: selectedDeliveryDate, modo: getStockMode(),' +
      ' chip: document.getElementById("date-chip").textContent,' +
      ' margarita: cart[' + JSON.stringify(idPMa) + '] || 0, otros: cartCount(),' +
      ' toast: document.getElementById("toast").textContent,' +
      ' guardada: localStorage.getItem("maleu_delivery_date") || "" })'));
    chk(trasDia.fecha === '2026-09-13', 'el dia del formulario ES la fecha del pedido', String(trasDia.fecha));
    chk(trasDia.modo === 'real', 'y con eso el stock pasa a toparse contra el freezer', trasDia.modo);
    chk(/13\/9/.test(trasDia.chip), 'el chip de arriba dice la fecha elegida', '"' + trasDia.chip + '"');
    chk(trasDia.margarita === 0, 'la margarita, que para hoy no hay, sale del carrito');
    chk(/ajustado/i.test(trasDia.toast), 'y se dice por que', '"' + trasDia.toast + '"');
    chk(/2026-09-13/.test(trasDia.guardada), 'la fecha queda guardada para la proxima visita');

    /* ── 4. LO QUE LA ZONA NUEVA NO VENDE NO ENTRA ────────────────── */
    console.log('\n' + DIM + '== Toca un pack y elige Clubes, que tiene otro catalogo ==' + RST);
    await abrir({});
    const idNoClub = await ev('(function () {' +
      'var club = {}; PRODUCTOS_CLUBES.forEach(function (p) { club[p.id] = 1; });' +
      'var p = getActiveProducts().filter(function (x) { return !esPorPeso(x) && !club[x.id]; })[0];' +
      'return p ? String(p.id) : null; })()');
    chk(!!idNoClub, 'hay un producto de Estancias que Clubes no vende (sin esto el caso no se prueba)');
    await ev('addToCart(' + JSON.stringify(idNoClub) + ')');
    await dormir(400);
    chk(await ev(abierto), 'al tocarlo pregunta la zona');
    chk(!!(await tocar('#loc-step-zone .loc-btn[onclick*="clubes"]')), 'el boton de Clubes se toca');
    const club = JSON.parse(await ev('JSON.stringify({ zona: currentZone, carrito: cartCount(),' +
      ' toast: document.getElementById("toast").textContent, abierto: ' + abierto + ' })'));
    chk(club.zona === 'clubes' && club.abierto === false, 'la zona queda en Clubes y el modal cierra');
    chk(club.carrito === 0, 'y el producto NO entra: en Clubes no existe', 'carrito ' + club.carrito);
    chk(/no lo tenemos/i.test(club.toast), 'y se dice por que', '"' + club.toast + '"');

    /* ── 5. PILAR: LA ZONA SE COMPLETA ANTES DE AGREGAR ───────────── */
    console.log('\n' + DIM + '== Pilar: se completa zona, barrio y sub barrio, y recien ahi entra ==' + RST);
    await abrir({});
    const idPilar = await ev('(function () {' +
      'var p = getActiveProducts().filter(function (x) { return !esPorPeso(x) && (!x.zonas || x.zonas.indexOf("pilar") >= 0); })[0];' +
      'return p ? String(p.id) : null; })()');
    await ev('addToCart(' + JSON.stringify(idPilar) + ')');
    await dormir(400);
    chk(!!(await tocar('#loc-step-zone .loc-btn[onclick*="pilar"]')), 'el boton de Pilar se toca');
    chk(await ev('document.getElementById("loc-step-barrio").style.display !== "none"'),
        'sigue al paso del barrio, no cierra a mitad de camino');
    chk(await ev('cartCount()') === 0, 'y todavia no agrego nada');
    chk(!!(await tocar('#loc-barrios-grid button[onclick*="__otro__"]')), '"Otra zona de Pilar" se toca');
    chk(await ev('document.getElementById("loc-step-subbarrio").style.display !== "none"'), 'sigue al sub barrio');
    chk(await ev('cartCount()') === 0, 'y sigue sin agregar nada');
    chk(!!(await tocar('#loc-subbarrios-grid button')), 'el barrio se toca');
    const pil = JSON.parse(await ev('JSON.stringify({ zona: currentZone, carrito: cartCount(), abierto: ' + abierto + ',' +
      ' paso: document.getElementById("loc-step-date").style.display })'));
    chk(pil.abierto === false, 'con el barrio elegido el modal CIERRA: la fecha ya no es parte de la entrada');
    chk(pil.paso === 'none', 'y el paso de fecha no llego a mostrarse');
    chk(pil.zona === 'pilar' && pil.carrito === 1, 'y ahi si entra lo que habia tocado', JSON.stringify(pil));

    /* ── 6. EL QUE VUELVE ─────────────────────────────────────────── */
    console.log('\n' + DIM + '== El que vuelve, con su zona ya elegida ==' + RST);
    await abrir({ maleu_zone: 'estancias',
      maleu_delivery_date: { iso: '2026-09-18', dayName: 'Viernes', flexible: false, zone: 'estancias', ts: 1 } });
    const vuelve = JSON.parse(await ev('JSON.stringify({ abierto: ' + abierto + ', zona: currentZone,' +
      ' prov: zonaProvisoria, fecha: selectedDeliveryDate, chip: document.getElementById("date-chip").textContent,' +
      ' cta: (function () { var e = document.getElementById("zona-cta"); return !!e && !e.hidden; })() })'));
    chk(vuelve.abierto === false && vuelve.zona === 'estancias' && vuelve.prov === false,
        'entra directo, sin modal y sin cartel', JSON.stringify({ abierto: vuelve.abierto, cta: vuelve.cta }));
    chk(vuelve.cta === false, 'el cartel de la zona no le aparece: ya eligio');
    chk(vuelve.fecha === '2026-09-18' && /18\/9/.test(vuelve.chip), 'y le respeta la fecha que habia elegido',
        '"' + vuelve.chip + '"');

    /* La fecha vencida es el caso comun del que vuelve una semana despues. */
    await abrir({ maleu_zone: 'estancias',
      maleu_delivery_date: { iso: '2026-09-01', dayName: 'Martes', flexible: false, zone: 'estancias', ts: 1 } });
    const vencida = JSON.parse(await ev('JSON.stringify({ abierto: ' + abierto + ', fecha: selectedDeliveryDate,' +
      ' chip: document.getElementById("date-chip").textContent, modo: getStockMode() })'));
    chk(vencida.abierto === false, 'con la fecha vencida TAMPOCO se le abre el modal (antes se le abria en "¿para cuando?")');
    chk(!vencida.fecha && /Eleg[ií] el d[ií]a/.test(vencida.chip) && vencida.modo === 'ilimitado',
        've el catalogo entero y el chip lo invita a elegir el dia', JSON.stringify(vencida));

    /* ── 7. NADA SALIO ────────────────────────────────────────────── */
    console.log('\n' + DIM + '== Nada salio hacia afuera ==' + RST);
    const posts = await ev('window.__post || 0');
    chk(posts === 0 && escapados.length === 0, 'ningun POST al backend',
        posts + ' adentro, ' + escapados.length + ' por CDP');
    const errs = JSON.parse(await ev('JSON.stringify(window.__err || [])'));
    chk(errs.length === 0, 'y ningun error de JS en todo el recorrido', errs.join(' | ') || '0');

    console.log('\n' + (mal ? RED : VER) + bien + ' ok · ' + mal + ' mal' + RST + DIM + '  (' + ANCHO + 'px)' + RST);
  } catch (e) {
    cortar(e.message);
  } finally {
    try { proc.kill(); } catch (e) {}
    srv.close();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }
  process.exit(mal ? 1 : 0);
}

main();
