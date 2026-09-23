/**
 * Las zonas de entrega como quedaron el 14/9/2026.
 *
 *   node _tools/verificar-zonas.js [ancho]      (390 por defecto)
 *
 * QUE CAMBIO ESE DIA (Tadeo):
 *   1. "En la primera opcion que diga Estancias del Pilar y Estancias del Rio.
 *      Son los 2 barrios a atacar, son muy parecidos y deberian ir juntos. Envio
 *      gratis. Lo mismo de siempre." → Estancias del Rio vuelve a la zona
 *      Estancias (del 10/8 al 14/9 estuvo adentro de "Otra zona de Pilar"), y su
 *      pedido va a la hoja Home.
 *   2. "Pilar y Alrededores ... hacemos entregas los miercoles y los viernes." →
 *      lo que entrega Maleu ("Otra zona de Pilar") tiene miercoles y viernes.
 *      Los barrios con vendedor siguen SOLO el viernes: el vendedor reparte ese
 *      dia y sus pedidos son a pedido (entran en la orden del jueves).
 *   3. "En otra zona de pilar, para las entregas que haga yo que no sean de mis
 *      vendedores, deberia estar involucrada la carne." → la carne se ofrece en
 *      "Otra zona de Pilar", nunca en un barrio con vendedor (esos pedidos van a
 *      la hoja Red, que no tiene columnas de carne).
 *   4. La foto de la categoria Carnes: carne a la parrilla, como el resto de las
 *      categorias muestran el producto cocinado.
 *
 * QUE MIRA:
 *   · el paso 1 del modal dice lo que tiene que decir;
 *   · un pedido de Estancias del Rio sale a la hoja Home, sin envio y con el
 *     10% en efectivo, y con carne;
 *   · "Otra zona de Pilar" ya no lista Estancias del Rio;
 *   · Pilar de Maleu: el calendario del modal y el del formulario ofrecen
 *     miercoles y viernes, se ve la carne y el pedido sale a la hoja Pilar con
 *     sus kilos y sus piezas;
 *   · Los Alcanfores sigue con envio gratis y el 10% en efectivo;
 *   · un barrio con vendedor: solo viernes, sin carne; y si el cliente cambia a
 *     uno teniendo carne en el carrito, la carne sale y se dice;
 *   · el que tenia Estancias del Rio guardado en Pilar entra a Estancias con su
 *     barrio y su lote ya cargados;
 *   · el que vuelve a Pilar encuentra su barrio elegido en el formulario;
 *   · el cartel del cierre en los dias de la semana, con el miercoles.
 *
 * El RELOJ va congelado en el lunes 14/9/2026 10:00 de Argentina. Todo POST se
 * corta adentro de la pagina y por CDP; Analytics y Meta se bloquean. Con
 * RAIZ=<carpeta> corre contra otra copia (contra la de antes tiene que fallar).
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

/* Hora de Argentina (UTC-3) de un dia de septiembre de 2026. */
const AR = (dia, hora, min) => Date.UTC(2026, 8, dia, hora + 3, min || 0, 0);
const LUNES = AR(14, 10);

const ABBRS = ['PMu', 'PMa', 'PJyQ', 'PCC', 'PJyM', 'PPM', 'PPJyQ', 'PPCyQ', 'SQB', 'SL', 'SCo',
  'SPyP', 'SJyQ', 'SE', 'SCa', 'ECaC', 'EJyQ', 'ECyQ', 'EV', 'TG', 'TLC', 'TC', 'F', 'TP', 'TJyQ',
  'TCa', 'TV', 'RC', 'RP', 'CCo', 'CEn', 'CLo', 'CPi', 'CVa'];
const STOCK = {};
ABBRS.forEach((a) => { STOCK[a] = { f: 50, p: 50 }; });
const PIEZAS = {
  CEn: [{ id: 'ENT-01', kg: 1.163 }],
  CVa: [{ id: 'VAC-01', kg: 1.064 }, { id: 'VAC-02', kg: 1.241 }],
};
const VENDEDORES = { vendedores: [
  { nombre: 'Marcos', wa: '5491100000001', alias: '', barrios: ['Tortugas y alrededores', 'El Lucero', 'Los Tacos', 'Villa Bertha', 'Azzurra'] },
  { nombre: 'Fini', wa: '5491100000002', alias: '', barrios: ['Ayres y alrededores', 'Ayres del Pilar', 'La Lomada', 'Los Lagartos', 'Highland'] },
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

/* Antes de que arranque la tienda: la semilla del localStorage (una sola vez
   por navegacion: el script se vuelve a correr en cada recarga), el reloj, el
   backend y los espias. */
const PREP = '(function () {' +
  'var m = /[?&]semilla=([^&]+)/.exec(location.search), nn = /[?&]n=(\\d+)/.exec(location.search);' +
  /* La marca lleva el numero de navegacion: dos abrir({}) seguidos tienen la
     misma semilla, y sin el numero el segundo no limpiaba nada. */
  'if (m && sessionStorage.getItem("__semilla") !== (nn ? nn[1] : "") + m[1]) {' +
  '  sessionStorage.setItem("__semilla", (nn ? nn[1] : "") + m[1]);' +
  '  try { localStorage.clear(); var s = JSON.parse(decodeURIComponent(m[1]));' +
  '    Object.keys(s).forEach(function (k) { localStorage.setItem(k, typeof s[k] === "string" ? s[k] : JSON.stringify(s[k])); }); } catch (e) {}' +
  '}' +
  'var RD = Date; window.__ahora = ' + LUNES + ';' +
  'function FD() {' +
  '  if (!(this instanceof FD)) return new RD(window.__ahora).toString();' +
  '  if (arguments.length === 0) return new RD(window.__ahora);' +
  '  var a = [null].concat([].slice.call(arguments));' +
  '  return new (Function.prototype.bind.apply(RD, a))();' +
  '}' +
  'FD.prototype = RD.prototype; FD.now = function () { return window.__ahora; };' +
  'FD.UTC = RD.UTC; FD.parse = RD.parse; window.Date = FD;' +
  'window.__posts = []; navigator.sendBeacon = function (u, d) { window.__posts.push({ beacon: true, body: String(d || "") }); return false; };' +
  'var orig = window.fetch;' +
  'var json = function (o) { return Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { "Content-Type": "application/json" } })); };' +
  'window.fetch = function (url, opts) {' +
  '  var u = String(url);' +
  '  if (opts && String(opts.method || "").toUpperCase() === "POST" && u.indexOf("script.google") >= 0) { window.__posts.push({ body: String(opts.body || "") }); return new Promise(function () {}); }' +
  '  if (u.indexOf("action=stock_full") >= 0) return json(' + JSON.stringify(STOCK) + ');' +
  '  if (u.indexOf("action=piezas_full") >= 0) return json(' + JSON.stringify(PIEZAS) + ');' +
  '  if (u.indexOf("action=vendedores") >= 0) return json(' + JSON.stringify(VENDEDORES) + ');' +
  '  if (u.indexOf("script.google") >= 0) return json({ ok: true });' +
  '  return orig.apply(this, arguments);' +
  '};' +
  '})();';

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-zonas-'));
  const puertoCdp = 9300 + Math.floor(Math.random() * 90);
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
        'e.scrollIntoView({ block: "center" });' +
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
    const abrir = async (semilla) => {
      await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?n=' + (++nav) +
        '&semilla=' + encodeURIComponent(JSON.stringify(semilla || {})) });
      if (!(await esperar("typeof PRODUCTOS !== 'undefined' && !!document.getElementById('loc-step-zone')", 15000))) {
        throw new Error('la tienda no arranco');
      }
      /* Desde el 23/9/2026 la tienda abre en el catalogo y el modal ya no sale
         solo. Este test es el del MODAL —que cada zona ofrezca sus dias, su
         envio y su hoja—, asi que si la zona todavia esta sin elegir se abre
         por donde lo abre una persona: el chip de arriba. Que entre sin nada
         encima lo prueba verificar-entrada.js. */
      await ev('(function () { if (typeof zonaProvisoria !== "undefined" && zonaProvisoria) showZoneModal("chip"); })()');
      await dormir(300);
    };
    const listos = async () => {
      await esperar('Object.keys(stockMap).length > 5', 10000);
      await esperar('typeof piezasEstado !== "undefined" && piezasEstado !== "cargando"', 10000);
      await dormir(300);
    };
    /* Abre el paso de fecha antes de leerlo. Desde el 23/9/2026 elegir la zona
       (o el barrio) cierra el modal y al calendario se llega desde el chip 📅.
       Lo que se mide —que cada zona y cada barrio ofrezcan SUS dias— no cambio;
       cambio por donde se llega. */
    const fechasDelModal = async () => {
      await ev('showDateModal()');
      await dormir(300);
      return JSON.parse(await ev('JSON.stringify([].map.call(document.querySelectorAll("#loc-dates-grid .loc-date-card"), function (b) {' +
        ' var m = /setDeliveryDate\\(\'([0-9-]+)\',\'([^\']*)\'/.exec(b.getAttribute("onclick") || ""); return m ? m[1] + " " + m[2] : ""; }))'));
    };
    const diasDelForm = async () => JSON.parse(await ev('JSON.stringify([].map.call(document.querySelectorAll("#day-picker .dp-cell.available"), function (b) { return b.getAttribute("data-dia"); }).filter(function (d, i, a) { return a.indexOf(d) === i; }))'));
    const carneVisible = async () => ev('document.querySelectorAll(".carne-card").length');
    const ultimoPost = async () => {
      const lista = JSON.parse(await ev('JSON.stringify(window.__posts.filter(function (p) { return !p.beacon; }))'));
      if (!lista.length) return null;
      try { return JSON.parse(lista[lista.length - 1].body); } catch (e) { return null; }
    };
    const completarYMandar = async (campos) => ev('(async function () {' +
      'var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };' +
      'var c = ' + JSON.stringify(campos) + ';' +
      'Object.keys(c).forEach(function (id) { var e = document.getElementById(id); if (!e) return; e.value = c[id]; e.dispatchEvent(new Event("change", { bubbles: true })); });' +
      'await dormir(200);' +
      'var ef = document.querySelector("input[name=pago][value=Efectivo]"); ef.checked = true; ef.dispatchEvent(new Event("change", { bubbles: true }));' +
      'await dormir(200);' +
      'window.__esperado = { sub: cartTotal(), desc: getTotalDiscount(), envio: getShipping() };' +
      'enviarPedido();' +
      'for (var i = 0; i < 30 && !window.__posts.some(function (p) { return !p.beacon; }); i++) await dormir(100);' +
      'return JSON.stringify(window.__esperado);' +
      '})()');

    /* ── 1. EL PASO 1 DEL MODAL ─────────────────────────────────────── */
    console.log(DIM + '== El paso 1: "¿Donde entregamos?" ==' + RST);
    await abrir({});
    const paso1 = JSON.parse(await ev('JSON.stringify([].map.call(document.querySelectorAll("#loc-step-zone .loc-btn"), function (b) { return { z: (/setZone\\(\'(\\w+)\'/.exec(b.getAttribute("onclick")) || [])[1], t: b.innerText.replace(/\\s+/g, " ").trim() }; }))'));
    const btnEst = paso1.filter((b) => b.z === 'estancias')[0] || { t: '' };
    const btnPil = paso1.filter((b) => b.z === 'pilar')[0] || { t: '' };
    chk(paso1.length === 3 && paso1[0].z === 'estancias', 'la primera opcion es la de Estancias (' + paso1.map((b) => b.z).join(', ') + ')');
    chk(/Estancias del Pilar y Estancias del R[ií]o/.test(btnEst.t), 'dice "Estancias del Pilar y Estancias del Rio" ("' + btnEst.t.slice(0, 60) + '")');
    chk(/[Ee]nv[ií]o gratis/.test(btnEst.t) && /lunes, mi[eé]rcoles, viernes, s[aá]bado y domingo/.test(btnEst.t), 'con envio gratis y los cinco dias');
    chk(/Pilar y Alrededores/.test(btnPil.t) && /mi[eé]rcoles y los viernes/.test(btnPil.t), 'Pilar dice miercoles y viernes ("' + btnPil.t + '")');

    /* ── 2. ESTANCIAS DEL RIO: HOJA HOME ────────────────────────────── */
    console.log('\n' + DIM + '== Estancias del Rio, adentro de la zona Estancias ==' + RST);
    chk(await tocar('#loc-step-zone .loc-btn[onclick*="estancias"]'), 'el boton de Estancias se toca');
    const fEst = await fechasDelModal();
    chk(fEst.some((f) => /Lunes/.test(f)) && fEst.some((f) => /Domingo/.test(f)), 'el calendario de Estancias sigue con sus cinco dias (' + fEst.slice(0, 5).join(' · ') + ')');
    await ev('setDeliveryDate("2026-09-16", "Miércoles")');
    await listos();
    const opciones = JSON.parse(await ev('JSON.stringify([].map.call(document.getElementById("f-barrio-privado").options, function (o) { return o.value; }).filter(Boolean))'));
    chk(opciones.indexOf('Estancias del Pilar') >= 0 && opciones.indexOf('Estancias del Río') >= 0, 'el formulario ofrece los dos barrios privados (' + opciones.join(', ') + ')');
    chk(await carneVisible() > 0, 'en Estancias se ve la carne');
    await ev('addToCart(11); togglePieza("CVa", "VAC-01")');
    await ev('(function () { var s = document.getElementById("f-barrio-privado"); s.value = "Estancias del Río"; s.dispatchEvent(new Event("change", { bubbles: true })); })()');
    await dormir(200);
    const estadoRio = JSON.parse(await ev('JSON.stringify({ sub: getComputedStyle(document.getElementById("field-sub-barrio")).display, chip: document.getElementById("zone-chip").textContent })'));
    chk(estadoRio.sub === 'none', 'Estancias del Rio no pide sub barrio (' + estadoRio.sub + ')');
    chk(/Estancias del R[ií]o/.test(estadoRio.chip), 'el chip de arriba dice el barrio ("' + estadoRio.chip + '")');
    const espRio = JSON.parse(await completarYMandar({ 'f-nombre': 'PRUEBA Rio', 'f-telefono': '1155038905', 'f-lote': '77' }));
    const pRio = await ultimoPost();
    chk(!!pRio, 'sale el pedido');
    if (pRio) {
      chk(pRio.canal === 'Home', 'va a la hoja Home (canal "' + pRio.canal + '")');
      chk(pRio.barrioPrivado === 'Estancias del Río' && pRio.barrio === 'Estancias del Río' && !pRio.subBarrio,
          'con el barrio "Estancias del Rio" y sin sub barrio (' + [pRio.barrioPrivado, pRio.barrio, pRio.subBarrio].join(' / ') + ')');
      chk(Number(pRio.envio) === 0, 'sin envio (' + pRio.envio + ')');
      chk(Number(pRio.descuento) === Math.round(espRio.sub * 0.1) && espRio.desc > 0, 'con el 10% en efectivo (' + pRio.descuento + ' sobre ' + espRio.sub + ')');
      const carne = (pRio.items || []).filter((it) => it.unidad === 'kg');
      chk(carne.length === 1 && carne[0].abbr === 'CVa' && (carne[0].piezas || [])[0] === 'VAC-01', 'con la pieza de carne (' + JSON.stringify(carne.map((c) => c.abbr + ':' + (c.piezas || []).join('+'))) + ')');
    }

    /* ── 3. PILAR DE MALEU: MIERCOLES Y VIERNES, CON CARNE ───────────── */
    console.log('\n' + DIM + '== "Otra zona de Pilar": miercoles y viernes, con carne ==' + RST);
    await abrir({});
    chk(await tocar('#loc-step-zone .loc-btn[onclick*="pilar"]'), 'el boton de Pilar se toca');
    const otra = await ev('(function () { var b = document.querySelector("#loc-barrios-grid button[onclick*=__otro__]"); return b ? b.innerText.replace(/\\s+/g, " ") : ""; })()');
    chk(/Los Alcanfores/.test(otra) && !/Estancias del R/.test(otra), '"Otra zona de Pilar" ya no lista Estancias del Rio ("' + otra + '")');
    chk(await tocar('#loc-barrios-grid button[onclick*="__otro__"]'), 'la tarjeta "Otra zona" se toca');
    const subs = JSON.parse(await ev('JSON.stringify([].map.call(document.querySelectorAll("#loc-subbarrios-grid button"), function (b) { return b.innerText.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ ]/g, "").trim(); }))'));
    chk(subs.indexOf('Los Alcanfores') >= 0 && !subs.some((s) => /Estancias del R/.test(s)), 'los barrios de la zona: ' + subs.join(', '));
    chk(await tocar('#loc-subbarrios-grid button[onclick*="Pilara"]'), 'Pilara se toca');
    const fPil = await fechasDelModal();
    chk(fPil.indexOf('2026-09-16 Miércoles') >= 0 && fPil.indexOf('2026-09-18 Viernes') >= 0, 'el calendario ofrece el miercoles 16 y el viernes 18 (' + fPil.slice(0, 4).join(' · ') + ')');
    chk(fPil.every((f) => /Miércoles|Viernes/.test(f)), 'y ningun otro dia (' + fPil.length + ' fechas)');
    const notaPil = await ev('document.getElementById("loc-date-note").innerText');
    chk(/mi[eé]rcoles y los viernes/.test(notaPil) && /jueves 17\/9/.test(notaPil) && /viernes 18\/9/.test(notaPil), 'el cartel dice miercoles y viernes, y el cierre del viernes ("' + notaPil + '")');
    await ev('setDeliveryDate("2026-09-16", "Miércoles")');
    await listos();
    const diasPil = await diasDelForm();
    chk(diasPil.indexOf('Miércoles') >= 0 && diasPil.indexOf('Viernes') >= 0 && diasPil.length === 2, 'el calendario del formulario tambien (' + diasPil.join(', ') + ')');
    const hero = await ev('document.getElementById("hero-delivery").textContent');
    chk(/mi[eé]rcoles y viernes/.test(hero), 'el hero dice miercoles y viernes ("' + hero + '")');
    chk(await carneVisible() > 0, 'se ve la carne (' + (await carneVisible()) + ' cortes)');
    chk(await ev('!!document.querySelector(".cat-tile img[src*=\'categoria-carnes.jpg\']")'), 'la categoria Carnes usa la foto nueva');
    chk(await ev('document.getElementById("f-pilar-barrio").value') === 'Pilara', 'el formulario ya tiene Pilara elegido');
    await ev('addToCart(5); togglePieza("CEn", "ENT-01"); togglePieza("CVa", "VAC-02")');
    const espPil = JSON.parse(await completarYMandar({ 'f-nombre': 'PRUEBA Pilara', 'f-telefono': '1155038905', 'f-lote-pilar': '12' }));
    const pPil = await ultimoPost();
    chk(!!pPil, 'sale el pedido');
    if (pPil) {
      chk(pPil.canal === 'Pilar', 'va a la hoja Pilar (canal "' + pPil.canal + '")');
      chk(pPil.barrio === 'Pilara' && pPil.lote === '12', 'con el barrio y el lote (' + pPil.barrio + ' / ' + pPil.lote + ')');
      chk(Number(pPil.envio) === 5000 && Number(pPil.descuento) === 0, 'envio $5.000 y sin descuento en efectivo (' + pPil.envio + ' / ' + pPil.descuento + ')');
      chk(pPil.dia === '16/09/2026' || pPil.fechaEntrega === '2026-09-16', 'para el miercoles 16 (' + pPil.dia + ')');
      const carne = (pPil.items || []).filter((it) => it.unidad === 'kg').map((c) => c.abbr + ':' + c.qty + ':' + (c.piezas || []).join('+')).sort();
      chk(JSON.stringify(carne) === JSON.stringify(['CEn:1.163:ENT-01', 'CVa:1.241:VAC-02']), 'con los kilos y las piezas (' + carne.join(', ') + ')');
      chk(Math.abs(pPil.total - (espPil.sub + 5000)) < 2, 'el total cierra (' + pPil.total + ')');
    }

    /* ── 4. EL CARTEL DEL CIERRE, CON EL MIERCOLES ──────────────────── */
    console.log('\n' + DIM + '== El cartel del cierre para lo que entrega Maleu ==' + RST);
    const nota = async (ms) => (await ev('(function () { window.__ahora = ' + ms + '; var n = _cutoffNote("pilar"); return n ? n.html : ""; })()')).replace(/<[^>]+>/g, '');
    const nJueAm = await nota(AR(17, 11));
    chk(/hoy a las 12 hs/.test(nJueAm) && /viernes 18\/9/.test(nJueAm) && /mi[eé]rcoles 23\/9/.test(nJueAm), 'jueves 17/9 11:00: ultima chance para el viernes, y el miercoles 23 ("' + nJueAm + '")');
    const nJuePm = await nota(AR(17, 13));
    chk(/cerraron/.test(nJuePm) && /mi[eé]rcoles 23\/9/.test(nJuePm) && /viernes 25\/9/.test(nJuePm), 'jueves 17/9 13:00: miercoles 23 o viernes 25 ("' + nJuePm + '")');
    const nVie = await nota(AR(18, 10));
    chk(/Hoy estamos entregando/.test(nVie) && /mi[eé]rcoles 23\/9/.test(nVie) && /viernes 25\/9/.test(nVie), 'viernes 18/9: hoy se entrega, vuelve el 23 y el 25');
    const nSab = await nota(AR(19, 10));
    chk(/mi[eé]rcoles y los viernes/.test(nSab) && /jueves 24\/9/.test(nSab) && /viernes 25\/9/.test(nSab), 'sabado 19/9: el viernes 25, pedidos hasta el jueves 24');
    await ev('window.__ahora = ' + LUNES);

    /* ── 5. CAMBIA A UN BARRIO CON VENDEDOR TENIENDO CARNE ──────────── */
    console.log('\n' + DIM + '== Pasa a un barrio con vendedor con carne en el carrito ==' + RST);
    await abrir({ maleu_zone: 'pilar', maleu_pilar_zona: { val: '__otro__', nombre: 'Otra zona de Pilar', ts: 1 },
      maleu_pilar_barrio: { val: 'Pilara', nombre: 'Pilara', ts: 1 },
      maleu_delivery_date: { iso: '2026-09-16', dayName: 'Miércoles', flexible: false, zone: 'pilar', ts: 1 } });
    await listos();
    chk(await ev('getComputedStyle(document.getElementById("loc-overlay")).display === "none" || document.getElementById("loc-overlay").classList.contains("hidden")'), 'entra directo, con zona, barrio y fecha guardados');
    await ev('togglePieza("CVa", "VAC-01"); addToCart(5)');
    chk(await ev('Object.keys(piezaCart).length') === 1, 'la pieza entro al carrito');
    await ev('showDateModal()'); await dormir(300);
    chk(await tocar('#loc-step-date .loc-back-btn'), '"Volver" desde la fecha se toca');
    chk(await ev('document.getElementById("loc-overlay").classList.contains("hidden")'),
        'y CIERRA, en vez de mandarlo a reelegir zona y barrio que ya tiene (23/9/2026)');
    /* El paso del barrio se abre con el mismo "← Cambiar zona" de siempre; el
       camino del cliente para cambiar solo el barrio sin perder el carrito es
       el desplegable del formulario. */
    await ev('welcomeShowSubBarrioStep(); _setOverlay(true);'); await dormir(300);
    chk(await tocar('#loc-step-subbarrio .loc-back-btn'), '"Cambiar zona" desde el barrio');
    chk(await tocar('#loc-barrios-grid button[onclick*="Tortugas"]'), 'la zona de Marcos se toca');
    chk(await tocar('#loc-subbarrios-grid button[onclick*="El Lucero"]'), 'El Lucero se toca');
    await dormir(300);
    const trasCambio = JSON.parse(await ev('JSON.stringify({ piezas: Object.keys(piezaCart).length, productos: cartCount(), toast: document.getElementById("toast").textContent, carne: document.querySelectorAll(".carne-card").length, fecha: selectedDeliveryDate, paso: document.getElementById("loc-step-date").style.display })'));
    chk(trasCambio.piezas === 0 && trasCambio.productos === 1, 'la carne sale del carrito y la pizza se queda (' + trasCambio.piezas + ' piezas, ' + trasCambio.productos + ' en el carrito)');
    chk(/carne/i.test(trasCambio.toast) && /vendedor/.test(trasCambio.toast), 'y se dice por que ("' + trasCambio.toast + '")');
    chk(trasCambio.carne === 0, 'ya no se ven los cortes');
    chk(trasCambio.fecha !== '2026-09-16', 'el miercoles elegido no se respeta en un barrio que recibe los viernes (fecha ' + trasCambio.fecha + ', paso de fecha ' + (trasCambio.paso === 'none' ? 'cerrado' : 'abierto') + ')');
    const fMarcos = await fechasDelModal();
    chk(fMarcos.length > 0 && fMarcos.every((f) => /Viernes/.test(f)), 'el calendario de Marcos: solo viernes (' + fMarcos.slice(0, 3).join(' · ') + ')');
    const notaMarcos = await ev('document.getElementById("loc-date-note").innerText');
    chk(!/mi[eé]rcoles/.test(notaMarcos) && /viernes/.test(notaMarcos), 'y su cartel no habla del miercoles ("' + notaMarcos + '")');
    await ev('setDeliveryDate("2026-09-18", "Viernes")');
    const diasMarcos = await diasDelForm();
    chk(diasMarcos.length === 1 && diasMarcos[0] === 'Viernes', 'el formulario tambien: ' + diasMarcos.join(', '));
    const heroMarcos = await ev('document.getElementById("hero-delivery").textContent');
    chk(!/mi[eé]rcoles/.test(heroMarcos), 'el hero no promete el miercoles ("' + heroMarcos + '")');

    /* ── 6. LOS ALCANFORES SIGUE COMO EX-HOME ───────────────────────── */
    console.log('\n' + DIM + '== Los Alcanfores ==' + RST);
    await abrir({ maleu_zone: 'pilar', maleu_pilar_zona: { val: '__otro__', nombre: 'Otra zona de Pilar', ts: 1 },
      maleu_pilar_barrio: { val: 'Los Alcanfores', nombre: 'Los Alcanfores', ts: 1 },
      maleu_delivery_date: { iso: '2026-09-18', dayName: 'Viernes', flexible: false, zone: 'pilar', ts: 1 } });
    await listos();
    const alc = JSON.parse(await ev('(function () { addToCart(5); var ef = document.querySelector("input[name=pago][value=Efectivo]"); ef.checked = true; ef.dispatchEvent(new Event("change", { bubbles: true }));' +
      ' return JSON.stringify({ envio: getShipping(), efectivo: cashDiscountActive(), carne: document.querySelectorAll(".carne-card").length, dias: [].map.call(document.querySelectorAll("#day-picker .dp-cell.available"), function (b) { return b.getAttribute("data-dia"); }) }); })()'));
    chk(alc.envio === 0 && alc.efectivo, 'envio gratis y 10% en efectivo (' + alc.envio + ' / ' + alc.efectivo + ')');
    chk(alc.carne > 0, 'con carne: lo entrega Maleu');
    chk(alc.dias.indexOf('Miércoles') >= 0, 'y con miercoles');

    /* ── 7. EL QUE TENIA ESTANCIAS DEL RIO EN PILAR ─────────────────── */
    console.log('\n' + DIM + '== Migracion: Estancias del Rio guardado en Pilar ==' + RST);
    await abrir({ maleu_zone: 'pilar', maleu_pilar_zona: { val: '__otro__', nombre: 'Otra zona de Pilar', ts: 1 },
      maleu_pilar_barrio: { val: 'Estancias del Río', nombre: 'Estancias del Río', ts: 1 },
      maleu_cliente_pilar: { nombre: 'Ana Rio', telefono: '1144445555', direccion: 'Estancias del Río', lote: '88', zone: 'pilar' },
      maleu_cliente_pg: { nombre: 'Ana Rio', telefono: '1144445555', direccion: 'Estancias del Río', lote: '88', zone: 'pilar' } });
    await dormir(400);
    const mig = JSON.parse(await ev('JSON.stringify({ zona: currentZone, guardada: localStorage.getItem("maleu_zone"), bp: document.getElementById("f-barrio-privado").value, lote: document.getElementById("f-lote").value, nombre: document.getElementById("f-nombre").value, barrioPilar: localStorage.getItem("maleu_pilar_barrio") })'));
    chk(mig.zona === 'estancias' && mig.guardada === 'estancias', 'entra a la zona Estancias (' + mig.zona + ')');
    chk(mig.bp === 'Estancias del Río' && mig.lote === '88' && mig.nombre === 'Ana Rio', 'con su barrio, su lote y su nombre ya cargados (' + [mig.bp, mig.lote, mig.nombre].join(' / ') + ')');
    chk(!mig.barrioPilar, 'y sin el barrio viejo de Pilar guardado');

    /* ── 8. EL QUE VUELVE A PILAR ENCUENTRA SU BARRIO ───────────────── */
    console.log('\n' + DIM + '== Vuelve a Pilar ==' + RST);
    await abrir({ maleu_zone: 'pilar', maleu_pilar_zona: { val: '__otro__', nombre: 'Otra zona de Pilar', ts: 1 },
      maleu_pilar_barrio: { val: 'El Ocho', nombre: 'El Ocho', ts: 1 },
      maleu_cliente_pilar: { nombre: 'Juan Ocho', telefono: '1166667777', direccion: 'El Ocho', lote: '5', zone: 'pilar' },
      maleu_delivery_date: { iso: '2026-09-18', dayName: 'Viernes', flexible: false, zone: 'pilar', ts: 1 } });
    await listos();
    const vuelve = JSON.parse(await ev('JSON.stringify({ barrio: document.getElementById("f-pilar-barrio").value, otro: getComputedStyle(document.getElementById("field-pilar-otro")).display, lote: document.getElementById("f-lote-pilar").value, chip: document.getElementById("zone-chip").textContent })'));
    chk(vuelve.barrio === 'El Ocho' && vuelve.otro === 'none', 'el formulario tiene El Ocho elegido (' + vuelve.barrio + ', campo libre ' + vuelve.otro + ')');
    chk(vuelve.lote === '5', 'y su lote (' + vuelve.lote + ')');

    /* ── 9. CLUBES NO CAMBIA ────────────────────────────────────────── */
    console.log('\n' + DIM + '== Clubes ==' + RST);
    await abrir({});
    await tocar('#loc-step-zone .loc-btn[onclick*="clubes"]');
    await listos();
    chk(await carneVisible() === 0, 'en Clubes no hay carne');

    chk(escapados.length === 0, 'no se escapo ningun POST ni salto a WhatsApp (' + escapados.join(', ') + ')');
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
